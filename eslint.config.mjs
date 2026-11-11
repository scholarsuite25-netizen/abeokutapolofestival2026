import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const patchedConfigs = [...nextVitals, ...nextTs].map((cfg) => {
  if (!cfg.rules) return cfg;
  const rules = { ...cfg.rules };
  for (const key of [
    "@typescript-eslint/no-explicit-any",
    "@typescript-eslint/no-require-imports",
    "react/no-unescaped-entities",
    "react-hooks/purity",
    "react-hooks/set-state-in-effect",
    "prefer-const",
  ]) {
    if (key in rules) {
      rules[key] = "warn";
    }
  }
  return { ...cfg, rules };
});

const eslintConfig = defineConfig([
  ...patchedConfigs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "stitch_abeokuta_polo_festival_platform/**",
    ".agents/**",
    ".vercel/**",
  ]),
]);

export default eslintConfig;
