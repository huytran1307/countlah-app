import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { invalidateBrandingCache, refreshBranding } from "@/hooks/use-branding";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ data: { email, password, rememberMe } });
      queryClient.invalidateQueries();
      invalidateBrandingCache();
      refreshBranding();
      const me = await fetch("/api/auth/me").then(r => r.json());
      navigate(me?.isAdmin ? "/settings" : "/dashboard");
    } catch (_err) {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <h1 className="gradient-primary-text text-4xl font-bold tracking-tight mb-2">
            COUNTLAH
          </h1>
          <p className="text-white/40 text-sm font-medium">Invoice processing for finance teams</p>
        </div>

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

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(v => !v)}
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 flex-shrink-0 ${
                  rememberMe
                    ? "gradient-primary border-transparent"
                    : "bg-white/[0.06] border-white/[0.15]"
                }`}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span
                className="text-white/40 text-sm cursor-pointer select-none"
                onClick={() => setRememberMe(v => !v)}
              >
                Remember me
              </span>
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

          <p className="mt-6 text-center text-white/40 text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
