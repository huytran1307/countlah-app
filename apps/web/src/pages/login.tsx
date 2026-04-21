import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { invalidateBrandingCache, refreshBranding } from "@/hooks/use-branding";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      setError("Invalid email or password");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center gap-4">
          <a href="https://countlah.vercel.app" className="hover:opacity-80 transition-opacity duration-200">
            <CountlahLogo className="h-8 w-auto" />
          </a>
          <p className="text-white/40 text-sm font-medium">Invoice processing for finance teams</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-white font-semibold text-base mb-7">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/40 text-xs font-medium uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/25"
                placeholder="Enter your email"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs font-medium uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/25"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
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
                Remember me for 3 days
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
