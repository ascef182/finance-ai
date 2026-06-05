import { TransactionCategory } from "@prisma/client";
import { z } from "zod";

export const upsertGoalSchema = z.object({
  name: z.string().trim().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  category: z.nativeEnum(TransactionCategory).nullish(),
  deadline: z.date().nullish(),
});

export type UpsertGoalSchema = z.infer<typeof upsertGoalSchema>;
