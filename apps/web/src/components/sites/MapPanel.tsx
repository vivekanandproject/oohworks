"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import type { MapPoint } from "./LiveMap";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => (
    <p className="t-small text-ink-muted grid h-full place-items-center">Loading the map…</p>
  ),
});

/** Shows a still drawing of where the sites are, and swaps in the live map on request. */
export function MapPanel({
  points,
  styleUrl,
  here = false,
  children,
}: {
  points: MapPoint[];
  styleUrl: string;
  here?: boolean;
  children: ReactNode;
}) {
  const [live, setLive] = useState(false);
  if (points.length === 0) return <>{children}</>;
  return (
    <div className="relative h-full w-full">
      {live ? (
        <LiveMap points={points} styleUrl={styleUrl} here={here} />
      ) : (
        <>
          {children}
          <button
            type="button"
            className="oh-btn secondary sm absolute top-3 left-1/2 -translate-x-1/2"
            onClick={() => setLive(true)}
          >
            Show the live map
          </button>
        </>
      )}
    </div>
  );
}
