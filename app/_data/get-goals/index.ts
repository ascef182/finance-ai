import { auth } from "@clerk/nextjs/server";
import { Goal } from "@prisma/client";

import { db } from "@/app/_lib/prisma";

export const getGoals = async (): Promise<Goal[]> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return db.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};
