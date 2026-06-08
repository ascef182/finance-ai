import { auth } from "@clerk/nextjs/server";

import { db } from "@/app/_lib/prisma";
import { SerializedTransaction } from "@/app/_types/serialized-transaction";

export const TRANSACTIONS_PAGE_SIZE = 20;

export interface GetTransactionsParams {
  /** id da última transação da página anterior; ausente = primeira página. */
  cursor?: string;
  take?: number;
}

export interface GetTransactionsResult {
  transactions: SerializedTransaction[];
  /** id para a próxima página, ou null quando não há mais resultados. */
  nextCursor: string | null;
}

/**
 * Busca as transações do usuário autenticado em páginas (cursor-based), em vez
 * de carregar a tabela inteira. Ordena por data desc (e id como desempate, que
 * também serve de cursor estável e único).
 */
export const getTransactions = async ({
  cursor,
  take = TRANSACTIONS_PAGE_SIZE,
}: GetTransactionsParams = {}): Promise<GetTransactionsResult> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Pedimos um item a mais para saber se existe próxima página sem um count().
  const rows = await db.transaction.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > take;
  const sliced = hasMore ? rows.slice(0, take) : rows;
  const transactions = sliced.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }));
  const nextCursor = hasMore ? transactions[transactions.length - 1].id : null;

  return { transactions, nextCursor };
};
