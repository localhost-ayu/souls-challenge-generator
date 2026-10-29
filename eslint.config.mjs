import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The engine is pure TypeScript: no UI, framework or browser APIs, and
    // no unseeded randomness, so runs stay reproducible from their seed.
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "react/*",
                "react-dom/*",
                "next",
                "next/*",
              ],
              message: "The engine must not depend on React or Next.js.",
            },
            {
              group: [
                "@/app/*",
                "@/components/*",
                "@/i18n/*",
                "@/lib/*",
                "**/app/**",
                "**/components/**",
                "**/i18n/**",
                "**/lib/**",
              ],
              message: "The engine must not import application code.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        ...[
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "navigator",
        ].map((name) => ({
          name,
          message: "The engine must not touch browser APIs.",
        })),
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Use the seeded rng from src/engine/core/rng.ts.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
