import { NativeSelect } from "@/components/NativeSelect";
import { PHONE_COUNTRIES } from "@/lib/phone";

const OPTIONS = PHONE_COUNTRIES.map((c) => ({ value: c.code, label: `${c.name} (${c.dial})` }));

/**
 * A phone number from any country: the country in a list, the number typed the way it is written at
 * home. Two ordinary fields, so it needs no script. The label on the page belongs to the number.
 */
export function PhoneField({
  id,
  country,
  number,
  required,
  invalid,
  describedBy,
}: {
  id: string;
  /** ISO country code chosen in the list. */
  country: string;
  /** The number as typed, or as it would be written within the country. */
  number: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <div className="mt-1 grid gap-4 sm:grid-cols-2">
      <NativeSelect
        id={`${id}-country`}
        name="phoneCountry"
        value={country}
        options={OPTIONS}
        aria-label="Country calling code"
        autoComplete="tel-country-code"
        className="oh-input"
      />
      <input
        id={id}
        name="phone"
        type="tel"
        inputMode="tel"
        required={required}
        maxLength={32}
        defaultValue={number}
        autoComplete="tel-national"
        aria-describedby={describedBy}
        aria-invalid={invalid ? true : undefined}
        className="oh-input data scroll-mt-10"
      />
    </div>
  );
}
