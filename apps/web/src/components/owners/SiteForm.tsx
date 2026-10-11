import type { ReactNode } from "react";
import type { FieldErrors, FieldKey, Raw } from "@/lib/owners/site-input";
import { CITIES, FORMATS, LIGHTING } from "@/lib/sites/taxonomy";
import { NativeSelect } from "@/components/NativeSelect";
import { FormSection } from "./Frame";
import { PinPicker } from "./PinPicker";

function Field({
  name,
  label,
  raw,
  errors,
  help,
  mono,
  affix,
  placeholder,
  type = "text",
  inputMode,
  list,
}: {
  name: FieldKey;
  label: string;
  raw: Raw;
  errors: FieldErrors;
  help?: string;
  mono?: boolean;
  affix?: string;
  placeholder?: string;
  type?: "text" | "date";
  inputMode?: "decimal" | "numeric";
  list?: string;
}) {
  const error = errors[name];
  const id = `site-${name}`;
  const input = (
    <input
      id={id}
      name={name}
      type={type}
      inputMode={inputMode}
      list={list}
      defaultValue={raw[name] ?? ""}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
      className={`oh-input ${mono ? "data" : ""}`}
    />
  );
  return (
    <div>
      <label htmlFor={id} className="oh-label block">
        {label}
      </label>
      <div className={affix ? "oh-affix mt-1" : "mt-1"}>
        {affix ? <span aria-hidden="true">{affix}</span> : null}
        {input}
      </div>
      {error ? (
        <p id={`${id}-error`} className="t-small text-critical mt-1" data-field-error={name}>
          {error}
        </p>
      ) : help ? (
        <p id={`${id}-help`} className="t-small text-ink-muted mt-1">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function Choice({
  name,
  label,
  raw,
  errors,
  options,
}: {
  name: FieldKey;
  label: string;
  raw: Raw;
  errors: FieldErrors;
  options: readonly { slug: string; label: string }[];
}) {
  const error = errors[name];
  const id = `site-${name}`;
  return (
    <div>
      <label htmlFor={id} className="oh-label block">
        {label}
      </label>
      <NativeSelect
        id={id}
        name={name}
        value={raw[name] ?? ""}
        placeholder="Choose…"
        options={options.map((o) => ({ value: o.slug, label: o.label }))}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="oh-input mt-1"
      />
      {error ? (
        <p id={`${id}-error`} className="t-small text-critical mt-1" data-field-error={name}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Part({
  n,
  title,
  children,
  note,
}: {
  n: number;
  title: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <FormSection n={n} title={title} note={note}>
      {children}
    </FormSection>
  );
}

const Radios = ({
  name,
  value,
  options,
}: {
  name: string;
  value: string;
  options: [string, string][];
}) => (
  <div className="flex flex-wrap gap-x-6">
    {options.map(([v, label]) => (
      <label key={v} className="t-body flex min-h-11 cursor-pointer items-center gap-2">
        <input
          type="radio"
          name={name}
          value={v}
          defaultChecked={value === v}
          className="accent-navy h-[18px] w-[18px]"
        />
        {label}
      </label>
    ))}
  </div>
);

/**
 * One site, in five short parts. Every field is one an owner can answer from memory, and each problem
 * is shown beside the field it belongs to, in words that say what to do.
 */
export function SiteForm({
  raw,
  errors,
  id,
  availability,
  styleUrl,
}: {
  raw: Raw;
  errors: FieldErrors;
  id?: string | undefined;
  availability: "free" | "booked";
  styleUrl: string;
}) {
  const count = Object.keys(errors).length;
  return (
    <form
      method="post"
      action="/api/owner/site/"
      className="flex flex-col gap-6"
      data-section="site-form"
      noValidate
    >
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {count ? (
        <div className="oh-toast error" role="alert" data-section="site-errors">
          <span className="dot" />
          <div>
            <div className="t">
              {count === 1
                ? "One thing to fix before this can be saved."
                : `${count} things to fix before this can be saved.`}
            </div>
            <div className="d">Each is marked beside its field. Nothing you typed was lost.</div>
          </div>
        </div>
      ) : null}

      <Part n={1} title="What it is">
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice name="format" label="Format" raw={raw} errors={errors} options={FORMATS} />
          <Choice name="lighting" label="Lighting" raw={raw} errors={errors} options={LIGHTING} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="width"
            label="Width"
            raw={raw}
            errors={errors}
            mono
            inputMode="decimal"
            placeholder="20"
          />
          <Field
            name="height"
            label="Height"
            raw={raw}
            errors={errors}
            mono
            inputMode="decimal"
            placeholder="10"
          />
          <div>
            <label htmlFor="site-unit" className="oh-label block">
              Measured in
            </label>
            <NativeSelect
              id="site-unit"
              name="unit"
              value={raw.unit === "m" ? "m" : "ft"}
              options={[
                { value: "ft", label: "Feet" },
                { value: "m", label: "Metres" },
              ]}
              className="oh-input mt-1"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="litHours"
            label="Lit hours, optional"
            raw={raw}
            errors={errors}
            placeholder="6 pm to 11 pm"
          />
          <Field
            name="ownerRef"
            label="Your own reference, optional"
            raw={raw}
            errors={errors}
            mono
            placeholder="KRM-014"
            help="Only you see this. It matches a spreadsheet later."
          />
        </div>
      </Part>

      <Part n={2} title="Where it is">
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice name="city" label="City" raw={raw} errors={errors} options={CITIES} />
          <Field name="locality" label="Area" raw={raw} errors={errors} placeholder="Koramangala" />
        </div>
        <Field
          name="road"
          label="Road"
          raw={raw}
          errors={errors}
          placeholder="80 Feet Road"
          help="How a buyer would name the road."
        />
        <Field
          name="landmark"
          label="Landmark, optional"
          raw={raw}
          errors={errors}
          placeholder="opposite Sony Signal"
        />
        <PinPicker
          lat={raw.lat ?? ""}
          lng={raw.lng ?? ""}
          place={raw.place ?? ""}
          styleUrl={styleUrl}
          errors={{ lat: errors.lat, lng: errors.lng, place: errors.place }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="facing"
            label="Faces, in degrees, optional"
            raw={raw}
            errors={errors}
            mono
            inputMode="numeric"
            placeholder="225"
            help="The way the face points. North is 0, east 90, south 180, west 270."
          />
          <Field
            name="traffic"
            label="Traffic it faces, optional"
            raw={raw}
            errors={errors}
            placeholder="north-bound"
          />
        </div>
      </Part>

      <Part
        n={3}
        title="Price and terms"
        note="You choose whether buyers see your rate. A private price is never a penalty."
      >
        <fieldset>
          <legend className="oh-label">How the price shows</legend>
          <Radios
            name="priceDisplay"
            value={raw.priceDisplay || "exact"}
            options={[
              ["exact", "Exact rate"],
              ["from", "“From” price"],
              ["on_request", "Price on request"],
            ]}
          />
        </fieldset>
        <Field
          name="rate"
          label="Rate a month"
          raw={raw}
          errors={errors}
          mono
          affix="₹"
          inputMode="numeric"
          placeholder="85,000"
          help="In rupees, before taxes. Leave empty only if the price is on request."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="minPeriod"
            label="Minimum period, optional"
            raw={raw}
            errors={errors}
            placeholder="3 months"
          />
          <Field
            name="productionCost"
            label="Printing and mounting, optional"
            raw={raw}
            errors={errors}
            placeholder="₹ 18,000 once, by the owner"
          />
        </div>
        <Field
          name="notAccepted"
          label="Categories you do not accept, optional"
          raw={raw}
          errors={errors}
          placeholder="Alcohol, tobacco"
        />
      </Part>

      <Part
        n={4}
        title="Availability"
        note="Saving this confirms it as of today, which earns the “Updated” badge."
      >
        <Radios
          name="availability"
          value={availability}
          options={[
            ["free", "It is free now"],
            ["booked", "It is booked until a date"],
          ]}
        />
        <Field
          name="bookedUntil"
          label="Booked until, if it is booked"
          raw={raw}
          errors={errors}
          type="date"
          mono
        />
      </Part>

      <Part
        n={5}
        title="Audience, permit and artwork"
        note="All optional. Each one you can fill in moves the listing up."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="audienceFigure"
            label="People a week"
            raw={raw}
            errors={errors}
            mono
            inputMode="numeric"
            placeholder="4,20,000"
          />
          <Field
            name="audienceSource"
            label="Who measured it"
            raw={raw}
            errors={errors}
            placeholder="RoadStar"
          />
          <Field
            name="audienceDate"
            label="Measured on"
            raw={raw}
            errors={errors}
            type="date"
            mono
          />
          <Field
            name="audienceMetric"
            label="What it counts"
            raw={raw}
            errors={errors}
            placeholder="weekly impressions, adults 18+"
          />
        </div>
        <p className="t-small bg-lit-tint text-ink rounded-sm px-3 py-2">
          A figure is shown only with its source and the date it was measured. Without them, leave
          it empty.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="permitNumber" label="Permit number" raw={raw} errors={errors} mono />
          <Field
            name="permitAuthority"
            label="Issued by"
            raw={raw}
            errors={errors}
            placeholder="BBMP"
          />
          <Field name="permitExpires" label="Valid to" raw={raw} errors={errors} type="date" mono />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="artworkSpec"
            label="Artwork size"
            raw={raw}
            errors={errors}
            placeholder="20 × 10 ft at 30 dpi"
          />
          <Field
            name="fileTypes"
            label="File type"
            raw={raw}
            errors={errors}
            placeholder="PDF or TIFF, CMYK"
          />
          <Field
            name="leadTimeDays"
            label="Lead time, days"
            raw={raw}
            errors={errors}
            mono
            inputMode="numeric"
            placeholder="7"
          />
        </div>
        <details>
          <summary className="oh-link t-body cursor-pointer">
            For a screen: resolution, spot and loop
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field
              name="resolution"
              label="Resolution"
              raw={raw}
              errors={errors}
              mono
              placeholder="1920 × 1080"
            />
            <Field
              name="spotSeconds"
              label="Spot, seconds"
              raw={raw}
              errors={errors}
              mono
              inputMode="numeric"
              placeholder="10"
            />
            <Field
              name="loopSeconds"
              label="Loop, seconds"
              raw={raw}
              errors={errors}
              mono
              inputMode="numeric"
              placeholder="60"
            />
            <Field
              name="advertisers"
              label="Advertisers in the loop"
              raw={raw}
              errors={errors}
              mono
              inputMode="numeric"
              placeholder="6"
            />
          </div>
        </details>
      </Part>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="oh-btn primary lg" data-action="save-site">
          {id ? "Save the changes" : "Save this site"}
        </button>
        <p className="t-small text-ink-muted">
          Saved as a draft. Only you can see it until you send it for review. Photographs come next.
        </p>
      </div>
    </form>
  );
}
