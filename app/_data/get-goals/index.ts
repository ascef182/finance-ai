import { auth } from "@clerk/nextjs/server";

import { db } from "@/app/_lib/prisma";

export const getGoals = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const goals = await db.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return goals.map((goal) => ({
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
  }));
};
