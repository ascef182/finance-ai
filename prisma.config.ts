import "dotenv/config";

import path from "path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Migrações usam a conexão DIRETA (Neon: sem o pooler/PgBouncer). Em dev
    // local com Docker, DIRECT_URL não existe e caímos para DATABASE_URL.
    // O runtime da aplicação NÃO usa isto — conecta via driver adapter (pg).
    url: (process.env.DIRECT_URL ?? process.env.DATABASE_URL) as string,
  },
});
