import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/login",
      // Todo o resto é área autenticada (dashboard, metas, assinatura,
      // transações) — não faz sentido indexar, e crawlers batendo nessas
      // rotas só vão bater no redirect do Clerk pra /login mesmo.
      disallow: ["/", "/goals", "/subscription", "/transactions"],
    },
    sitemap: "https://financeai.caza-tech.com/sitemap.xml",
  };
}
