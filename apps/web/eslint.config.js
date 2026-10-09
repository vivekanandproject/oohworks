import next from "@ohworks/config/eslint/next";

const config = [
  { ignores: ["src/payload-types.ts", "src/app/(payload)/admin/importMap.js"] },
  ...next,
];

export default config;
