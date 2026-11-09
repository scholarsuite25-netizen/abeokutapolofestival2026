import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      "server-only": path.resolve(import.meta.dirname, "tests/shims/server-only.ts"),
    },
  },
  test: {
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/e2e/**/*.test.ts",
      "tests/e2e/**/*.test.tsx",
    ],
    environment: "node",
    globals: false,
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
    },
  },
});
