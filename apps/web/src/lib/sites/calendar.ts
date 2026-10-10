const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const INDIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar date in India for a moment in time, as YYYY-MM-DD. */
export function indiaDate(ms: number): string {
  return INDIA.format(new Date(ms));
}

export interface CalendarDay {
  n: number;
  iso: string;
  state: "past" | "booked" | "free";
}

export interface MonthView {
  key: string;
  label: string;
  /** Empty cells before the 1st, with the week starting on Monday. */
  blanks: number;
  days: CalendarDay[];
  prev: string | null;
  next: string | null;
}

const pad = (n: number): string => String(n).padStart(2, "0");
const shift = (key: string, by: number): string => {
  const [y = 0, m = 1] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

/** How many months ahead a buyer can page through. */
export const MONTHS_AHEAD = 11;

/**
 * One month of an owner's calendar. A day is booked up to and including the "booked until" date;
 * every later day is free. Days before today carry no claim at all.
 */
export function monthView(
  param: string | undefined,
  bookedUntil: string | null | undefined,
  now: number,
): MonthView {
  const today = indiaDate(now);
  const first = today.slice(0, 7);
  const last = shift(first, MONTHS_AHEAD);
  const key =
    param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param) && param >= first && param <= last
      ? param
      : first;
  const [y = 0, m = 1] = key.split("-").map(Number);
  const booked = bookedUntil ? indiaDate(new Date(bookedUntil).getTime()) : null;
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days: CalendarDay[] = Array.from({ length: count }, (_, i) => {
    const iso = `${key}-${pad(i + 1)}`;
    return {
      n: i + 1,
      iso,
      state: iso < today ? "past" : booked && iso <= booked ? "booked" : "free",
    };
  });
  return {
    key,
    label: `${MONTHS[m - 1] ?? ""} ${y}`,
    blanks: (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7,
    days,
    prev: key > first ? shift(key, -1) : null,
    next: key < last ? shift(key, 1) : null,
  };
}
