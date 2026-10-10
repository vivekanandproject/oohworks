"use client";

import { useEffect, useRef } from "react";
import { LngLatBounds, Map as LiveMapGl, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  url: string;
  price: string | null;
}

/** The live map. Loaded only when someone asks for it, so it never slows the page it sits on. */
export default function LiveMap({
  points,
  styleUrl,
  here = false,
}: {
  points: MapPoint[];
  styleUrl: string;
  here?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = points[0];
    if (!ref.current || !first) return;
    const map = new LiveMapGl({
      container: ref.current,
      style: styleUrl,
      center: [first.lng, first.lat],
      zoom: 13,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const bounds = new LngLatBounds();
    for (const p of points) {
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = here ? "oh-mappin here" : "oh-mappin";
      pin.setAttribute("aria-label", p.title);

      const body = document.createElement("div");
      body.className = "oh-mappop";
      const title = document.createElement("b");
      title.textContent = p.title;
      body.append(title);
      const price = document.createElement("span");
      price.textContent = p.price ? `${p.price} / month` : "Price on request";
      body.append(price);
      if (!here) {
        const link = document.createElement("a");
        link.href = p.url;
        link.textContent = "View this site";
        body.append(link);
      }
      const popup = new Popup({ offset: 30, closeButton: false, maxWidth: "260px" }).setDOMContent(
        body,
      );
      new Marker({ element: pin, anchor: "bottom" })
        .setLngLat([p.lng, p.lat])
        .setPopup(popup)
        .addTo(map);
      bounds.extend([p.lng, p.lat]);
    }
    if (points.length > 1) map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
    else map.setZoom(15);
    return () => map.remove();
  }, [points, styleUrl, here]);

  return <div ref={ref} className="h-full w-full" data-section="live-map" />;
}
