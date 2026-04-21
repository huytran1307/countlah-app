import { Router, type IRouter } from "express";
import multer from "multer";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";
import { getStoredKeyStatus, storeApiKey, deleteApiKey } from "../lib/claude";
import {
  generatePkce,
  buildAuthUrl,
  exchangeCode,
  getTenantConnections,
  getSetting,
  setSetting,
  deleteSetting,
  getUserSetting,
  setUserSetting,
  deleteAllUserSettings,
} from "../lib/xero";

const router: IRouter = Router();

// ── Logo storage (memory — stored as base64 in DB for persistence) ────────────

const logoUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"].includes(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Logo must be a PNG, JPG, WEBP, or SVG image"));
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});

// ─── Constant key names ───────────────────────────────────────────────────────

const GLOBAL = {
  BRANDING_LOGO_URL: "branding_logo_url",
  BRANDING_COMPANY_NAME: "branding_company_name",
  XERO_CLIENT_ID: "xero_client_id",
  XERO_CLIENT_SECRET: "xero_client_secret",
  ACCT_ACCOUNT_CODE: "accounting_account_code",
  ACCT_TAX_TYPE: "accounting_tax_type",
  ACCT_CURRENCY: "accounting_currency",
  ACCT_INVOICE_TYPE: "accounting_invoice_type",
  FIELD_MAPPING: "field_mapping",
  CONTACT_AUTO_CREATE: "contact_auto_create",
  CONTACT_NAME_MATCHING: "contact_name_matching",
};

const USER = {
  XERO_ACCESS_TOKEN: "xero_access_token",
  XERO_REFRESH_TOKEN: "xero_refresh_token",
  XERO_TOKEN_EXPIRY: "xero_token_expiry",
  XERO_TENANT_ID: "xero_tenant_id",
  XERO_TENANT_NAME: "xero_tenant_name",
  XERO_CONNECTED: "xero_connected",
};

const XERO_TOKEN_KEYS = [
  USER.XERO_ACCESS_TOKEN,
  USER.XERO_REFRESH_TOKEN,
  USER.XERO_TOKEN_EXPIRY,
  USER.XERO_TENANT_ID,
  USER.XERO_TENANT_NAME,
  USER.XERO_CONNECTED,
];

const DEFAULT_FIELD_MAPPING: Record<string, { xeroField: string; required: boolean }> = {
  supplier_name: { xeroField: "Contact Name", required: true },
  invoice_number: { xeroField: "Invoice Number", required: false },
  invoice_date: { xeroField: "Invoice Date", required: false },
  due_date: { xeroField: "Due Date", required: false },
  total: { xeroField: "Total Amount", required: true },
  line_items: { xeroField: "Line Items", required: false },
};

function maskSecret(value: string | null): { isSet: boolean; hint: string | null } {
  if (!value) return { isSet: false, hint: null };
  const hint = value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : "****";
  return { isSet: true, hint };
}

function buildRedirectUri(req: { headers: { host?: string }; protocol: string }): string {
  const host = req.headers.host ?? "localhost";
  const proto = process.env.NODE_ENV === "production" ? "https" : req.protocol;
  return `${proto}://${host}/api/auth/xero/callback`;
}

// ─── Anthropic Key (admin-only) ───────────────────────────────────────────────

router.get("/settings/anthropic-key", requireAdmin, async (_req, res): Promise<void> => {
  const status = await getStoredKeyStatus();
  res.json(status);
});

router.post("/settings/anthropic-key", requireAdmin, async (req, res): Promise<void> => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-ant-")) {
    res.status(400).json({ error: "Invalid API key — must start with sk-ant-" });
    return;
  }
  await storeApiKey(apiKey.trim());
  const status = await getStoredKeyStatus();
  res.json({ success: true, ...status });
});

router.delete("/settings/anthropic-key", requireAdmin, async (_req, res): Promise<void> => {
  await deleteApiKey();
  res.json({ success: true, isSet: false, hint: null });
});

// ─── All Settings (aggregate GET) — per-user ─────────────────────────────────

