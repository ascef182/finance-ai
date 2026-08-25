/** @type {import('next').NextConfig} */

// Content-Security-Policy compatível com Clerk (auth) e Stripe (checkout/portal).
// 'unsafe-inline'/'unsafe-eval' em script-src são necessários para o runtime do
// Next/Clerk; podem ser endurecidos com nonces numa etapa futura.
//
// Clerk em produção serve o clerk-js e a API de auth pelo domínio customizado
// (clerk.financeai.caza-tech.com), não mais por *.clerk.accounts.dev — que é
// só o domínio de desenvolvimento. Mantemos *.clerk.accounts.dev também para
// não quebrar previews/dev que ainda rodam com a chave de teste.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.financeai.caza-tech.com https://challenges.cloudflare.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.clerk.com https://img.clerk.com",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.clerk.accounts.dev https://clerk.financeai.caza-tech.com https://*.clerk.com https://api.stripe.com https://*.upstash.io",
  "frame-src 'self' https://*.clerk.accounts.dev https://clerk.financeai.caza-tech.com https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: cspDirectives },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
