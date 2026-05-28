/**
 * Executado uma vez no boot do servidor (Next.js instrumentation).
 * Importar o módulo de env faz a validação Zod rodar cedo, fazendo o app
 * falhar com mensagem clara se alguma variável obrigatória estiver ausente.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/app/_lib/env");
  }
}
