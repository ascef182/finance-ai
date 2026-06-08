import { auth } from "@clerk/nextjs/server";
import { TransactionType } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";

import { db } from "@/app/_lib/prisma";

import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";

export const getDashboard = async (month: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const year = new Date().getFullYear();
  const monthDate = new Date(year, Number(month) - 1, 1);

  const where = {
    userId,
    date: {
      gte: startOfMonth(monthDate),
      lt: endOfMonth(monthDate),
    },
  };

  const depositsTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: TransactionType.DEPOSIT },
        _sum: { amount: true },
      })
    )?._sum?.amount ?? 0,
  );
  const investmentsTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: TransactionType.INVESTMENT },
        _sum: { amount: true },
      })
    )?._sum?.amount ?? 0,
  );
  const expensesTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      })
    )?._sum?.amount ?? 0,
  );
  const balance = depositsTotal - investmentsTotal - expensesTotal;
  const transactionsTotal = depositsTotal + investmentsTotal + expensesTotal;

  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]:
      transactionsTotal > 0
        ? Math.round((depositsTotal / transactionsTotal) * 100)
        : 0,
    [TransactionType.EXPENSE]:
      transactionsTotal > 0
        ? Math.round((expensesTotal / transactionsTotal) * 100)
        : 0,
    [TransactionType.INVESTMENT]:
      transactionsTotal > 0
        ? Math.round((investmentsTotal / transactionsTotal) * 100)
        : 0,
  };

  const totalExpensePerCategory: TotalExpensePerCategory[] = (
    await db.transaction.groupBy({
      by: ["category"],
      where: {
        ...where,
        type: TransactionType.EXPENSE,
      },
      _sum: {
        amount: true,
      },
    })
  ).map((category) => ({
    category: category.category,
    totalAmount: Number(category._sum.amount),
    percentageOfTotal:
      expensesTotal > 0
        ? Math.round((Number(category._sum.amount) / expensesTotal) * 100)
        : 0,
  }));

  const lastTransactions = (
    await db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: 15,
    })
  ).map((t) => ({ ...t, amount: Number(t.amount) }));

  return {
    balance,
    depositsTotal,
    investmentsTotal,
    expensesTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions,
  };
};
