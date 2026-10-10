import type { Metadata } from "next";
import { HubPage, hubMetadata } from "@/components/sites/HubPage";
import { readHub } from "@/lib/sites/hubs";

export const dynamic = "force-dynamic";

type Params = Promise<{ country: string; city: string; locality: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  return hubMetadata(readHub(p.country, p.city, p.locality), 1);
}

/** An area's hub, `/in/bengaluru/koramangala/`, or a format's, `/in/bengaluru/hoardings/`. */
export default async function AreaOrFormatHub({ params }: { params: Params }) {
  const p = await params;
  return <HubPage hub={readHub(p.country, p.city, p.locality)} page={1} />;
}
