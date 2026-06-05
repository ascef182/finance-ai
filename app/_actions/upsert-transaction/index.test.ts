import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, updateManyMock, createMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  updateManyMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    transaction: { updateMany: updateManyMock, create: createMock },
  },
}));

import { upsertTransaction } from "./index";

const baseParams = {
  name: "Mercado",
  amount: 100,
  type: TransactionType.EXPENSE,
  category: TransactionCategory.FOOD,
  paymentMethod: TransactionPaymentMethod.PIX,
  date: new Date("2026-01-15"),
};

describe("upsertTransaction (isolamento por userId — A3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: "user-1" });
  });

  it("rejeita edição de transação de outro usuário (count 0)", async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    await expect(
      upsertTransaction({ ...baseParams, id: "tx-de-outro" }),
    ).rejects.toThrow("Transaction not found");
  });

  it("ao editar, escopa o where por { id, userId }", async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    await upsertTransaction({ ...baseParams, id: "tx-1" });
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "tx-1", userId: "user-1" } }),
    );
  });

  it("ao criar, injeta o userId autenticado", async () => {
    await upsertTransaction(baseParams);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });

  it("lança Unauthorized sem usuário autenticado", async () => {
    authMock.mockResolvedValue({ userId: null });
    await expect(upsertTransaction(baseParams)).rejects.toThrow("Unauthorized");
  });
});
