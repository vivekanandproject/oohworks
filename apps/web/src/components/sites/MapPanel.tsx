"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import type { MapBox, MapPoint } from "./LiveMap";

const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => (
    <p className="t-small text-ink-muted grid h-full place-items-center">Loading the map…</p>
  ),
});

const KEY = "oh_map_live";

/**
 * Shows a still drawing of where the sites are, and swaps in the live map on request. Once a buyer has
 * asked for the live map on the results, it stays live while they keep filtering in the same tab.
 */
export function MapPanel({
  points,
  styleUrl,
  here = false,
  bbox,
  areaBase,
  remember = false,
  children,
}: {
  points: MapPoint[];
  styleUrl: string;
  here?: boolean;
  /** A search by map area opens straight on that area. */
  bbox?: MapBox | undefined;
  areaBase?: string | undefined;
  /** Keep the live map on across the buyer's next searches in this tab. */
  remember?: boolean;
  children: ReactNode;
}) {
  const [live, setLive] = useState(false);
  const [full, setFull] = useState(false);
  const hasBox = Boolean(bbox);

  useEffect(() => {
    let wanted = hasBox;
    if (!wanted && remember) {
      try {
        wanted = window.sessionStorage.getItem(KEY) === "1";
      } catch {
        wanted = false;
      }
    }
    if (wanted) setLive(true);
  }, [hasBox, remember]);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", full);
    return () => document.body.classList.remove("overflow-hidden");
  }, [full]);

  if (points.length === 0 && !hasBox) return <>{children}</>;

  const goLive = () => {
    setLive(true);
    if (!remember) return;
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      // Private windows may refuse storage; the map still opens.
    }
  };

  return (
    <div
      className={full ? "bg-paper-sunken fixed inset-0 z-50" : "relative h-full w-full"}
      data-map={live ? "live" : "still"}
      data-map-full={full ? "1" : "0"}
    >
      {live ? (
        <>
          <LiveMap
            points={points}
            styleUrl={styleUrl}
            here={here}
            bbox={bbox}
            areaBase={areaBase}
            fallback={children}
          />
          <button
            type="button"
            className="oh-btn secondary sm absolute bottom-3 left-3 lg:hidden"
            onClick={() => setFull((f) => !f)}
            data-action="map-full"
          >
            {full ? "Back to the list" : "Full screen"}
          </button>
        </>
      ) : (
        <>
          {children}
          <button
            type="button"
            className="oh-btn secondary sm absolute top-3 left-1/2 -translate-x-1/2"
            onClick={goLive}
          >
            Show the live map
          </button>
        </>
      )}
    </div>
  );
}
