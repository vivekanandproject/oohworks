import type { Metadata } from "next";
import { HubPage, hubMetadata, hubPageNumber } from "@/components/sites/HubPage";
import { readHub } from "@/lib/sites/hubs";

export const dynamic = "force-dynamic";

type Params = Promise<{ country: string; city: string; locality: string; n: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const hub = readHub(p.country, p.city, p.locality);
  return hubMetadata(hub, /^[1-9]\d{0,3}$/.test(p.n) ? Number(p.n) : 1);
}

/** Later pages of an area's or a format's hub. */
export default async function AreaOrFormatHubPage({ params }: { params: Params }) {
  const p = await params;
  const hub = readHub(p.country, p.city, p.locality);
  return <HubPage hub={hub} page={hubPageNumber(hub, p.n)} />;
}
