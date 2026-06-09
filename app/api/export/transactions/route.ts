import { auth } from "@clerk/nextjs/server";
import { TransactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_constants/transactions";
import { db } from "@/app/_lib/prisma";

const TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT: "Depósito",
  EXPENSE: "Despesa",
  INVESTMENT: "Investimento",
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year") ?? new Date().getFullYear().toString();

  let dateFilter = {};
  if (month && year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    dateFilter = { date: { gte: start, lt: end } };
  }

  const transactions = await db.transaction.findMany({
    where: { userId, ...dateFilter },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  const header = [
    "Data",
    "Nome",
    "Tipo",
    "Categoria",
    "Método de Pagamento",
    "Valor (R$)",
  ].join(";");
  const rows = transactions.map((t) => {
    const date = new Date(t.date).toLocaleDateString("pt-BR");
    const name = `"${t.name.replace(/"/g, '""')}"`;
    const type = TYPE_LABELS[t.type];
    const category = TRANSACTION_CATEGORY_LABELS[t.category];
    const paymentMethod = TRANSACTION_PAYMENT_METHOD_LABELS[t.paymentMethod];
    const amount = Number(t.amount).toFixed(2).replace(".", ",");
    return [date, name, type, category, paymentMethod, amount].join(";");
  });

  const csv = [header, ...rows].join("\r\n");
  const filename = month
    ? `transacoes-${year}-${String(month).padStart(2, "0")}.csv`
    : `transacoes-${year}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
