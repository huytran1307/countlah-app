import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { eq, desc, count, and } from "drizzle-orm";
import { db, invoicesTable, invoiceLogsTable } from "@workspace/db";
import {
  GetInvoiceParams,
  UpdateInvoiceParams,
  UpdateInvoiceBody,
  DeleteInvoiceParams,
  ExtractInvoiceParams,
  PushToXeroParams,
  GetInvoiceLogsParams,
  ListInvoicesQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { getClaudeClient } from "../lib/claude";
import { extractInvoiceFromFile, isImageMime } from "../lib/ocr";
import { getValidToken, xeroPost, buildXeroInvoice, XeroApiError, getUserSetting } from "../lib/xero";

const router: IRouter = Router();

// ── Multer setup ────────────────────────────────────────────────────────────

// /tmp is writable on Vercel; process.cwd() is read-only in production
const uploadsDir = process.env.NODE_ENV === "production"
  ? "/tmp/uploads"
  : path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Please upload a PDF, JPG, or PNG."));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function addLog(invoiceId: number, action: string, status: string, message?: string) {
  await db.insert(invoiceLogsTable).values({ invoiceId, action, status, message: message ?? null });
}

/** Derive mime type from a saved filename */
function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "application/pdf";
}

// ── Upload + immediate extraction ─────────────────────────────────────────────

router.post("/invoices/upload", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message ?? "File upload failed" });
      return;
    }
    next();
  });
}, async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const userId = req.session.userId!;

  // Insert invoice row immediately so we have an ID for logs
  const [invoice] = await db.insert(invoicesTable).values({
    userId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    rawText: null,
    status: "uploaded",
  }).returning();

  await addLog(invoice.id, "upload", "success", `Uploaded: ${req.file.originalname}`);
  await addLog(invoice.id, "extract", "pending", "Starting AI vision extraction");

  // Run extraction immediately — convert to images → vision model → structured JSON
  try {
    const { client, model } = await getClaudeClient();
    const extractedData = await extractInvoiceFromFile(
      req.file.path,
      req.file.mimetype,
      client,
      model
    );

    await db.update(invoicesTable)
      .set({ extractedData, status: "extracted" })
      .where(eq(invoicesTable.id, invoice.id));

    await addLog(invoice.id, "extract", "success", "AI vision extraction completed");

    const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoice.id));
    res.status(201).json(updated);
  } catch (err) {
    const msg = (err as Error).message ?? "Unknown extraction error";
    req.log.warn({ err }, "Extraction failed during upload");
    await db.update(invoicesTable).set({ status: "failed" }).where(eq(invoicesTable.id, invoice.id));
    await addLog(invoice.id, "extract", "failed", `Extraction failed: ${msg}`);

    // Still return the invoice — user can retry extraction manually
    const [saved] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoice.id));
    res.status(201).json({ ...saved, extractionError: msg });
  }
});

// ── List invoices ─────────────────────────────────────────────────────────────

router.get("/invoices", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const parsed = ListInvoicesQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const status = parsed.success ? parsed.data.status : undefined;
  const offset = (page - 1) * limit;

  const where = status
    ? and(eq(invoicesTable.userId, userId), eq(invoicesTable.status, status))
    : eq(invoicesTable.userId, userId);

  const [invoices, totalResult] = await Promise.all([
    db.select().from(invoicesTable)
      .where(where)
      .orderBy(desc(invoicesTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(invoicesTable).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;
  res.json({ invoices, total, page, limit });
});

// ── Invoice stats ─────────────────────────────────────────────────────────────

router.get("/invoices/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const allInvoices = await db.select({
    status: invoicesTable.status,
    extractedData: invoicesTable.extractedData,
  }).from(invoicesTable).where(eq(invoicesTable.userId, userId));

  const stats = {
    total: allInvoices.length,
    uploaded: allInvoices.filter(i => i.status === "uploaded").length,
    extracted: allInvoices.filter(i => i.status === "extracted").length,
    pushed: allInvoices.filter(i => i.status === "pushed").length,
    failed: allInvoices.filter(i => i.status === "failed").length,
    totalValue: allInvoices.reduce((sum, inv) => {
      const data = inv.extractedData as { total?: number } | null;
      return sum + (data?.total ?? 0);
    }, 0),
  };

  res.json(stats);
});

// ── Get single invoice ────────────────────────────────────────────────────────

router.get("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [invoice] = await db.select().from(invoicesTable)
    .where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.userId, userId)));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  res.json(invoice);
});

// ── Update extracted data ─────────────────────────────────────────────────────

router.put("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.extractedData !== undefined) updateData.extractedData = parsed.data.extractedData;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const [updated] = await db.update(invoicesTable)
    .set(updateData)
    .where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.userId, userId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Invoice not found" }); return; }

  await addLog(updated.id, "update", "success", "Invoice data updated manually");
  res.json(updated);
});

// ── Delete invoice ────────────────────────────────────────────────────────────

router.delete("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [invoice] = await db.select().from(invoicesTable)
    .where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.userId, userId)));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  try {
    const filePath = path.join(uploadsDir, invoice.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}

  await db.delete(invoicesTable).where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.userId, userId)));
  res.json({ message: "Invoice deleted" });
});

// ── Re-extract (vision) ───────────────────────────────────────────────────────

