import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored ReUI registry source (copy-and-own, upstream-maintained). It
    // relies on render-phase ref writes and clock reads on purpose, which the
    // React rules flag as errors; linting it would only fight the upstream.
    "src/components/reui/**",
  ]),
]);

export default eslintConfig;
