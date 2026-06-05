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
    goal: { updateMany: updateManyMock, create: createMock },
  },
}));

import { upsertGoal } from "./index";

const baseParams = {
  name: "Reserva de emergência",
  targetAmount: 10000,
  currentAmount: 1500,
};

describe("upsertGoal (isolamento por userId)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: "user-1" });
  });

  it("rejeita edição de meta de outro usuário (count 0)", async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    await expect(
      upsertGoal({ ...baseParams, id: "goal-de-outro" }),
    ).rejects.toThrow("Goal not found");
  });

  it("ao editar, escopa o where por { id, userId }", async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    await upsertGoal({ ...baseParams, id: "goal-1" });
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "goal-1", userId: "user-1" } }),
    );
  });

  it("ao criar, injeta o userId autenticado", async () => {
    await upsertGoal(baseParams);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });

  it("lança Unauthorized sem usuário autenticado", async () => {
    authMock.mockResolvedValue({ userId: null });
    await expect(upsertGoal(baseParams)).rejects.toThrow("Unauthorized");
  });
});
