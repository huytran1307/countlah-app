import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Signup failed. Please try again.");
        return;
      }

      await queryClient.invalidateQueries();
      navigate("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center gap-4">
          <a href="https://countlah.vercel.app" className="hover:opacity-80 transition-opacity duration-200">
            <CountlahLogo className="h-8 w-auto" />
          </a>
          <p className="text-white/40 text-sm font-medium">Invoice processing for finance teams</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-white font-semibold text-base mb-7">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/40 text-xs font-medium uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/25"
                placeholder="Enter your email"
                autoComplete="email"
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
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs font-medium uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.10] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-200 placeholder:text-white/25"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-primary glow-primary disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] mt-1"
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-white/40 text-sm">
            Already have an account?{" "}
            <Link href="/" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
