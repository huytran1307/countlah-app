import { useState, useEffect, useRef } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { invalidateBrandingCache, refreshBranding } from "@/hooks/use-branding";

// ─── Logo ─────────────────────────────────────────────────────────────────────

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

// ─── Data ─────────────────────────────────────────────────────────────────────

const SLOTS = 3;

interface Service {
  id: string;
  title: string;
  tagline: string;
  detail: string;
  icon: React.ReactNode;
  featured?: boolean;
  fullWidth?: boolean;
}

const SERVICES: Service[] = [
  {
    id: "bookkeeping",
    title: "Bookkeeping & Accounts",
    tagline: "Always know your numbers",
    detail: "Monthly reconciled books delivered clean, accurate, and on time. No more mystery balances or year-end panic. We handle every transaction so your financial records are always audit-ready and stress-free.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: "gst",
    featured: true,
    title: "GST Filing & Compliance",
    tagline: "Never miss a deadline again",
    detail: "We prepare, review, and submit your GST returns every quarter — penalty-free, every time. Full reconciliation, IRAS correspondence handled, and proactive alerts for any regulatory changes that affect your business.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
  },
  {
    id: "tax",
    title: "Corporate Tax (Form C/C-S)",
    tagline: "Pay only what you owe",
    detail: "We maximise your allowable deductions and file on time — so you keep more of what you earn. Full Form C and Form C-S preparation, tax computation, capital allowance claims, and submission to IRAS.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
  },
  {
    id: "payroll",
    title: "Payroll Processing",
    tagline: "Your team, paid right",
    detail: "CPF submissions, payslips, IR8A — handled accurately every cycle with zero hassle from your side. We manage the full payroll process so your team gets paid correctly and on time, every single month.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    id: "xbrl",
    title: "XBRL & Annual Filing",
    tagline: "ACRA-compliant, always",
    detail: "Full XBRL tagging and ACRA annual return submissions so your company stays in good standing. We handle AGM preparation, financial statement preparation, and all ACRA filings on your behalf.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    id: "cfo",
    fullWidth: true,
    title: "CFO Advisory",
    tagline: "Strategy, not just compliance",
    detail: "Monthly financial reviews, cash flow forecasting, and growth planning — like having a CFO on call. We help you understand your numbers and make decisions that actually move your business forward.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
];

const STATS = [
  { value: "500+", label: "SME Clients Served" },
  { value: "99%", label: "On-Time Filing Rate" },
  { value: "S$2M+", label: "Tax Savings Uncovered" },
  { value: "10+", label: "Years of Experience" },
];

const TESTIMONIALS = [
  {
    quote: "Before Countlah, I was doing my own GST and getting it wrong every quarter. Now I don't think about it at all. Best decision I made for my business.",
    name: "James Tan",
    role: "F&B Operator, Tanjong Pagar",
  },
  {
    quote: "They spotted that I had been overpaying corporate tax for two years. The refund more than covered their fees for the next three years.",
    name: "Sarah Lim",
    role: "E-commerce Founder, Shopee Seller",
  },
  {
    quote: "Switched from a traditional accountant who never replied. Countlah responds same day and I always know where my numbers stand.",
    name: "Marcus Ng",
    role: "Tech Startup Founder",
  },
  {
    quote: "Payroll used to take me half a day every month. Now it's completely off my plate. Absolutely worth every dollar.",
    name: "Linda Chow",
    role: "Retail SME Owner",
  },
  {
    quote: "They cleaned up 18 months of backlog in two weeks. Professional, fast, and no judgment whatsoever.",
    name: "David Koh",
    role: "F&B Chain Operator",
  },
];

const PLANS = [
  {
    name: "Essential",
    price: 280,
    popular: false,
    tagline: "For sole proprietors & newly incorporated companies with simple books.",
    features: [
      "Monthly bookkeeping (up to 50 txn)",
      "Annual GST filing",
      "Corporate tax filing",
      "Email support",
      "Dedicated account manager",
    ],
  },
  {
    name: "Professional",
    price: 680,
    popular: true,
    tagline: "For growing SMEs with employees, higher transaction volumes, and bigger ambitions.",
    features: [
      "Monthly bookkeeping (up to 200 txn)",
      "GST filing (quarterly)",
      "Annual corporate tax + XBRL",
      "Payroll (up to 10 staff)",
      "Priority email & WhatsApp support",
      "Monthly P&L report",
    ],
  },
  {
    name: "Premium",
    price: 1280,
    popular: false,
    tagline: "For established businesses that need full-service financial management and strategic advice.",
    features: [
      "Unlimited bookkeeping",
      "GST, tax & XBRL filing",
      "Payroll (up to 30 staff)",
      "Monthly CFO advisory call",
      "Cash flow forecasting",
      "Dedicated account manager",
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "My books are a complete mess. Is it too late?",
    a: "Not at all. Most new clients come to us exactly this way. We have a dedicated cleanup process that reconciles backlogs — no judgment, just a clear path forward.",
  },
  {
    q: "Do I need to switch accounting software?",
    a: "No. We work with Xero, QuickBooks, and most major platforms. If you don't have one yet, we'll recommend the right fit for your business.",
  },
  {
    q: "How long does onboarding take?",
    a: "Most clients are fully onboarded within a week. If your books need cleanup, we'll give you a clear timeline upfront.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Scale up or down anytime based on your business needs. No lock-in contracts, ever.",
  },
  {
    q: "What if I'm not happy?",
    a: "Cancel anytime with no penalty. We'd rather earn your business every month than trap you in a contract.",
  },
  {
    q: "Is my financial data secure?",
    a: "Absolutely. We're PDPA compliant, use bank-grade encryption, and your data never leaves secure Singapore-based systems.",
  },
];

// ─── Reusable components ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-4">
      {children}
    </span>
  );
}

