import { NextResponse } from "next/server";

import { db } from "@/app/_lib/prisma";

// Health check sempre dinâmico (nunca cacheado): valida conectividade do DB.
export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("[health] DB check failed:", error);
    return NextResponse.json({ status: "error", db: "down" }, { status: 503 });
  }
};
