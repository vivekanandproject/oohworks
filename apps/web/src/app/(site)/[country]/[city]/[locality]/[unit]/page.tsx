import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { permanentIdFromSlug, unitPath } from "@ohworks/core";
import { findFace } from "@/lib/fixtures";
import { Shell } from "@/components/Shell";

interface Params {
  country: string;
  city: string;
  locality: string;
  unit: string;
}

function resolve(params: Params) {
  const id = permanentIdFromSlug(params.unit);
  if (!id) return null;
  const face = findFace(id);
  if (!face) return null;
  return face;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const face = resolve(p);
  if (!face) return {};
  return {
    title: face.name,
    description: `${face.format} in ${face.locality}, ${face.city}. Listed by ${face.owner.name}.`,
    robots: face.indexable ? { index: true, follow: true } : { index: false, follow: true },
    alternates: { canonical: unitPath({ ...face }) },
  };
}

export default async function UnitPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const face = resolve(p);
  if (!face) notFound();

  // Permanent id wins: if any path segment drifted, 301 to the canonical URL.
  const canonical = unitPath(face);
  const requested = `/${p.country}/${p.city}/${p.locality}/${p.unit}/`;
  if (requested !== canonical) permanentRedirect(canonical);

  const widthFt = (face.widthMm / 304.8).toFixed(0);
  const heightFt = (face.heightMm / 304.8).toFixed(0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: face.name,
    sku: face.permanentId,
    category: "Out-of-home advertising space",
    additionalProperty: [
      { "@type": "PropertyValue", name: "format", value: face.format },
      { "@type": "PropertyValue", name: "width_mm", value: face.widthMm },
      { "@type": "PropertyValue", name: "height_mm", value: face.heightMm },
      { "@type": "PropertyValue", name: "illumination", value: face.illumination },
      { "@type": "PropertyValue", name: "facing_deg", value: face.facingDeg },
    ],
    ...(face.priceDisplay !== "on_request" && face.ratePerMonthInr
      ? {
          offers: {
            "@type": "Offer",
            businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
            price: face.ratePerMonthInr,
            priceCurrency: "INR",
            unitText: "MONTH",
            seller: { "@type": "Organization", name: face.owner.name },
          },
        }
      : {}),
  };

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
          {face.country.toUpperCase()} / {face.city} / {face.locality}
        </nav>
        <h1 className="mt-2 text-2xl font-semibold">{face.name}</h1>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-neutral-500">Format</dt>
          <dd>{face.format}</dd>
          <dt className="text-neutral-500">Size</dt>
          <dd>
            {widthFt} × {heightFt} ft
          </dd>
          <dt className="text-neutral-500">Lighting</dt>
          <dd>{face.illumination}</dd>
          <dt className="text-neutral-500">Owner</dt>
          <dd>{face.owner.name}</dd>
          <dt className="text-neutral-500">Price</dt>
          <dd>
            {face.priceDisplay === "on_request"
              ? "On request"
              : `${face.priceDisplay === "from" ? "From " : ""}₹${face.ratePerMonthInr?.toLocaleString("en-IN")} a month`}
          </dd>
          <dt className="text-neutral-500">Location</dt>
          <dd>
            {face.lat.toFixed(5)}, {face.lng.toFixed(5)} · facing {face.facingDeg}°
          </dd>
        </dl>
        <p className="mt-8 text-xs text-neutral-500">
          Unit {face.permanentId}. Day-one fixture; replaced by live data in M2.
        </p>
      </div>
    </Shell>
  );
}
