import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  {
    ignores: [
      "node_modules/",
      ".next/",
      "backend/",
      "Mobile App/",
      "mobile/",
      "output/",
      "playwright-report/",
      "test-results/",
      "scratch/",
    ],
  },
  {
    extends: [...next],
    rules: {
      // Security
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // Quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "no-unused-expressions": "error",
      "no-duplicate-imports": "error",

      // Next.js specific
      "@next/next/no-html-link-for-pages": "error",
    },
  },
]);
