import { useLogout, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useBranding } from "../hooks/use-branding";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const branding = useBranding();

  async function handleLogout() {
    await logout.mutateAsync();
    queryClient.clear();
    navigate("/");
  }

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <header className="border-b border-white/[0.07] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.companyName ?? "Logo"}
                className="h-8 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <span className="gradient-primary-text text-lg font-bold tracking-tight">
                {branding.companyName || "COUNTLAH"}
              </span>
            )}
          </button>
          <nav className="flex items-center gap-1">
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
        <div className="flex items-center gap-4">
          {me?.email && (
            <span className="text-white/35 text-xs font-medium">{me.email}</span>
          )}
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
      <main className="flex-1 px-8 py-10">
        {children}
      </main>
    </div>
  );
}
