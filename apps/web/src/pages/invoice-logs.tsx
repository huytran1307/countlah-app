import { useGetInvoiceLogs, useGetInvoice, getGetInvoiceLogsQueryKey, getGetInvoiceQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import Layout from "../components/layout";
import { formatDate } from "../lib/utils";

function statusDotColor(status: string): string {
  if (status === "success") return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]";
  if (status === "failed") return "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]";
  if (status === "pending") return "bg-amber-400";
  return "bg-white/30";
}

function statusTextColor(status: string): string {
  if (status === "success") return "text-emerald-400";
  if (status === "failed") return "text-red-400";
  if (status === "pending") return "text-amber-400";
  return "text-white/40";
}

export default function InvoiceLogsPage({ id }: { id: number }) {
  const [, navigate] = useLocation();

  const { data: invoice } = useGetInvoice(id, {
    query: { queryKey: getGetInvoiceQueryKey(id) },
  });

  const { data: logs, isLoading } = useGetInvoiceLogs(id, {
    query: { queryKey: getGetInvoiceLogsQueryKey(id) },
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-white/40 hover:text-white transition-all duration-200 font-medium"
          >
            Dashboard
          </button>
          <span className="text-white/20">/</span>
          <button
            onClick={() => navigate(`/invoices/${id}`)}
            className="text-white/40 hover:text-white transition-all duration-200 font-mono text-xs"
          >
            {invoice?.originalName ?? invoice?.filename ?? `Invoice #${id}`}
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white/60 font-medium">Logs</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Processing Logs</h1>
          <p className="text-white/35 text-sm mt-1">Full activity trail for this invoice</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
          </div>
        ) : !logs?.length ? (
          <div className="text-center py-20 text-white/20 text-sm">
            No activity logged yet
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[23px] top-3 bottom-3 w-px bg-white/[0.06]" />
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="glass glass-hover rounded-xl px-5 py-4 flex items-start gap-5">
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusDotColor(log.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-white text-sm font-semibold capitalize">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className={`text-xs font-medium capitalize ${statusTextColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    {log.message && (
                      <p className="text-white/35 text-xs leading-relaxed font-mono">{log.message}</p>
                    )}
                  </div>
                  <span className="text-white/20 text-xs shrink-0 mt-0.5">{formatDate(log.createdAt as string)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
