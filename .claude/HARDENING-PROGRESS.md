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

**Status de verificação:** `tsc --noEmit` limpo; `pnpm lint` só com 2 erros pré-existentes (`require()` em `tailwind.config.ts`) + warnings de import-sort. `pnpm build` AINDA NÃO rodou limpo (bloqueado pelo dev server + exFAT — resolver após mover para C:).

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

### Fechar verificação do Bloco A
1. Parar qualquer `pnpm dev`, limpar `.next`, rodar `$env:CI='true'; pnpm build`.
2. `pnpm exec prisma migrate dev --name security_indexes_and_goal` (precisa de DB acessível) para aplicar índices + model `Goal`.
3. Teste funcional de isolamento: 2 usuários; cada relatório de IA só com as próprias transações; tentar editar transação de outro usuário → rejeitado.

### Bloco B — escala (Vercel/Neon)
- B1 índices: já no schema, falta migrar (passo acima).
- B2 Neon pooling: `.env` (pooled+direct) já suportado por schema/prisma.config/prisma.ts.
- B3 **paginação cursor-based**: criar `app/_data/get-transactions/` (escopado por `userId`, `take`+`cursor`) e ajustar `app/transactions/page.tsx` + `DataTable` (hoje carrega TODAS as transações).
- B4 **rate limiting**: `pnpm add @upstash/ratelimit @upstash/redis`; helper `app/_lib/ratelimit.ts`; aplicar em server actions, em especial `generateAiReport` (cota mensal/usuário + cache do relatório no Redis com TTL) e no webhook do Stripe.

### Bloco C — operação/qualidade
- C1 `@sentry/nextjs` + logging; `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`; `app/api/health/route.ts` (checa DB).
- C2 testes: `vitest` + `@testing-library/react` (cobrir isolamento por `userId` de A1/A3); `playwright` (auth, criar transação, checkout).
- C3 CI/CD: GitHub Actions (lint → typecheck → build → test) + Vercel Preview/Prod; separar ambientes via env vars do projeto Vercel.
- C4 metas: model `Goal` já no schema; falta `app/goals/` (página + Navbar), `app/_actions/upsert-goal/` (+schema Zod) e `app/_data/get-goals/`, todos escopados por `userId`; UI com `@radix-ui/react-progress`.
- Limpeza extra: `tailwind.config.ts` usa `require()` (2 erros de lint) — converter para import ou override no eslint.

## Tarefas (status)
- [x] A1+A2  [x] A3  [x] A4  [x] A5  (código; build final pendente)
- [ ] Bloco B  [ ] Bloco C
