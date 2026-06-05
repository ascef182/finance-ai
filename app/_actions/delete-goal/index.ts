"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { db } from "@/app/_lib/prisma";

export const deleteGoal = async (id: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  // deleteMany escopado por userId: apagar a meta de outro usuário não afeta nada.
  await db.goal.deleteMany({
    where: { id, userId },
  });
  revalidatePath("/goals");
};
