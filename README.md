# Finance AI — AI-Powered Personal Finance Manager

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)

**Full-stack SaaS with AI-generated financial reports, Stripe subscriptions, and production-grade security hardening.**

[Features](#key-features) · [Tech Stack](#tech-stack) · [Architecture](#architecture) · [Getting Started](#getting-started) · [Security](#security--hardening)

</div>

---

## Overview

Finance AI is a full-stack personal finance management platform that combines real-time dashboards, automated AI reporting, and a freemium subscription model into a production-ready SaaS application.

Users track income, expenses, and investments through an interactive dashboard with Recharts visualisations. A **GPT-4o-mini powered report engine** analyses their transaction history and delivers personalised financial insights on demand — gated behind a Stripe Premium subscription. Financial goals can be created with target amounts, deadlines, and a live progress bar.

The entire backend was put through a **three-block security and scalability hardening cycle**: row-level data isolation, cursor-based pagination, Upstash Redis rate limiting and caching, Zod-validated environment variables, and HTTP security headers — turning a prototype into a system ready for real users.

---

## Key Features

- **AI Financial Reports** — GPT-4o-mini analyses user transactions by month and returns personalised insights. Reports are cached in Redis (24h TTL) and rate-limited (10 per month/user) to protect LLM quota.
- **Interactive Dashboard** — Monthly overview cards (income, expenses, investments, balance), a Recharts pie chart by category, and a last-transactions panel — all filterable by month via URL search params.
- **Freemium + Stripe Subscriptions** — Free plan allows up to 10 transactions/month. Premium (R$19/mo) unlocks unlimited transactions and AI reports. Stripe webhooks sync subscription state to Clerk user metadata.
- **Savings Goals** — Create goals with name, target/current amount, optional category and deadline. Progress visualised with a `@radix-ui/react-progress` bar. Full CRUD, all data isolated by user.
- **Cursor-Based Pagination** — Transaction list loads 20 rows at a time via a "Load more" server action — no full-table scans regardless of history size.
- **Production Security Hardening** — Per-user data isolation enforced at the query layer, strict environment validation at boot, and HTTP security headers (HSTS, CSP, X-Frame-Options, Permissions-Policy).
- **Full Auth Flow** — Clerk-powered login with persistent sessions, public/private route protection via Next.js middleware.

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | SSR, server actions, API routes |
| Language | TypeScript 5.9 (strict mode) | End-to-end type safety |
| Styling | Tailwind CSS + shadcn/ui | Design system, accessible components |
| Database | PostgreSQL (Neon serverless) | Primary data store |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Type-safe queries, migrations |
| Auth | Clerk | Authentication, user metadata |
| Payments | Stripe | Subscriptions, webhooks, customer portal |
| AI | OpenAI GPT-4o-mini via Vercel AI SDK | Financial report generation |
| Caching / Rate Limiting | Upstash Redis | Report cache (TTL 24h), request rate limiting |
| Charts | Recharts | Dashboard visualisations |
| Forms | React Hook Form + Zod | Validated form inputs |
| Testing | Vitest + custom integration suite | Unit + DB isolation tests |
| CI/CD | GitHub Actions + Vercel | Automated pipeline, preview + production deploys |
| Package Manager | pnpm 10 | Enforced via `only-allow` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App Router                    │
│                                                              │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Dashboard  │  │  Transactions   │  │  Goals / Sub    │  │
│  │  (SSR page) │  │  (paginated)    │  │  (SSR pages)    │  │
│  └──────┬──────┘  └────────┬────────┘  └────────┬────────┘  │
│         │                  │                     │           │
│  ┌──────▼──────────────────▼─────────────────────▼────────┐  │
│  │            Server Actions  (_actions/*/)               │  │
│  │  auth() → userId isolation → Zod validation → Prisma  │  │
│  └──────────────────────────┬──────────────────────────────┘ │
│                             │                                 │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │          Data Layer  (_data/*/, _lib/prisma.ts)         │  │
│  │  pg.Pool (max:1 in prod) → PrismaClient (adapter-pg)   │  │
│  └──────────────────────────┬──────────────────────────────┘  │
└─────────────────────────────│────────────────────────────────┘
                              │
         ┌────────────────────┼──────────────────────┐
         │                    │                       │
   ┌─────▼──────┐    ┌────────▼───────┐   ┌─────────▼────────┐
   │ PostgreSQL  │    │  Upstash Redis  │   │  OpenAI / Clerk  │
   │ (Neon pool) │    │ (cache + limit) │   │  Stripe APIs     │
   └─────────────┘    └────────────────┘   └──────────────────┘
```

**Key conventions:**
- `_actions/` — Next.js Server Actions, always `"use server"`, always auth-checked + Zod-validated before DB access.
- `_data/` — async server-side data fetching for Server Components. Every function calls `auth()` and scopes queries by `userId`.
- `_lib/` — shared singletons: `prisma.ts` (pooled PrismaClient), `env.ts` (Zod-validated env at boot), `ratelimit.ts` (Upstash helpers with graceful degradation).
- `_components/ui/` — shadcn/ui primitives, treated as library code.

---

## Security & Hardening

The application underwent a structured three-block hardening process after initial development:

### Block A — Data Isolation & Auth
| Item | Implementation |
|---|---|
| **Row-level isolation** | Every `findMany`, `updateMany`, and `deleteMany` is scoped by `{ userId }` — cross-user data access is structurally impossible. |
| **Auth bypass prevention** | `updateMany({ where: { id, userId } })` pattern: editing another user's resource silently returns `count: 0` → throws `"not found"`. |
| **Hardcoded date fix** | Dashboard date ranges computed via `getMonthDateRange(month)` — previously a hardcoded year and `day: 31` caused wrong results in short months. |
| **Environment validation** | `app/_lib/env.ts` runs Zod `safeParse` at boot. Missing or malformed vars produce a descriptive error before any request is served. |
| **Security headers** | `next.config.mjs` injects HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a CSP tuned for Clerk and Stripe origins. |

### Block B — Scalability
| Item | Implementation |
|---|---|
| **DB indexes** | `@@index([userId, date])` and `@@index([userId, createdAt])` on `Transaction`; `@@index([userId])` on `Goal` — supports fast per-user time-range queries. |
| **Serverless pooling** | `pg.Pool(max: 1)` in production prevents connection exhaustion under Vercel concurrency. Neon's PgBouncer handles true connection pooling. |
| **Cursor pagination** | `getTransactions()` uses a `take + 1` probe pattern with stable `(date desc, id desc)` ordering. `TransactionsDataTable` accumulates pages client-side via a "Load more" server action. |
| **Rate limiting** | Upstash Redis sliding/fixed-window limiters with graceful degradation (no-op if `UPSTASH_*` env vars are absent). Applied to AI reports (10/30d/user) and Stripe webhook (20req/10s/IP → 429). |
| **AI report caching** | Generated reports cached in Redis with 24h TTL, keyed by `userId + year + month`. A cache hit is free; only a miss consumes LLM quota. |

### Block C — Observability & Quality
| Item | Implementation |
|---|---|
| **Error boundaries** | `app/error.tsx` + `app/global-error.tsx` catch render errors with a "Try again" reset action. Console logging is Sentry-ready (DSN optional). |
| **Health endpoint** | `GET /api/health` runs `SELECT 1` and returns `{ status, db }` — suitable for Vercel uptime checks and load-balancer probes. |
| **Unit tests** | 11 Vitest tests covering `generateAiReport` (A1 data scoping), `upsertTransaction` (A3 cross-user block), `upsertGoal` — zero DB dependency. |
| **Integration tests** | `pnpm test:isolation` runs 12 tests against live Postgres, verifying cross-user data isolation and cursor pagination correctness end-to-end. |
| **CI pipeline** | GitHub Actions: `install → prisma generate → lint → tsc → vitest → next build` on every push and PR. |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20 (tested on 22 and 26)
- pnpm 10 — `npm i -g pnpm@10`
- Docker Desktop (for local Postgres) **or** a [Neon](https://neon.tech) project
- A [Clerk](https://clerk.com) application
- A [Stripe](https://stripe.com) account with a Premium plan price configured

### Installation

```bash
# 1. Clone
git clone https://github.com/ascef182/finance-ai.git
cd finance-ai

# 2. Install (pnpm is enforced — npm/yarn are blocked)
pnpm install

# 3. Configure environment
cp .env.example .env
# Fill in all required variables (see Environment Variables section)

# 4. Start local Postgres (skip if using Neon)
docker compose up -d

# 5. Apply migrations and generate Prisma Client
pnpm setup
# Equivalent to: pnpm install && prisma generate && prisma migrate dev
```

### Development

```bash
pnpm dev          # Next.js + Turbopack at http://localhost:3000
pnpm dev:full     # Validates Prisma schema first, then starts dev server
```

### Other Scripts

```bash
pnpm build               # Production build
pnpm lint                # ESLint
pnpm test                # Vitest unit tests (no DB required)
pnpm test:isolation      # Integration tests (requires DATABASE_URL)
pnpm exec prisma studio  # Visual DB browser at http://localhost:5555
pnpm exec prisma migrate dev --name <name>  # Create a new migration
```

---

## Environment Variables

Copy `.env.example` to `.env`. All variables are validated by Zod at application startup — the app fails fast with a descriptive error if any required variable is missing.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. Use Neon's **pooled** (`-pooler`) endpoint in production. |
| `DIRECT_URL` | Prod only | Neon **direct** (non-pooled) URL used by Prisma migrations. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend secret key |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key |
| `STRIPE_PREMIUM_PLAN_PRICE_ID` | ✅ | Stripe Price ID for the Premium plan |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key |
| `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` | ✅ | URL of the Stripe customer portal |
| `OPENAI_API_KEY` | Optional | Without this key, AI reports return a rich demo response. |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash REST URL. Rate limiting and caching silently degrade to no-op without it. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash auth token. |

---

## Project Structure

```
finance-ai/
├── app/
│   ├── (home)/              # Dashboard — summary cards, charts, AI report
│   │   ├── _actions/        # generateAiReport (rate-limited, Redis-cached)
│   │   └── _components/     # SummaryCards, PieChart, LastTransactions
│   ├── _actions/            # upsertTransaction, upsertGoal, deleteGoal
│   ├── _components/         # Shared components (Navbar, dialogs, inputs)
│   │   └── ui/              # shadcn/ui primitives (library code)
│   ├── _constants/          # Enum → label/icon maps
│   ├── _data/               # Server-side data fetching (always userId-scoped)
│   ├── _lib/                # prisma.ts · env.ts · ratelimit.ts · utils.ts
│   ├── _utils/              # Pure helpers (getMonthDateRange)
│   ├── api/
│   │   ├── health/          # GET /api/health — DB connectivity probe
│   │   └── webhooks/stripe/ # POST — Stripe event handler (rate-limited)
│   ├── goals/               # Savings goals page + CRUD components
│   ├── subscription/        # Plan comparison + Stripe checkout trigger
│   ├── transactions/        # Cursor-paginated transaction table
│   ├── error.tsx            # Route-level error boundary
│   ├── global-error.tsx     # Root layout error boundary
│   └── not-found.tsx        # Branded 404 page
├── prisma/
│   ├── schema.prisma        # Transaction (compound-indexed) + Goal models
│   ├── prisma.config.ts     # DIRECT_URL override for migrations
│   └── migrations/          # 3 applied migrations
├── scripts/
│   └── test-isolation.ts    # 12-test integration suite against live DB
├── .github/
│   └── workflows/ci.yml     # CI: lint → tsc → test → build
├── vitest.config.ts
├── vitest.setup.ts
└── .env.example
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns `{ status: "ok", db: "up" }`. DB unreachable → 503. |
| `POST` | `/api/webhooks/stripe` | Stripe signature | Handles `invoice.paid` and `customer.subscription.deleted` events. Rate-limited at 20 req/10s per IP. |

All data mutations use **Next.js Server Actions** (not REST routes), keeping authentication, validation, and business logic co-located in the same function.

---

## Testing

```bash
# Unit tests — fully mocked, no DB, runs in <10s
pnpm test

# Integration tests — requires a running Postgres (DATABASE_URL)
pnpm test:isolation
```

| Suite | Tests | Coverage |
|---|---|---|
| `generate-ai-report/index.test.ts` | 3 | userId data scoping (A1), premium gate, Unauthorized guard |
| `upsert-transaction/index.test.ts` | 4 | Cross-user edit blocked (A3), own-edit success, create userId injection |
| `upsert-goal/index.test.ts` | 4 | Same isolation pattern applied to the Goals model |
| `scripts/test-isolation.ts` | 12 | Live DB: A1 scoping, A3 cross-edit, goal delete isolation, cursor pagination |

---

## CI/CD

Every push and pull request triggers the GitHub Actions pipeline (`.github/workflows/ci.yml`):

```
pnpm install --frozen-lockfile
  → prisma generate
  → pnpm lint          (ESLint — must be 0 errors)
  → tsc --noEmit       (TypeScript strict — must be clean)
  → pnpm test          (Vitest — 11 tests must pass)
  → pnpm build         (Next.js production build)
```

Vercel auto-deploys Preview environments on pull requests and promotes to Production on merge to `main`.

---

## Roadmap

- [ ] **Sentry integration** — error tracking + performance monitoring (currently deferred due to Next.js 16 / Turbopack compatibility)
- [ ] **Playwright E2E tests** — full auth flow, transaction creation, Stripe checkout
- [ ] **Goal auto-sync** — link goal categories to transaction feed and update `currentAmount` automatically
- [ ] **Multi-currency support** — exchange rate API integration
- [ ] **Export to CSV/PDF** — downloadable transaction history and monthly reports

---

## License

MIT © [ascef182](https://github.com/ascef182)