router.get("/settings/all", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const isAdmin = req.session.role === "admin";

  const [
    xeroClientId,
    xeroClientSecret,
    xeroAccessToken,
    xeroTenantId,
    xeroTenantName,
    acctCode,
    acctTaxType,
    acctCurrency,
    acctType,
    fieldMappingRaw,
    contactAutoCreate,
    contactNameMatching,
    brandingLogoUrl,
    brandingCompanyName,
  ] = await Promise.all([
    getSetting(GLOBAL.XERO_CLIENT_ID),
    getSetting(GLOBAL.XERO_CLIENT_SECRET),
    getUserSetting(userId, USER.XERO_ACCESS_TOKEN),
    getUserSetting(userId, USER.XERO_TENANT_ID),
    getUserSetting(userId, USER.XERO_TENANT_NAME),
    getSetting(GLOBAL.ACCT_ACCOUNT_CODE),
    getSetting(GLOBAL.ACCT_TAX_TYPE),
    getSetting(GLOBAL.ACCT_CURRENCY),
    getSetting(GLOBAL.ACCT_INVOICE_TYPE),
    getSetting(GLOBAL.FIELD_MAPPING),
    getSetting(GLOBAL.CONTACT_AUTO_CREATE),
    getSetting(GLOBAL.CONTACT_NAME_MATCHING),
    getSetting(GLOBAL.BRANDING_LOGO_URL),
    getSetting(GLOBAL.BRANDING_COMPANY_NAME),
  ]);

  const anthropicStatus = isAdmin ? await getStoredKeyStatus() : null;

  // Connected = both access token AND tenant ID are present in DB
  const xeroConnected = !!(xeroAccessToken && xeroTenantId);

  let fieldMapping = DEFAULT_FIELD_MAPPING;
  try {
    if (fieldMappingRaw) fieldMapping = JSON.parse(fieldMappingRaw);
  } catch {}

  res.json({
    anthropic: anthropicStatus,
    xero: {
      clientId: xeroClientId ?? "",
      clientSecret: maskSecret(xeroClientSecret),
      redirectUri: buildRedirectUri(req),
      connected: xeroConnected,
      tenantId: xeroTenantId ?? null,
      tenantName: xeroTenantName ?? null,
    },
    accounting: {
      accountCode: acctCode ?? "",
      taxType: acctTaxType ?? "",
      currency: acctCurrency ?? "SGD",
      invoiceType: acctType ?? "BILL",
    },
    fieldMapping,
    contacts: {
      autoCreate: contactAutoCreate !== "false",
      nameMatching: contactNameMatching ?? "exact",
    },
    branding: {
      logoUrl: brandingLogoUrl ?? null,
      companyName: brandingCompanyName ?? null,
    },
  });
});

// ─── Xero Credentials (save client ID + secret) — admin-only global ──────────

router.post("/settings/xero", requireAdmin, async (req, res): Promise<void> => {
  const { clientId, clientSecret } = req.body;
  if (typeof clientId === "string") await setSetting(GLOBAL.XERO_CLIENT_ID, clientId.trim());
  if (typeof clientSecret === "string" && clientSecret.trim() !== "") {
    await setSetting(GLOBAL.XERO_CLIENT_SECRET, clientSecret.trim());
  }
  res.json({ success: true });
});

// ─── Xero OAuth: get authorization URL — per-user ─────────────────────────────

router.get("/settings/xero/auth-url", requireAuth, async (req, res): Promise<void> => {
  const [clientId, clientSecret] = await Promise.all([
    getSetting(GLOBAL.XERO_CLIENT_ID),
    getSetting(GLOBAL.XERO_CLIENT_SECRET),
  ]);

  if (!clientId || !clientSecret) {
    res.status(400).json({ error: "Save your Xero Client ID and Client Secret in Settings before connecting" });
    return;
  }

  const { verifier, challenge } = generatePkce();
  const state = Math.random().toString(36).slice(2);

  req.session.xeroOAuthState = state;
  req.session.xeroCodeVerifier = verifier;
  // Store where to redirect after OAuth completes (dashboard or settings)
  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "settings";
  req.session.xeroReturnTo = returnTo;

  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve()))
  );

  const redirectUri = buildRedirectUri(req);
  const url = buildAuthUrl({ clientId, redirectUri, state, codeChallenge: challenge });
  res.json({ url });
});

