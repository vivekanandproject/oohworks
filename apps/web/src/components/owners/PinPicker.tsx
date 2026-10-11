"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { readCoords } from "@/lib/owners/coords";
import { CITY_CENTRE, type CitySlug } from "@/lib/sites/taxonomy";

const PinMap = dynamic(() => import("./PinMap"), {
  ssr: false,
  loading: () => (
    <p className="t-small text-ink-muted grid h-full place-items-center">Loading the map…</p>
  ),
});

/**
 * Where a site is. Three ways to say it, all filling the same two numbers: press on a map, paste
 * coordinates or a Google Maps link, or type them. The fields are ordinary inputs, so they work
 * without script and keep whatever was typed before the page finished loading.
 */
export function PinPicker({
  lat,
  lng,
  place,
  styleUrl,
  errors,
}: {
  lat: string;
  lng: string;
  place: string;
  styleUrl: string;
  errors: { lat?: string | undefined; lng?: string | undefined; place?: string | undefined };
}) {
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<{
    start: [number, number];
    pin: [number, number] | null;
  } | null>(null);
  const [missed, setMissed] = useState(false);

  const set = (la: number, lo: number) => {
    if (latRef.current) latRef.current.value = la.toFixed(5);
    if (lngRef.current) lngRef.current.value = lo.toFixed(5);
  };
  const openMap = () => {
    const la = Number(latRef.current?.value);
    const lo = Number(lngRef.current?.value);
    const has =
      latRef.current?.value.trim() !== "" &&
      lngRef.current?.value.trim() !== "" &&
      Number.isFinite(la) &&
      Number.isFinite(lo);
    const city = document.querySelector<HTMLSelectElement>("select[name='city']")?.value as
      CitySlug | undefined;
    setOpen({
      start: (city && CITY_CENTRE[city]) || CITY_CENTRE.bengaluru,
      pin: has ? [lo, la] : null,
    });
  };
  const onPaste = (value: string) => {
    const found = readCoords(value);
    setMissed(value.trim() !== "" && !found);
    if (found) set(found.lat, found.lng);
  };

  return (
    <div className="flex flex-col gap-4" data-section="pin-picker">
      {open ? (
        <>
          <div className="border-hairline bg-paper-sunken h-[280px] overflow-hidden rounded-md border">
            <PinMap
              styleUrl={styleUrl}
              start={open.start}
              pin={open.pin}
              onPick={(la, lo) => {
                set(la, lo);
                if (placeRef.current) placeRef.current.value = "";
                setMissed(false);
              }}
            />
          </div>
          <p className="t-small text-ink-muted">
            Press where the site stands. Drag the pin to adjust it.
          </p>
        </>
      ) : (
        <button
          type="button"
          className="oh-btn secondary"
          onClick={openMap}
          data-action="open-pin-map"
        >
          Place the pin on a map
        </button>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="site-lat" className="oh-label block">
            Latitude
          </label>
          <input
            ref={latRef}
            id="site-lat"
            name="lat"
            type="text"
            inputMode="decimal"
            defaultValue={lat}
            placeholder="12.93512"
            aria-invalid={errors.lat ? true : undefined}
            aria-describedby={errors.lat ? "site-lat-error" : undefined}
            className="oh-input data mt-1"
          />
          {errors.lat ? (
            <p id="site-lat-error" className="t-small text-critical mt-1" data-field-error="lat">
              {errors.lat}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="site-lng" className="oh-label block">
            Longitude
          </label>
          <input
            ref={lngRef}
            id="site-lng"
            name="lng"
            type="text"
            inputMode="decimal"
            defaultValue={lng}
            placeholder="77.62214"
            aria-invalid={errors.lng ? true : undefined}
            aria-describedby={errors.lng ? "site-lng-error" : undefined}
            className="oh-input data mt-1"
          />
          {errors.lng ? (
            <p id="site-lng-error" className="t-small text-critical mt-1" data-field-error="lng">
              {errors.lng}
            </p>
          ) : null}
        </div>
      </div>
      <div>
        <label htmlFor="site-place" className="oh-label block">
          Or paste coordinates or a Google Maps link
        </label>
        <input
          ref={placeRef}
          id="site-place"
          name="place"
          type="text"
          defaultValue={place}
          onChange={(e) => onPaste(e.target.value)}
          placeholder="12.93512, 77.62214"
          aria-describedby="site-place-help"
          className="oh-input data mt-1"
        />
        <p
          id="site-place-help"
          className={`t-small mt-1 ${missed || errors.place ? "text-critical" : "text-ink-muted"}`}
          role={missed ? "status" : undefined}
          {...(errors.place ? { "data-field-error": "place" } : {})}
        >
          {missed || errors.place
            ? (errors.place ??
              "We could not find a position in that. A short “maps.app.goo.gl” link does not hold one: open it and copy the long address.")
            : "It fills the two numbers above. Five decimal places is about a metre."}
        </p>
      </div>
    </div>
  );
}