function Stars() {
  return (
    <div className="flex gap-0.5 text-orange-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 w-4 h-4 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
        <svg className="w-2.5 h-2.5 text-orange-400" fill="none" viewBox="0 0 10 8">
          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-white/60 text-sm">{children}</span>
    </div>
  );
}

// ─── Hero visual components ───────────────────────────────────────────────────

function CountlahSymbolHero() {
  const pathStyle = (anim: string): React.CSSProperties => ({
    transformBox: "fill-box",
    transformOrigin: "center",
    animation: anim,
  });
  const barStyle = (anim: string): React.CSSProperties => ({
    transformBox: "fill-box",
    transformOrigin: "bottom",
    animation: anim,
  });

  return (
    <div className="relative flex items-center justify-center w-28 h-24">
      {/* Ambient glow pulses with the logo phase */}
      <div
        className="absolute inset-0 rounded-full bg-orange-500/25 blur-3xl scale-[2] pointer-events-none"
        style={{ animation: "glowPulse 10s ease-in-out infinite" }}
      />

      {/* 3 points expand into logo paths, then collapse */}
      <svg viewBox="0 0 90 74" className="absolute inset-0 w-full h-full">
        <path
          fill="#F95A18"
          d="M14.43,70.18L1.49,57.23c-.95-.95-1.49-2.25-1.49-3.6v-26.51c0-4.58,5.54-6.88,8.78-3.64l41.06,41.06c3.24,3.24.95,8.78-3.64,8.78h-24.16c-2.86,0-5.59-1.13-7.61-3.15"
          style={pathStyle("path1Expand 10s ease-in-out infinite")}
        />
        <path
          fill="#F95A18"
          d="M4.39,8.78l17.42,17.4c2.02,2.02,4.76,3.15,7.61,3.15l46.2-.02c2.81,0,5.09-2.28,5.09-5.09V5.09c0-2.81-2.28-5.09-5.09-5.09H8.02C3.44,0,1.15,5.54,4.39,8.78"
          style={pathStyle("path2Expand 10s ease-in-out infinite")}
        />
        <path
          fill="#F95A18"
          d="M73.41,73.32h9.52c2.81,0,5.08-2.27,5.09-5.08v-7.38s0-19.15,0-19.15c0-2.81-2.28-5.09-5.09-5.08l-38.1.03c-4.63,0-6.94,5.6-3.67,8.87l24.65,24.65c2.02,2.02,4.76,3.15,7.61,3.15"
          style={pathStyle("path3Expand 10s ease-in-out infinite")}
        />
      </svg>

      {/* Chart bars rise from baseline once logo collapses */}
      <svg
        viewBox="0 0 90 74"
        className="absolute inset-0 w-full h-full"
        style={{ animation: "chartShow 10s ease-in-out infinite" }}
      >
        {/* Baseline */}
        <line x1="2" y1="72" x2="88" y2="72" stroke="#F95A18" strokeWidth="1" opacity="0.2" />
        {/* Bars */}
        <rect x="5"  y="44" width="13" height="28" rx="2.5" fill="#F95A18" opacity="0.50" style={barStyle("bar1Rise 10s ease-in-out infinite")} />
        <rect x="22" y="28" width="13" height="44" rx="2.5" fill="#F95A18" opacity="0.70" style={barStyle("bar2Rise 10s ease-in-out infinite")} />
        <rect x="39" y="12" width="13" height="60" rx="2.5" fill="#F95A18"               style={barStyle("bar3Rise 10s ease-in-out infinite")} />
        <rect x="56" y="20" width="13" height="52" rx="2.5" fill="#F95A18" opacity="0.85" style={barStyle("bar4Rise 10s ease-in-out infinite")} />
        <rect x="73" y="33" width="13" height="39" rx="2.5" fill="#F95A18" opacity="0.60" style={barStyle("bar5Rise 10s ease-in-out infinite")} />
        {/* Trend line + dots */}
        <polyline points="11.5,44 28.5,28 45.5,12 62.5,20 79.5,33" stroke="#FFA070" strokeWidth="1.8" fill="none" opacity="0.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="11.5" cy="44"  r="2.5" fill="#FFA070" opacity="0.9" />
        <circle cx="28.5" cy="28"  r="2.5" fill="#FFA070" opacity="0.9" />
        <circle cx="45.5" cy="12"  r="2.5" fill="#FFA070" opacity="0.9" />
        <circle cx="62.5" cy="20"  r="2.5" fill="#FFA070" opacity="0.9" />
        <circle cx="79.5" cy="33"  r="2.5" fill="#FFA070" opacity="0.9" />
      </svg>
    </div>
  );
}

