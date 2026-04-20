# Workspace

## Overview

COUNTLAH — A full-stack invoice processing app for finance teams. Upload PDF invoices, extract structured data with AI, review and edit, then push to Xero.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (no API key needed)
- **File uploads**: multer (PDF/JPG/PNG, 20MB limit for invoices, 5MB for logo)
- **PDF/image extraction**: Unified vision pipeline — all inputs converted to images (pdftoppm for PDF) → OpenAI Vision extracts structured JSON directly (no pdf-parse)
- **OCR engine**: pdftoppm (PDF→PNG) → OpenAI Vision API (structured JSON extraction in one shot)
- **System dependency**: `poppler-utils` declared as Nix system dependency (nix stable-25_05) — provides `pdftoppm` in both dev and deployed containers. Binary resolved at startup via `which` → Nix store scan fallback in `ocr.ts`.

## Architecture

### Backend (`artifacts/api-server`)
- Express 5 server with session-based auth
- Routes: `/api/auth/*`, `/api/invoices/*`
- Admin credentials: `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars (defaults: admin@countlah.com / @Admin123)
- AI extraction using OpenAI gpt-5.2 via Replit AI Integrations
- Xero push endpoint (mock — ready for real OAuth integration)

### Frontend (`artifacts/countlah`)
- React + Vite, dark mode default
- Pages: login, dashboard, invoice detail, invoice logs
- Session-based auth with auth guard

### Database (`lib/db`)
- Tables: `invoices`, `invoice_logs`
- `invoices`: id, filename, original_name, raw_text, extracted_data (jsonb), status, timestamps
- `invoice_logs`: id, invoice_id, action, status, message, created_at

## Invoice Flow
1. Upload PDF → multer saves file → pdf-parse extracts raw text; if minimal/empty text detected → pdftoppm converts pages to PNG → OpenAI Vision OCR reads images → rawText stored
2. Extract → OpenAI gpt-5.2 reads raw text, returns structured JSON (re-runs OCR if rawText still missing)
3. Review & Edit → frontend editable form
4. Push to Xero → mock endpoint (returns XERO-{timestamp} ID)

## Extracted Data Structure
```json
{
  "supplier_name": "...",
  "invoice_number": "...",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "currency": "SGD",
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "line_items": [
    { "description": "...", "quantity": 1, "unit_price": 0.00, "amount": 0.00 }
  ]
}
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables Required
- `SESSION_SECRET` — session signing secret (already set)
- `DATABASE_URL` — PostgreSQL connection string (already set)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — set by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_API_KEY` — set by Replit AI Integrations
- `ADMIN_EMAIL` — optional (default: admin@countlah.com)
- `ADMIN_PASSWORD` — optional (default: @Admin123)
