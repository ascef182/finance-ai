# Finance-AI — Progresso do Hardening (handoff)

> Documento de continuação. O projeto será movido de `F:` (exFAT) para um drive
> **NTFS (C:)** para eliminar os erros de `EPERM`/symlink. Este arquivo viaja
> junto com o repo. Plano completo original: `~/.claude/plans/laudo-de-avalia-o-wondrous-quilt.md`.

## Decisões do usuário
- Deploy alvo: **Vercel** (serverless).
- Postgres: **Neon** (pooled em runtime + direct para migrações).
- Rate limiting: **Upstash Redis**.
- Feature de **metas (Goal)**: implementar.
- Escopo: hardening completo (Blocos A + B + C).

---

## ✅ Bloco A — CONCLUÍDO (código). Verificado por `tsc` e `lint`.

| Item | Arquivo | Mudança |
|------|---------|---------|
| A1 vazamento de dados | `app/(home)/_actions/generate-ai-report/index.ts` | `findMany` agora filtra por `userId` |
| A2 datas hardcoded | mesmo arquivo | usa `getMonthDateRange(month)` de `app/_utils/date.ts` |
| A3 bypass de autorização | `app/_actions/upsert-transaction/index.ts` | `upsert` → `updateMany({id,userId})` + `create`; edição de transação alheia lança "Transaction not found" |
| A4 validação de env | `app/_lib/env.ts`, `instrumentation.ts`, `.env.example` (novos) | Zod valida no boot; Prisma usa `env.DATABASE_URL` |
| A5 headers de segurança | `next.config.mjs` | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP (Clerk/Stripe) |

**Extras já feitos (adiantando B/C):**
- `prisma/schema.prisma`: `@@index([userId, date])`, `@@index([userId, createdAt])` no `Transaction`; novo model `Goal` (id, userId, name, targetAmount, currentAmount, category?, deadline?, timestamps, `@@index([userId])`).
- `prisma.config.ts`: migrações usam `DIRECT_URL ?? DATABASE_URL`.
- `app/_lib/prisma.ts`: `pg.Pool` com `max: 1` em produção (serverless-safe).
- `eslint.config.mjs`: corrigida a regra `no-restricted-imports` (estava bloqueando `@/app/_lib/prisma` em TODO server action; agora liberada em `_actions/**`,`_data/**`,`_lib/**`,`api/**`) + `ignores` para lixo (`finance.ai/**`, `**/._*`, `.next/**`).
- `.npmrc`: `node-linker=hoisted` (necessário no exFAT; pode permanecer no NTFS sem dano).

**Status de verificação (ATUALIZADO — sessão NTFS em `D:`):** `tsc --noEmit` limpo; `pnpm lint` agora com **0 erros** (os 2 `require()` do `tailwind.config.ts` foram convertidos para import ESM) + warnings de import-sort (não bloqueiam CI); **`pnpm build` RODA LIMPO** no NTFS (9 rotas) — o bloqueio do exFAT foi eliminado. `pnpm test` (vitest) verde: 11 testes em 3 arquivos.

---

## Setup do ambiente (após mover para C:)
1. Node 26.2.0 (ok). `corepack` não vem no Node 26 → pnpm instalado global: `npm i -g pnpm@10.30.0`.
2. Instalar deps: na 1ª vez pode precisar `CI=true` (PowerShell: `$env:CI='true'; pnpm install`).
3. Rodar build/lint com `$env:CI='true'`.
4. No NTFS os `EPERM`/symlink somem; `node-linker=hoisted` pode ficar (inofensivo) ou ser removido.

## Ações pendentes do usuário (credenciais/infra)
- **Reorganizar `.env`** para o padrão Neon:
  - `DATABASE_URL` = string **pooled** do Neon (host com `-pooler`) — runtime.
  - `DIRECT_URL` = conexão **direta** do Neon — migrações.
  - (hoje: `NEONDATABASE_URL` tem a conexão Neon e `DATABASE_URL` aponta p/ Docker. Manter um `.env` de dev-local com Docker e um conjunto Neon para prod via env vars da Vercel.)
- Criar **Upstash Redis** → `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- (Bloco C) Criar **Sentry** → DSN/org/project.
- **Rotacionar todas as chaves** antes de produção.
- Limpeza de working tree (opcional, não rastreado pelo git): apagar `finance.ai/` (cópia paralela com `.git` próprio) e os ~2067 arquivos `._*` do macOS.

---

## ▶️ Próximos passos (retomar aqui)

### ✅ Migração + testes reais de isolamento — CONCLUÍDOS
- `docker compose up -d` + `pnpm exec prisma migrate dev --name security_indexes_and_goal` aplicados com sucesso (`20260605215228_security_indexes_and_goal`).
- `pnpm test:isolation` (script `scripts/test-isolation.ts`, roda direto contra o banco) → **12/12 testes passaram**: A1 (escopo de `findMany` por userId), A3 (edição cruzada bloqueada por `updateMany({id, userId})`), metas (delete cruzado bloqueado), B3 (paginação cursor sem repetição de itens).

## ✅ Bloco B — CONCLUÍDO (código, build verde)
- B1 índices: no schema (falta só rodar a migração — passo acima).
- B2 Neon pooling: suportado por schema/prisma.config/prisma.ts; reorg do `.env` (pooled + `DIRECT_URL`) é tarefa de infra do usuário.
- B3 **paginação cursor-based**: `app/_data/get-transactions/` + server action `app/transactions/_actions/load-more-transactions/` + wrapper client `app/transactions/_components/transactions-data-table.tsx` ("Carregar mais"). `transactions/page.tsx` agora pagina (20/página) em vez de carregar tudo.
- B4 **rate limiting**: `@upstash/ratelimit` + `@upstash/redis`; helper `app/_lib/ratelimit.ts` (degrada para "sempre permitir" sem Upstash). Aplicado em `generateAiReport` (cota mensal + cache de relatório no Redis, TTL 24h) e no webhook do Stripe (flood por IP → 429).

## ✅ Bloco C — CONCLUÍDO (exceto Sentry, adiado pelo usuário)
- C1 observabilidade: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/api/health/route.ts` (checa DB via `SELECT 1`). **Sentry ADIADO** (risco Next 16/Turbopack + precisa de DSN).
- C2 testes: `vitest` configurado (`vitest.config.ts`, `vitest.setup.ts`). 11 testes verdes cobrindo isolamento por `userId` de A1 (`generateAiReport`), A3 (`upsertTransaction`) e metas (`upsertGoal`). Playwright não incluído nesta rodada.
- C3 CI/CD: `.github/workflows/ci.yml` (install → prisma generate → lint → typecheck → test → build, com env fictício no build). Vercel: tarefa de infra do usuário.
- C4 metas: `app/goals/` (página + card com `@radix-ui/react-progress`), `app/_actions/upsert-goal/` (+ schema Zod) e `app/_actions/delete-goal/`, `app/_data/get-goals/` — todos escopados por `userId`. Link "Metas" na Navbar.
- Limpeza: `tailwind.config.ts` convertido de `require()` para import ESM (0 erros de lint).

## Tarefas (status)
- [x] A1+A2  [x] A3  [x] A4  [x] A5  (código verificado por tsc/lint/build; **falta só migrar + teste funcional**)
- [x] Bloco B  (B1 código pronto, falta migração)
- [x] Bloco C  (Sentry adiado; Playwright fora desta rodada)
