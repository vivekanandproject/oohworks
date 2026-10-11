"use client";

import { useEffect, useId, useRef, useState } from "react";

interface Suggestion {
  id: string;
  label: string;
  detail: string;
}

export interface PickedPlace {
  id: string;
  label: string;
  locality: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  /** The ohworks city this place belongs to, if it is in one. */
  city: string | null;
}

const CREDIT: Record<string, string> = {
  google: "Powered by Google",
  photon: "Search © OpenStreetMap contributors",
};

function token(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * A box for a place anywhere in the world. As the visitor types, matching places are offered, and
 * picking one records where it is. It is an ordinary text box first: with no script, or with a place
 * the search does not know, what was typed is what is sent.
 *
 * Given a `name`, it sends `{name}Label` and, for a picked place, `{name}Id`, `{name}Lat`,
 * `{name}Lng` and `{name}Country`. Without one it sends nothing and only reports the pick.
 */
export function PlaceField({
  id,
  name,
  scope = "city",
  defaultLabel = "",
  defaults,
  required,
  invalid,
  describedBy,
  placeholder,
  className = "oh-input mt-1",
  phone,
  onPick,
}: {
  id: string;
  name?: string;
  scope?: "city" | "any";
  defaultLabel?: string;
  defaults?: { id?: string; lat?: string; lng?: string; country?: string };
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  className?: string;
  /** A country list to move to the picked place's country, for as long as its number is empty. */
  phone?: { countryId: string; numberId: string };
  onPick?: (place: PickedPlace) => void;
}) {
  const listId = useId();
  const box = useRef<HTMLInputElement>(null);
  const hidden = useRef<Record<"id" | "lat" | "lng" | "country", HTMLInputElement | null>>({
    id: null,
    lat: null,
    lng: null,
    country: null,
  });
  const timer = useRef<number | undefined>(undefined);
  const asked = useRef(0);
  const session = useRef("");
  const live = useRef<AbortController | null>(null);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [source, setSource] = useState("");

  // A question still on its way when the page is left is called off, so the browser has nothing to
  // report as a failed request.
  useEffect(() => {
    const stop = () => {
      window.clearTimeout(timer.current);
      live.current?.abort();
    };
    window.addEventListener("submit", stop, true);
    window.addEventListener("pagehide", stop);
    return () => {
      stop();
      window.removeEventListener("submit", stop, true);
      window.removeEventListener("pagehide", stop);
    };
  }, []);

  const ask = (url: string): Promise<unknown> => {
    live.current?.abort();
    live.current = new AbortController();
    return fetch(url, { signal: live.current.signal }).then((res) => res.json());
  };

  const record = (v: { id: string; lat: string; lng: string; country: string }) => {
    for (const key of ["id", "lat", "lng", "country"] as const) {
      const el = hidden.current[key];
      if (el) el.value = v[key];
    }
  };

  const onType = (value: string) => {
    // What was picked no longer describes what is in the box.
    record({ id: "", lat: "", lng: "", country: "" });
    window.clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) {
      asked.current += 1;
      setItems([]);
      setOpen(false);
      return;
    }
    timer.current = window.setTimeout(() => {
      const mine = ++asked.current;
      if (!session.current) session.current = token();
      ask(`/api/places/?q=${encodeURIComponent(q)}&scope=${scope}&s=${session.current}`)
        .then((found) => {
          const data = found as { provider?: string; suggestions?: Suggestion[] };
          if (mine !== asked.current) return;
          setItems(data.suggestions ?? []);
          setSource(data.provider ?? "");
          setActive(-1);
          setOpen(true);
        })
        .catch(() => {
          if (mine === asked.current) setOpen(false);
        });
    }, 220);
  };

  const pick = (item: Suggestion) => {
    const full = item.detail ? `${item.label}, ${item.detail}` : item.label;
    if (box.current) box.current.value = full;
    asked.current += 1;
    setOpen(false);
    setItems([]);
    const s = session.current;
    session.current = "";
    ask(`/api/places/detail/?id=${encodeURIComponent(item.id)}&s=${s}`)
      .then((found) => {
        const data = found as { place?: Omit<PickedPlace, "city"> | null; city?: string | null };
        const place = data.place;
        // The visitor may have typed on while this was fetched.
        if (!place || box.current?.value !== full) return;
        record({
          id: item.id.startsWith("g:") ? item.id.slice(2) : "",
          lat: place.lat === null ? "" : String(place.lat),
          lng: place.lng === null ? "" : String(place.lng),
          country: place.countryCode ?? "",
        });
        if (phone && place.countryCode) {
          const list = document.getElementById(phone.countryId) as HTMLSelectElement | null;
          const number = document.getElementById(phone.numberId) as HTMLInputElement | null;
          const offered = list && [...list.options].some((o) => o.value === place.countryCode);
          if (list && offered && number && number.value.trim() === "")
            list.value = place.countryCode;
        }
        onPick?.({ ...place, city: data.city ?? null });
      })
      .catch(() => undefined);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!items.length) {
      if (e.key === "Enter" && !name) e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + step + items.length) % items.length);
    } else if (e.key === "Enter" && open && active >= 0) {
      // Enter chooses the lit place. It does not send the form.
      e.preventDefault();
      const item = items[active];
      if (item) pick(item);
    } else if (e.key === "Enter" && !name) {
      // A search box that sends nothing of its own must not send the form around it either.
      e.preventDefault();
      if (items[0]) pick(items[0]);
    }
  };

  const showing = open && (items.length > 0 || source !== "");
  return (
    <div className="relative">
      <input
        ref={box}
        id={id}
        {...(name ? { name: `${name}Label` } : {})}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showing}
        aria-controls={listId}
        aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        required={required}
        maxLength={160}
        defaultValue={defaultLabel}
        placeholder={placeholder}
        className={className}
        onChange={(e) => onType(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => setOpen(false)}
        onFocus={() => {
          if (items.length) setOpen(true);
        }}
      />
      {name
        ? (["id", "lat", "lng", "country"] as const).map((key) => (
            <input
              key={key}
              ref={(el) => {
                hidden.current[key] = el;
              }}
              type="hidden"
              name={`${name}${key[0]?.toUpperCase()}${key.slice(1)}`}
              defaultValue={defaults?.[key] ?? ""}
            />
          ))
        : null}
      <ul
        id={listId}
        role="listbox"
        aria-label="Matching places"
        hidden={!showing}
        className="border-hairline bg-paper-raised shadow-float absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-sm border"
        data-section="place-options"
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className={`flex min-h-11 cursor-pointer flex-col justify-center px-3 py-2 ${i === active ? "bg-navy-200" : "hover:bg-paper-sunken"}`}
            // Keeps the box focused, so the press is a choice and not a blur.
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => pick(item)}
          >
            <span className="text-ink text-[15px] leading-[22px] font-medium">{item.label}</span>
            {item.detail ? <span className="t-small text-ink-muted">{item.detail}</span> : null}
          </li>
        ))}
        {items.length === 0 ? (
          <li role="presentation" className="t-small text-ink-muted px-3 py-2.5">
            No place found by that name. You can keep what you typed.
          </li>
        ) : null}
        {CREDIT[source] ? (
          <li
            role="presentation"
            className="border-hairline t-small text-ink-muted border-t px-3 py-1.5 text-right"
          >
            {CREDIT[source]}
          </li>
        ) : null}
      </ul>
      <p className="sr-only" role="status">
        {showing
          ? items.length === 1
            ? "1 place found. Use the arrow keys to choose it."
            : `${items.length} places found.${items.length ? " Use the arrow keys to choose one." : ""}`
          : ""}
      </p>
    </div>
  );
}
