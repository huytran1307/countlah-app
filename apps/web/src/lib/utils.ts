import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

export function formatCurrency(amount: number | null | undefined, currency = "SGD"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-SG", { style: "currency", currency }).format(amount);
}

export function statusColor(status: string): string {
  switch (status) {
    case "uploaded":
      return "text-white/60 bg-white/[0.06] border-white/[0.10]";
    case "extracted":
      return "text-white/80 bg-white/[0.08] border-white/[0.14]";
    case "pushed":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
    case "failed":
      return "text-red-400 bg-red-500/10 border-red-500/25";
    default:
      return "text-white/60 bg-white/[0.06] border-white/[0.10]";
  }
}
