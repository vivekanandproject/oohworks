"use client";

import { useEffect, useRef, useState } from "react";
import { Map as PinMapGl, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadOwnWorker } from "@/components/sites/mapWorker";

/**
 * A map to place one pin on. Press to drop it, drag to adjust. Each move is reported with five
 * decimal places, which is about a metre: enough to tell one side of a junction from the other.
 */
export default function PinMap({
  styleUrl,
  start,
  pin,
  onPick,
}: {
  styleUrl: string;
  start: [number, number];
  pin: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // The picker reports through this, so re-rendering the form never rebuilds the map.
  const report = useRef(onPick);
  useEffect(() => {
    report.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!ref.current) return;
    loadOwnWorker();
    let map: PinMapGl;
    try {
      map = new PinMapGl({
        container: ref.current,
        style: styleUrl,
        center: pin ?? start,
        zoom: pin ? 16 : 11,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const el = document.createElement("div");
    el.className = "oh-mappin here";
    let marker: Marker | null = null;
    const place = (lng: number, lat: number) => {
      if (!marker) {
        marker = new Marker({ element: el, anchor: "bottom", draggable: true })
          .setLngLat([lng, lat])
          .addTo(map);
        marker.on("dragend", () => {
          const at = marker?.getLngLat();
          if (at) report.current(Number(at.lat.toFixed(5)), Number(at.lng.toFixed(5)));
        });
      } else marker.setLngLat([lng, lat]);
    };
    if (pin) place(pin[0], pin[1]);
    map.on("click", (e) => {
      place(e.lngLat.lng, e.lngLat.lat);
      report.current(Number(e.lngLat.lat.toFixed(5)), Number(e.lngLat.lng.toFixed(5)));
    });
    return () => map.remove();
    // The map is built once. Later positions come from the visitor's own presses on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  if (failed)
    return (
      <p className="t-small text-ink-muted grid h-full place-items-center px-6 text-center">
        The map could not start in this browser. Type the latitude and longitude, or paste a Google
        Maps link.
      </p>
    );
  return <div ref={ref} className="h-full w-full" data-section="pin-map" />;
}
