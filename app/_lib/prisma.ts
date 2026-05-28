import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { env } from "./env";

declare global {
  var cachedPrisma: PrismaClient;
}

function createPrismaClient() {
  // Em serverless (Vercel), cada instância mantém seu próprio pool; limitamos
  // `max` para não esgotar as conexões do Postgres sob concorrência. O pooling
  // de verdade vem do endpoint "pooled" do Neon (PgBouncer) via DATABASE_URL.
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === "production" ? 1 : 10,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = createPrismaClient();
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
