# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start PostgreSQL (required before dev)
docker compose up -d

# Install and set up DB (first time)
pnpm setup           # install + prisma generate + prisma migrate dev

# Development
pnpm dev             # Next.js with Turbo
pnpm dev:full        # healthcheck (prisma validate + generate) then dev

# Build & lint
pnpm build
pnpm lint

# DB utilities
pnpm healthcheck     # prisma validate + generate
pnpm exec prisma studio   # GUI for the database
pnpm exec prisma migrate dev --name <migration_name>
```

**Package manager is pnpm (enforced). Do not use npm or yarn.**

## Architecture

This is a **Next.js App Router** personal finance app (UI is in Portuguese). Key layers:

### Route structure
- `app/(home)/` — Dashboard: summary cards, pie chart, expenses by category, last 15 transactions. Filtered by `?month=MM` search param.
- `app/transactions/` — Full transactions table with TanStack Table.
- `app/subscription/` — Freemium plan comparison (Basic vs Premium R$19/mo).
- `app/login/` — Clerk-powered auth page.

### Convention: `_` prefix means private/co-located
- `_actions/` — Next.js Server Actions (`"use server"`). Always validate with Zod schema before DB access.
- `_components/ui/` — shadcn/ui primitives (treat as library code).
- `_components/` — shared app components (Navbar, dialogs, inputs).
- `_constants/` — enum-to-label/icon maps for `TransactionType`, `TransactionCategory`, `TransactionPaymentMethod`.
- `_data/` — async data-fetching functions called from Server Components. Each checks auth via Clerk before querying.
- `_lib/prisma.ts` — Prisma singleton (`db` export). Use `db` everywhere.
- `_utils/` — pure utility helpers.

### Auth pattern
Every server action and data function checks auth the same way:
```ts
const { userId } = await auth(); // from @clerk/nextjs/server
if (!userId) throw new Error("Unauthorized");
```

### Subscription model
- **Free plan**: max 10 transactions per month. Enforced by checking `getCurrentMonthTransactions()` count before allowing upsert.
- **Premium plan**: unlimited transactions + AI reports. Activated via Stripe checkout session.
- Plan state lives in **Clerk `publicMetadata.subscriptionPlan`** (`"premium"` = active). Stripe webhook updates this metadata on subscription events.

### AI reports
Generated with the Vercel AI SDK (`ai` package) using Google or OpenAI providers. The report action passes dashboard data as context to the model.

### Key env vars needed
- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_PREMIUM_PLAN_PRICE_ID` / `STRIPE_WEBHOOK_SECRET`
- AI provider keys (Google or OpenAI)
