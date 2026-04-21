import crypto from "crypto";
import { db, settingsTable, userSettingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

// ─── Constants ────────────────────────────────────────────────────────────────

export const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
export const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
export const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";
export const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
export const XERO_SCOPES = "openid profile email offline_access accounting.invoices accounting.contacts accounting.settings";

// ─── PKCE ─────────────────────────────────────────────────────────────────────

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(40).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
}

export async function deleteSetting(key: string): Promise<void> {
  await db.delete(settingsTable).where(eq(settingsTable.key, key));
}

// ─── Per-user settings helpers ────────────────────────────────────────────────

export async function getUserSetting(userId: number, key: string): Promise<string | null> {
  const [row] = await db.select()
    .from(userSettingsTable)
    .where(and(eq(userSettingsTable.userId, userId), eq(userSettingsTable.key, key)));
  return row?.value ?? null;
}

export async function setUserSetting(userId: number, key: string, value: string): Promise<void> {
  await db.insert(userSettingsTable)
    .values({ userId, key, value })
    .onConflictDoUpdate({
      target: [userSettingsTable.userId, userSettingsTable.key],
      set: { value, updatedAt: new Date() },
    });
}

export async function deleteUserSetting(userId: number, key: string): Promise<void> {
  await db.delete(userSettingsTable)
    .where(and(eq(userSettingsTable.userId, userId), eq(userSettingsTable.key, key)));
}

export async function deleteAllUserSettings(userId: number, keys: string[]): Promise<void> {
  for (const key of keys) {
    await deleteUserSetting(userId, key);
  }
}

// ─── OAuth URL builder ────────────────────────────────────────────────────────

export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: XERO_SCOPES,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${XERO_AUTH_URL}?${q}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeCode(params: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code_verifier: params.codeVerifier,
  });

  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TokenResponse>;
}

export async function doTokenRefresh(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TokenResponse>;
}

// ─── Tenant connections ───────────────────────────────────────────────────────

export interface XeroTenant {
  id: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
}

