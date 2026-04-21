import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import router from "./routes";
import { logger } from "./lib/logger";
import { db, pool, usersTable } from "@workspace/db";

// ─── Admin bootstrap ──────────────────────────────────────────────────────────
// Ensures at least one admin account exists on startup.
// Uses ADMIN_EMAIL / ADMIN_PASSWORD env vars (defaults maintained for dev).

async function ensureAdminUser(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "@Admin123";

  // Remove any existing admin accounts that don't match the configured email,
  // so credential changes in .env take effect without manual DB edits.
  const allAdmins = await db.select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));

  for (const admin of allAdmins) {
    if (admin.email !== adminEmail) {
      await db.delete(usersTable).where(eq(usersTable.id, admin.id));
      logger.info({ email: admin.email }, "Removed stale admin account");
    }
  }

  const [existing] = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, adminEmail));

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(usersTable).values({ email: adminEmail, passwordHash, role: "admin" });
    logger.info({ email: adminEmail }, "Admin user created");
  } else {
    // Always sync password on startup so .env changes apply immediately.
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.update(usersTable)
      .set({ passwordHash, role: "admin" })
      .where(eq(usersTable.id, existing.id));
    logger.info({ email: adminEmail }, "Admin credentials synced");
  }
}

async function ensureTestUser(): Promise<void> {
  const testEmail = (process.env.TEST_EMAIL ?? "countla168@gmail.com").toLowerCase();
  const testPassword = process.env.TEST_PASSWORD ?? "Admin@123";

  const [existing] = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, testEmail));

  if (!existing) {
    const passwordHash = await bcrypt.hash(testPassword, 12);
    await db.insert(usersTable).values({ email: testEmail, passwordHash, role: "user" });
    logger.info({ email: testEmail }, "Test user created");
  } else {
    const passwordHash = await bcrypt.hash(testPassword, 12);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, existing.id));
    logger.info({ email: testEmail }, "Test user credentials synced");
  }
}

const app = express();
app.set("trust proxy", 1);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const PgStore = connectPgSimple(session);

app.use(
  session({
    store: (process.env.DATABASE_URL ?? process.env.POSTGRES_URL)
      ? new PgStore({ pool, createTableIfMissing: true, tableName: "user_sessions" })
      : undefined,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // maxAge is set per-request in the login route based on rememberMe
    },
  }),
);

// Serve uploads directory
const uploadsStaticDir = process.env.VERCEL
  ? "/tmp/uploads"
  : path.join(process.cwd(), "uploads");
app.use("/api/uploads", express.static(uploadsStaticDir));

app.use("/api", router);

export { ensureAdminUser, ensureTestUser };
export default app;
