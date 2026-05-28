import nextConfig from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import prettier from "eslint-config-prettier";

export default [
  {
    // Lixo de working tree (cópia paralela do projeto, metadados do macOS,
    // artefatos de build). Substitui o antigo .eslintignore (não suportado no
    // ESLint 9). Nada disso é rastreado pelo git.
    ignores: [
      "finance.ai/**",
      "**/._*",
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
  ...nextConfig,
  ...nextTypescript,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      // Impede importar a instância `db` do Prisma em código que pode ir para o
      // cliente (componentes/páginas). Código de servidor é liberado abaixo.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/_lib/prisma"],
              message:
                "Do not import the Prisma db instance in client components. Move data access to a server action or _data/ function.",
            },
          ],
        },
      ],
    },
  },
  {
    // Locais exclusivamente de servidor podem (e devem) importar o Prisma.
    files: [
      "app/**/_actions/**",
      "app/**/_data/**",
      "app/_lib/**",
      "app/api/**",
      "instrumentation.ts",
      "proxy.ts",
      "prisma.config.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  prettier,
];
