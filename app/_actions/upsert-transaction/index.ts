"use server";

import { auth } from "@clerk/nextjs/server";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/app/_lib/prisma";

import { upsertTransactionSchema } from "./schema";

interface UpsertTransactionParams {
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  upsertTransactionSchema.parse(params);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const { id, ...data } = params;
  if (id) {
    // Atualização escopada por dono: updateMany filtra por { id, userId }, então
    // tentar editar a transação de outro usuário simplesmente não altera nada (count 0).
    const { count } = await db.transaction.updateMany({
      where: { id, userId },
      data: { ...data, userId },
    });
    if (count === 0) {
      throw new Error("Transaction not found");
    }
  } else {
    await db.transaction.create({
      data: { ...data, userId },
    });
  }
  revalidatePath("/transactions");
};
