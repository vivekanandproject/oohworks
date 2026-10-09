import { Badge } from "@ohworks/ui";

/**
 * The hero illustration: a sample site sheet drawn as a survey drawing with hairlines and mono labels.
 * It shows what ohworks records about every face. It is a schematic, not a photo, and says so.
 */
export function SiteSheet() {
  return (
    <figure
      className="border-hairline bg-paper-raised rounded-md border p-4 sm:p-5"
      data-section="site-sheet"
    >
      <svg
        viewBox="0 0 560 372"
        className="block h-auto w-full"
        role="img"
        aria-labelledby="site-sheet-title"
      >
        <title id="site-sheet-title">
          Sample site sheet: a 20 by 10 foot front-lit hoarding on two posts, with its dimensions,
          facing direction and coordinates
        </title>
        {/* ID block */}
        <rect x="16" y="16" width="118" height="26" rx="2" className="fill-paper-sunken" />
        <text
          x="26"
          y="33"
          className="fill-ink font-mono"
          fontSize="13"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          OW-8K3X2
        </text>
        <text
          x="544"
          y="33"
          textAnchor="end"
          className="fill-ink-muted font-sans"
          fontSize="11"
          fontWeight={600}
          letterSpacing="0.06em"
        >
          SITE SHEET · SAMPLE
        </text>

        {/* Top dimension */}
        <line x1="140" y1="60" x2="420" y2="60" className="stroke-ink-muted" strokeWidth="1" />
        <line x1="140" y1="55" x2="140" y2="65" className="stroke-ink-muted" strokeWidth="1" />
        <line x1="420" y1="55" x2="420" y2="65" className="stroke-ink-muted" strokeWidth="1" />
        <rect x="232" y="50" width="96" height="20" rx="2" className="fill-paper-raised" />
        <text x="280" y="64" textAnchor="middle" className="fill-ink font-mono" fontSize="12">
          20 ft (6.1 m)
        </text>

        {/* Face */}
        <rect
          x="140"
          y="78"
          width="280"
          height="140"
          rx="4"
          className="fill-paper-sunken stroke-hairline-strong"
          strokeWidth="1.5"
        />
        <rect
          x="150"
          y="88"
          width="260"
          height="120"
          rx="2"
          className="stroke-hairline fill-none"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text
          x="280"
          y="144"
          textAnchor="middle"
          className="fill-ink font-mono"
          fontSize="18"
          fontWeight={500}
        >
          20 × 10 ft
        </text>
        <text
          x="280"
          y="166"
          textAnchor="middle"
          className="fill-ink-muted font-sans"
          fontSize="12"
        >
          front-lit · hoarding
        </text>

        {/* Right dimension */}
        <line x1="436" y1="78" x2="436" y2="218" className="stroke-ink-muted" strokeWidth="1" />
        <line x1="431" y1="78" x2="441" y2="78" className="stroke-ink-muted" strokeWidth="1" />
        <line x1="431" y1="218" x2="441" y2="218" className="stroke-ink-muted" strokeWidth="1" />
        <text x="446" y="152" className="fill-ink font-mono" fontSize="12">
          10 ft
        </text>
        <text x="446" y="168" className="fill-ink-muted font-mono" fontSize="11">
          (3.0 m)
        </text>

        {/* Posts and ground */}
        <rect x="198" y="218" width="5" height="86" className="fill-ink" />
        <rect x="357" y="218" width="5" height="86" className="fill-ink" />
        <rect x="190" y="304" width="21" height="4" rx="2" className="fill-ink" />
        <rect x="349" y="304" width="21" height="4" rx="2" className="fill-ink" />
        <line
          x1="150"
          y1="312"
          x2="410"
          y2="312"
          className="stroke-ink"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <line
          x1="160"
          y1="320"
          x2="176"
          y2="320"
          className="stroke-hairline-strong"
          strokeWidth="1"
        />
        <line
          x1="190"
          y1="320"
          x2="206"
          y2="320"
          className="stroke-hairline-strong"
          strokeWidth="1"
        />
        <line
          x1="220"
          y1="320"
          x2="236"
          y2="320"
          className="stroke-hairline-strong"
          strokeWidth="1"
        />
        <line
          x1="324"
          y1="320"
          x2="340"
          y2="320"
          className="stroke-hairline-strong"
          strokeWidth="1"
        />
        <line
          x1="354"
          y1="320"
          x2="370"
          y2="320"
          className="stroke-hairline-strong"
          strokeWidth="1"
        />
        <line
          x1="384"
          y1="320"
          x2="400"
          y2="320"
          className="stroke-hairline-strong"
          strokeWidth="1"
        />

        {/* Compass: facing 225° (south-west) */}
        <circle
          cx="66"
          cy="312"
          r="30"
          className="fill-paper-raised stroke-hairline-strong"
          strokeWidth="1"
        />
        <text
          x="66"
          y="290"
          textAnchor="middle"
          className="fill-ink-muted font-sans"
          fontSize="10"
          fontWeight={600}
        >
          N
        </text>
        <line
          x1="66"
          y1="282"
          x2="66"
          y2="288"
          className="stroke-hairline-strong"
          strokeWidth="1"
        />
        <line
          x1="66"
          y1="312"
          x2="49"
          y2="329"
          className="stroke-navy"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon points="45,333 48,323 55,330" className="fill-navy" />
        <circle cx="66" cy="312" r="2.5" className="fill-navy" />
        <text x="16" y="358" className="fill-ink font-mono" fontSize="12">
          Facing 225° SW
        </text>

        {/* Coordinates */}
        <text
          x="544"
          y="342"
          textAnchor="end"
          className="fill-ink font-mono"
          fontSize="13"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          12.93512, 77.62214
        </text>
        <text x="544" y="360" textAnchor="end" className="fill-ink-muted font-sans" fontSize="12">
          80 Feet Road, Koramangala, Bengaluru
        </text>
      </svg>
      <div className="mt-3 flex flex-wrap gap-1">
        <Badge kind="verified">Verified owner</Badge>
        <Badge kind="permit">Permit on file</Badge>
        <Badge kind="fresh">Updated 3 days ago</Badge>
        <Badge kind="responsive">Replies in under a day</Badge>
      </div>
      <figcaption className="text-ink-muted t-small mt-3">
        Every site on ohworks is recorded like this: measured, checked and dated. Sample data, not a
        live listing.
      </figcaption>
    </figure>
  );
}
