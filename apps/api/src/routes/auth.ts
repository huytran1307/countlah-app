import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
    userId: number;
    email: string;
    role: string;
    xeroOAuthState: string;
    xeroCodeVerifier: string;
    xeroReturnTo: string;
  }
}

const router: IRouter = Router();

const SignupBody = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ── Signup ────────────────────────────────────────────────────────────────────

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i: { message: string }) => i.message).join(", ");
    res.status(400).json({ error: msg });
    return;
  }

  const { email, password } = parsed.data;

  const [existing] = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    role: "user",
  }).returning();

  req.session.authenticated = true;
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;

  req.session.save((err) => {
    if (err) { res.status(500).json({ error: "Session error" }); return; }
    res.status(201).json({ success: true, message: "Account created" });
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { email, password, rememberMe } = parsed.data;

  const [user] = await db.select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.authenticated = true;
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;

  // Remember me: persist for 3 days; otherwise session cookie (expires on browser close)
  req.session.cookie.maxAge = rememberMe
    ? 3 * 24 * 60 * 60 * 1000
    : undefined;

  req.session.save((err) => {
    if (err) { res.status(500).json({ error: "Session error" }); return; }
    res.json({ success: true, message: "Login successful" });
  });
});

// ── Login via form POST (cross-origin safe — returns redirect, not JSON) ─────

router.post("/auth/login-form", async (req, res): Promise<void> => {
  const email = (req.body.email ?? "").trim().toLowerCase();
  const password = (req.body.password ?? "").trim();

  if (!email || !password) {
    res.redirect(302, "/?error=missing");
    return;
  }

  const [user] = await db.select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.redirect(302, "/?error=invalid");
    return;
  }

  req.session.authenticated = true;
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;
  req.session.cookie.maxAge = 3 * 24 * 60 * 60 * 1000;

  req.session.save((err) => {
    if (err) { res.redirect(302, "/?error=session"); return; }
    res.redirect(302, user.role === "admin" ? "/settings" : "/app");
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

// ── Me ────────────────────────────────────────────────────────────────────────

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.authenticated || !req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    authenticated: true,
    userId: req.session.userId,
    email: req.session.email,
    role: req.session.role,
    isAdmin: req.session.role === "admin",
  });
});

export default router;
