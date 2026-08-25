import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { Mulish } from "next/font/google";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

const siteUrl = "https://financeai.caza-tech.com";
const siteDescription =
  "Plataforma de gestão financeira que usa IA para monitorar suas movimentações e oferecer insights personalizados, facilitando o controle do seu orçamento.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Finance-Ai — Gestão financeira pessoal com IA",
    template: "%s | Finance-Ai",
  },
  description: siteDescription,
  keywords: [
    "gestão financeira",
    "finanças pessoais",
    "controle de gastos",
    "orçamento pessoal",
    "IA financeira",
    "finance ai",
  ],
  openGraph: {
    title: "Finance-Ai — Gestão financeira pessoal com IA",
    description: siteDescription,
    url: siteUrl,
    siteName: "Finance-Ai",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Finance-Ai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance-Ai — Gestão financeira pessoal com IA",
    description: siteDescription,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${mulish.className} dark antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
          }}
        >
          <div className="flex h-full flex-col overflow-x-hidden xl:overflow-hidden">
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
