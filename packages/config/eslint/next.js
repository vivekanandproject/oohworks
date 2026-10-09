import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

// Next's preset already wires typescript-eslint with its own parser; layering the
// library preset on top gives two parsers and false "only used as a type" errors.
export default [
  { ignores: [".next/**", "next-env.d.ts", "node_modules/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
