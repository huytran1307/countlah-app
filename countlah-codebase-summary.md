# Countlah — Codebase Summary for AI Context

## Mục đích app
Countlah là web app xử lý hóa đơn (invoice processing) cho finance team. Flow chính:
1. Upload file PDF/JPG/PNG hóa đơn
2. Claude AI (claude-opus-4-7) dùng Vision API để extract dữ liệu (supplier, amount, line items...)
3. User review và edit dữ liệu đã extract
4. Push hóa đơn lên Xero (accounting software) qua OAuth2

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React + TypeScript + Vite + TailwindCSS v4 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| Auth | express-session (session-based, không dùng JWT) |
| API contract | Orval (generate từ OpenAPI spec) → `@workspace/api-zod` + `@workspace/api-client-react` |
| Monorepo | pnpm workspaces |
| Xero | OAuth2 + PKCE |

---

## Cấu trúc thư mục

```
workspace/
├── artifacts/
│   ├── api-server/          # Backend Express app
│   │   ├── src/
│   │   │   ├── app.ts           # Express setup, session, admin bootstrap
│   │   │   ├── index.ts         # Entry point (chạy server)
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts      # /auth/login, /auth/logout, /auth/me, /auth/signup
│   │   │   │   ├── invoices.ts  # CRUD invoices, upload, extract, push to Xero
│   │   │   │   ├── settings.ts  # Anthropic key, Xero OAuth, branding, accounting config
│   │   │   │   └── health.ts
│   │   │   ├── lib/
│   │   │   │   ├── claude.ts    # Anthropic client factory (DB key > env var)
│   │   │   │   ├── ocr.ts       # PDF→images (pdftoppm) + Claude Vision extract
│   │   │   │   ├── xero.ts      # Xero OAuth helpers, token refresh, API calls
│   │   │   │   └── logger.ts    # pino logger
│   │   │   └── middlewares/
│   │   │       └── requireAuth.ts  # requireAuth, requireAdmin middleware
│   │   ├── uploads/         # Uploaded invoice files (disk)
│   │   └── .env             # Env vars (xem bên dưới)
│   │
│   └── countlah/            # Frontend React app
│       └── src/
│           ├── App.tsx          # Router + AuthGuard
│           ├── pages/
│           │   ├── landing.tsx  # Trang login (route /, /login, /admin)
│           │   ├── dashboard.tsx    # Admin dashboard (stats + recent invoices)
│           │   ├── settings.tsx     # Admin settings page
│           │   ├── user-app.tsx     # User app (upload, invoice list, Xero view)
│           │   ├── invoice-detail.tsx
│           │   ├── invoice-logs.tsx
│           │   └── signup.tsx
│           ├── components/
│           │   ├── layout.tsx       # Admin sidebar layout
│           │   ├── user-layout.tsx  # User sidebar layout
│           │   └── ui/              # shadcn/ui components
│           └── hooks/
│               └── use-branding.ts  # Logo/company name từ API
│
└── lib/
    ├── api-zod/             # Zod schemas (generated từ OpenAPI, KHÔNG build step)
    │   └── src/generated/api.ts  # LoginBody, InvoiceResponse, etc.
    ├── api-client-react/    # React Query hooks (generated từ OpenAPI)
    │   └── src/generated/api.ts  # useLogin, useListInvoices, useGetMe, etc.
    └── db/                  # Drizzle schema + DB client
        └── src/schema.ts    # usersTable, invoicesTable, invoiceLogsTable, settingsTable
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| email | text unique | Dùng như username (không bắt buộc email format) |
| passwordHash | text | bcryptjs, 12 rounds |
| role | text | `"admin"` hoặc `"user"` |
| createdAt | timestamp | |

### `invoices`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| filename | text | Tên file trên disk (uuid-based) |
| originalName | text | Tên file gốc user upload |
| rawText | text | Raw text từ OCR (hiện ít dùng) |
| extractedData | jsonb | Structured data từ Claude Vision |
| status | enum | `uploaded`, `extracted`, `pushed`, `failed` |
| createdAt / updatedAt | timestamp | |

### `invoiceLogs`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| invoiceId | FK | |
| action | text | `upload`, `extract`, `push` |
| status | text | `success`, `error` |
| message | text | Error message nếu có |
| createdAt | timestamp | |

### `settings`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| key | text unique | |
| value | text | |
| userId | int nullable | NULL = global (branding), có userId = per-user (Xero tokens, etc.) |
| updatedAt | timestamp | |

---

## Authentication & Roles

- **Session-based** dùng `express-session` + PostgreSQL (hoặc in-memory store)
- Cookie: `httpOnly`, `sameSite: lax`
- **Remember me**: `maxAge = 30 days` nếu checked, `undefined` (session cookie) nếu không
- **Roles**:
  - `admin` → truy cập `/dashboard`, `/settings`, full invoice CRUD
  - `user` → truy cập `/app` (upload + view invoices của mình)

### Admin Bootstrap
- Khi server start, `ensureAdminUser()` trong `app.ts` chạy tự động
- Đọc `ADMIN_EMAIL` + `ADMIN_PASSWORD` từ `.env`
- Nếu admin khác email đang config → xóa đi
- Luôn sync password (thay đổi .env → restart server là có hiệu lực ngay)
- Default hiện tại: `ADMIN_EMAIL=huy`, `ADMIN_PASSWORD=huy`

### Login Flow
- Route `/`, `/login`, `/admin` đều render `LandingPage` (landing.tsx)
- Sau login thành công: gọi `/api/auth/me` → nếu `isAdmin=true` redirect `/settings`, ngược lại `/app`
- Field "Email/Username": `type="text"` (không validate email format)

---

## API Endpoints

### Auth
```
POST /api/auth/login         { email, password, rememberMe? }
POST /api/auth/logout
POST /api/auth/signup        { email, password }
GET  /api/auth/me            → { authenticated, userId, email, role, isAdmin }
```

### Invoices (requireAuth)
```
GET    /api/invoices                     ?status&page&limit
GET    /api/invoices/stats
GET    /api/invoices/:id
POST   /api/invoices/upload              multipart/form-data (file)
PUT    /api/invoices/:id                 { extractedData?, status? }
DELETE /api/invoices/:id
POST   /api/invoices/:id/extract         Chạy Claude Vision extraction
POST   /api/invoices/:id/push-to-xero   Push lên Xero
GET    /api/invoices/:id/logs
```

### Settings (requireAuth / requireAdmin)
```
GET    /api/settings/all                 Tất cả settings của user hiện tại
POST   /api/settings/anthropic-key      { apiKey } — requireAdmin
DELETE /api/settings/anthropic-key      — requireAdmin
POST   /api/settings/xero               { clientId, clientSecret }
GET    /api/settings/xero/auth-url      Bắt đầu OAuth flow
DELETE /api/settings/xero/connect      Disconnect Xero
POST   /api/settings/accounting         { accountCode, taxType, currency, invoiceType }
POST   /api/settings/field-mapping      { fieldMapping }
POST   /api/settings/contacts           { autoCreate, nameMatching }
GET    /api/branding                    Public — logo + company name
POST   /api/settings/branding/logo      Upload logo — requireAdmin
POST   /api/settings/branding           { companyName } — requireAdmin
GET    /api/xero/status
GET    /api/auth/xero/callback          OAuth callback
```

---

## AI Extraction (Claude Vision)

File: `api-server/src/lib/ocr.ts`

1. Nếu file là PDF → dùng `pdftoppm` convert sang PNG (tối đa 4 trang)
2. Nếu là image → dùng trực tiếp
3. Gửi lên Claude Vision API với prompt yêu cầu trả về JSON:
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
     "line_items": [{ "description": "", "quantity": 0, "unit_price": 0, "amount": 0 }]
   }
   ```
