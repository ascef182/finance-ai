"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/app/_lib/prisma";

const addToGoalSchema = z.object({
  goalId: z.string().min(1),
  amount: z.number().positive(),
});

export const addToGoal = async (params: { goalId: string; amount: number }) => {
  addToGoalSchema.parse(params);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const goal = await db.goal.findFirst({
    where: { id: params.goalId, userId },
    select: { targetAmount: true, currentAmount: true },
  });
  if (!goal) throw new Error("Goal not found");

  const newAmount = Math.min(
    Number(goal.currentAmount) + params.amount,
    Number(goal.targetAmount),
  );

  await db.goal.update({
    where: { id: params.goalId },
    data: { currentAmount: newAmount },
  });

  revalidatePath("/goals");
};
