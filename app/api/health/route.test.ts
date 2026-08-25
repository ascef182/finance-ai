import { describe, expect, it, vi } from "vitest";

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock("@/app/_lib/prisma", () => ({
  db: {
    $queryRaw: queryRawMock,
  },
}));

import { GET } from "./route";

describe("smoke: GET /api/health", () => {
  it("responds 200 with { status: 'ok', db: 'up' } when the DB check succeeds", async () => {
    queryRawMock.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", db: "up" });
  });

  it("responds 503 when the DB check fails", async () => {
    queryRawMock.mockRejectedValue(new Error("connection refused"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      db: "down",
    });
  });
});
