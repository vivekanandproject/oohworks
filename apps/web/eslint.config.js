import next from "@ohworks/config/eslint/next";

const config = [
  // public/vendor holds a file copied from node_modules (the map library's worker).
  {
    ignores: [
      "src/payload-types.ts",
      "src/app/(payload)/admin/importMap.js",
      "src/migrations/**",
      "public/vendor/**",
      "public/_media/**",
    ],
  },
  ...next,
];

export default config;
