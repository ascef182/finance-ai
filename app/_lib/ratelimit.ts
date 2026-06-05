import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "./env";

/**
 * Rate limiting e cache via Upstash Redis.
 *
 * As variáveis UPSTASH_* são opcionais (ver env.ts): quando ausentes (ex.: dev
 * local sem Redis), o limiter degrada para "sempre permitir" e o cache vira
 * no-op, para não travar o desenvolvimento. Em produção, configure-as na Vercel.
 */
const isConfigured = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);

if (!isConfigured && env.NODE_ENV === "production") {
  // Aviso explícito: em produção o rate limiting deveria estar ativo.
  console.warn(
    "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN ausentes — rate limiting DESATIVADO.",
  );
}

export const redis = isConfigured
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export interface LimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const ALWAYS_ALLOW: LimitResult = {
  success: true,
  limit: 0,
  remaining: 0,
  reset: 0,
};

export interface RateLimiter {
  limit: (identifier: string) => Promise<LimitResult>;
}

/**
 * Cria um limiter nomeado. Sem Redis configurado, retorna um limiter que sempre
 * permite (degradação graciosa).
 */
const createRateLimiter = (
  prefix: string,
  limiter: ReturnType<typeof Ratelimit.slidingWindow>,
): RateLimiter => {
  if (!redis) {
    return { limit: async () => ALWAYS_ALLOW };
  }
  const ratelimit = new Ratelimit({
    redis,
    limiter,
    prefix: `ratelimit:${prefix}`,
    analytics: true,
  });
  return { limit: (identifier: string) => ratelimit.limit(identifier) };
};

/**
 * Cota mensal de relatórios de IA por usuário (operação cara: chama o modelo).
 */
export const aiReportRateLimiter = createRateLimiter(
  "ai-report",
  Ratelimit.fixedWindow(10, "30 d"),
);

/**
 * Proteção do webhook do Stripe contra flood (por IP).
 */
export const stripeWebhookRateLimiter = createRateLimiter(
  "stripe-webhook",
  Ratelimit.slidingWindow(20, "10 s"),
);