// ─── Xero OAuth callback ──────────────────────────────────────────────────────

router.get("/auth/xero/callback", async (req, res): Promise<void> => {
  const { code, state, error: xeroError } = req.query as Record<string, string>;

  const frontendBase = process.env.NODE_ENV === "production"
    ? `https://${req.headers.host}`
    : `http://${req.headers.host?.replace(/:\d+$/, "")}`;

  const returnTo = req.session.xeroReturnTo;
  const returnPath = returnTo === "dashboard" ? "dashboard" : returnTo === "app" ? "app?view=xero" : "settings";
  const returnUrl = `${frontendBase}/${returnPath}`;

  if (xeroError) {
    res.redirect(`${returnUrl}?xero_error=${encodeURIComponent(xeroError)}`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${returnUrl}?xero_error=missing_code`);
    return;
  }

  if (state !== req.session.xeroOAuthState) {
    res.redirect(`${returnUrl}?xero_error=state_mismatch`);
    return;
  }

  const codeVerifier = req.session.xeroCodeVerifier;
  if (!codeVerifier) {
    res.redirect(`${returnUrl}?xero_error=missing_verifier`);
    return;
  }

  const userId = req.session.userId;
  if (!userId) {
    res.redirect(`${returnUrl}?xero_error=not_authenticated`);
    return;
  }

  try {
    const [clientId, clientSecret] = await Promise.all([
      getSetting(GLOBAL.XERO_CLIENT_ID),
      getSetting(GLOBAL.XERO_CLIENT_SECRET),
    ]);

    if (!clientId || !clientSecret) {
      res.redirect(`${returnUrl}?xero_error=missing_credentials`);
      return;
    }

    const redirectUri = buildRedirectUri(req);
    const tokens = await exchangeCode({ clientId, clientSecret, redirectUri, code, codeVerifier });
    const tenants = await getTenantConnections(tokens.access_token);

    if (tenants.length === 0) {
      res.redirect(`${returnUrl}?xero_error=no_tenants`);
      return;
    }

    const tenant = tenants[0];
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    console.log("[xero:callback] Storing tokens for userId=%d, tenant=%s", userId, tenant.tenantName);

    await Promise.all([
      setUserSetting(userId, USER.XERO_ACCESS_TOKEN, tokens.access_token),
      setUserSetting(userId, USER.XERO_REFRESH_TOKEN, tokens.refresh_token),
      setUserSetting(userId, USER.XERO_TOKEN_EXPIRY, tokenExpiry),
      setUserSetting(userId, USER.XERO_TENANT_ID, tenant.tenantId),
      setUserSetting(userId, USER.XERO_TENANT_NAME, tenant.tenantName),
      setUserSetting(userId, USER.XERO_CONNECTED, "true"),
    ]);

    delete req.session.xeroOAuthState;
    delete req.session.xeroCodeVerifier;
    delete req.session.xeroReturnTo;

    res.redirect(`${returnUrl}?xero=connected&tenant=${encodeURIComponent(tenant.tenantName)}`);
  } catch (err) {
    const msg = (err as Error).message ?? "Unknown error";
    res.redirect(`${returnUrl}?xero_error=${encodeURIComponent(msg)}`);
  }
});

// ─── Xero connection status (lightweight, for dashboard) — per-user ──────────

router.get("/xero/status", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [accessToken, tenantId, tenantName, clientId, clientSecret] = await Promise.all([
    getUserSetting(userId, USER.XERO_ACCESS_TOKEN),
    getUserSetting(userId, USER.XERO_TENANT_ID),
    getUserSetting(userId, USER.XERO_TENANT_NAME),
    getSetting(GLOBAL.XERO_CLIENT_ID),
    getSetting(GLOBAL.XERO_CLIENT_SECRET),
  ]);
  const connected = !!(accessToken && tenantId);
  const hasCredentials = !!(clientId && clientSecret);
  res.json({ connected, tenantName: tenantName ?? null, hasCredentials });
});

// ─── Xero disconnect — per-user ───────────────────────────────────────────────

router.delete("/settings/xero/connect", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  await deleteAllUserSettings(userId, XERO_TOKEN_KEYS);
  res.json({ success: true, connected: false });
});

// ─── Accounting Defaults — global (admin-only) ───────────────────────────────

router.post("/settings/accounting", requireAdmin, async (req, res): Promise<void> => {
  const { accountCode, taxType, currency, invoiceType } = req.body;
  await Promise.all([
    typeof accountCode === "string" ? setSetting(GLOBAL.ACCT_ACCOUNT_CODE, accountCode.trim()) : Promise.resolve(),
    typeof taxType === "string" ? setSetting(GLOBAL.ACCT_TAX_TYPE, taxType.trim()) : Promise.resolve(),
    typeof currency === "string" ? setSetting(GLOBAL.ACCT_CURRENCY, currency.trim()) : Promise.resolve(),
    typeof invoiceType === "string" ? setSetting(GLOBAL.ACCT_INVOICE_TYPE, invoiceType.trim()) : Promise.resolve(),
  ]);
  res.json({ success: true });
});

// ─── Field Mapping — global (admin-only) ─────────────────────────────────────

router.post("/settings/field-mapping", requireAdmin, async (req, res): Promise<void> => {
  const { fieldMapping } = req.body;
  if (!fieldMapping || typeof fieldMapping !== "object") {
    res.status(400).json({ error: "Invalid field mapping" });
    return;
  }
  await setSetting(GLOBAL.FIELD_MAPPING, JSON.stringify(fieldMapping));
  res.json({ success: true });
});

// ─── Contact Settings — global (admin-only) ───────────────────────────────────

router.post("/settings/contacts", requireAdmin, async (req, res): Promise<void> => {
  const { autoCreate, nameMatching } = req.body;
  await Promise.all([
    typeof autoCreate === "boolean" ? setSetting(GLOBAL.CONTACT_AUTO_CREATE, String(autoCreate)) : Promise.resolve(),
    typeof nameMatching === "string" ? setSetting(GLOBAL.CONTACT_NAME_MATCHING, nameMatching.trim()) : Promise.resolve(),
  ]);
  res.json({ success: true });
});

// ─── Branding (admin-only global) ─────────────────────────────────────────────

router.get("/branding", async (_req, res): Promise<void> => {
  const [logoUrl, companyName] = await Promise.all([
    getSetting(GLOBAL.BRANDING_LOGO_URL),
    getSetting(GLOBAL.BRANDING_COMPANY_NAME),
  ]);
  res.json({ logoUrl: logoUrl ?? null, companyName: companyName ?? null });
});

router.post("/settings/branding/logo", requireAdmin, (req, res, next) => {
  logoUpload.single("logo")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message ?? "Logo upload failed" });
      return;
    }
    next();
  });
}, async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const base64 = req.file.buffer.toString("base64");
  const logoUrl = `data:${req.file.mimetype};base64,${base64}`;
  await setSetting(GLOBAL.BRANDING_LOGO_URL, logoUrl);
  res.json({ success: true, logoUrl });
});

router.post("/settings/branding", requireAdmin, async (req, res): Promise<void> => {
  const { companyName } = req.body;
  if (typeof companyName === "string") {
    await setSetting(GLOBAL.BRANDING_COMPANY_NAME, companyName.trim());
  }
  res.json({ success: true });
});

router.delete("/settings/branding/logo", requireAdmin, async (_req, res): Promise<void> => {
  await deleteSetting(GLOBAL.BRANDING_LOGO_URL);
  res.json({ success: true, logoUrl: null });
});

export default router;
