import { useState } from "react";
import { useGetInvoice, useExtractInvoice, useUpdateInvoice, usePushToXero, getGetInvoiceQueryKey, getGetInvoiceStatsQueryKey, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "../components/layout";
import { formatDate, formatCurrency, statusColor } from "../lib/utils";

type LayoutComponent = React.ComponentType<{ children: React.ReactNode }>;

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
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
  line_items?: LineItem[];
}

const inputCls = "w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/25";

export default function InvoiceDetailPage({
  id,
  LayoutComp = Layout,
  backPath = "/dashboard",
  backLabel = "Dashboard",
}: {
  id: number;
  LayoutComp?: LayoutComponent;
  backPath?: string;
  backLabel?: string;
}) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showRaw, setShowRaw] = useState(false);
  const [extractMsg, setExtractMsg] = useState("");
  const [xeroMsg, setXeroMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<ExtractedData | null>(null);

  const { data: invoice, isLoading, refetch } = useGetInvoice(id, {
    query: { queryKey: getGetInvoiceQueryKey(id) },
  });

  const extract = useExtractInvoice();
  const update = useUpdateInvoice();
  const pushXero = usePushToXero();

  const extracted = (invoice?.extractedData ?? null) as ExtractedData | null;

  function startEdit() {
    setFormData(extracted ? JSON.parse(JSON.stringify(extracted)) : {});
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setFormData(null);
  }

  async function saveEdit() {
    if (!formData) return;
    await update.mutateAsync({ id, data: { extractedData: formData as any } });
    await refetch();
    queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
    setEditing(false);
    setFormData(null);
  }

  async function handleExtract() {
    setExtractMsg("Extracting with AI…");
    setXeroMsg("");
    try {
      await extract.mutateAsync({ id });
      await refetch();
      queryClient.invalidateQueries({ queryKey: getGetInvoiceStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      setExtractMsg("Extraction complete");
    } catch (err: any) {
      setExtractMsg(`Error: ${err?.message ?? "Extraction failed"}`);
    }
  }

  async function handlePushXero() {
    setXeroMsg("Pushing to Xero…");
    setExtractMsg("");
    try {
      const result = await pushXero.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetInvoiceStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      await refetch();
      setXeroMsg(result.message ?? "Pushed successfully");
    } catch (err: any) {
      setXeroMsg(`Error: ${err?.message ?? "Push failed"}`);
    }
  }

  function updateField(key: keyof ExtractedData, val: any) {
    setFormData(prev => prev ? { ...prev, [key]: val } : { [key]: val });
  }

  function updateLineItem(idx: number, key: keyof LineItem, val: string) {
    setFormData(prev => {
      if (!prev) return prev;
      const items = [...(prev.line_items ?? [])];
      items[idx] = { ...items[idx], [key]: key === "description" ? val : parseFloat(val) || 0 };
      return { ...prev, line_items: items };
    });
  }

  function addLineItem() {
    setFormData(prev => ({
      ...prev,
      line_items: [...(prev?.line_items ?? []), { description: "", quantity: 1, unit_price: 0, amount: 0 }],
    }));
  }

  function removeLineItem(idx: number) {
    setFormData(prev => ({
      ...prev,
      line_items: (prev?.line_items ?? []).filter((_, i) => i !== idx),
    }));
  }

  if (isLoading) {
    return (
      <LayoutComp>
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
        </div>
      </LayoutComp>
    );
  }

  if (!invoice) {
    return (
      <LayoutComp>
        <div className="text-center py-24 text-white/30">Invoice not found</div>
      </LayoutComp>
    );
  }

  const displayData = editing ? formData : extracted;

  const isXeroSuccess = xeroMsg && !xeroMsg.startsWith("Error") && !xeroMsg.includes("Pushing");
  const isExtractSuccess = extractMsg === "Extraction complete";

  return (
    <LayoutComp>
      <div className="max-w-4xl mx-auto space-y-7">

        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate(backPath)}
            className="text-white/40 hover:text-white transition-all duration-200 font-medium"
          >
            {backLabel}
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white/60 font-mono text-xs">{invoice.originalName ?? invoice.filename}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{invoice.originalName ?? invoice.filename}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${statusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              <span className="text-white/30 text-xs">{formatDate(invoice.createdAt as string)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!editing ? (
              <>
                <button
                  onClick={() => navigate(`/invoices/${id}/logs`)}
                  className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white border border-white/[0.09] hover:border-white/20 rounded-xl transition-all duration-200"
                >
                  Logs
                </button>
                {extracted && (
                  <button
                    onClick={startEdit}
                    className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white border border-white/[0.09] hover:border-white/20 rounded-xl transition-all duration-200"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={handleExtract}
                  disabled={extract.isPending}
                  className="px-4 py-2 text-sm font-semibold text-white border border-white/[0.15] hover:bg-white/[0.07] disabled:opacity-50 rounded-xl transition-all duration-200"
                >
                  {extract.isPending ? "Extracting…" : "Extract with AI"}
                </button>
                <button
                  onClick={handlePushXero}
                  disabled={!extracted || pushXero.isPending}
                  className="gradient-primary glow-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:opacity-90"
                >
                  {pushXero.isPending ? "Pushing…" : "Push to Xero"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white border border-white/[0.09] hover:border-white/20 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={update.isPending}
                  className="gradient-primary glow-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 rounded-xl transition-all duration-200 hover:opacity-90"
                >
                  {update.isPending ? "Saving…" : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {(extractMsg || xeroMsg) && (
          <div className={`glass rounded-xl px-5 py-3.5 text-sm font-medium ${
            isXeroSuccess || isExtractSuccess ? "text-emerald-400" : (extractMsg.startsWith("Error") || xeroMsg.startsWith("Error")) ? "text-red-400" : "text-white/60"
          }`}>
            {extractMsg || xeroMsg}
          </div>
        )}

        {invoice.rawText && (
          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm text-white/40 hover:text-white/70 transition-all duration-200"
            >
              <span className="font-medium">Raw PDF Text</span>
              <span className="text-xs text-white/25">{showRaw ? "Hide" : "Show"}</span>
            </button>
            {showRaw && (
              <div className="px-6 pb-5">
                <pre className="text-xs text-white/30 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-relaxed">
                  {invoice.rawText}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="glass rounded-2xl p-7 space-y-7">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-base tracking-tight">Extracted Data</h2>
            {!displayData && !editing && (
              <span className="text-white/30 text-sm">Run AI extraction to populate fields</span>
            )}
          </div>

          {displayData !== null || editing ? (
            <>
              <div className="grid grid-cols-2 gap-5">
                {(["supplier_name", "invoice_number", "invoice_date", "due_date", "currency"] as const).map(field => (
                  <div key={field}>
                    <label className="block text-white/35 text-xs font-medium uppercase tracking-widest mb-2">
                      {field.replace(/_/g, " ")}
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={(formData?.[field] as string) ?? ""}
                        onChange={e => updateField(field, e.target.value)}
                        className={inputCls}
                      />
                    ) : (
                      <p className="text-white text-sm font-medium">{(displayData?.[field] as string) || "—"}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-5">
                {(["subtotal", "tax", "total"] as const).map(field => (
                  <div key={field}>
                    <label className="block text-white/35 text-xs font-medium uppercase tracking-widest mb-2">{field}</label>
                    {editing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={(formData?.[field] as number) ?? ""}
                        onChange={e => updateField(field, parseFloat(e.target.value) || 0)}
                        className={inputCls}
                      />
                    ) : (
                      <p className={`text-xl font-bold ${field === "total" ? "text-white" : "text-white/70"}`}>
                        {formatCurrency(displayData?.[field] as number, displayData?.currency ?? undefined)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/35 text-xs font-medium uppercase tracking-widest">Line Items</h3>
                  {editing && (
                    <button
                      onClick={addLineItem}
                      className="text-white/50 hover:text-white text-xs font-medium transition-all duration-200"
                    >
                      + Add Row
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/25 text-xs border-b border-white/[0.07]">
                        <th className="text-left pb-3 font-medium uppercase tracking-widest">Description</th>
                        <th className="text-right pb-3 font-medium w-20 uppercase tracking-widest">Qty</th>
                        <th className="text-right pb-3 font-medium w-28 uppercase tracking-widest">Unit Price</th>
                        <th className="text-right pb-3 font-medium w-28 uppercase tracking-widest">Amount</th>
                        {editing && <th className="pb-3 w-8" />}
                      </tr>
                    </thead>
                    <tbody>
                      {(displayData?.line_items ?? []).map((item: LineItem, idx: number) => (
                        <tr key={idx} className="border-b border-white/[0.05] last:border-0">
                          <td className="py-3 pr-4">
                            {editing ? (
                              <input
                                type="text"
                                value={item.description}
                                onChange={e => updateLineItem(idx, "description", e.target.value)}
                                className={inputCls}
                              />
                            ) : (
                              <span className="text-white/70">{item.description}</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {editing ? (
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={e => updateLineItem(idx, "quantity", e.target.value)}
                                className={`${inputCls} text-right`}
                              />
                            ) : (
                              <span className="text-white/50">{item.quantity}</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {editing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={e => updateLineItem(idx, "unit_price", e.target.value)}
                                className={`${inputCls} text-right`}
                              />
                            ) : (
                              <span className="text-white/50">{formatCurrency(item.unit_price, displayData?.currency ?? undefined)}</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {editing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={item.amount}
                                onChange={e => updateLineItem(idx, "amount", e.target.value)}
                                className={`${inputCls} text-right`}
                              />
                            ) : (
                              <span className="text-white font-semibold">{formatCurrency(item.amount, displayData?.currency ?? undefined)}</span>
                            )}
                          </td>
                          {editing && (
                            <td className="py-3 text-center">
                              <button
                                onClick={() => removeLineItem(idx)}
                                className="text-white/25 hover:text-red-400 transition-all duration-200 text-xs"
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {(displayData?.line_items ?? []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-white/20 text-xs">
                            No line items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-white/25">
              <p className="text-sm font-medium">No extracted data yet</p>
              <p className="text-xs mt-1.5 text-white/15">Click "Extract with AI" to analyse this invoice</p>
            </div>
          )}
        </div>
      </div>
    </LayoutComp>
  );
}
