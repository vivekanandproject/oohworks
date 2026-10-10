"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LngLatBounds,
  Map as LiveMapGl,
  Marker,
  NavigationControl,
  Popup,
  getVersion,
  setWorkerUrl,
} from "maplibre-gl";
import Supercluster from "supercluster";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  url: string;
  price: string | null;
}

/** West, south, east, north. */
export type MapBox = [number, number, number, number];

interface Drawn {
  marker: Marker;
  el: HTMLButtonElement;
  /** The sites this marker stands for: one for a pin, several for a cluster. */
  ids: string[];
}

/** The worker is served from this site (see scripts/copy-map-worker.mjs), not from beside the bundled library. */
let workerSet = false;
function loadOwnWorker() {
  if (workerSet) return;
  workerSet = true;
  setWorkerUrl(`/vendor/maplibre-gl-worker.mjs?v=${getVersion()}`);
}

const emit = (name: string, id: string | null) =>
  window.dispatchEvent(new CustomEvent(name, { detail: id }));

/**
 * The live map. Loaded only when someone asks for it, so it never slows the page it sits on.
 * Nearby sites gather into a counted cluster that splits as you zoom in. Pointing at a card lights
 * its pin, and the reverse; one pin is selected at a time.
 */
export default function LiveMap({
  points,
  styleUrl,
  here = false,
  bbox,
  areaBase,
  fallback,
}: {
  points: MapPoint[];
  styleUrl: string;
  /** A site page: the one pin shown is the site itself. */
  here?: boolean;
  /** Open on this area instead of fitting the pins. */
  bbox?: MapBox | undefined;
  /** The search address that "Search this area" adds the map's bounds to. Leave out to hide the button. */
  areaBase?: string | undefined;
  /** Shown in place of the map if this browser cannot draw one. */
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LiveMapGl | null>(null);
  const [moved, setMoved] = useState(false);
  const [failed, setFailed] = useState(false);
  const boxKey = bbox?.join(",") ?? "";

  useEffect(() => {
    const first = points[0];
    if (!ref.current) return;
    const box = boxKey ? (boxKey.split(",").map(Number) as MapBox) : null;
    const center: [number, number] = box
      ? [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2]
      : first
        ? [first.lng, first.lat]
        : [78.9, 21.1];
    loadOwnWorker();
    const holder = ref.current;
    let map: LiveMapGl;
    try {
      map = new LiveMapGl({
        container: holder,
        style: styleUrl,
        center,
        zoom: first || box ? 13 : 4,
        attributionControl: { compact: true },
      });
    } catch {
      // No WebGL, most often. The page carries on with the still drawing and the list.
      setFailed(true);
      return;
    }
    mapRef.current = map;
    // What the map itself reports, so a blank map is noticed rather than assumed to be fine.
    holder.dataset.mapState = "loading";
    map.once("load", () => (holder.dataset.mapState = "ready"));
    map.on("error", (e) => {
      if (!holder.dataset.mapError)
        holder.dataset.mapError = String(
          (e as { error?: { message?: string } }).error?.message ?? "error",
        ).slice(0, 160);
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const byId = new Map(points.map((p) => [p.id, p]));
    const index = new Supercluster<{ id: string }>({ radius: 56, maxZoom: 15 });
    index.load(
      points.map((p) => ({
        type: "Feature" as const,
        properties: { id: p.id },
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      })),
    );

    const drawn = new Map<string, Drawn>();
    const popup = new Popup({ offset: 30, closeButton: false, maxWidth: "260px" });
    let selected: string | null = here ? (first?.id ?? null) : null;
    let lit: string | null = null;

    const paint = () => {
      for (const d of drawn.values()) {
        d.el.classList.toggle("here", d.ids.length === 1 && d.ids[0] === selected);
        d.el.classList.toggle("lit", lit !== null && d.ids.includes(lit));
      }
    };

    const select = (id: string) => {
      const p = byId.get(id);
      if (!p) return;
      selected = id;
      paint();
      const body = document.createElement("div");
      body.className = "oh-mappop";
      const title = document.createElement("b");
      title.textContent = p.title;
      const price = document.createElement("span");
      price.textContent = p.price ? `${p.price} / month` : "Price on request";
      body.append(title, price);
      if (!here) {
        const quick = document.createElement("a");
        quick.href = p.url;
        quick.dataset.quick = p.id;
        quick.textContent = "Quick view";
        const full = document.createElement("a");
        full.href = p.url;
        full.textContent = "Open full page";
        body.append(quick, full);
        emit("oh:pin-select", id);
      }
      popup.setLngLat([p.lng, p.lat]).setDOMContent(body).addTo(map);
    };

    const draw = () => {
      const b = map.getBounds();
      const seen = new Set<string>();
      for (const f of index.getClusters(
        [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        Math.floor(map.getZoom()),
      )) {
        const [lng = 0, lat = 0] = f.geometry.coordinates;
        const props = f.properties as {
          cluster?: boolean;
          cluster_id?: number;
          point_count?: number;
          id?: string;
        };
        const clusterId = props.cluster ? props.cluster_id : undefined;
        const key = clusterId !== undefined ? `c${clusterId}` : `p${props.id}`;
        seen.add(key);
        if (drawn.has(key)) continue;
        const el = document.createElement("button");
        el.type = "button";
        let ids: string[];
        if (clusterId !== undefined) {
          ids = index.getLeaves(clusterId, Infinity).map((leaf) => leaf.properties.id);
          el.className = "oh-cluster";
          el.textContent = String(props.point_count ?? ids.length);
          el.setAttribute("aria-label", `${ids.length} sites here. Zoom in to see them.`);
          el.addEventListener("click", () =>
            map.easeTo({
              center: [lng, lat],
              zoom: Math.min(index.getClusterExpansionZoom(clusterId), 17),
            }),
          );
        } else {
          const id = props.id ?? "";
          ids = [id];
          el.className = "oh-mappin";
          el.setAttribute("aria-label", byId.get(id)?.title ?? "Site");
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            select(id);
          });
          if (!here) {
            el.addEventListener("mouseenter", () => emit("oh:pin-hover", id));
            el.addEventListener("mouseleave", () => emit("oh:pin-hover", null));
            el.addEventListener("focus", () => emit("oh:pin-hover", id));
            el.addEventListener("blur", () => emit("oh:pin-hover", null));
          }
        }
        el.dataset.ids = ids.join(",");
        const marker = new Marker({
          element: el,
          anchor: clusterId !== undefined ? "center" : "bottom",
        })
          .setLngLat([lng, lat])
          .addTo(map);
        drawn.set(key, { marker, el, ids });
      }
      for (const [key, d] of drawn) {
        if (seen.has(key)) continue;
        d.marker.remove();
        drawn.delete(key);
      }
      paint();
    };

    if (box) {
      map.fitBounds(
        [
          [box[0], box[1]],
          [box[2], box[3]],
        ],
        { padding: 0, duration: 0 },
      );
    } else if (points.length > 1) {
      const bounds = new LngLatBounds();
      for (const p of points) bounds.extend([p.lng, p.lat]);
      map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
    } else if (first) {
      map.setZoom(15);
    }
    draw();
    map.on("moveend", (e) => {
      draw();
      // Only a move the visitor made offers a new search; the map settling by itself does not.
      if ((e as { originalEvent?: unknown }).originalEvent) setMoved(true);
    });
    map.on("click", () => popup.remove());

    const onCard = (e: Event) => {
      lit = (e as CustomEvent<string | null>).detail;
      paint();
    };
    window.addEventListener("oh:card-hover", onCard);
    return () => {
      window.removeEventListener("oh:card-hover", onCard);
      map.remove();
      mapRef.current = null;
    };
  }, [points, styleUrl, here, boxKey]);

  const searchHere = () => {
    const map = mapRef.current;
    if (!map || !areaBase) return;
    const b = map.getBounds();
    const url = new URL(areaBase, window.location.origin);
    url.searchParams.set(
      "bbox",
      [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => n.toFixed(4)).join(","),
    );
    window.location.assign(`${url.pathname}${url.search.replace(/%2C/g, ",")}`);
  };

  if (failed) {
    return (
      <div className="relative h-full w-full" data-section="live-map" data-map-state="failed">
        {fallback}
        <p className="t-small bg-paper-raised text-ink absolute top-3 left-1/2 w-[min(280px,90%)] -translate-x-1/2 rounded-sm px-3 py-2 text-center">
          The live map could not start in this browser. The list still has every site.
        </p>
      </div>
    );
  }

  return (
    <>
      <div ref={ref} className="h-full w-full" data-section="live-map" />
      {areaBase && moved ? (
        <button
          type="button"
          className="oh-btn primary sm shadow-float absolute top-3 left-1/2 -translate-x-1/2"
          onClick={searchHere}
          data-action="search-area"
        >
          Search this area
        </button>
      ) : null}
    </>
  );
}