function HeroDashboard() {
  const [phase, setPhase] = useState<"filing" | "done" | "new">("filing");
  const [barKey, setBarKey] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "filing") {
      t = setTimeout(() => setPhase("done"), 4200);
    } else if (phase === "done") {
      t = setTimeout(() => setPhase("new"), 1600);
    } else {
      t = setTimeout(() => { setBarKey(k => k + 1); setPhase("filing"); }, 900);
    }
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="relative w-full max-w-xs mx-auto">
      {/* Ambient glow */}
      <div className="absolute -inset-4 bg-orange-500/[0.06] rounded-3xl blur-2xl pointer-events-none" />

      {/* Main card */}
      <div className="relative glass rounded-2xl overflow-hidden border border-white/[0.10] shadow-2xl">
        {/* Card header */}
        <div className="bg-orange-500/[0.07] px-4 py-3.5 flex items-center justify-between border-b border-white/[0.06]">
          <div>
            <p className="text-white/35 text-[10px] font-medium uppercase tracking-widest">Revenue · Apr 2025</p>
            <p className="text-white font-bold text-lg leading-tight">S$24,580</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-green-500/15 text-green-400 animate-pulse">↑ 12%</span>
        </div>

        {/* Progress bar — 3-phase state machine: filing → done → new project */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className={`transition-colors duration-300 ${phase === "new" ? "text-orange-400" : "text-white/30"}`}>
              {phase === "new" ? "New project activating…" : "Filing progress"}
            </span>
            <span className={`transition-all duration-300 font-medium ${phase === "done" ? "text-green-400" : "text-white/0"}`}>
              Done ✓
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              key={barKey}
              className={`h-full rounded-full transition-[box-shadow] duration-500 ${phase === "done" ? "bg-green-500" : "gradient-primary"}`}
              style={{
                width: phase === "new" ? "0%" : undefined,
                boxShadow: phase === "done" ? "0 0 10px rgba(34,197,94,0.55)" : undefined,
                animation: phase === "filing" ? "progressFill 4.2s linear forwards" : "none",
              }}
            />
          </div>
        </div>

        {/* Invoice rows — slide in one by one */}
        <div className="px-4 py-2">
          {[
            { name: "Acme Corp",        amount: "S$4,200", paid: true  },
            { name: "Tech Solutions Pte", amount: "S$8,500", paid: true  },
            { name: "Global Trade Ltd", amount: "S$3,800", paid: false },
          ].map((inv, i) => (
            <div
              key={inv.name}
              className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0"
              style={{ animation: `fadeSlideIn 0.45s ease-out ${0.3 + i * 0.18}s both` }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 text-[10px] font-bold">
                  {inv.name[0]}
                </div>
                <span className="text-white/65 text-xs truncate max-w-[120px]">{inv.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${inv.paid ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"}`}>
                  {inv.paid ? "Paid" : "Due"}
                </span>
                <span className="text-white/80 text-xs font-medium">{inv.amount}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-3.5 pt-1 text-[10px] text-white/20 text-right">
          Powered by Countlah · ACRA Compliant
        </div>
      </div>

      {/* Floating chip — GST filed */}
      <div
        className="absolute -top-3 -right-4 glass rounded-xl px-2.5 py-1.5 border border-white/[0.12] flex items-center gap-1.5 shadow-lg"
        style={{ animation: "floatChip 3s ease-in-out infinite" }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </div>
        <span className="text-white/70 text-[11px] font-medium whitespace-nowrap">GST Filed ✓</span>
      </div>

      {/* Floating chip — savings */}
      <div
        className="absolute -bottom-3 -left-4 glass rounded-xl px-2.5 py-1.5 border border-white/[0.12] flex items-center gap-1.5 shadow-lg"
        style={{ animation: "floatChip 4s ease-in-out infinite 1.2s" }}
      >
        <span className="text-orange-400 text-xs font-bold">↑</span>
        <span className="text-white/70 text-[11px] font-medium whitespace-nowrap">S$2,400 saved</span>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className={`relative glass rounded-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-white/35 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ModalType = "login" | "how-it-works" | "service" | "testimonials" | "faq" | null;

const CONSULTATION_URL = "mailto:hello@countlah.com?subject=Free Consultation Request";
const WHATSAPP_URL = "https://wa.me/6591234567?text=Hi%20Countlah%2C%20I%27d%20like%20to%20book%20a%20free%20consultation.";

function homeFor(isAdmin: boolean) {
  return isAdmin ? "/settings" : "/app";
}

export default function LandingPage() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [checking, setChecking] = useState(true);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();

  // ── Marketing state ─────────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Auto-open login modal when visiting /login or /admin routes
  useEffect(() => {
    const path = window.location.pathname;
    if (path.endsWith("/login") || path.endsWith("/admin")) {
      setActiveModal("login");
    }
  }, []);

  // Pick up error params from server-side redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "invalid" || err === "missing") setLoginError("Invalid email or password");
    else if (err === "session") setLoginError("Session error. Please try again.");
  }, []);

  // Redirect already-authenticated users
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/auth/me`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.authenticated) navigate(homeFor(data.isAdmin ?? false));
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  // ESC key closes any modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveModal(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Body scroll lock while any modal is open
  useEffect(() => {
    document.body.style.overflow = activeModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeModal]);

  // Auto-advance testimonial slider
  useEffect(() => {
    if (activeModal !== "testimonials") return;
    const id = setInterval(() => {
      setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(id);
  }, [activeModal]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await login.mutateAsync({ data: { email, password, rememberMe } as any });
      queryClient.invalidateQueries();
      invalidateBrandingCache();
      refreshBranding();
      const me = await fetch(`${import.meta.env.BASE_URL}api/auth/me`, { credentials: "include" }).then(r => r.json());
      navigate(homeFor(me?.isAdmin ?? false));
    } catch {
      setLoginError("Invalid email or password");
    }
  }

  function openService(s: Service) {
    setActiveService(s);
    setActiveModal("service");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-orange-500 border-r-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">

      {/* ── Sticky header: banner + floating nav ───────────────────────────── */}
      <div className="sticky top-0 z-50">
        {/* Scarcity banner */}
        {bannerVisible && (
          <div className="gradient-primary">
            <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2 relative">
              <svg className="w-3.5 h-3.5 text-white/80 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0 1 12 2v5h4a1 1 0 0 1 .82 1.573l-7 10A1 1 0 0 1 8 18v-5H4a1 1 0 0 1-.82-1.573l7-10a1 1 0 0 1 1.12-.38Z" clipRule="evenodd" />
              </svg>
              <p className="text-white text-xs font-semibold text-center">
                Only 5 new clients per month —{" "}
                <span className="font-bold">{SLOTS} slots left this month</span>
              </p>
              <button
                onClick={() => setBannerVisible(false)}
                className="absolute right-4 text-white/50 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Floating glass nav */}
        <div className="px-4 py-3 flex justify-center">
          <nav className="w-full max-w-2xl flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-xl">
            {/* Logo */}
            <div className="flex-shrink-0 px-1">
              <CountlahLogo className="h-5 w-auto" />
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-white/[0.08] mx-1 flex-shrink-0" />

            {/* Nav items */}
            <div className="flex items-center gap-0.5 flex-1">
              <button
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] transition-all duration-150 text-sm font-medium"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
                <span className="hidden sm:inline">Services</span>
              </button>

              <button
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] transition-all duration-150 text-sm font-medium"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
                </svg>
                <span className="hidden sm:inline">Pricing</span>
              </button>

              <button
                onClick={() => setActiveModal("faq")}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] transition-all duration-150 text-sm font-medium"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
                <span className="hidden sm:inline">FAQ</span>
              </button>
            </div>

            {/* Sign in button */}
            <button
              onClick={() => setActiveModal("login")}
              className="flex-shrink-0 gradient-primary glow-primary text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
            >
              Sign in
            </button>
          </nav>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Left: text */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-orange-500/25 bg-orange-500/[0.08] text-orange-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              ACRA-Registered · Singapore
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              Still filing your own{" "}
              <span className="gradient-primary-text">GST at midnight?</span>
            </h1>

            <p className="text-white/50 text-lg leading-relaxed mb-10">
              You didn't start a business to live in spreadsheets.{" "}
              <span className="text-white/70">Let us handle every number</span>{" "}
              — so you get back to running yours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-10">
              <a
                href={CONSULTATION_URL}
                className="gradient-primary glow-primary text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
              >
                Book My Free Consultation
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <button
                onClick={() => setActiveModal("how-it-works")}
                className="px-7 py-3.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white border border-white/[0.10] hover:border-white/25 hover:bg-white/[0.04] transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                See How It Works
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-white/30 text-xs font-medium">
              {["ISCA Member", "PDPA Compliant", "Xero & QuickBooks Certified", "Est. 2014"].map((badge, i, arr) => (
                <span key={badge} className="flex items-center gap-5">
                  <span>{badge}</span>
                  {i < arr.length - 1 && <span className="text-white/15">·</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Right: animated visual */}
          <div className="flex flex-col items-center gap-8">
            <CountlahSymbolHero />
            <HeroDashboard />
          </div>

        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────────────────── */}
      <section id="services" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <SectionLabel>What we do for you</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Every service. Zero stress.
          </h2>
          <p className="text-white/40 text-base max-w-xl mx-auto">
            We take full ownership so you never think about compliance again.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              onClick={() => openService(s)}
              className={`glass rounded-2xl text-left group border border-white/[0.08]
                hover:border-orange-500/40 hover:bg-orange-500/[0.05]
                hover:shadow-[0_8px_32px_rgba(249,90,24,0.12)]
                active:scale-[0.98] active:border-orange-500/60
                transition-all duration-200 cursor-pointer
                ${s.featured
                  ? "sm:row-span-2 p-7 flex flex-col sm:hover:-translate-y-1"
                  : s.fullWidth
                    ? "sm:col-span-2 lg:col-span-3 p-5 sm:hover:-translate-y-1"
                    : "p-6 sm:hover:-translate-y-1.5"
                }`}
            >
              {s.featured ? (
                <>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400
                      group-hover:bg-orange-500/25 group-hover:border-orange-500/50 group-hover:scale-110 transition-all duration-200">
                      {s.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 whitespace-nowrap">
                      Most Requested
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
                  <p className="text-orange-400/80 text-sm font-medium mb-4">{s.tagline}</p>
                  <p className="text-white/40 text-sm leading-relaxed flex-1">{s.detail}</p>
                  <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center gap-2 text-sm font-medium text-orange-400/70 group-hover:text-orange-400 transition-colors duration-200">
                    <span>Learn more</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </>
              ) : s.fullWidth ? (
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0
                    group-hover:bg-orange-500/20 group-hover:border-orange-500/40 group-hover:scale-110 transition-all duration-200">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                      <h3 className="text-white font-semibold text-sm">{s.title}</h3>
                      <span className="text-orange-400/60 text-xs font-medium">· {s.tagline}</span>
                    </div>
                    <p className="text-white/35 text-xs leading-relaxed line-clamp-1 group-hover:text-white/50 transition-colors duration-200">{s.detail}</p>
                  </div>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400
                      group-hover:bg-orange-500/20 group-hover:border-orange-500/40 group-hover:scale-110 transition-all duration-200">
                      {s.icon}
                    </div>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1.5">{s.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-3">{s.tagline}</p>
                  <p className="text-white/25 text-xs leading-relaxed line-clamp-2 group-hover:text-white/40 transition-colors duration-200">{s.detail}</p>
                </>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Social proof ────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06]" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <SectionLabel>Trusted by Singapore SMEs</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Numbers that speak for themselves.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold gradient-primary-text mb-1">{s.value}</p>
                <p className="text-white/40 text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {TESTIMONIALS.slice(0, 2).map((t) => (
              <div key={t.name} className="glass rounded-2xl p-6">
                <Stars />
                <blockquote className="text-white/70 text-sm leading-relaxed mt-3 mb-4">
                  "{t.quote}"
                </blockquote>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-white/35 text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => { setTestimonialIndex(0); setActiveModal("testimonials"); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white border border-white/[0.12] hover:border-orange-500/40 hover:bg-orange-500/[0.06] transition-all duration-200 group"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                  </svg>
                ))}
              </div>
              See all client reviews
              <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 gradient-animated-bg" />
        <div className="absolute inset-0 border-y border-white/[0.06]" />
      <section id="pricing" className="relative max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <SectionLabel>Simple pricing</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            No surprises. No hidden fees.
          </h2>
          <p className="text-white/40 text-base">
            All plans include a dedicated account manager. Cancel anytime — no lock-in contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 relative flex flex-col ${
                plan.popular
                  ? "border border-orange-500/50 bg-orange-500/[0.09] shadow-[0_0_48px_rgba(249,90,24,0.20),0_0_80px_rgba(249,90,24,0.08)] md:scale-[1.06] z-10"
                  : "glass"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-base mb-1">{plan.name}</h3>
                <p className="text-white/35 text-xs leading-relaxed mb-4">{plan.tagline}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">S${plan.price.toLocaleString()}</span>
                  <span className="text-white/35 text-sm font-medium">/ mo</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1 mb-7">
                {plan.features.map((f) => (
                  <CheckItem key={f}>{f}</CheckItem>
                ))}
              </div>

              <a
                href={CONSULTATION_URL}
                className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] ${
                  plan.popular
                    ? "gradient-primary glow-primary text-white"
                    : "border border-white/[0.12] hover:border-white/25 text-white/70 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="glass rounded-3xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-48 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(249,90,24,0.08) 0%, transparent 100%)" }} />

          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                Ready to stop worrying about your finances?
              </h2>
              <p className="text-white/45 text-base leading-relaxed mb-8">
                Book a free, no-obligation 30-minute consultation. We'll review your current setup, identify what's at risk, and tell you exactly how we can help — for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={CONSULTATION_URL}
                  className="gradient-primary glow-primary text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Book My Free Consultation
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </a>
                <button
                  onClick={() => setActiveModal("faq")}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white/55 hover:text-white border border-white/[0.10] hover:border-white/25 hover:bg-white/[0.04] transition-all duration-200"
                >
                  FAQ
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                "No hard sell — just honest advice",
                "Response within 24 hours",
                "Free financial health check included",
                "Available via video call or in-office",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 10 8">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-white/65 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <CountlahLogo className="h-5 w-auto opacity-70" />
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Countlah. All rights reserved. Company Reg. No. 201312619D.</p>
          <div className="flex items-center gap-5 text-white/25 text-xs">
            <a href="#" className="hover:text-white/50 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
            <button onClick={() => setActiveModal("login")} className="hover:text-white/50 transition-colors">Client Login</button>
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp ────────────────────────────────────────────────── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl glass border border-white/[0.14] hover:border-white/30 hover:bg-white/[0.08] transition-all duration-200 hover:scale-105 active:scale-95 group"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        <span className="text-white/60 group-hover:text-white text-sm font-medium transition-colors">Chat with us</span>
      </a>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Login */}
      <Modal open={activeModal === "login"} onClose={() => setActiveModal(null)}>
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <CountlahLogo className="h-7 w-auto" />
          </div>
          <h2 className="text-white font-semibold text-base mb-7 text-center">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-5">
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
                  rememberMe ? "gradient-primary border-transparent" : "bg-white/[0.06] border-white/[0.15]"
                }`}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

            {loginError && (
              <p className="text-red-400 text-sm font-medium">{loginError}</p>
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
            <a href="/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Sign up
            </a>
          </p>
        </div>
      </Modal>

      {/* How it works */}
      <Modal open={activeModal === "how-it-works"} onClose={() => setActiveModal(null)}>
        <div className="p-8">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Process</p>
          <h2 className="text-2xl font-bold text-white mb-1">Up and running in 3 steps.</h2>
          <p className="text-white/40 text-sm mb-8">From first call to fully managed books — most clients onboarded within a week.</p>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "Free 30-Min Consultation",
                body: "Tell us about your business. We assess your current setup, identify gaps, and recommend a plan — with zero obligation.",
              },
              {
                step: "02",
                title: "We Onboard & Clean Up",
                body: "We take over your books, reconcile any backlog, and set up clean systems. Hand over the mess — we sort it out.",
              },
              {
                step: "03",
                title: "Sit Back & Grow",
                body: "Every deadline met, every filing done, every question answered — without you lifting a finger. Just focus on your business.",
              },
            ].map((s, i) => (
              <div key={s.step} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.step}
                  </div>
                  {i < 2 && <div className="w-px flex-1 bg-white/[0.08] mt-2 mb-0" />}
                </div>
                <div className="pb-6">
                  <h3 className="text-white font-semibold text-sm mb-1.5">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            href={CONSULTATION_URL}
            className="mt-2 w-full gradient-primary glow-primary text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2"
          >
            Book My Free Consultation
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </Modal>

      {/* Service detail */}
      <Modal open={activeModal === "service"} onClose={() => setActiveModal(null)}>
        {activeService && (
          <div className="p-8">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-5">
              {activeService.icon}
            </div>
            <h2 className="text-xl font-bold text-white mb-1.5">{activeService.title}</h2>
            <p className="text-orange-400 text-sm font-medium mb-5">{activeService.tagline}</p>
            <p className="text-white/55 text-sm leading-relaxed mb-7">{activeService.detail}</p>
            <a
              href={CONSULTATION_URL}
              className="w-full gradient-primary glow-primary text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2"
            >
              Book a Free Consultation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        )}
      </Modal>

      {/* All testimonials — auto gallery */}
      <Modal open={activeModal === "testimonials"} onClose={() => setActiveModal(null)}>
        <div className="p-6 md:p-8">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Reviews</p>
          <h2 className="text-xl font-bold text-white mb-6">What our clients say.</h2>

          {/* Card + side arrows */}
          <div className="flex items-center gap-3">
            {/* Left arrow — hidden on mobile */}
            <button
              onClick={() => setTestimonialIndex(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="hidden sm:flex w-9 h-9 rounded-xl glass border border-white/[0.10] items-center justify-center text-white/40 hover:text-white hover:border-white/25 hover:bg-white/[0.06] transition-all duration-200 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Swipeable card */}
            <div
              className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 min-h-[200px] flex flex-col justify-between select-none"
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (touchStartX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                if (Math.abs(dx) > 40) {
                  setTestimonialIndex(i =>
                    dx < 0
                      ? (i + 1) % TESTIMONIALS.length
                      : (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
                  );
                }
                touchStartX.current = null;
              }}
            >
              <div>
                <Stars />
                <blockquote className="text-white/70 text-sm leading-relaxed mt-4 mb-5">
                  "{TESTIMONIALS[testimonialIndex].quote}"
                </blockquote>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{TESTIMONIALS[testimonialIndex].name}</p>
                <p className="text-white/35 text-xs mt-0.5">{TESTIMONIALS[testimonialIndex].role}</p>
              </div>
            </div>

            {/* Right arrow — hidden on mobile */}
            <button
              onClick={() => setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length)}
              className="hidden sm:flex w-9 h-9 rounded-xl glass border border-white/[0.10] items-center justify-center text-white/40 hover:text-white hover:border-white/25 hover:bg-white/[0.06] transition-all duration-200 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === testimonialIndex ? "w-6 bg-orange-400" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* FAQ */}
      <Modal open={activeModal === "faq"} onClose={() => setActiveModal(null)} wide>
        <div className="p-8">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">FAQ</p>
          <h2 className="text-2xl font-bold text-white mb-1">You've got questions.</h2>
          <p className="text-white/40 text-sm mb-7">Every reason not to reach out — addressed honestly.</p>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-white/[0.07] rounded-xl overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors duration-150"
                >
                  <span className="text-white text-sm font-medium">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${activeFaq === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-5 border-t border-white/[0.06]">
                    <p className="text-white/50 text-sm leading-relaxed pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

    </div>
  );
}
