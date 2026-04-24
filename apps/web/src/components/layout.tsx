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

const NAV_ICONS: Record<string, React.ReactNode> = {
  "/dashboard": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  ),
  "/settings": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  "/admin-users": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM19.5 19.5v-1.125A3.375 3.375 0 0 0 16.125 15h-8.25A3.375 3.375 0 0 0 4.5 18.375V19.5" />
    </svg>
  ),
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();

  async function handleLogout() {
    await logout.mutateAsync();
    queryClient.clear();
    navigate("/");
  }

  const navItems = [
    { label: "Dashboard", mobileLabel: "Dashboard", path: "/dashboard" },
    { label: "Settings",  mobileLabel: "Settings",  path: "/settings"  },
    ...(me?.isAdmin ? [{ label: "User Management", mobileLabel: "Users", path: "/admin-users" }] : []),
  ];

  return (
    <div className="min-h-screen text-white flex flex-col">
      <header className="border-b border-white/[0.07] px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <button
            onClick={() => navigate("/")}
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <CountlahSymbol className="h-7 w-auto block md:hidden" />
            <CountlahLogo className="h-6 w-auto hidden md:block" />
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location === path
                    ? "text-white bg-white/[0.08]"
                    : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-white/35 text-xs font-medium">{me?.email}</span>
          {me?.isAdmin && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/20">
              Admin
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-white/80 text-sm transition-all duration-200"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
        {children}
      </main>

      {/* ── Bottom nav — mobile only ───────────────────────────── */}
      <nav
        className="flex md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.08]"
        style={{ background: "rgba(10,15,25,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        {navItems.map(({ mobileLabel, path }) => {
          const isActive = location === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 ${
                isActive ? "text-orange-400" : "text-white/35 hover:text-white/70"
              }`}
            >
              {NAV_ICONS[path]}
              <span className="text-[10px] font-medium">{mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
