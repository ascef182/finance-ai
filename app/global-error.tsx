"use client";

import { useEffect } from "react";

/**
 * Error boundary global: substitui o root layout quando o próprio layout falha,
 * por isso precisa renderizar suas próprias tags <html>/<body>.
 */
const GlobalError = ({
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
    <html lang="pt-BR">
      <body className="dark">
        <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-bold">Erro inesperado</h1>
          <p className="text-muted-foreground">
            Não foi possível carregar a aplicação.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
