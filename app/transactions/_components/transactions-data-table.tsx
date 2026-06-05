"use client";

import { Transaction } from "@prisma/client";
import { useState, useTransition } from "react";

import { Button } from "@/app/_components/ui/button";
import { DataTable } from "@/app/_components/ui/data-table";

import { loadMoreTransactions } from "../_actions/load-more-transactions";
import { transactionColumns } from "../_columns";

interface TransactionsDataTableProps {
  initialTransactions: Transaction[];
  initialCursor: string | null;
}

const TransactionsDataTable = ({
  initialTransactions,
  initialCursor,
}: TransactionsDataTableProps) => {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadMoreTransactions(cursor);
      setTransactions((prev) => [...prev, ...result.transactions]);
      setCursor(result.nextCursor);
    });
  };

  return (
    <div className="space-y-4">
      <DataTable columns={transactionColumns} data={transactions} />
      {cursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionsDataTable;
