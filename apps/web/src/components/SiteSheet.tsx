import type { CSSProperties } from "react";
import { Badge, Reveal } from "@ohworks/ui";

/** Delay in ms for a stroke or a fade in the drawing sequence. */
const d = (ms: number) => ({ "--d": ms }) as CSSProperties;

/**
 * The hero illustration: a sample site sheet drawn as a survey drawing with hairlines and mono labels.
 * It draws itself on arrival, stroke by stroke, like a plotter. A schematic, not a photo, and says so.
 */
export function SiteSheet() {
  return (
    <Reveal mode="draw">
      <figure className="oh-box" data-section="site-sheet">
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
          <rect
            x="16"
            y="16"
            width="118"
            height="26"
            rx="2"
            className="fill-paper-sunken"
            data-fade
            style={d(0)}
          />
          <text
            x="26"
            y="33"
            className="fill-ink sheet-md font-mono tabular-nums"
            style={d(60)}
            data-fade
          >
            OW-8K3X2
          </text>
          <text
            x="544"
            y="33"
            textAnchor="end"
            className="fill-ink-muted sheet-xs font-sans"
            fontWeight={600}
            letterSpacing="0.06em"
            data-fade
            style={d(60)}
          >
            SITE SHEET · SAMPLE
          </text>

          {/* Top dimension */}
          <line
            x1="140"
            y1="60"
            x2="420"
            y2="60"
            className="stroke-ink-muted"
            strokeWidth="1"
            pathLength={1}
            data-draw
            style={d(60)}
          />
          <line
            x1="140"
            y1="55"
            x2="140"
            y2="65"
            className="stroke-ink-muted"
            strokeWidth="1"
            pathLength={1}
            data-draw
            style={d(60)}
          />
          <line
            x1="420"
            y1="55"
            x2="420"
            y2="65"
            className="stroke-ink-muted"
            strokeWidth="1"
            pathLength={1}
            data-draw
            style={d(300)}
          />
          <rect
            x="232"
            y="50"
            width="96"
            height="20"
            rx="2"
            className="fill-paper-raised"
            data-fade
            style={d(300)}
          />
          <text
            x="280"
            y="64"
            textAnchor="middle"
            className="fill-ink sheet-sm font-mono"
            data-fade
            style={d(320)}
          >
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
            pathLength={1}
            data-draw
            style={d(120)}
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
            data-fade
            style={d(420)}
          />
          <text
            x="280"
            y="144"
            textAnchor="middle"
            className="fill-ink font-mono"
            fontSize="18"
            fontWeight={500}
            data-fade
            style={d(440)}
          >
            20 × 10 ft
          </text>
          <text
            x="280"
            y="166"
            textAnchor="middle"
            className="fill-ink-muted sheet-sm font-sans"
            data-fade
            style={d(480)}
          >
            front-lit · hoarding
          </text>

          {/* Right dimension */}
          <line
            x1="436"
            y1="78"
            x2="436"
            y2="218"
            className="stroke-ink-muted"
            strokeWidth="1"
            pathLength={1}
            data-draw
            style={d(200)}
          />
          <line
            x1="431"
            y1="78"
            x2="441"
            y2="78"
            className="stroke-ink-muted"
            strokeWidth="1"
            pathLength={1}
            data-draw
            style={d(200)}
          />
          <line
            x1="431"
            y1="218"
            x2="441"
            y2="218"
            className="stroke-ink-muted"
            strokeWidth="1"
            pathLength={1}
            data-draw
            style={d(420)}
          />
          <text x="446" y="152" className="fill-ink sheet-sm font-mono" data-fade style={d(440)}>
            10 ft
          </text>
          <text
            x="446"
            y="168"
            className="fill-ink-muted sheet-xs font-mono"
            data-fade
            style={d(460)}
          >
            (3.0 m)
          </text>

          {/* Posts and ground */}
          <rect
            x="198"
            y="218"
            width="5"
            height="86"
            className="fill-ink"
            data-fade
            style={d(300)}
          />
          <rect
            x="357"
            y="218"
            width="5"
            height="86"
            className="fill-ink"
            data-fade
            style={d(340)}
          />
          <rect
            x="190"
            y="304"
            width="21"
            height="4"
            rx="2"
            className="fill-ink"
            data-fade
            style={d(380)}
          />
          <rect
            x="349"
            y="304"
            width="21"
            height="4"
            rx="2"
            className="fill-ink"
            data-fade
            style={d(400)}
          />
          <line
            x1="150"
            y1="312"
            x2="410"
            y2="312"
            className="stroke-ink"
            strokeWidth="1.75"
            strokeLinecap="round"
            pathLength={1}
            data-draw
            style={d(380)}
          />
          {[160, 190, 220, 324, 354, 384].map((x, i) => (
            <line
              key={x}
              x1={x}
              y1="320"
              x2={x + 16}
              y2="320"
              className="stroke-hairline-strong"
              strokeWidth="1"
              pathLength={1}
              data-draw
              style={d(520 + i * 30)}
            />
          ))}

          {/* Compass: facing 225° (south-west) */}
          <circle
            cx="66"
            cy="312"
            r="30"
            className="fill-paper-raised stroke-hairline-strong"
            strokeWidth="1"
            pathLength={1}
            data-draw
            style={d(460)}
          />
          <text
            x="66"
            y="290"
            textAnchor="middle"
            className="fill-ink-muted sheet-xs font-sans"
            fontWeight={600}
            data-fade
            style={d(620)}
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
            pathLength={1}
            data-draw
            style={d(620)}
          />
          <line
            x1="66"
            y1="312"
            x2="49"
            y2="329"
            className="stroke-navy"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={1}
            data-draw
            style={d(640)}
          />
          <polygon points="45,333 48,323 55,330" className="fill-navy" data-fade style={d(760)} />
          <circle cx="66" cy="312" r="2.5" className="fill-navy" data-fade style={d(640)} />
          <text x="16" y="358" className="fill-ink sheet-sm font-mono" data-fade style={d(800)}>
            Facing 225° SW
          </text>

          {/* Coordinates */}
          <text
            x="544"
            y="342"
            textAnchor="end"
            className="fill-ink sheet-md font-mono tabular-nums"
            style={d(820)}
            data-fade
          >
            12.93512, 77.62214
          </text>
          <text
            x="544"
            y="360"
            textAnchor="end"
            className="fill-ink-muted sheet-sm font-sans"
            data-fade
            style={d(860)}
          >
            80 Feet Road, Koramangala, Bengaluru
          </text>
        </svg>
        <div className="mt-3 flex flex-wrap gap-1">
          <span data-fade style={d(920)}>
            <Badge kind="verified">Verified owner</Badge>
          </span>
          <span data-fade style={d(980)}>
            <Badge kind="permit">Permit on file</Badge>
          </span>
          <span data-fade style={d(1040)}>
            <Badge kind="fresh">Updated 3 days ago</Badge>
          </span>
          <span data-fade style={d(1100)}>
            <Badge kind="responsive">Replies in under a day</Badge>
          </span>
        </div>
        <figcaption className="text-ink-muted t-small mt-3" data-fade style={d(1160)}>
          Every site on OOHWORKS is recorded like this: measured, checked and dated. Sample data,
          not a live listing.
        </figcaption>
      </figure>
    </Reveal>
  );
}
