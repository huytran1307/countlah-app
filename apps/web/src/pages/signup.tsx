import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <h1 className="gradient-primary-text text-4xl font-bold tracking-tight mb-2">
            COUNTLAH
          </h1>
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
