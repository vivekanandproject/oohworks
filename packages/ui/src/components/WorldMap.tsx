import { WORLD_DOTS, WORLD_VIEWBOX, projectWorld } from "./world-dots";

export interface WorldPin {
  id: string;
  lat: number;
  lon: number;
  label: string;
  labelSide?: "left" | "right";
}

/**
 * The open map: land as a dot grid, pins in the design system's billboard-head shape.
 * Static SVG, no map library. Pins are navy; the one survey element on a page is never a pin here.
 */
export function WorldMap({ pins, title }: { pins: WorldPin[]; title: string }) {
  return (
    <svg
      viewBox={`0 0 ${WORLD_VIEWBOX.width} ${WORLD_VIEWBOX.height}`}
      className="block h-auto w-full"
      role="img"
      aria-labelledby="world-map-title"
    >
      <title id="world-map-title">{title}</title>
      <path
        d={WORLD_DOTS}
        fill="none"
        className="stroke-hairline-strong"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      {pins.map((p) => {
        const { x, y } = projectWorld(p.lat, p.lon);
        const left = p.labelSide === "left";
        return (
          <g key={p.id} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            <circle r={9} className="fill-navy-200" opacity={0.7} />
            <rect x={-7} y={-16} width={14} height={9} rx={1.5} className="fill-navy" />
            <rect x={-1} y={-7} width={2} height={7} className="fill-navy" />
            <circle cy={-11.5} r={1.8} className="fill-paper" />
            <text
              x={left ? -11 : 11}
              y={-9}
              textAnchor={left ? "end" : "start"}
              className="map-label fill-ink font-sans"
              fontSize="12"
              fontWeight={500}
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
