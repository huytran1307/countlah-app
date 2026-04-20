// COUNTLAH MVP SKELETON v3
// Node.js + Express + SQLite + OCR (pdf-parse) + OpenAI extract

import express from "express";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import fs from "fs";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== ADMIN =====
const ADMIN_EMAIL = "countla168@gmail.com";
const ADMIN_PASSWORD = "@Admin123";

// ===== DB =====
const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database,
});

await db.exec(`
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  raw_text TEXT,
  extracted_json TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// ===== AUTH =====
function auth(req, res, next) {
  const { email, password } = req.headers;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ===== LOGIN =====
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false });
});

// ===== UPLOAD + OCR =====
app.post("/upload", auth, upload.single("file"), async (req, res) => {
  const fileBuffer = fs.readFileSync(req.file.path);

  const pdfData = await pdfParse(fileBuffer);
  const rawText = pdfData.text;

  const result = await db.run(
    `INSERT INTO invoices (filename, raw_text, status) VALUES (?, ?, ?)`,
    [req.file.filename, rawText, "uploaded"]
  );

  res.json({ invoiceId: result.lastID });
});

// ===== AI EXTRACT =====
app.post("/extract/:id", auth, async (req, res) => {
  const { id } = req.params;

  const invoice = await db.get(`SELECT * FROM invoices WHERE id = ?`, [id]);

  const prompt = `
Extract structured invoice data from the text below.

Return ONLY JSON.

Fields:
supplier_name
invoice_number
invoice_date
due_date
currency
subtotal
tax
total
line_items [{description, quantity, unit_price, amount}]

TEXT:
${invoice.raw_text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const output = response.choices[0].message.content;

    await db.run(
      `UPDATE invoices SET extracted_json = ?, status = ? WHERE id = ?`,
      [output, "extracted", id]
    );

    res.json({ data: JSON.parse(output) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== LIST =====
app.get("/invoices", auth, async (req, res) => {
  const rows = await db.all(`SELECT * FROM invoices ORDER BY created_at DESC`);
  res.json(rows);
});

// ===== START =====
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
