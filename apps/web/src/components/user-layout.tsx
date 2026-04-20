import { useLogout, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useBranding } from "../hooks/use-branding";

type View = "upload" | "invoices" | "xero" | "history";

interface UserLayoutProps {
  children: React.ReactNode;
  activeView?: View;
  onViewChange?: (v: View) => void;
}

const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
  {
    view: "upload",
    label: "Upload",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    view: "invoices",
    label: "Invoices",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    view: "xero",
    label: "Xero",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 40 40" fill="currentColor">
        <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm9.9 20c0 .547-.443.99-.99.99H22.3l5.37 5.37a.99.99 0 0 1-1.4 1.4l-5.37-5.37v6.61a.99.99 0 0 1-1.98 0V22.3l-5.37 5.37a.99.99 0 0 1-1.4-1.4l5.37-5.37H11.09a.99.99 0 0 1 0-1.98h6.43l-5.37-5.37a.99.99 0 0 1 1.4-1.4l5.37 5.37V11.1a.99.99 0 0 1 1.98 0v6.43l5.37-5.37a.99.99 0 0 1 1.4 1.4L22.3 19.01h6.61c.547 0 .99.443.99.99z"/>
      </svg>
    ),
  },
  {
    view: "history",
    label: "History",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

export default function UserLayout({ children, activeView, onViewChange }: UserLayoutProps) {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const branding = useBranding();

  async function handleLogout() {
    await logout.mutateAsync();
    queryClient.clear();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 border-r border-white/[0.07] flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.companyName ?? "Logo"}
              className="h-7 w-auto max-w-[120px] object-contain"
            />
          ) : (
            <span className="gradient-primary-text text-base font-bold tracking-tight">
              {branding.companyName || "COUNTLAH"}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map(({ view, label, icon }) => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                onClick={() => onViewChange?.(view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/45 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span className={isActive ? "text-orange-400" : ""}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          {me?.email && (
            <p className="text-white/30 text-xs font-medium truncate mb-3 px-1">{me.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/35 hover:text-white hover:bg-white/[0.04] transition-all duration-200 font-medium"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