export async function getTenantConnections(accessToken: string): Promise<XeroTenant[]> {
  const res = await fetch(XERO_CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get Xero tenant connections (${res.status}): ${text}`);
  }

  return res.json() as Promise<XeroTenant[]>;
}

// ─── Get valid access token (auto-refresh) ────────────────────────────────────

// ─── Per-user refresh mutex ───────────────────────────────────────────────────
// Prevents concurrent calls from using the same refresh token twice.
// Xero invalidates the entire token family if a refresh token is reused.
const refreshInProgress = new Map<number, Promise<{ accessToken: string }>>();

export async function getValidToken(userId: number): Promise<{ accessToken: string; tenantId: string; tenantName: string }> {
  const [accessToken, refreshToken, tokenExpiry, tenantId, tenantName, clientId, clientSecret] = await Promise.all([
    getUserSetting(userId, "xero_access_token"),
    getUserSetting(userId, "xero_refresh_token"),
    getUserSetting(userId, "xero_token_expiry"),
    getUserSetting(userId, "xero_tenant_id"),
    getUserSetting(userId, "xero_tenant_name"),
    getSetting("xero_client_id"),
    getSetting("xero_client_secret"),
  ]);

  console.log("[xero:getValidToken] DB state (userId=%d):", userId, {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    tokenExpiry: tokenExpiry ?? "(none)",
    tenantId: tenantId ?? "(none)",
    tenantName: tenantName ?? "(none)",
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
  });

  if (!accessToken || !tenantId) {
    const missing = [!accessToken && "access_token", !tenantId && "tenant_id"].filter(Boolean).join(", ");
    throw new Error(`Xero is not connected. Missing from database: ${missing}. Please connect Xero in Settings.`);
  }

  // Proactively refresh 120 seconds before expiry (as recommended by Xero)
  const expiry = tokenExpiry ? new Date(tokenExpiry).getTime() : 0;
  const needsRefresh = Date.now() > expiry - 120_000;

  console.log("[xero:getValidToken] Token expiry check:", { expiry: tokenExpiry ?? "(none)", needsRefresh, tenantId });

  if (!needsRefresh) {
    return { accessToken, tenantId, tenantName: tenantName ?? "" };
  }

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Cannot refresh Xero token — please reconnect Xero in Settings.");
  }

  // If a refresh is already in progress for this user, wait for it instead of
  // starting a second one. Xero will invalidate the token family if the same
  // refresh token is used more than once.
  let pending = refreshInProgress.get(userId);
  if (!pending) {
    console.log("[xero:getValidToken] Starting token refresh for userId=%d", userId);
    pending = (async () => {
      const tokens = await doTokenRefresh({ clientId, clientSecret, refreshToken });
      const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      await Promise.all([
        setUserSetting(userId, "xero_access_token", tokens.access_token),
        setUserSetting(userId, "xero_refresh_token", tokens.refresh_token),
        setUserSetting(userId, "xero_token_expiry", newExpiry),
      ]);
      console.log("[xero:getValidToken] Token refreshed for userId=%d, new expiry: %s", userId, newExpiry);
      return { accessToken: tokens.access_token };
    })().finally(() => {
      refreshInProgress.delete(userId);
    });
    refreshInProgress.set(userId, pending);
  } else {
    console.log("[xero:getValidToken] Waiting for in-progress refresh for userId=%d", userId);
  }

  const refreshed = await pending;
  return { accessToken: refreshed.accessToken, tenantId, tenantName: tenantName ?? "" };
}

// ─── Xero API call helper ─────────────────────────────────────────────────────

export async function xeroPost<T = unknown>(
  path: string,
  body: unknown,
  accessToken: string,
  tenantId: string
): Promise<T> {
  const url = `${XERO_API_BASE}${path}`;
  const payload = JSON.stringify(body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: payload,
  });

  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    const xerr = json as Record<string, unknown>;

    // Xero ValidationException: errors live in Elements[].ValidationErrors[].Message
    const elements = xerr?.Elements as Array<Record<string, unknown>> | undefined;
    const validationMessages: string[] = [];
    if (Array.isArray(elements)) {
      for (const el of elements) {
        const verrs = el?.ValidationErrors as Array<Record<string, string>> | undefined;
        if (Array.isArray(verrs)) {
          for (const ve of verrs) {
            if (ve?.Message) validationMessages.push(ve.Message);
          }
        }
      }
    }

    const detail =
      validationMessages.length > 0
        ? validationMessages.join("; ")
        : (xerr?.Detail as string) ??
          (xerr?.Message as string) ??
          (xerr?.message as string) ??
          text;

    // Always log the full Xero error body for debugging
    console.error("[xero:xeroPost] API error", {
      status: res.status,
      detail,
      fullBody: JSON.stringify(json),
    });

    throw new XeroApiError(detail, res.status, json);
  }

  return json as T;
}

export class XeroApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "XeroApiError";
  }
}

// ─── Invoice payload builder ──────────────────────────────────────────────────

export interface XeroLineItem {
  Description: string;
  Quantity: number;
  UnitAmount: number;
  AccountCode: string;
  TaxType?: string;
}

export interface XeroInvoicePayload {
  Type: "ACCPAY" | "ACCREC";
  Contact: { Name: string };
  Date?: string;
  DueDate?: string;
  InvoiceNumber?: string;
  Reference?: string;
  CurrencyCode?: string;
  LineAmountTypes: "EXCLUSIVE" | "INCLUSIVE" | "NOTAX";
  LineItems: XeroLineItem[];
}

interface ExtractedData {
  supplier_name?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  currency?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  line_items?: Array<{
    description?: string;
    quantity?: number;
    unit_price?: number;
    amount?: number;
  }> | null;
}

interface AccountingSettings {
  accountCode: string;
  taxType: string;          // Xero TaxType code, e.g. INPUT2, NONE, OUTPUT2
  currency: string;
  invoiceType: string;      // "BILL" or "INVOICE"
}

/** Map our invoice type string to Xero Type code */
function toXeroType(invoiceType: string): "ACCPAY" | "ACCREC" {
  return invoiceType === "INVOICE" ? "ACCREC" : "ACCPAY";
}

/** Decide LineAmountTypes from TaxType */
function toLineAmountTypes(taxType: string): "EXCLUSIVE" | "INCLUSIVE" | "NOTAX" {
  if (!taxType || taxType === "NONE" || taxType === "NOTAX" || taxType === "ZERORATED") return "NOTAX";
  return "EXCLUSIVE"; // amounts are tax-exclusive when a real tax type is applied
}

/**
 * Compute a safe UnitAmount ensuring Xero's LineAmount = Quantity × UnitAmount
 * matches the extracted amount.
 *
 * Rules:
 * - If unit_price is provided → use it directly (Xero will compute qty × unit_price)
 * - If only amount is provided (no unit_price):
 *     * quantity > 1 → derive unit_price = amount / quantity  (avoids qty × amount mismatch)
 *     * quantity = 1 or missing → unit_price = amount
 */
function safeUnitAmount(
  unitPrice: number | undefined | null,
  amount: number | undefined | null,
  quantity: number
): number {
  if (unitPrice != null && unitPrice >= 0) return roundTo2(unitPrice);
  if (amount == null) return 0;
  // Derive per-unit price to avoid Xero computing quantity × amount incorrectly
  return roundTo2(amount / quantity);
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildXeroInvoice(
  extracted: ExtractedData,
  accounting: AccountingSettings
): { payload: XeroInvoicePayload; errors: string[] } {
  const errors: string[] = [];

  const contactName = extracted.supplier_name?.trim() ?? "";
  if (!contactName) errors.push("Contact.Name is required (supplier_name missing from extracted data)");

  const accountCode = accounting.accountCode?.trim();
  // Do NOT fall back to a hard-coded "200" — that code won't exist in most Xero orgs
  if (!accountCode) errors.push("Account Code is required — set it in Settings > Accounting Defaults");

  const taxType = accounting.taxType?.trim() || "NONE";
  const lineAmountTypes = toLineAmountTypes(taxType);

  // When LineAmountTypes is NOTAX, Xero requires TaxType to be omitted from line items entirely.
  // Sending "NONE" causes a ValidationException in many Xero orgs.
  const lineTaxType = lineAmountTypes === "NOTAX" ? undefined : taxType;

  // Build line items from extracted data, or fall back to a single summary line
  let lineItems: XeroLineItem[] = [];

  if (extracted.line_items && extracted.line_items.length > 0) {
    lineItems = extracted.line_items.map((item, i) => {
      const qty = item.quantity ?? 1;
      const unitAmt = safeUnitAmount(item.unit_price, item.amount, qty);

      const li: XeroLineItem = {
        Description: item.description?.trim() || `Line item ${i + 1}`,
        Quantity: qty,
        UnitAmount: unitAmt,
        AccountCode: accountCode!, // validated above
      };
      if (lineTaxType) li.TaxType = lineTaxType;
      return li;
    });
  } else {
    // No line items extracted — create a single summary line from total
    const amount = extracted.subtotal ?? extracted.total ?? 0;
    const li: XeroLineItem = {
      Description: `Invoice from ${contactName || "Supplier"}`,
      Quantity: 1,
      UnitAmount: roundTo2(amount),
      AccountCode: accountCode!,
    };
    if (lineTaxType) li.TaxType = lineTaxType;
    lineItems = [li];
  }

  // Per-item validation: UnitAmount must be a number, AccountCode must not be empty
  for (let i = 0; i < lineItems.length; i++) {
    const li = lineItems[i];
    if (isNaN(li.UnitAmount)) errors.push(`Line item ${i + 1}: UnitAmount is not a number`);
    if (!li.AccountCode) errors.push(`Line item ${i + 1}: AccountCode is missing`);
  }

  if (lineItems.length === 0) {
    errors.push("At least one line item is required");
  }

  // Log the final payload for debugging
  console.log("[xero:buildInvoice]", {
    contactName,
    accountCode,
    taxType,
    lineAmountTypes,
    lineTaxType: lineTaxType ?? "(omitted — NOTAX mode)",
    lineItemCount: lineItems.length,
    lineItems: lineItems.map(li => ({
      desc: li.Description.slice(0, 40),
      qty: li.Quantity,
      unitAmt: li.UnitAmount,
      acct: li.AccountCode,
      tax: li.TaxType ?? "(omitted)",
    })),
  });

  const payload: XeroInvoicePayload = {
    Type: toXeroType(accounting.invoiceType),
    Contact: { Name: contactName || "Unknown Supplier" },
    LineAmountTypes: lineAmountTypes,
    LineItems: lineItems,
  };

  if (extracted.invoice_date) payload.Date = extracted.invoice_date;
  if (extracted.due_date) payload.DueDate = extracted.due_date;
  if (extracted.invoice_number) payload.InvoiceNumber = extracted.invoice_number;
  if (extracted.currency || accounting.currency) {
    payload.CurrencyCode = extracted.currency ?? accounting.currency;
  }

  return { payload, errors };
}
