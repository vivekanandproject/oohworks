import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatDate } from "@/lib/editorial/format";
import { PILLARS, PILLAR_KEYS, type PillarKey } from "@/lib/editorial/pillars";
import { getPiece } from "@/lib/editorial/queries";

export const dynamic = "force-dynamic";

let fontFiles: Promise<[Buffer, Buffer]> | null = null;
function fonts(): Promise<[Buffer, Buffer]> {
  fontFiles ??= Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/archivo-800.woff")),
    readFile(join(process.cwd(), "src/assets/fonts/archivo-500.woff")),
  ]);
  return fontFiles;
}

const INK = "#101c30";
const MUTED = "#56606f";
const PAPER = "#f6f5f2";
const HAIRLINE = "#d9d8d2";
const SURVEY = "#e8561f";

/** The 1200 by 630 card a link to a piece shows when it is shared: the title, set in the display face, on paper. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pillar: string; slug: string }> },
) {
  const { pillar, slug } = await params;
  if (!(PILLAR_KEYS as readonly string[]).includes(pillar))
    return new Response("Not found", { status: 404 });
  const piece = await getPiece(pillar as PillarKey, slug);
  if (!piece) return new Response("Not found", { status: 404 });

  const [bold, medium] = await fonts();
  const place = piece.period ?? piece.places[0]?.name;
  const eyebrow = (
    place ? `${PILLARS[piece.pillar].label} · ${place}` : PILLARS[piece.pillar].label
  ).toUpperCase();
  const size = piece.title.length > 90 ? 50 : piece.title.length > 60 ? 58 : 68;
  const byline = `${piece.authors[0]?.name ?? "ohworks"} · ${formatDate(piece.publishedAt)}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: PAPER,
        color: INK,
        padding: "64px 72px",
        fontFamily: "Archivo",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="52" height="52" viewBox="0 0 64 64">
          <rect x="8" y="8" width="48" height="30" rx="4" fill={INK} />
          <rect x="29" y="38" width="6" height="14" fill={INK} />
          <rect x="22" y="52" width="20" height="4" rx="2" fill={INK} />
          <circle cx="32" cy="23" r="6" fill={SURVEY} />
        </svg>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1.2 }}>
          ohworks
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{ display: "flex", fontSize: 24, fontWeight: 500, letterSpacing: 2, color: MUTED }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: size,
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: -2,
          }}
        >
          {piece.title}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `2px solid ${HAIRLINE}`,
          paddingTop: 24,
          fontSize: 26,
          fontWeight: 500,
          color: MUTED,
        }}
      >
        <div style={{ display: "flex" }}>{byline}</div>
        <div style={{ display: "flex" }}>Every figure sourced and dated</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: bold, weight: 800, style: "normal" },
        { name: "Archivo", data: medium, weight: 500, style: "normal" },
      ],
      headers: { "cache-control": "public, max-age=3600" },
    },
  );
}
