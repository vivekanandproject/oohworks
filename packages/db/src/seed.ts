import { db, country, city, locality } from "./index";

async function main() {
  const d = db();
  await d
    .insert(country)
    .values({ code: "in", name: "India", defaultLocale: "en" })
    .onConflictDoNothing();
  const [blr] = await d
    .insert(city)
    .values({ countryCode: "in", slug: "bengaluru", name: "Bengaluru" })
    .onConflictDoNothing()
    .returning();
  if (blr) {
    await d
      .insert(locality)
      .values({ cityId: blr.id, slug: "koramangala", name: "Koramangala" })
      .onConflictDoNothing();
  }
  console.log("seeded: in / bengaluru / koramangala");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
