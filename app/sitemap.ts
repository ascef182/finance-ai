import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Única URL pública real hoje — todo o resto é autenticado (ver robots.ts).
  // Quando existir uma landing page de marketing em "/", adicionar aqui.
  return [
    {
      url: "https://financeai.caza-tech.com/login",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