4. Response được strip markdown fences rồi `JSON.parse`

Model: `claude-opus-4-7` (default trong `claude.ts`)

API key priority: DB (`settingsTable` key=`anthropic_api_key`) > `ANTHROPIC_API_KEY` env var

---

## Xero Integration

- OAuth2 + PKCE flow
- Tokens lưu per-user trong `settingsTable` (access token, refresh token, tenant ID)
- Auto-refresh: nếu access token expired, dùng refresh token lấy token mới
- Push invoice tạo BILL trong Xero với line items
- Contact auto-create: nếu supplier chưa có trong Xero → tạo mới

---

## Frontend Routing (App.tsx)

```
/              → LandingPage (login form)
/login         → LandingPage
/admin         → LandingPage
/signup        → SignupPage
/dashboard     → DashboardPage (AuthGuard) — admin
/admin-dashboard → DashboardPage (AuthGuard)
/settings      → SettingsPage (AuthGuard) — admin
/app           → UserAppPage (AuthGuard) — user
/app/invoices/:id → InvoiceDetailPage (AuthGuard)
/invoices/:id  → InvoiceDetailPage (AuthGuard)
/invoices/:id/logs → InvoiceLogsPage (AuthGuard)
```

`AuthGuard`: check `/api/auth/me`, redirect về `/` nếu chưa login.

---

## Environment Variables (.env)

```env
DATABASE_URL=postgresql://user@localhost:5432/countlah
SESSION_SECRET=...
ADMIN_EMAIL=huy
ADMIN_PASSWORD=huy
ANTHROPIC_API_KEY=sk-ant-...   # optional nếu đã lưu qua Settings UI
NODE_ENV=development
PORT=3001
```

---

## Chạy Local (macOS ARM)

```bash
# Backend
cd artifacts/api-server
set -a && source .env && set +a
node dist/index.mjs        # hoặc pnpm run build trước nếu có thay đổi

# Frontend (Vite dev server, proxy /api → localhost:3001)
cd artifacts/countlah
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Vite proxy config trong `artifacts/countlah/vite.config.ts`

---

## Shared Packages (workspace libs)

### `@workspace/api-zod`
- Zod validation schemas (dùng trực tiếp từ source, không build)
- Import trực tiếp từ `./src/index.ts`
- Quan trọng: `LoginBody` dùng `zod.string()` cho email (không `.email()`)

### `@workspace/api-client-react`
- React Query hooks generated bởi Orval
- `useLogin`, `useGetMe`, `useListInvoices`, `useGetInvoiceStats`, v.v.
- Không có client-side Zod validation — chỉ TypeScript types

### `@workspace/db`
- Drizzle ORM client + schema definitions
- Export: `db`, `usersTable`, `invoicesTable`, `invoiceLogsTable`, `settingsTable`

---

## Những thay đổi đã làm (so với bản Replit gốc)

1. **OpenAI → Anthropic**: Thay toàn bộ OpenAI SDK bằng `@anthropic-ai/sdk`, endpoint `/settings/anthropic-key`
2. **Admin credentials**: Đổi từ `admin@countlah.com` thành `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars (hiện tại: `huy`/`huy`)
3. **Remember Me**: Checkbox trên login → 30-day cookie vs session cookie
4. **Login field**: `type="email"` → `type="text"`, label "Email/Username"
5. **Post-login redirect**: Admin → `/settings`, User → `/app`
6. **Vite proxy**: Thêm `server.proxy` để `/api` requests từ frontend đến đúng port 3001
7. **macOS ARM**: Fix native binary issues (rollup, lightningcss, tailwindcss-oxide)
