"use server";

import { auth } from "@clerk/nextjs/server";
import { TransactionCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/app/_lib/prisma";

import { upsertGoalSchema } from "./schema";

interface UpsertGoalParams {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  category?: TransactionCategory | null;
  deadline?: Date | null;
}

export const upsertGoal = async (params: UpsertGoalParams) => {
  upsertGoalSchema.parse(params);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const { id, ...data } = params;
  if (id) {
    // Mesma proteção de dono de upsertTransaction: updateMany por { id, userId }
    // garante que ninguém edite a meta de outro usuário.
    const { count } = await db.goal.updateMany({
      where: { id, userId },
      data: { ...data, userId },
    });
    if (count === 0) {
      throw new Error("Goal not found");
    }
  } else {
    await db.goal.create({
      data: { ...data, userId },
    });
  }
  revalidatePath("/goals");
};
