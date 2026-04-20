import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListInvoices,
  useGetInvoiceStats,
  getListInvoicesQueryKey,
  getGetInvoiceStatsQueryKey,
} from "@workspace/api-client-react";
import UserLayout from "../components/user-layout";
import { formatDate, formatCurrency, statusColor } from "../lib/utils";

type View = "upload" | "invoices" | "xero" | "history";

// ── Xero types ────────────────────────────────────────────────────────────────
interface XeroStatus {
  connected: boolean;
  tenantName: string | null;
  hasCredentials: boolean;
}

const XERO_ERRORS: Record<string, string> = {
  missing_code: "No authorization code received from Xero",
  state_mismatch: "Session mismatch — please try again",
  missing_verifier: "Session expired — please try again",
  not_authenticated: "You must be logged in to connect Xero",
  missing_credentials: "Add your Xero credentials in Settings first",
  no_tenants: "No Xero organisations found on your account",
};

function viewFromSearch(): View {
  const v = new URLSearchParams(window.location.search).get("view") as View | null;
  return (v && ["upload", "invoices", "xero", "history"].includes(v)) ? v : "upload";
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD VIEW
// ─────────────────────────────────────────────────────────────────────────────
function UploadView({ onUploaded }: { onUploaded: () => void }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setStatus(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/invoices/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetInvoiceStatsQueryKey() });
      setStatus({ type: "success", msg: `"${file.name}" uploaded and queued for extraction.` });
      onUploaded();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message ?? "Upload failed" });
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Upload Invoice</h2>
        <p className="text-white/40 text-sm mt-1">Upload a PDF or image to extract and send to Xero</p>
      </div>

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-2xl p-16 text-center border-2 border-dashed transition-all duration-200 ${
          uploading
            ? "border-white/[0.09] cursor-default"
            : dragOver
              ? "border-orange-500/60 bg-orange-500/5 cursor-copy"
              : "border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.02] cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
            <p className="text-white/50 text-sm font-medium">Uploading and processing…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-1">
              <svg className="w-7 h-7 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-white/60 text-sm font-medium">Drop your invoice here</p>
            <p className="text-white/25 text-xs">PDF · JPG · PNG · Max 20 MB</p>
            <button
              type="button"
              className="mt-2 gradient-primary glow-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Upload Invoice
            </button>
          </div>
        )}
      </div>

      {status && (
        <div className={`glass rounded-xl px-5 py-4 text-sm font-medium flex items-start gap-3 ${
          status.type === "success" ? "border border-emerald-500/20" : "border border-red-500/20"
        }`}>
          {status.type === "success" ? (
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          )}
          <p className={status.type === "success" ? "text-emerald-300" : "text-red-300"}>{status.msg}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES VIEW
// ─────────────────────────────────────────────────────────────────────────────
function InvoicesView({ onOpenInvoice }: { onOpenInvoice: (id: number) => void }) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data: invoiceList, isLoading } = useListInvoices(
    { status: statusFilter } as any,
    { query: { queryKey: getListInvoicesQueryKey({ status: statusFilter } as any) } }
  );

  const statuses = ["uploaded", "extracted", "pushed", "failed"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Invoices</h2>
          <p className="text-white/40 text-sm mt-1">Review extracted data and send to Xero</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            !statusFilter ? "bg-white/[0.10] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
          }`}
        >
          All
        </button>
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? undefined : s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm capitalize font-medium transition-all duration-200 ${
              statusFilter === s ? "bg-white/[0.10] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
          </div>
        ) : !invoiceList?.invoices?.length ? (
          <div className="text-center py-20 text-white/25">
            <svg className="w-9 h-9 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-sm font-medium">No invoices yet</p>
            <p className="text-xs text-white/20 mt-1">Upload a PDF or image to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-4 font-medium">File</th>
                <th className="text-left px-6 py-4 font-medium">Supplier</th>
                <th className="text-left px-6 py-4 font-medium">Amount</th>
                <th className="text-left px-6 py-4 font-medium">Uploaded</th>
                <th className="text-left px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.invoices.map((inv) => {
                const data = inv.extractedData as {
                  supplier_name?: string;
                  total?: number;
                  currency?: string;
                } | null;

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onOpenInvoice(inv.id)}
                    className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-white/60 font-mono text-xs truncate max-w-[180px]">
                        {inv.originalName ?? inv.filename}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {data?.supplier_name ?? <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {data?.total != null ? formatCurrency(data.total, data.currency) : <span className="text-white/20 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4 text-white/35 text-xs">
                      {formatDate(inv.createdAt as string)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${statusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// XERO VIEW
// ─────────────────────────────────────────────────────────────────────────────
function XeroView() {
  const [xeroStatus, setXeroStatus] = useState<XeroStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/xero/status`, { credentials: "include" });
      if (res.ok) setXeroStatus(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStatus();
    const params = new URLSearchParams(window.location.search);
    const result = params.get("xero");
    const err = params.get("xero_error");
    const tenant = params.get("tenant");
    if (result === "connected") {
      setMsg({ text: `Connected${tenant ? ` — ${tenant}` : ""}`, ok: true });
      window.history.replaceState({}, "", window.location.pathname + "?view=xero");
    } else if (err) {
      setMsg({ text: XERO_ERRORS[err] ?? err, ok: false });
      window.history.replaceState({}, "", window.location.pathname + "?view=xero");
    }
  }, [fetchStatus]);

  async function handleConnect() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/settings/xero/auth-url?returnTo=app`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error ?? "Failed to start connection", ok: false }); setBusy(false); return; }
      window.location.href = data.url;
    } catch {
      setMsg({ text: "Network error — please try again", ok: false });
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect from Xero?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/settings/xero/connect`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setXeroStatus(s => s ? { ...s, connected: false, tenantName: null } : null);
        setMsg({ text: "Disconnected from Xero", ok: true });
      }
    } catch {
      setMsg({ text: "Failed to disconnect", ok: false });
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Connect your Xero</h2>
        <p className="text-white/40 text-sm mt-1">Link your Xero organisation to push invoices automatically</p>
      </div>

      <div className="glass rounded-2xl p-7 space-y-6">
        {/* Xero logo + status */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            xeroStatus?.connected ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-white/[0.05] border border-white/[0.08]"
          }`}>
            <svg viewBox="0 0 40 40" className={`w-7 h-7 ${xeroStatus?.connected ? "text-emerald-400" : "text-white/25"}`} fill="currentColor">
              <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm9.9 20c0 .547-.443.99-.99.99H22.3l5.37 5.37a.99.99 0 0 1-1.4 1.4l-5.37-5.37v6.61a.99.99 0 0 1-1.98 0V22.3l-5.37 5.37a.99.99 0 0 1-1.4-1.4l5.37-5.37H11.09a.99.99 0 0 1 0-1.98h6.43l-5.37-5.37a.99.99 0 0 1 1.4-1.4l5.37 5.37V11.1a.99.99 0 0 1 1.98 0v6.43l5.37-5.37a.99.99 0 0 1 1.4 1.4L22.3 19.01h6.61c.547 0 .99.443.99.99z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-base">Xero</p>
            {loading ? (
              <p className="text-white/30 text-sm mt-0.5">Checking status…</p>
            ) : xeroStatus?.connected ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-emerald-400 text-sm font-medium">
                  Connected{xeroStatus.tenantName ? ` — ${xeroStatus.tenantName}` : ""}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-white/20" />
                <p className="text-white/40 text-sm">
                  {xeroStatus?.hasCredentials ? "Not connected" : "Credentials required"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions if no credentials */}
        {!loading && !xeroStatus?.hasCredentials && (
          <div className="bg-orange-500/[0.07] border border-orange-500/20 rounded-xl px-4 py-3.5 text-sm text-orange-300/80">
            You need to add your Xero API credentials in <strong className="text-orange-300">Settings</strong> before connecting.
          </div>
        )}

        {msg && (
          <p className={`text-sm font-medium ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
        )}

        {/* Action */}
        {!loading && (
          xeroStatus?.connected ? (
            <button
              onClick={handleDisconnect}
              disabled={busy}
              className="w-full py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white border border-white/[0.10] hover:border-white/25 transition-all duration-200 disabled:opacity-40"
            >
              {busy ? "Disconnecting…" : "Disconnect from Xero"}
            </button>
          ) : xeroStatus?.hasCredentials ? (
            <button
              onClick={handleConnect}
              disabled={busy}
              className="w-full gradient-primary glow-primary text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? "Connecting…" : "Connect Xero"}
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function HistoryView({ onOpenInvoice }: { onOpenInvoice: (id: number) => void }) {
  const { data: invoiceList, isLoading } = useListInvoices(
    { status: "pushed" } as any,
    { query: { queryKey: getListInvoicesQueryKey({ status: "pushed" } as any) } }
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">History</h2>
        <p className="text-white/40 text-sm mt-1">Invoices successfully sent to Xero</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
          </div>
        ) : !invoiceList?.invoices?.length ? (
          <div className="text-center py-20 text-white/25">
            <svg className="w-9 h-9 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm font-medium">No invoices pushed yet</p>
            <p className="text-xs text-white/20 mt-1">Invoices sent to Xero will appear here</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-4 font-medium">Invoice</th>
                <th className="text-left px-6 py-4 font-medium">Supplier</th>
                <th className="text-left px-6 py-4 font-medium">Amount</th>
                <th className="text-left px-6 py-4 font-medium">Date Sent</th>
                <th className="text-left px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.invoices.map((inv) => {
                const data = inv.extractedData as {
                  supplier_name?: string;
                  total?: number;
                  currency?: string;
                } | null;

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onOpenInvoice(inv.id)}
                    className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <p className="text-white/60 font-mono text-xs truncate max-w-[180px]">
                        {inv.originalName ?? inv.filename}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {data?.supplier_name ?? <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {data?.total != null ? formatCurrency(data.total, data.currency) : <span className="text-white/20 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4 text-white/35 text-xs">
                      {formatDate(inv.createdAt as string)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Sent
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function UserAppPage() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>(viewFromSearch);

  function changeView(v: View) {
    setView(v);
    window.history.replaceState({}, "", `?view=${v}`);
  }

  function openInvoice(id: number) {
    navigate(`/app/invoices/${id}`);
  }

  function handleUploaded() {
    // Switch to invoices view after successful upload
    setTimeout(() => changeView("invoices"), 1200);
  }

  return (
    <UserLayout activeView={view} onViewChange={changeView}>
      <div className="p-8">
        {view === "upload" && <UploadView onUploaded={handleUploaded} />}
        {view === "invoices" && <InvoicesView onOpenInvoice={openInvoice} />}
        {view === "xero" && <XeroView />}
        {view === "history" && <HistoryView onOpenInvoice={openInvoice} />}
      </div>
    </UserLayout>
  );
}
