import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import { getTransactions } from "../_data/get-transactions";
import ExportCsvButton from "./_components/export-csv-button";
import TransactionsDataTable from "./_components/transactions-data-table";

const TransactionsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }
  const { transactions, nextCursor } = await getTransactions();
  const userCanAddTransaction = await canUserAddTransaction();
  return (
    <>
      <Navbar />
      <div className="space-y-6 p-6">
        {/* TÍTULO E BOTÃO */}
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>
          <div className="flex items-center gap-3">
            <ExportCsvButton />
            <AddTransactionButton
              userCanAddTransaction={userCanAddTransaction}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-md">
          <TransactionsDataTable
            initialTransactions={transactions}
            initialCursor={nextCursor}
          />
        </div>
      </div>
    </>
  );
};

export default TransactionsPage;
