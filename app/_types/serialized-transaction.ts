import { Transaction } from "@prisma/client";

export type SerializedTransaction = Omit<Transaction, "amount"> & {
  amount: number;
};
