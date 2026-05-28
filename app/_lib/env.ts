import { z } from "zod";

/**
 * Validação das variáveis de ambiente no boot do servidor.
 *
 * Importe `env` (ao invés de `process.env`) em código de servidor para obter
 * valores tipados e garantir que o app falhe cedo, com mensagem clara, quando
 * uma variável obrigatória estiver ausente ou malformada.
 *
 * As variáveis do Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`)
 * são lidas diretamente pelo SDK do Clerk e por isso também são validadas aqui.
 */
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Banco de dados (Neon). DATABASE_URL = string "pooled"; DIRECT_URL = conexão
  // direta usada pelas migrações do Prisma (opcional em ambiente local).
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PREMIUM_PLAN_PRICE_ID: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL: z.string().url(),

  // IA (opcional: sem a chave, o relatório usa um conteúdo de demonstração).
  OPENAI_API_KEY: z.string().min(1).optional(),

  // Rate limiting (Upstash Redis) — usado no Bloco B; opcional até ser ativado.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Variáveis de ambiente inválidas ou ausentes:\n${issues}\n` +
      `Verifique seu arquivo .env (use .env.example como referência).`,
  );
}

export const env = parsed.data;
