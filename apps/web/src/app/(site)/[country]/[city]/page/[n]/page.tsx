import type { Metadata } from "next";
import { HubPage, hubMetadata, hubPageNumber } from "@/components/sites/HubPage";
import { readHub } from "@/lib/sites/hubs";

export const dynamic = "force-dynamic";

type Params = Promise<{ country: string; city: string; n: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const hub = readHub(p.country, p.city);
  return hubMetadata(hub, /^[1-9]\d{0,3}$/.test(p.n) ? Number(p.n) : 1);
}

/** Later pages of a city's hub: `/in/bengaluru/page/2/`. Real addresses, so each page can be crawled. */
export default async function CityHubPage({ params }: { params: Params }) {
  const p = await params;
  const hub = readHub(p.country, p.city);
  return <HubPage hub={hub} page={hubPageNumber(hub, p.n)} />;
}
