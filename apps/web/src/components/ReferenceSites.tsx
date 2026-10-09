import type { CSSProperties } from "react";
import { Badge, Container, Icon, Reveal, WorldMap } from "@ohworks/ui";
import { WORLD_SITES } from "@/lib/world-sites";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** The open map with twelve reference sites, each as a registry plate. */
export function ReferenceSites() {
  return (
    <section className="border-hairline border-b" data-section="world">
      <Container className="py-12 lg:py-16">
        <Reveal>
          <div className="mx-auto max-w-[60ch] text-center">
            <p className="t-label text-ink-muted">Sites across the world</p>
            <h2 className="t-display-md mt-3">One registry, every street</h2>
            <p className="t-body text-ink-muted mt-4">
              From a hoarding at Silk Board to the screens at Shibuya, every face is recorded the
              same way: where it stands, what it is, and who sells it.
            </p>
          </div>
        </Reveal>
        <div className="border-hairline bg-paper-sunken mt-8 rounded-md border p-3 sm:p-5">
          <WorldMap
            title="A dot map of the world with pins on twelve well-known out-of-home sites, from London and New York to Mumbai, Bengaluru, Tokyo and Sydney"
            pins={WORLD_SITES.map((s) => ({
              id: s.id,
              lat: s.lat,
              lon: s.lon,
              label: s.city,
              ...(s.labelSide ? { labelSide: s.labelSide } : {}),
            }))}
          />
        </div>
        <Reveal stagger>
          <ul className="snap-row mt-6" aria-label="Reference sites">
            {WORLD_SITES.map((s, i) => (
              <li
                key={s.id}
                className="oh-panel border-hairline bg-paper-raised rounded-md border p-4"
                data-stagger-item
                style={at(i)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-ink">
                    <Icon name={s.icon} size={24} />
                  </span>
                  <Badge kind="neutral">Reference</Badge>
                </div>
                <h3 className="t-body-strong mt-3">{s.city}</h3>
                <p className="t-small text-ink-muted">{s.country}</p>
                <p className="t-body text-ink mt-3">{s.name}</p>
                <p className="t-small text-ink-muted">{s.format}</p>
                <p
                  className="t-data-sm text-ink-muted mt-3"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {s.lat.toFixed(5)}, {s.lon.toFixed(5)}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="t-small text-ink-muted mx-auto mt-6 max-w-[70ch] text-center">
          Reference sites, shown to illustrate the record. They are not listed for enquiry; owners
          list their own sites free, and every listing names its owner.
        </p>
      </Container>
    </section>
  );
}
