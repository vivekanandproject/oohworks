import type { Metadata } from "next";
import { HubPage, hubMetadata } from "@/components/sites/HubPage";
import { readHub } from "@/lib/sites/hubs";

export const dynamic = "force-dynamic";

type Params = Promise<{ country: string; city: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  return hubMetadata(readHub(p.country, p.city), 1);
}

/** A city's hub: `/in/bengaluru/`. */
export default async function CityHub({ params }: { params: Params }) {
  const p = await params;
  return <HubPage hub={readHub(p.country, p.city)} page={1} />;
}
