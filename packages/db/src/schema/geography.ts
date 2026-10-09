import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const country = pgTable("country", {
  code: text("code").primaryKey(), // ISO 3166-1 alpha-2, lower case: "in"
  name: text("name").notNull(),
  defaultLocale: text("default_locale").notNull(), // "en"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const city = pgTable(
  "city",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    countryCode: text("country_code")
      .notNull()
      .references(() => country.code),
    slug: text("slug").notNull(), // "bengaluru"
    name: text("name").notNull(),
    hubThreshold: integer("hub_threshold").notNull().default(25),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("city_country_slug_idx").on(t.countryCode, t.slug)],
);

export const locality = pgTable(
  "locality",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    cityId: integer("city_id")
      .notNull()
      .references(() => city.id),
    slug: text("slug").notNull(), // "koramangala"
    name: text("name").notNull(),
    hubThreshold: integer("hub_threshold").notNull().default(10),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("locality_city_slug_idx").on(t.cityId, t.slug)],
);
