"use server";

import {
  getTransactions,
  GetTransactionsResult,
} from "@/app/_data/get-transactions";

/**
 * Server action chamada pelo botão "Carregar mais" no cliente. A autorização
 * (escopo por userId) é garantida dentro de getTransactions.
 */
export const loadMoreTransactions = async (
  cursor: string,
): Promise<GetTransactionsResult> => {
  return getTransactions({ cursor });
};
