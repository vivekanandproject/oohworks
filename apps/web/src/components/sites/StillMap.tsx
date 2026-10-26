import { compass } from "@/lib/sites/view";

interface Point {
  id: string;
  lat: number;
  lng: number;
}

const PAD = 56;
/** The map box is tall beside the list on a wide screen and wide above it below 1024px. */
const SHAPES = [
  { w: 500, h: 640, className: "hidden h-full w-full lg:block" },
  { w: 640, h: 360, className: "block h-full w-full lg:hidden" },
] as const;

/**
 * A still drawing of where the sites sit relative to each other: positions only, no streets.
 * It is honest about that, and the live map is one tap away.
 */
export function StillMap({
  points,
  facing,
  label,
  wide = false,
}: {
  points: Point[];
  facing?: number | null;
  label: string;
  /** The box is wide at every width, as on a site page. */
  wide?: boolean;
}) {
  if (wide)
    return (
      <Drawing
        W={640}
        H={360}
        className="block h-full w-full"
        points={points}
        facing={facing}
        label={label}
      />
    );
  return (
    <>
      {SHAPES.map((shape) => (
        <Drawing
          key={shape.w}
          W={shape.w}
          H={shape.h}
          className={shape.className}
          points={points}
          facing={facing}
          label={label}
        />
      ))}
    </>
  );
}

function Drawing({
  W,
  H,
  className,
  points,
  facing,
  label,
}: {
  W: number;
  H: number;
  className: string;
  points: Point[];
  facing?: number | null | undefined;
  label: string;
}) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const k = Math.cos((midLat * Math.PI) / 180) || 1;
  const xs = lngs.map((v) => v * k);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);
  const span = Math.max(maxX - minX, maxY - minY, 0.002);
  const scale = Math.min((W - PAD * 2) / span, (H - PAD * 2) / span);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const place = (p: Point) => ({
    x: W / 2 + (p.lng * k - cx) * scale,
    y: H / 2 - (p.lat - cy) * scale,
  });
  const single = points.length === 1;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={label}
    >
      <rect width={W} height={H} className="fill-paper-sunken" />
      <g className="stroke-hairline" strokeWidth="1">
        {Array.from({ length: Math.floor(W / 50) }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 50} y1="0" x2={(i + 1) * 50} y2={H} />
        ))}
        {Array.from({ length: Math.floor(H / 50) }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * 50} x2={W} y2={(i + 1) * 50} />
        ))}
      </g>
      {points.map((p) => {
        const { x, y } = place(p);
        return (
          <g key={p.id} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            {single ? <circle r="26" className="fill-navy-200" opacity="0.7" /> : null}
            {single && facing != null ? (
              <g transform={`rotate(${facing})`}>
                <line
                  x1="0"
                  y1="-30"
                  x2="0"
                  y2="-62"
                  className="stroke-navy"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polygon points="-6,-58 0,-72 6,-58" className="fill-navy" />
              </g>
            ) : null}
            <rect
              x="-13"
              y="-30"
              width="26"
              height="18"
              rx="3"
              className={single ? "fill-survey" : "fill-navy"}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <rect
              x="-1.5"
              y="-12"
              width="3"
              height="12"
              className={single ? "fill-survey" : "fill-navy"}
            />
          </g>
        );
      })}
      {single && facing != null ? (
        <text x={W - 16} y={H - 16} textAnchor="end" className="fill-ink font-mono" fontSize="14">
          Faces {Math.round(facing)}° {compass(facing)}
        </text>
      ) : null}
    </svg>
  );
}
