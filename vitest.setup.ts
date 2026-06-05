/**
 * Define variáveis de ambiente fictícias antes de qualquer import dos testes,
 * para que a validação Zod em app/_lib/env.ts não falhe no boot dos módulos.
 * Valores reais não são necessários: os testes mockam Prisma/Clerk/AI.
 */
const defaults: Record<string, string> = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/test",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_dummy",
  CLERK_SECRET_KEY: "sk_test_dummy",
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_PREMIUM_PLAN_PRICE_ID: "price_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_dummy",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_dummy",
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL: "https://example.com/portal",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
