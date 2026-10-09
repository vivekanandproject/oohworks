import { notFound } from "next/navigation";
import { FIXTURE_HUBS } from "@/lib/fixtures";

interface Params {
  country: string;
  city: string;
}

/** City hub. Returns a real 404 unless the hub is above its inventory threshold. */
export default async function CityHub({ params }: { params: Promise<Params> }) {
  const p = await params;
  if (!FIXTURE_HUBS.has(`${p.country}/${p.city}`)) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Out-of-home sites in {p.city}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Hub page. Opening fact and listings land in M2.
      </p>
    </main>
  );
}
