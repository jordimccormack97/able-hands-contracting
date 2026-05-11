# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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

## Artifacts

### Handyman Contracting Site (`artifacts/handyman-site`)
- **Type**: React + Vite (frontend-only, no backend)
- **Preview path**: `/`
- **Description**: Single-page landing site for Able Home Services (Jordi McCormack) — handyman and contracting services
- **Features**:
  - Responsive desktop + mobile design
  - QR code landing mode (`?src=qr`) for flyers/business cards
  - Sticky mobile CTA bar (Book Now / Estimate)
  - Sections: Hero, Value Pillars, About, Services, Past Work, What to Expect, Contact
  - Calendly integration via external link buttons
  - **Simple request estimate form**:
    - Required: Full Name, Email, Phone, ZIP Code, Service Type, Project Summary
    - Hidden source attribution from URL `?src=qr`
    - No measurement panels in the public form
  - Spam protection: IP rate limiting (5/min), per-email throttling (3/15min), honeypot field
  - SMTP email notifications for new estimate requests (subject: "New Able Home Services Lead — {Service} — {ZIP}")
  - **Admin panel** at `/admin` for lead management
- **Images**: Owner portrait and 6 AI-generated project photos in `public/images/`
- **Key constants** (in `App.tsx`): `CALENDLY_URL`, `PHONE`, `EMAIL`, `SERVICE_AREA`
- **Styling**: Tailwind CSS v4, Inter font, warm cream palette (#f5f2ec)
- **Custom components**: Simplified Button (rounded-full, 3 variants) and Card components

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/api-server run test` — run API server unit/integration tests (vitest)

## Testing

- **Framework**: vitest (in `artifacts/api-server`)
- **Test files**:
  - `src/lib/rate-limit.test.ts` — unit tests for `checkRateLimit` and `pruneStore` pure functions
  - `src/routes/contact.test.ts` — unit + integration tests for IP/email rate limiting, honeypot spam protection, and POST /api/contact route behavior (uses supertest)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Email Notifications (Contact Form)

To enable email notifications for contact form submissions, set these secrets:

- `SMTP_HOST` — SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
- `SMTP_PORT` — SMTP port (e.g., `587` for TLS, `465` for SSL)
- `SMTP_USER` — SMTP username/email
- `SMTP_PASS` — SMTP password or app-specific password
- `NOTIFY_EMAIL` — Email address to receive submission notifications

If not configured, submissions still save to the database but no email is sent.

## Rate Limit Configuration

Contact form rate limits are configurable via environment variables. All are optional — sensible defaults apply when unset.

| Variable | Description | Default |
|---|---|---|
| `IP_RATE_WINDOW_MS` | Time window for per-IP rate limiting (milliseconds) | `60000` (1 minute) |
| `IP_RATE_MAX` | Max requests per IP within the window | `5` |
| `EMAIL_RATE_WINDOW_MS` | Time window for per-email rate limiting (milliseconds) | `900000` (15 minutes) |
| `EMAIL_RATE_MAX` | Max requests per email within the window | `3` |
| `ADMIN_RATE_WINDOW_MS` | Time window for admin API per-IP rate limiting (milliseconds) | `60000` (1 minute) |
| `ADMIN_RATE_MAX` | Max admin API requests per IP within the window | `10` |

## Admin Panel

- **URL**: `/admin`
- **Protection**: Session-based authentication using `ADMIN_KEY` secret (set in Replit Secrets, current placeholder: `12345` — change before production)
- **Auth flow**: Admin key is verified via `POST /api/admin/login`, which issues an httpOnly session cookie
- **Session**: Database-backed session store (PostgreSQL `admin_sessions` table) with configurable TTL (default 1 hour). Sessions survive server restarts.
- **API endpoints** (all require valid session cookie):
  - `POST /api/admin/login` — verify admin key, set session cookie
  - `POST /api/admin/logout` — clear session
  - `GET /api/admin/session` — check if session is valid
  - `GET /api/admin/health` — operational health check
  - `GET /api/admin/submissions?search=&status=&serviceType=&zip=&source=` — list/filter leads
  - `PATCH /api/admin/submissions/:id/status` — update lead status
  - `PATCH /api/admin/submissions/:id/notes` — update internal notes
  - `DELETE /api/admin/submissions/:id` — permanently delete a lead
- **Lead statuses**: `new`, `contacted`, `consultation_scheduled`, `estimate_sent`, `won`, `lost`, `archived`
- **Features**: Expandable lead cards, contact details, project summary, inline notes editing, status management, search/filter by status/service type, delete with confirmation
- **Key files**: `artifacts/api-server/src/routes/admin.ts`, `artifacts/handyman-site/src/pages/AdminPage.tsx`, `lib/db/src/schema/contactSubmissions.ts`

## Object Storage

Object storage support exists in the backend but is not used by the simplified public estimate form. Keep the storage routes only if photo/file uploads are added back later.

## Database Schema

### `contact_submissions` table
Core public-form fields: id, name, email, phone, zipCode, serviceType, projectSummary, source, status, notes, createdAt, updatedAt. The table also keeps optional legacy columns for future use.

### `rate_limits` table
Rate limiting state: category, key, hit_at

### `admin_sessions` table
Admin session store: sid, data, expires_at
