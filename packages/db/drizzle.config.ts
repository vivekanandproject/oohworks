import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://ohworks:ohworks@localhost:5433/ohworks",
  },
  extensionsFilters: ["postgis"],
  strict: true,
  verbose: true,
});
