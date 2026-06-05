import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  clerkClientMock,
  getUserMock,
  findManyMock,
  generateTextMock,
} = vi.hoisted(() => {
  const getUserMock = vi.fn();
  return {
    authMock: vi.fn(),
    getUserMock,
    clerkClientMock: vi.fn(async () => ({
      users: { getUser: getUserMock },
    })),
    findManyMock: vi.fn(),
    generateTextMock: vi.fn(),
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  clerkClient: clerkClientMock,
}));
vi.mock("ai", () => ({ generateText: generateTextMock }));
vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn(() => "model") }));
vi.mock("@/app/_lib/prisma", () => ({
  db: { transaction: { findMany: findManyMock } },
}));
vi.mock("@/app/_lib/ratelimit", () => ({
  redis: null,
  aiReportRateLimiter: { limit: vi.fn(async () => ({ success: true })) },
}));

import { generateAiReport } from "./index";

describe("generateAiReport (isolamento por userId — A1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: "user-1" });
    getUserMock.mockResolvedValue({
      publicMetadata: { subscriptionPlan: "premium" },
    });
    findManyMock.mockResolvedValue([]);
    generateTextMock.mockResolvedValue({ text: "relatório" });
    process.env.OPENAI_API_KEY = "sk-test";
  });

  it("busca transações filtrando pelo userId autenticado", async () => {
    await generateAiReport({ month: "01" });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });

  it("exige plano premium", async () => {
    getUserMock.mockResolvedValue({
      publicMetadata: { subscriptionPlan: null },
    });
    await expect(generateAiReport({ month: "01" })).rejects.toThrow("premium");
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("lança Unauthorized sem usuário autenticado", async () => {
    authMock.mockResolvedValue({ userId: null });
    await expect(generateAiReport({ month: "01" })).rejects.toThrow(
      "Unauthorized",
    );
  });
});
