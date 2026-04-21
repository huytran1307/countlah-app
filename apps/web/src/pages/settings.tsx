import { useState, useEffect, useCallback } from "react";
import Layout from "../components/layout";
import { refreshBranding } from "../hooks/use-branding";

const inputCls =
  "w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/20";

const selectCls =
  "w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/25 transition-all duration-200 appearance-none cursor-pointer";

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-7 space-y-6">
      <div>
        <h2 className="text-white font-semibold text-sm uppercase tracking-widest">{title}</h2>
        {description && <p className="text-white/35 text-xs mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-white/35 text-xs font-medium uppercase tracking-widest mb-2">{children}</label>;
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-white/20"}`} />
      <span className={`text-sm font-medium ${ok ? "text-emerald-400" : "text-white/40"}`}>{label}</span>
    </div>
  );
}

function SaveMsg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <p className={`text-sm font-medium ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
  );
}

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, { credentials: "include", ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

interface AllSettings {
  anthropic: { isSet: boolean; hint: string | null } | null;
  xero: {
    clientId: string;
    clientSecret: { isSet: boolean; hint: string | null };
    redirectUri: string;
    connected: boolean;
    tenantId: string | null;
    tenantName: string | null;
  };
  accounting: {
    accountCode: string;
    taxType: string;
    currency: string;
    invoiceType: string;
  };
  fieldMapping: Record<string, { xeroField: string; required: boolean }>;
  contacts: {
    autoCreate: boolean;
    nameMatching: string;
  };
  branding: {
    logoUrl: string | null;
    companyName: string | null;
  };
}

const AI_FIELD_LABELS: Record<string, string> = {
  supplier_name: "Supplier Name",
  invoice_number: "Invoice Number",
  invoice_date: "Invoice Date",
  due_date: "Due Date",
  total: "Total Amount",
  line_items: "Line Items",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AllSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [anthropicKey, setAnthropicKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [anthropicMsg, setAnthropicMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [anthropicSaving, setAnthropicSaving] = useState(false);
  const [anthropicRemoving, setAnthropicRemoving] = useState(false);

  const [xeroClientId, setXeroClientId] = useState("");
  const [xeroClientSecret, setXeroClientSecret] = useState("");
  const [showXeroSecret, setShowXeroSecret] = useState(false);
  const [xeroMsg, setXeroMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [xeroSaving, setXeroSaving] = useState(false);
  const [xeroConnecting, setXeroConnecting] = useState(false);
  const [xeroCopied, setXeroCopied] = useState(false);

  const [acctCode, setAcctCode] = useState("");
  const [acctTaxType, setAcctTaxType] = useState("NONE");
  const [acctCurrency, setAcctCurrency] = useState("SGD");
  const [acctType, setAcctType] = useState("BILL");
  const [acctMsg, setAcctMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [acctSaving, setAcctSaving] = useState(false);

  const [fieldMapping, setFieldMapping] = useState<AllSettings["fieldMapping"]>({});
  const [fieldMsg, setFieldMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [fieldSaving, setFieldSaving] = useState(false);

  const [contactAutoCreate, setContactAutoCreate] = useState(true);
  const [contactNameMatching, setContactNameMatching] = useState("exact");
  const [contactMsg, setContactMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [contactSaving, setContactSaving] = useState(false);

  const [logoMsg, setLogoMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [brandingSaving, setBrandingSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data: AllSettings = await api("/api/settings/all");
      setSettings(data);
      setXeroClientId(data.xero.clientId);
      setAcctCode(data.accounting.accountCode);
      setAcctTaxType(data.accounting.taxType || "NONE");
      setAcctCurrency(data.accounting.currency || "SGD");
      setAcctType(data.accounting.invoiceType || "BILL");
      setFieldMapping(data.fieldMapping);
      setContactAutoCreate(data.contacts.autoCreate);
      setContactNameMatching(data.contacts.nameMatching);
      setCompanyName(data.branding?.companyName ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Show feedback from Xero OAuth callback redirect params
    const params = new URLSearchParams(window.location.search);
    const xeroResult = params.get("xero");
    const xeroError = params.get("xero_error");
    const tenant = params.get("tenant");
    if (xeroResult === "connected") {
      setXeroMsg({ text: `Connected to Xero${tenant ? ` (${tenant})` : ""}`, ok: true });
      window.history.replaceState({}, "", "/settings");
    } else if (xeroError) {
      const readable: Record<string, string> = {
        state_mismatch: "OAuth state mismatch — please try again",
        missing_code: "No authorization code received from Xero",
        missing_verifier: "OAuth session expired — please try again",
        no_tenants: "No Xero organisations found — check your Xero account",
        missing_credentials: "Client ID or Secret missing — save them first",
      };
      setXeroMsg({ text: `Xero connection failed: ${readable[xeroError] ?? xeroError}`, ok: false });
      window.history.replaceState({}, "", "/settings");
    }
  }, [load]);

  async function handleBrandingSave(e: React.FormEvent) {
    e.preventDefault();
    setBrandingSaving(true);
    try {
      await api("/api/settings/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });
      setLogoMsg({ text: "Branding saved", ok: true });
      await refreshBranding();
      setTimeout(() => setLogoMsg(null), 3000);
    } catch (err: any) {
      setLogoMsg({ text: err.message ?? "Failed to save", ok: false });
    } finally {
      setBrandingSaving(false);
    }
  }

  async function handleAnthropicSave(e: React.FormEvent) {
    e.preventDefault();
    if (!anthropicKey.trim()) return;
    setAnthropicSaving(true);
    setAnthropicMsg(null);
    try {
      await api("/api/settings/anthropic-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: anthropicKey.trim() }),
      });
      setAnthropicKey("");
      setAnthropicMsg({ text: "API key saved", ok: true });
      await load();
    } catch (err: any) {
      setAnthropicMsg({ text: err.message ?? "Failed to save", ok: false });
    } finally {
      setAnthropicSaving(false);
    }
  }

  async function handleAnthropicRemove() {
    if (!confirm("Remove the stored Anthropic API key?")) return;
    setAnthropicRemoving(true);
    try {
      await api("/api/settings/anthropic-key", { method: "DELETE" });
      setAnthropicMsg({ text: "Key removed.", ok: true });
      await load();
    } catch (err: any) {
      setAnthropicMsg({ text: err.message ?? "Failed to remove", ok: false });
    } finally {
      setAnthropicRemoving(false);
    }
  }

  async function handleXeroSave(e: React.FormEvent) {
    e.preventDefault();
    setXeroSaving(true);
    setXeroMsg(null);
    try {
      await api("/api/settings/xero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: xeroClientId, clientSecret: xeroClientSecret }),
      });
      setXeroClientSecret("");
      setXeroMsg({ text: "Xero credentials saved", ok: true });
      await load();
    } catch (err: any) {
      setXeroMsg({ text: err.message ?? "Failed to save", ok: false });
    } finally {
      setXeroSaving(false);
    }
  }

  async function handleXeroConnect() {
    setXeroConnecting(true);
    setXeroMsg(null);
    try {
      const data = await api("/api/settings/xero/auth-url");
      // Redirect browser to Xero's OAuth authorization page
      window.location.href = data.url;
    } catch (err: any) {
      setXeroMsg({ text: err.message ?? "Connection failed", ok: false });
      setXeroConnecting(false);
    }
    // Note: don't reset xeroConnecting if we redirected — page will navigate away
  }

  async function handleXeroDisconnect() {
    if (!confirm("Disconnect from Xero?")) return;
    setXeroConnecting(true);
    setXeroMsg(null);
    try {
      await api("/api/settings/xero/connect", { method: "DELETE" });
      setXeroMsg({ text: "Disconnected from Xero", ok: true });
      await load();
    } catch (err: any) {
      setXeroMsg({ text: err.message ?? "Failed", ok: false });
    } finally {
      setXeroConnecting(false);
    }
  }

  function copyRedirectUri() {
    if (!settings?.xero.redirectUri) return;
    navigator.clipboard.writeText(settings.xero.redirectUri).then(() => {
      setXeroCopied(true);
      setTimeout(() => setXeroCopied(false), 2000);
    });
  }

  async function handleAcctSave(e: React.FormEvent) {
    e.preventDefault();
    setAcctSaving(true);
    setAcctMsg(null);
    try {
      await api("/api/settings/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountCode: acctCode, taxType: acctTaxType, currency: acctCurrency, invoiceType: acctType }),
      });
      setAcctMsg({ text: "Accounting defaults saved", ok: true });
      setTimeout(() => setAcctMsg(null), 3000);
    } catch (err: any) {
      setAcctMsg({ text: err.message ?? "Failed to save", ok: false });
    } finally {
      setAcctSaving(false);
    }
  }

  async function handleFieldSave(e: React.FormEvent) {
    e.preventDefault();
    setFieldSaving(true);
    setFieldMsg(null);
    try {
      await api("/api/settings/field-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldMapping }),
      });
      setFieldMsg({ text: "Field mapping saved", ok: true });
      setTimeout(() => setFieldMsg(null), 3000);
    } catch (err: any) {
      setFieldMsg({ text: err.message ?? "Failed to save", ok: false });
    } finally {
      setFieldSaving(false);
    }
  }

  async function handleContactSave(e: React.FormEvent) {
    e.preventDefault();
    setContactSaving(true);
    setContactMsg(null);
    try {
      await api("/api/settings/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoCreate: contactAutoCreate, nameMatching: contactNameMatching }),
      });
      setContactMsg({ text: "Contact settings saved", ok: true });
      setTimeout(() => setContactMsg(null), 3000);
    } catch (err: any) {
      setContactMsg({ text: err.message ?? "Failed to save", ok: false });
    } finally {
      setContactSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-white/40 text-sm mt-1">Admin-only system configuration</p>
          </div>
          <span className="ml-auto px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Admin Only
          </span>
        </div>

        {/* ── 0. Branding ───────────────────────────────────────────── */}
        <SectionCard title="Branding" description="Set the company name shown across the app">
          <form onSubmit={handleBrandingSave} className="space-y-4">
            <div>
              <Label>Company / App Name</Label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className={inputCls}
                placeholder="e.g. COUNTLAH"
                maxLength={60}
              />
              <p className="text-white/20 text-xs mt-1.5">Shown in the navigation bar.</p>
            </div>

            <SaveMsg msg={logoMsg} />

            <button
              type="submit"
              disabled={brandingSaving}
              className="gradient-primary glow-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
            >
              {brandingSaving ? "Saving…" : "Save Branding"}
            </button>
          </form>
        </SectionCard>

        {/* ── 1. Xero Configuration ─────────────────────────────────── */}
        <SectionCard title="Xero Configuration" description="Connect your Xero organisation to push invoices automatically">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <StatusDot ok={settings?.xero.connected ?? false} label={settings?.xero.connected ? "Connected" : "Not connected"} />
              {settings?.xero.connected && settings.xero.tenantName && (
                <p className="text-white/30 text-xs ml-4">{settings.xero.tenantName}</p>
              )}
            </div>
            {settings?.xero.connected ? (
              <button
                onClick={handleXeroDisconnect}
                disabled={xeroConnecting}
                className="px-4 py-2 text-xs font-medium text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all duration-200 disabled:opacity-40"
              >
                {xeroConnecting ? "…" : "Disconnect"}
              </button>
            ) : (
              <button
                onClick={handleXeroConnect}
                disabled={xeroConnecting}
                className="px-4 py-2 text-xs font-semibold gradient-primary rounded-xl text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40"
              >
                {xeroConnecting ? "Redirecting…" : "Connect to Xero"}
              </button>
            )}
          </div>

          <form onSubmit={handleXeroSave} className="space-y-4">
            <div>
              <Label>Client ID</Label>
              <input
                type="text"
                value={xeroClientId}
                onChange={e => setXeroClientId(e.target.value)}
                className={inputCls}
                placeholder="Your Xero App Client ID"
                autoComplete="off"
              />
            </div>

            <div>
              <Label>Client Secret</Label>
              <div className="relative">
                <input
                  type={showXeroSecret ? "text" : "password"}
                  value={xeroClientSecret}
                  onChange={e => setXeroClientSecret(e.target.value)}
                  className={`${inputCls} pr-14`}
                  placeholder={settings?.xero.clientSecret.isSet ? settings.xero.clientSecret.hint ?? "••••••••" : "Your Xero App Client Secret"}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowXeroSecret(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs transition-all"
                >
                  {showXeroSecret ? "Hide" : "Show"}
                </button>
              </div>
              {settings?.xero.clientSecret.isSet && (
                <p className="text-white/25 text-xs mt-1.5">Secret saved as {settings.xero.clientSecret.hint}. Leave blank to keep it.</p>
              )}
            </div>

            <div>
              <Label>Redirect URI (auto-generated)</Label>
              <div className="flex gap-2">
                <code className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white/50 rounded-xl px-4 py-2.5 text-xs font-mono truncate">
                  {settings?.xero.redirectUri}
                </code>
                <button
                  type="button"
                  onClick={copyRedirectUri}
                  className="px-3.5 py-2.5 text-xs font-medium text-white/50 hover:text-white border border-white/[0.10] hover:border-white/25 rounded-xl transition-all duration-200 whitespace-nowrap"
                >
                  {xeroCopied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-white/20 text-xs mt-1.5">Add this URI to your Xero App's allowed redirect URIs.</p>
            </div>

            <SaveMsg msg={xeroMsg} />

            <button
              type="submit"
              disabled={xeroSaving}
              className="gradient-primary glow-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
            >
              {xeroSaving ? "Saving…" : "Save Xero Credentials"}
            </button>
          </form>
        </SectionCard>

        {/* ── 2. Accounting Defaults ────────────────────────────────── */}
        <SectionCard title="Default Accounting Settings" description="Applied when pushing invoices to Xero">
          <form onSubmit={handleAcctSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Code</Label>
                <input
                  type="text"
                  value={acctCode}
                  onChange={e => setAcctCode(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 200"
                />
              </div>
              <div>
                <Label>Tax Type (Xero Code)</Label>
                <select value={acctTaxType} onChange={e => setAcctTaxType(e.target.value)} className={selectCls}>
                  <option value="NONE">NONE — No Tax</option>
                  <option value="INPUT2">INPUT2 — GST on Expenses (Bills)</option>
                  <option value="OUTPUT2">OUTPUT2 — GST on Sales (Invoices)</option>
                  <option value="INPUT">INPUT — Exempt Purchases</option>
                  <option value="OUTPUT">OUTPUT — Exempt Sales</option>
                  <option value="ZERORATED">ZERORATED — Zero Rated</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Default Currency</Label>
                <select value={acctCurrency} onChange={e => setAcctCurrency(e.target.value)} className={selectCls}>
                  {["NZD", "AUD", "USD", "GBP", "EUR", "SGD", "CAD"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Invoice Type</Label>
                <select value={acctType} onChange={e => setAcctType(e.target.value)} className={selectCls}>
                  <option value="BILL">Bill (Accounts Payable)</option>
                  <option value="INVOICE">Invoice (Accounts Receivable)</option>
                </select>
              </div>
            </div>

            <SaveMsg msg={acctMsg} />

            <button
              type="submit"
              disabled={acctSaving}
              className="gradient-primary glow-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
            >
              {acctSaving ? "Saving…" : "Save Defaults"}
            </button>
          </form>
        </SectionCard>

        {/* ── 3. Field Mapping Rules ────────────────────────────────── */}
        <SectionCard title="Field Mapping Rules" description="Map extracted invoice fields to their Xero equivalents">
          <form onSubmit={handleFieldSave} className="space-y-1">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-x-4 gap-y-1 items-center mb-3">
              <span className="text-white/30 text-xs uppercase tracking-widest font-medium">Extracted Field</span>
              <span className="text-white/30 text-xs uppercase tracking-widest font-medium">Xero Field</span>
              <span className="text-white/30 text-xs uppercase tracking-widest font-medium text-center">Required</span>
            </div>

            {Object.entries(fieldMapping).map(([key, val]) => (
              <div key={key} className="grid grid-cols-[1fr_1fr_auto] gap-x-4 gap-y-3 items-center py-2 border-b border-white/[0.05] last:border-0">
                <div className="text-white/60 text-sm font-medium">
                  {AI_FIELD_LABELS[key] ?? key}
                  <span className="block text-white/25 text-xs font-mono mt-0.5">{key}</span>
                </div>
                <input
                  type="text"
                  value={val.xeroField}
                  onChange={e => setFieldMapping(prev => ({
                    ...prev,
                    [key]: { ...prev[key], xeroField: e.target.value },
                  }))}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setFieldMapping(prev => ({
                    ...prev,
                    [key]: { ...prev[key], required: !prev[key].required },
                  }))}
                  className={`w-10 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                    val.required ? "gradient-primary" : "bg-white/[0.10]"
                  }`}
                  title={val.required ? "Required — push blocked if missing" : "Optional"}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white mx-auto transition-transform duration-200 ${val.required ? "translate-x-2" : "-translate-x-2"}`} />
                </button>
              </div>
            ))}

            <p className="text-white/20 text-xs pt-2">Toggle a field to Required to block pushing if it's missing from the extracted data.</p>

            <div className="pt-2 space-y-3">
              <SaveMsg msg={fieldMsg} />
              <button
                type="submit"
                disabled={fieldSaving}
                className="gradient-primary glow-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
              >
                {fieldSaving ? "Saving…" : "Save Mapping"}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── 4. Contact Settings ───────────────────────────────────── */}
        <SectionCard title="Contact Settings" description="How contacts are matched or created in Xero">
          <form onSubmit={handleContactSave} className="space-y-5">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-white text-sm font-medium">Auto-create contacts</p>
                <p className="text-white/30 text-xs mt-0.5">Automatically create a new contact in Xero if one isn't found</p>
              </div>
              <button
                type="button"
                onClick={() => setContactAutoCreate(v => !v)}
                className={`w-12 h-7 rounded-full transition-all duration-200 flex-shrink-0 relative ${
                  contactAutoCreate ? "gradient-primary" : "bg-white/[0.10]"
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-200 ${contactAutoCreate ? "right-1" : "left-1"}`} />
              </button>
            </div>

            <div>
              <Label>Name Matching Logic</Label>
              <select value={contactNameMatching} onChange={e => setContactNameMatching(e.target.value)} className={selectCls}>
                <option value="exact">Exact match</option>
                <option value="fuzzy">Fuzzy match (contains)</option>
                <option value="first_word">First word match</option>
              </select>
              <p className="text-white/20 text-xs mt-2">How to look up an existing Xero contact by the supplier name on the invoice.</p>
            </div>

            <SaveMsg msg={contactMsg} />

            <button
              type="submit"
              disabled={contactSaving}
              className="gradient-primary glow-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
            >
              {contactSaving ? "Saving…" : "Save Contact Settings"}
            </button>
          </form>
        </SectionCard>

        {/* ── 5. AI / Anthropic Key ─────────────────────────────────── */}
        <SectionCard title="AI Extraction" description="Anthropic API key for Claude invoice data extraction">
          <div className="flex items-center gap-3">
            <StatusDot
              ok={settings?.anthropic?.isSet ?? false}
              label={settings?.anthropic?.isSet ? `Custom key active (${settings.anthropic?.hint})` : "No API key configured"}
            />
          </div>
          {!settings?.anthropic?.isSet && (
            <p className="text-white/25 text-xs">No key set — add your Anthropic API key (starts with <code className="text-white/40">sk-ant-</code>) to enable extraction.</p>
          )}

          <form onSubmit={handleAnthropicSave} className="space-y-4">
            <div>
              <Label>{settings?.anthropic?.isSet ? "Update Anthropic API Key" : "Add Anthropic API Key"}</Label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={anthropicKey}
                  onChange={e => setAnthropicKey(e.target.value)}
                  className={`${inputCls} pr-14 font-mono`}
                  placeholder="sk-ant-..."
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs transition-all"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-white/20 text-xs mt-1.5">Stored server-side only — never sent to the browser.</p>
            </div>

            <SaveMsg msg={anthropicMsg} />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!anthropicKey.trim() || anthropicSaving}
                className="gradient-primary glow-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {anthropicSaving ? "Saving…" : "Save Key"}
              </button>
              {settings?.anthropic?.isSet && (
                <button
                  type="button"
                  onClick={handleAnthropicRemove}
                  disabled={anthropicRemoving}
                  className="px-5 py-2.5 text-sm font-medium text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all duration-200 disabled:opacity-40"
                >
                  {anthropicRemoving ? "Removing…" : "Remove Key"}
                </button>
              )}
            </div>
          </form>
        </SectionCard>

      </div>
    </Layout>
  );
}
