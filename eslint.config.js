// Root config used by lint-staged for files under packages/. The Next app has its own
// preset and is linted from its own directory (see .lintstagedrc.json).
import library from "./packages/config/eslint/library.js";

export default [
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/.turbo/**", "apps/**"] },
  ...library,
];
