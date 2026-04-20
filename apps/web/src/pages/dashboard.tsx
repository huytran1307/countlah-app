import { useState, useEffect, useCallback } from "react";
import {
  useGetInvoiceStats,
  useListInvoices,
  getGetInvoiceStatsQueryKey,
  getListInvoicesQueryKey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import Layout from "../components/layout";
import { formatDate, formatCurrency, statusColor } from "../lib/utils";

interface XeroStatus {
  connected: boolean;
  tenantName: string | null;
  hasCredentials: boolean;
}

const XERO_ERROR_MESSAGES: Record<string, string> = {
  missing_code: "No authorization code received from Xero",
  state_mismatch: "Session mismatch — please try again",
  missing_verifier: "Session expired — please try again",
  not_authenticated: "You must be logged in to connect Xero",
  missing_credentials: "Add your Xero credentials in Settings first",
  no_tenants: "No Xero organisations found on your account",
};

export default function DashboardPage() {
  const [, navigate] = useLocation();

  // ── Stats & recent activity ────────────────────────────────────────────────
  const { data: stats } = useGetInvoiceStats({ query: { queryKey: getGetInvoiceStatsQueryKey() } });
  const { data: recentList } = useListInvoices(
    { limit: 5 } as any,
    { query: { queryKey: getListInvoicesQueryKey({ limit: 5 } as any) } }
  );

  // ── Xero connection state ──────────────────────────────────────────────────
  const [xeroStatus, setXeroStatus] = useState<XeroStatus | null>(null);
  const [xeroStatusLoading, setXeroStatusLoading] = useState(true);
  const [xeroMsg, setXeroMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [xeroConnecting, setXeroConnecting] = useState(false);

  const fetchXeroStatus = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/xero/status`, { credentials: "include" });
      if (res.ok) setXeroStatus(await res.json());
    } catch {}
    finally { setXeroStatusLoading(false); }
  }, []);

  useEffect(() => {
    fetchXeroStatus();

    const params = new URLSearchParams(window.location.search);
    const xeroResult = params.get("xero");
    const xeroError = params.get("xero_error");
    const tenant = params.get("tenant");
    if (xeroResult === "connected") {
      setXeroMsg({ text: `Connected to Xero${tenant ? ` — ${tenant}` : ""}`, ok: true });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (xeroError) {
      setXeroMsg({ text: XERO_ERROR_MESSAGES[xeroError] ?? xeroError, ok: false });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchXeroStatus]);

  async function handleXeroConnect() {
    setXeroConnecting(true);
    setXeroMsg(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/settings/xero/auth-url?returnTo=dashboard`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setXeroMsg({ text: data.error ?? "Failed to start connection", ok: false });
        setXeroConnecting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setXeroMsg({ text: "Network error — please try again", ok: false });
      setXeroConnecting(false);
    }
  }

  async function handleXeroDisconnect() {
    if (!confirm("Disconnect from Xero?")) return;
    setXeroConnecting(true);
    setXeroMsg(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/settings/xero/connect`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setXeroStatus(s => s ? { ...s, connected: false, tenantName: null } : null);
        setXeroMsg({ text: "Disconnected from Xero", ok: true });
      }
    } catch {
      setXeroMsg({ text: "Failed to disconnect — try again", ok: false });
    } finally {
      setXeroConnecting(false);
    }
  }

  // ── Overview stat cards ────────────────────────────────────────────────────
  const overviewCards = [
    {
      label: "Total Invoices",
      value: stats?.total ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
      color: "text-white",
    },
    {
      label: "Pushed to Xero",
      value: stats?.pushed ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      color: "text-emerald-400",
    },
    {
      label: "Pending Review",
      value: (stats?.uploaded ?? 0) + (stats?.extracted ?? 0),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      color: "text-amber-400",
    },
    {
      label: "Failed",
      value: stats?.failed ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      ),
      color: "text-red-400",
    },
    {
      label: "Total Value",
      value: formatCurrency(stats?.totalValue),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      color: "text-white",
      wide: true,
    },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-10">

        {/* ── Page header ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Overview of your invoice processing activity</p>
        </div>

        {/* ── Overview stats ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {overviewCards.map((card) => (
              <div key={card.label} className={`glass rounded-xl p-5 ${card.wide ? "sm:col-span-2 lg:col-span-2" : ""}`}>
                <div className={`mb-3 ${card.color} opacity-60`}>{card.icon}</div>
                <p className={`text-2xl font-bold ${card.color} mb-1`}>{card.value}</p>
                <p className="text-white/35 text-xs font-medium">{card.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Connected Services ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">Connected Services</h2>
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">

              {/* Xero brand + status */}
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  xeroStatus?.connected ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-white/[0.06] border border-white/[0.08]"
                }`}>
                  {/* Xero logo mark */}
                  <svg viewBox="0 0 40 40" className={`w-6 h-6 ${xeroStatus?.connected ? "text-emerald-400" : "text-white/25"}`} fill="currentColor">
                    <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm9.9 20c0 .547-.443.99-.99.99H22.3l5.37 5.37a.99.99 0 0 1-1.4 1.4l-5.37-5.37v6.61a.99.99 0 0 1-1.98 0V22.3l-5.37 5.37a.99.99 0 0 1-1.4-1.4l5.37-5.37H11.09a.99.99 0 0 1 0-1.98h6.43l-5.37-5.37a.99.99 0 0 1 1.4-1.4l5.37 5.37V11.1a.99.99 0 0 1 1.98 0v6.43l5.37-5.37a.99.99 0 0 1 1.4 1.4L22.3 19.01h6.61c.547 0 .99.443.99.99z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-base">Xero</p>
                  {xeroStatusLoading ? (
                    <p className="text-white/30 text-sm mt-0.5">Checking status…</p>
                  ) : xeroStatus?.connected ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <p className="text-emerald-400 text-sm font-medium">
                        Connected{xeroStatus.tenantName ? ` — ${xeroStatus.tenantName}` : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
                      <p className="text-white/35 text-sm">
                        {xeroStatus?.hasCredentials ? "Not connected" : "Credentials required"}
                      </p>
                    </div>
                  )}
                  <p className="text-white/25 text-xs mt-1.5">
                    Connect your Xero organisation to push invoices automatically
                  </p>
                </div>
              </div>

              {/* Action area */}
              <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                {xeroMsg && (
                  <p className={`text-xs font-medium ${xeroMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {xeroMsg.text}
                  </p>
                )}
                {!xeroStatusLoading && (
                  xeroStatus?.connected ? (
                    <button
                      onClick={handleXeroDisconnect}
                      disabled={xeroConnecting}
                      className="text-sm text-white/40 hover:text-white/70 font-medium px-4 py-2 rounded-xl border border-white/[0.10] hover:border-white/25 transition-all duration-200 disabled:opacity-40"
                    >
                      {xeroConnecting ? "Disconnecting…" : "Disconnect"}
                    </button>
                  ) : xeroStatus?.hasCredentials ? (
                    <button
                      onClick={handleXeroConnect}
                      disabled={xeroConnecting}
                      className="gradient-primary glow-primary text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    >
                      {xeroConnecting ? "Connecting…" : "Connect Xero"}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/settings")}
                      className="text-sm text-orange-400 hover:text-orange-300 font-medium px-4 py-2 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-200"
                    >
                      Set up credentials
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Recent Activity ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">Recent Activity</h2>
          <div className="glass rounded-2xl overflow-hidden">
            {!recentList?.invoices?.length ? (
              <div className="text-center py-14 text-white/25">
                <svg className="w-8 h-8 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="text-sm font-medium">No invoice activity yet</p>
                <p className="text-xs text-white/20 mt-1">Processed invoices will appear here</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] text-white/30 text-xs uppercase tracking-widest">
                    <th className="text-left px-6 py-4 font-medium">Invoice</th>
                    <th className="text-left px-6 py-4 font-medium">Supplier</th>
                    <th className="text-left px-6 py-4 font-medium">Amount</th>
                    <th className="text-left px-6 py-4 font-medium">Date</th>
                    <th className="text-left px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentList.invoices.map((inv) => {
                    const data = inv.extractedData as {
                      supplier_name?: string;
                      invoice_number?: string;
                      total?: number;
                      currency?: string;
                    } | null;

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <p className="text-white/50 font-mono text-xs truncate max-w-[160px]">
                            {inv.originalName ?? inv.filename}
                          </p>
                          {data?.invoice_number && (
                            <p className="text-white/25 text-xs mt-0.5">#{data.invoice_number}</p>
                          )}
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
        </section>

      </div>
    </Layout>
  );
}
