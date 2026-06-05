"use client";

import { useEffect } from "react";

import { Button } from "./_components/ui/button";

/**
 * Error boundary de rota. Captura erros de renderização/servidor nas páginas e
 * oferece uma ação de "tentar novamente". O log vai para o console (e, quando
 * configurado, para o Sentry via instrumentation-client/global-error).
 */
const ErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="text-muted-foreground">
        Ocorreu um erro inesperado. Você pode tentar novamente.
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  );
};

export default ErrorPage;
