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
      // Internal links are plain anchors on purpose: every navigation is a document navigation,
      // so the native cross-document view transition gives one consistent crossfade.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
