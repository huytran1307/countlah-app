import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import UserAppPage from "@/pages/user-app";
import InvoiceDetailPage from "@/pages/invoice-detail";
import InvoiceLogsPage from "@/pages/invoice-logs";
import SettingsPage from "@/pages/settings";
import AdminUsersPage from "@/pages/admin-users";
import UserLayout from "@/components/user-layout";
import { refreshBranding, invalidateBrandingCache } from "@/hooks/use-branding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// ── UserLayout wrapper for invoice detail (sidebar stays visible) ──────────────
function UserInvoiceLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  return (
    <UserLayout
      activeView="invoices"
      onViewChange={(v) => navigate(`/app?view=${v}`)}
    >
      <div className="p-8">{children}</div>
    </UserLayout>
  );
}

// ── Auth guard: redirects to / if not logged in ─────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { data: me, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  useEffect(() => {
    if (!isLoading && !me?.authenticated) {
      navigate("/");
    }
  }, [isLoading, me?.authenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
      </div>
    );
  }

  if (!me?.authenticated) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LandingPage} />
      <Route path="/admin" component={LandingPage} />
      <Route path="/signup" component={SignupPage} />

      {/* Admin routes */}
      <Route path="/admin-dashboard">
        <AuthGuard><DashboardPage /></AuthGuard>
      </Route>
      {/* Legacy dashboard path — still accessible */}
      <Route path="/dashboard">
        <AuthGuard><DashboardPage /></AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard><SettingsPage /></AuthGuard>
      </Route>
      <Route path="/admin-users">
        <AuthGuard><AdminUsersPage /></AuthGuard>
      </Route>

      {/* User app routes */}
      <Route path="/app">
        <AuthGuard><UserAppPage /></AuthGuard>
      </Route>
      <Route path="/app/invoices/:id">
        {(params) => (
          <AuthGuard>
            <InvoiceDetailPage
              id={parseInt(params.id, 10)}
              LayoutComp={UserInvoiceLayout}
              backPath="/app?view=invoices"
              backLabel="Invoices"
            />
          </AuthGuard>
        )}
      </Route>

      {/* Legacy invoice detail routes (admin uses Layout by default) */}
      <Route path="/invoices/:id/logs">
        {(params) => (
          <AuthGuard><InvoiceLogsPage id={parseInt(params.id, 10)} /></AuthGuard>
        )}
      </Route>
      <Route path="/invoices/:id">
        {(params) => (
          <AuthGuard><InvoiceDetailPage id={parseInt(params.id, 10)} /></AuthGuard>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    refreshBranding();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export { invalidateBrandingCache, refreshBranding };
export default App;