router.post("/invoices/:id/extract", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = ExtractInvoiceParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [invoice] = await db.select().from(invoicesTable)
    .where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.userId, userId)));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  const filePath = path.join(uploadsDir, invoice.filename);
  if (!fs.existsSync(filePath)) {
    res.status(400).json({ error: "Original file not found — cannot re-extract" });
    return;
  }

  await addLog(invoice.id, "extract", "pending", "Starting AI vision re-extraction");

  try {
    const mimeType = mimeFromFilename(invoice.filename);
    const { client, model } = await getClaudeClient();
    const extractedData = await extractInvoiceFromFile(filePath, mimeType, client, model);

    await db.update(invoicesTable)
      .set({ extractedData, status: "extracted" })
      .where(eq(invoicesTable.id, params.data.id));

    await addLog(invoice.id, "extract", "success", "AI vision re-extraction completed");
    res.json(extractedData);
  } catch (err) {
    const msg = (err as Error).message ?? "Unknown error";
    await db.update(invoicesTable).set({ status: "failed" }).where(eq(invoicesTable.id, params.data.id));
    await addLog(invoice.id, "extract", "failed", `Re-extraction failed: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ── Push to Xero ──────────────────────────────────────────────────────────────

router.post("/invoices/:id/push-xero", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = PushToXeroParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [invoice] = await db.select().from(invoicesTable)
    .where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.userId, userId)));
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  if (!invoice.extractedData) {
    res.status(400).json({ error: "Invoice has no extracted data. Run extraction first." });
    return;
  }

  await addLog(invoice.id, "push_xero", "pending", "Attempting to push to Xero");

  try {
    const { accessToken, tenantId, tenantName } = await getValidToken(userId);

    const [accountCode, taxType, currency, invoiceType] = await Promise.all([
      getUserSetting(userId, "accounting_account_code"),
      getUserSetting(userId, "accounting_tax_type"),
      getUserSetting(userId, "accounting_currency"),
      getUserSetting(userId, "accounting_invoice_type"),
    ]);

    const accounting = {
      accountCode: accountCode ?? "",
      taxType: taxType ?? "NONE",
      currency: currency ?? "SGD",
      invoiceType: invoiceType ?? "BILL",
    };

    const extracted = invoice.extractedData as Record<string, unknown>;
    const { payload, errors } = buildXeroInvoice(extracted as Parameters<typeof buildXeroInvoice>[0], accounting);

    if (errors.length > 0) {
      const msg = `Validation failed: ${errors.join("; ")}`;
      await addLog(invoice.id, "push_xero", "failed", msg);
      res.status(400).json({ error: msg });
      return;
    }

    req.log.info({ xeroPayload: payload, tenantId }, "Sending invoice to Xero");
    await addLog(invoice.id, "push_xero", "pending",
      `Sending to Xero (tenant: ${tenantName || tenantId}): ${JSON.stringify(payload)}`);

    const xeroResponse = await xeroPost<{
      Invoices?: Array<{ InvoiceID: string; InvoiceNumber: string; Status: string; Warnings?: Array<{ Message: string }> }>;
    }>("/Invoices", { Invoices: [payload] }, accessToken, tenantId);

    req.log.info({ xeroResponse }, "Xero API response");

    const createdInvoice = xeroResponse?.Invoices?.[0];
    if (!createdInvoice?.InvoiceID) {
      throw new Error("Xero did not return an invoice ID — push may have failed silently");
    }

    const xeroInvoiceId = createdInvoice.InvoiceID;
    const warnings = createdInvoice.Warnings?.map((w) => w.Message).join("; ");

    await db.update(invoicesTable)
      .set({ status: "pushed" })
      .where(eq(invoicesTable.id, params.data.id));

    const successMsg = warnings
      ? `Pushed to Xero. Invoice ID: ${xeroInvoiceId}. Warnings: ${warnings}`
      : `Pushed to Xero. Invoice ID: ${xeroInvoiceId}`;
    await addLog(invoice.id, "push_xero", "success", successMsg);

    res.json({
      success: true,
      xeroInvoiceId,
      xeroStatus: createdInvoice.Status,
      warnings: createdInvoice.Warnings ?? [],
      message: `Invoice successfully created in Xero (${tenantName || tenantId})`,
    });
  } catch (err) {
    await db.update(invoicesTable).set({ status: "failed" }).where(eq(invoicesTable.id, params.data.id));

    let userMessage: string;
    let logMessage: string;

    if (err instanceof XeroApiError) {
      userMessage = `Xero rejected the invoice: ${err.message}`;
      logMessage = `Xero API error (${err.statusCode}): ${err.message} — body: ${JSON.stringify(err.body)}`;
    } else {
      userMessage = (err as Error).message;
      logMessage = `Xero push error: ${(err as Error).message}`;
    }

    req.log.error({ err }, logMessage);
    await addLog(invoice.id, "push_xero", "failed", logMessage);
    res.status(500).json({ error: userMessage });
  }
});

// ── Invoice logs ──────────────────────────────────────────────────────────────

router.get("/invoices/:id/logs", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const params = GetInvoiceLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  // Verify invoice belongs to user
  const [ownerCheck] = await db.select({ id: invoicesTable.id }).from(invoicesTable)
    .where(and(eq(invoicesTable.id, params.data.id), eq(invoicesTable.userId, userId)));
  if (!ownerCheck) { res.status(404).json({ error: "Invoice not found" }); return; }

  const logs = await db.select().from(invoiceLogsTable)
    .where(eq(invoiceLogsTable.invoiceId, params.data.id))
    .orderBy(desc(invoiceLogsTable.createdAt));

  res.json(logs);
});

export default router;
