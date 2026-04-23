import { useLogout, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

function CountlahSymbol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 74" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#F95A18" d="M14.43,70.18L1.49,57.23c-.95-.95-1.49-2.25-1.49-3.6v-26.51c0-4.58,5.54-6.88,8.78-3.64l41.06,41.06c3.24,3.24.95,8.78-3.64,8.78h-24.16c-2.86,0-5.59-1.13-7.61-3.15"/>
      <path fill="#F95A18" d="M4.39,8.78l17.42,17.4c2.02,2.02,4.76,3.15,7.61,3.15l46.2-.02c2.81,0,5.09-2.28,5.09-5.09V5.09c0-2.81-2.28-5.09-5.09-5.09H8.02C3.44,0,1.15,5.54,4.39,8.78"/>
      <path fill="#F95A18" d="M73.41,73.32h9.52c2.81,0,5.08-2.27,5.09-5.08v-7.38s0-19.15,0-19.15c0-2.81-2.28-5.09-5.09-5.08l-38.1.03c-4.63,0-6.94,5.6-3.67,8.87l24.65,24.65c2.02,2.02,4.76,3.15,7.61,3.15"/>
    </svg>
  );
}

function CountlahLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 440.41 73.33" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#F95A18" d="M14.43,70.18L1.49,57.23c-.95-.95-1.49-2.25-1.49-3.6v-26.51c0-4.58,5.54-6.88,8.78-3.64l41.06,41.06c3.24,3.24.95,8.78-3.64,8.78h-24.16c-2.86,0-5.59-1.13-7.61-3.15"/>
      <path fill="#F95A18" d="M4.39,8.78l17.42,17.4c2.02,2.02,4.76,3.15,7.61,3.15l46.2-.02c2.81,0,5.09-2.28,5.09-5.09V5.09c0-2.81-2.28-5.09-5.09-5.09H8.02C3.44,0,1.15,5.54,4.39,8.78"/>
      <path fill="#F95A18" d="M73.41,73.32h9.52c2.81,0,5.08-2.27,5.09-5.08v-7.38s0-19.15,0-19.15c0-2.81-2.28-5.09-5.09-5.08l-38.1.03c-4.63,0-6.94,5.6-3.67,8.87l24.65,24.65c2.02,2.02,4.76,3.15,7.61,3.15"/>
      <path fill="#FFFFFF" d="M180.57,20.96c-19.8-9.64-39.26,9.82-29.62,29.62,1.78,3.65,4.75,6.63,8.41,8.41,19.8,9.64,39.26-9.82,29.62-29.62-1.78-3.65-4.75-6.63-8.41-8.41M169.96,48.32c-4.61,0-8.35-3.74-8.35-8.35s3.74-8.35,8.35-8.35,8.35,3.74,8.35,8.35-3.74,8.35-8.35,8.35"/>
      <path fill="#FFFFFF" d="M222.17,19.53v28.46c0,.9-.73,1.63-1.63,1.63h-7.09c-.9,0-1.63-.73-1.63-1.63v-28.46h-16.03v25.97c0,8.99,7.29,16.28,16.28,16.28h9.84c8.99,0,16.28-7.29,16.28-16.28v-25.97h-16.03Z"/>
      <polygon fill="#FFFFFF" points="319.92 18.67 312.66 18.67 312.66 13.38 298.76 13.38 298.76 18.67 291.88 18.67 291.88 31.61 298.76 31.61 298.76 62.23 312.66 62.23 312.66 31.61 319.92 31.61 319.92 18.67"/>
      <rect fill="#FFFFFF" x="327.2" y="3.09" width="16.03" height="58.44"/>
      <path fill="#FFFFFF" d="M414.03,61.4v-30.09h10.35v30.09h16.03v-29.22c0-7.19-5.83-13.03-13.03-13.03h-13.35V3.22h-16.03v58.19h16.03Z"/>
      <path fill="#FFFFFF" d="M137.39,45.1c-1.63,2.58-4.62,4.21-7.96,3.86-3.84-.4-6.97-3.51-7.39-7.35-.56-5.04,3.37-9.3,8.3-9.3,3.24,0,6.04,1.85,7.43,4.55h0l9.52-9.52c-4.37-5.56-11.41-8.91-19.19-8.13-9.98,1.01-18.06,8.99-19.17,18.97-1.45,13.02,8.7,24.04,21.42,24.04,6.66,0,12.6-3.02,16.56-7.76l-9.38-9.38s-.09-.03-.12.01"/>
      <path fill="#FFFFFF" d="M259.55,61.7v-28.46c0-.9.73-1.63,1.63-1.63h7.09c.9,0,1.63.73,1.63,1.63v28.46h16.03v-25.97c0-8.99-7.29-16.28-16.28-16.28h-26.13v42.25h16.03Z"/>
      <path fill="#FFFFFF" d="M369.04,19.1h.02c-16.09,0-28.08,17.61-17.69,34.61,1.14,1.86,2.7,3.44,4.55,4.58,7.45,4.58,15.02,4.85,21.18,2.36v.02s0,1.56,0,1.56h16.11v-19.37c0-13.12-10.63-23.75-23.75-23.75h-.42ZM369.04,49.01c-4.61,0-8.35-3.74-8.35-8.35s3.74-8.35,8.35-8.35,8.35,3.74,8.35,8.35-3.74,8.35-8.35,8.35"/>
    </svg>
  );
}

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
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    view: "invoices",
    label: "Invoices",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    view: "xero",
    label: "Xero",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 40 40" fill="currentColor">
        <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm9.9 20c0 .547-.443.99-.99.99H22.3l5.37 5.37a.99.99 0 0 1-1.4 1.4l-5.37-5.37v6.61a.99.99 0 0 1-1.98 0V22.3l-5.37 5.37a.99.99 0 0 1-1.4-1.4l5.37-5.37H11.09a.99.99 0 0 1 0-1.98h6.43l-5.37-5.37a.99.99 0 0 1 1.4-1.4l5.37 5.37V11.1a.99.99 0 0 1 1.98 0v6.43l5.37-5.37a.99.99 0 0 1 1.4 1.4L22.3 19.01h6.61c.547 0 .99.443.99.99z"/>
      </svg>
    ),
  },
  {
    view: "history",
    label: "History",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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

  async function handleLogout() {
    await logout.mutateAsync();
    queryClient.clear();
    navigate("/");
  }

  return (
    <div className="min-h-screen text-white flex">

      {/* ── Sidebar — desktop only ───────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-white/[0.07] flex-col">
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <CountlahLogo className="h-6 w-auto" />
        </div>

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
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-white/[0.07]">
          <CountlahSymbol className="h-7 w-auto" />
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-white/80 text-sm transition-colors"
          >
            Sign out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Bottom nav — mobile only ─────────────────────────────────── */}
      <nav className="flex md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.08]"
        style={{ background: "rgba(10,15,25,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        {navItems.map(({ view, label, icon }) => {
          const isActive = activeView === view;
          return (
            <button
              key={view}
              onClick={() => onViewChange?.(view)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 ${
                isActive ? "text-orange-400" : "text-white/35 hover:text-white/70"
              }`}
            >
              {icon}
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
