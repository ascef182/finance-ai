/**
 * Teste de isolamento de dados por userId (Fase 1 — Bloco A).
 *
 * Roda direto contra o banco local (DATABASE_URL); não precisa do servidor
 * Next.js. Executa com:
 *   pnpm test:isolation
 *
 * O script cria dados de teste, verifica o isolamento e limpa tudo ao final.
 */

import { config } from "dotenv";
config(); // carrega .env antes de qualquer acesso a process.env

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const USER_A = "test-isolation-user-A";
const USER_B = "test-isolation-user-B";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✔ ${label}`);
    passed++;
  } else {
    console.error(`  ✘ FALHOU: ${label}`);
    failed++;
  }
}

async function cleanup() {
  await db.goal.deleteMany({ where: { userId: { in: [USER_A, USER_B] } } });
  await db.transaction.deleteMany({
    where: { userId: { in: [USER_A, USER_B] } },
  });
}

async function seedTransactions() {
  const base = {
    type: "EXPENSE" as const,
    category: "FOOD" as const,
    paymentMethod: "PIX" as const,
    date: new Date(),
    amount: 100,
  };
  const txA = await db.transaction.create({
    data: { ...base, name: "Tx de A", userId: USER_A },
  });
  const txB = await db.transaction.create({
    data: { ...base, name: "Tx de B", userId: USER_B },
  });
  return { txA, txB };
}

async function seedGoals() {
  const goalA = await db.goal.create({
    data: { name: "Meta A", targetAmount: 1000, userId: USER_A },
  });
  const goalB = await db.goal.create({
    data: { name: "Meta B", targetAmount: 2000, userId: USER_B },
  });
  return { goalA, goalB };
}

async function main() {
  console.log("\n=== Teste de Isolamento por userId (Bloco A) ===\n");
  await cleanup();

  const { txA, txB } = await seedTransactions();
  const { goalA, goalB } = await seedGoals();

  // ── A1: relatório de IA — findMany escopado por userId ─────────────────────
  console.log("A1 — Escopo de transações por userId:");
  const txsDoUsuarioA = await db.transaction.findMany({
    where: { userId: USER_A },
  });
  assert(
    txsDoUsuarioA.every((t) => t.userId === USER_A),
    "findMany só retorna transações de USER_A",
  );
  assert(
    !txsDoUsuarioA.some((t) => t.id === txB.id),
    "Tx de USER_B não aparece para USER_A",
  );

  // ── A3: upsertTransaction — updateMany escopado por { id, userId } ──────────
  console.log("\nA3 — Proteção de edição cruzada:");

  // USER_A tenta editar a transação de USER_B → count deve ser 0
  const crossEdit = await db.transaction.updateMany({
    where: { id: txB.id, userId: USER_A },
    data: { name: "VIOLADO" },
  });
  assert(
    crossEdit.count === 0,
    "USER_A não consegue editar tx de USER_B (count === 0)",
  );

  // Confirma que a tx de B não foi alterada
  const txBCheck = await db.transaction.findUnique({ where: { id: txB.id } });
  assert(
    txBCheck?.name === "Tx de B",
    "Tx de B permanece intacta após tentativa de edição",
  );

  // USER_A edita a própria transação → deve funcionar
  const ownEdit = await db.transaction.updateMany({
    where: { id: txA.id, userId: USER_A },
    data: { name: "Tx A Atualizada" },
  });
  assert(
    ownEdit.count === 1,
    "USER_A consegue editar a própria tx (count === 1)",
  );

  // ── Goals: deleteMany escopado por userId ────────────────────────────────────
  console.log("\nMetas — Proteção de delete cruzado:");

  const crossDelete = await db.goal.deleteMany({
    where: { id: goalB.id, userId: USER_A },
  });
  assert(crossDelete.count === 0, "USER_A não consegue deletar meta de USER_B");

  const goalBStillExists = await db.goal.findUnique({
    where: { id: goalB.id },
  });
  assert(goalBStillExists !== null, "Meta de USER_B permanece intacta");

  const ownDelete = await db.goal.deleteMany({
    where: { id: goalA.id, userId: USER_A },
  });
  assert(ownDelete.count === 1, "USER_A deleta a própria meta com sucesso");

  // ── Paginação cursor-based ────────────────────────────────────────────────
  console.log("\nB3 — Paginação cursor-based:");

  // Insere 5 transações para USER_A
  for (let i = 1; i <= 5; i++) {
    await db.transaction.create({
      data: {
        name: `Pag-${i}`,
        type: "EXPENSE",
        category: "OTHER",
        paymentMethod: "CASH",
        date: new Date(2026, 0, i),
        amount: i * 10,
        userId: USER_A,
      },
    });
  }

  // Página 1: take=3
  const page1 = await db.transaction.findMany({
    where: { userId: USER_A },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: 3 + 1,
  });
  const hasMore = page1.length > 3;
  const firstPage = page1.slice(0, 3);
  assert(firstPage.length === 3, "Página 1 contém 3 itens");
  assert(hasMore, "Flag hasMore detectada corretamente (>3 itens existem)");

  const cursor = firstPage[firstPage.length - 1].id;
  const page2 = await db.transaction.findMany({
    where: { userId: USER_A },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: 3 + 1,
    cursor: { id: cursor },
    skip: 1,
  });
  assert(page2.length > 0, "Página 2 retorna resultados via cursor");
  assert(
    !page2.some((t) => firstPage.some((p) => p.id === t.id)),
    "Página 2 não repete itens da página 1",
  );

  // ── Sumário ─────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Resultado: ${passed} passaram, ${failed} falharam`);

  await cleanup();
  await db.$disconnect();
  await pool.end();

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
