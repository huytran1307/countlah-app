import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAuth";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db
      .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
      .from(usersTable)
      .orderBy(usersTable.createdAt);
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/users", requireAdmin, async (req, res) => {
  const { email, password, role } = req.body as { email?: string; password?: string; role?: string };
  if (!email || !password || password.length < 8) {
    res.status(400).json({ error: "Email and password (min 8 chars) required" });
    return;
  }
  const normalised = email.toLowerCase().trim();
  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, normalised));
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({ email: normalised, passwordHash, role: role === "admin" ? "admin" : "user" })
      .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt });
    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.post("/users/:id/reset-password", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.patch("/users/:id/role", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body as { role?: string };
  if (role !== "admin" && role !== "user") {
    res.status(400).json({ error: "Role must be 'admin' or 'user'" });
    return;
  }
  try {
    await db.update(usersTable).set({ role }).where(eq(usersTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to update role" });
  }
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
