import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-config-next 15 ships eslintrc-style configs, so flat config reaches
// them through FlatCompat. (create-next-app scaffolded the Next 16 form; the
// project is pinned to 15 for next-intl / Convex / Better Auth compatibility.)
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", ".data/**"],
  },
];

export default eslintConfig;
