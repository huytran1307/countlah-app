import { execSync, execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type Anthropic from "@anthropic-ai/sdk";

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png"]);

/** Returns true for image MIME types we accept */
export function isImageMime(mimeType: string): boolean {
  return ALLOWED_IMAGE_MIMES.has(mimeType);
}

/**
 * Resolve the full path to pdftoppm at startup.
 * Checks: which command → known Nix store locations → bare name.
 * Result is cached so resolution only happens once.
 */
const PDFTOPPM_BIN = ((): string => {
  // 1. Try `which` — works when PATH includes poppler bin dir
  for (const whichCmd of ["which pdftoppm", "command -v pdftoppm"]) {
    try {
      const p = execSync(whichCmd, { encoding: "utf8", stdio: "pipe", timeout: 5_000 }).trim();
      if (p && fs.existsSync(p)) return p;
    } catch {}
  }

  // 2. Check nix store for poppler-utils (stable-25_05 hash may vary)
  try {
    const nixStore = "/nix/store";
    const entries = fs.readdirSync(nixStore);
    for (const entry of entries) {
      if (!entry.includes("poppler-utils") && !entry.includes("poppler_utils")) continue;
      const candidate = path.join(nixStore, entry, "bin", "pdftoppm");
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch {}

  // 3. Common system paths
  for (const p of ["/usr/bin/pdftoppm", "/usr/local/bin/pdftoppm", "/opt/homebrew/bin/pdftoppm"]) {
    if (fs.existsSync(p)) return p;
  }

  // 4. Fall back to bare name — will throw at call time if not found
  return "pdftoppm";
})();

/**
 * Convert a PDF file to PNG images (first N pages) using pdftoppm.
 * Returns absolute paths to the generated PNG files, sorted by page number.
 */
function pdfToImages(pdfPath: string, maxPages = 4): string[] {
  const prefix = path.join(
    os.tmpdir(),
    `inv-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  execFileSync(
    PDFTOPPM_BIN,
    ["-r", "200", "-png", "-l", String(maxPages), pdfPath, prefix],
    { timeout: 60_000, stdio: "pipe" }
  );

  const tmpDir = path.dirname(prefix);
  const baseName = path.basename(prefix);

  return fs
    .readdirSync(tmpDir)
    .filter((f) => f.startsWith(baseName) && f.endsWith(".png"))
    .sort()
    .map((f) => path.join(tmpDir, f));
}

/** Read a file and return its raw base64 string */
function toBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString("base64");
}

const EXTRACTION_PROMPT = `You are an invoice data extractor. Look at this invoice image carefully and extract all fields into a single JSON object.

Return ONLY valid JSON — no markdown, no code fences, no explanation. If a field is not present or cannot be determined, use null.

Required JSON schema:
{
  "supplier_name": string | null,
  "invoice_number": string | null,
  "invoice_date": string | null,   // ISO format YYYY-MM-DD if possible
  "due_date": string | null,        // ISO format YYYY-MM-DD if possible
  "currency": string | null,        // e.g. "SGD", "USD", "AUD"
  "subtotal": number | null,
  "tax": number | null,
  "total": number | null,
  "line_items": [
    {
      "description": string,
      "quantity": number | null,
      "unit_price": number | null,
      "amount": number | null
    }
  ] | null
}

Rules:
- Extract numbers as plain numbers (no currency symbols, no commas)
- If there are multiple pages, combine all line items
- Use the document's own currency symbol/code to determine the currency field
- If the document shows GST/VAT/tax separately, put it in the "tax" field
- supplier_name is the company or person who ISSUED the invoice (the seller/vendor)`;

/**
 * Send one or more invoice page images to Claude Vision and return structured JSON.
 * Throws if the model returns invalid JSON.
 */
async function visionExtract(
  images: Array<{ base64: string; mediaType: "image/jpeg" | "image/png" }>,
  anthropicClient: Anthropic,
  model: string
): Promise<Record<string, unknown>> {
  const imageBlocks: Anthropic.ImageBlockParam[] = images.map(({ base64, mediaType }) => ({
    type: "image",
    source: {
      type: "base64",
      media_type: mediaType,
      data: base64,
    },
  }));

  const response = await anthropicClient.messages.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          ...imageBlocks,
        ],
      },
    ],
  });

  const firstBlock = response.content[0];
  const raw = firstBlock.type === "text" ? firstBlock.text.trim() : "";

  // Strip markdown fences if the model wraps its output
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as Record<string, unknown>;
}

/**
 * Unified invoice extraction from any supported file type.
 *
 * - PDF  → convert pages to PNG via pdftoppm → send all page images to Claude Vision
 * - JPEG/PNG → send directly to Claude Vision
 *
 * Returns structured invoice data as a plain object.
 */
export async function extractInvoiceFromFile(
  filePath: string,
  mimeType: string,
  anthropicClient: Anthropic,
  model: string
): Promise<Record<string, unknown>> {
  if (isImageMime(mimeType)) {
    const mediaType = mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
    const base64 = toBase64(filePath);
    return visionExtract([{ base64, mediaType }], anthropicClient, model);
  }

  // PDF: convert pages to images first
  let imagePaths: string[] = [];
  try {
    imagePaths = pdfToImages(filePath);

    if (imagePaths.length === 0) {
      throw new Error("pdftoppm produced no images — the PDF may be encrypted or corrupted");
    }

    const images = imagePaths.map((p) => ({
      base64: toBase64(p),
      mediaType: "image/png" as const,
    }));
    return await visionExtract(images, anthropicClient, model);
  } finally {
    for (const p of imagePaths) {
      try { fs.unlinkSync(p); } catch {}
    }
  }
}
