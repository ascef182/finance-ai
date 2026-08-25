import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginButton } from "./_components/login-button";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Entre na Finance-Ai e controle suas finanças com insights gerados por IA — monitore movimentações, defina metas e organize seu orçamento em um só lugar.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Finance-Ai",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Plataforma de gestão financeira que usa IA para monitorar suas movimentações e oferecer insights personalizados, facilitando o controle do seu orçamento.",
  url: "https://financeai.caza-tech.com/login",
};

const LoginPage = async () => {
  const { userId } = await auth();
  if (userId) {
    redirect("/");
  }
  return (
    <div className="grid h-full grid-cols-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ESQUERDA */}
      <div className="mx-auto flex h-full max-w-[550px] flex-col justify-center p-8">
        <Image
          src="/logo.svg"
          width={173}
          height={39}
          alt="Finance AI"
          className="mb-8"
        />
        <h1 className="mb-3 text-4xl font-bold">Bem-vindo</h1>
        <p className="mb-8 text-muted-foreground">
          A Finance AI é uma plataforma de gestão financeira que utiliza IA para
          monitorar suas movimentações, e oferecer insights personalizados,
          facilitando o controle do seu orçamento.
        </p>
        <LoginButton />
      </div>
      {/* DIREITA */}
      <div className="relative h-full w-full">
        <Image
          src="/login.png"
          alt="Faça login"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
};

export default LoginPage;
