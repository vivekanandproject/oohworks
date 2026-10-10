import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPermanentId } from "@ohworks/core";
import { QuickBody } from "@/components/sites/QuickBody";
import { readLists } from "@/lib/sites/lists-server";
import { getSite } from "@/lib/sites/queries";

export const dynamic = "force-dynamic";
/** The content of the quick view panel. It is fetched by the results page; it is not a page to land on. */
export const metadata: Metadata = { title: "Quick view", robots: { index: false, follow: false } };

export default async function QuickPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPermanentId(id)) notFound();
  const found = await getSite(id);
  if (!found || found.site.removed) notFound();
  return (
    <main id="main" className="mx-auto max-w-[480px] p-5">
      <div className="flex flex-col gap-6" data-quick-body="">
        <QuickBody found={found} now={Date.now()} lists={await readLists()} />
      </div>
    </main>
  );
}
