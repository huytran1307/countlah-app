import { useState, useEffect } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useBranding } from "../hooks/use-branding";
import { invalidateBrandingCache, refreshBranding } from "@/hooks/use-branding";

function homeFor(isAdmin: boolean) {
  return isAdmin ? "/admin-dashboard" : "/app";
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();
  const branding = useBranding();

  // If already authenticated, redirect based on role
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/auth/me`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.authenticated) {
          navigate(homeFor(data.isAdmin ?? false));
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ data: { email, password } });
      queryClient.invalidateQueries();
      invalidateBrandingCache();
      refreshBranding();
      const me = await fetch(`${import.meta.env.BASE_URL}api/auth/me`, { credentials: "include" }).then(r => r.json());
      navigate(me?.isAdmin ? "/settings" : "/app");
    } catch {
      setError("Invalid email or password");
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Hero logo */}
        <div className="mb-12 text-center">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.companyName ?? "Logo"}
              className="h-20 w-auto mx-auto mb-4 object-contain"
            />
          ) : (
            <h1 className="gradient-primary-text text-5xl font-bold tracking-tight mb-3">
              {branding.companyName || "COUNTLAH"}
            </h1>
          )}
          <p className="text-white/35 text-sm font-medium">Invoice processing for finance teams</p>
        </div>

        {/* Login card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-white font-semibold text-base mb-7">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/40 text-xs font-medium uppercase tracking-widest mb-2">
                Email/Username
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/25"
                placeholder="Enter your email or username"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs font-medium uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/25"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full gradient-primary glow-primary disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] mt-1"
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-white/35 text-sm">
            Don't have an account?{" "}
            <a href="/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
