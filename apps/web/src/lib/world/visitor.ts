import { cookies, headers } from "next/headers";
import { isCountryCode } from "./currency";
import { COUNTRY_COOKIE, geoCountry } from "./geo";

export { COUNTRY_COOKIE } from "./geo";

/**
 * The visitor's country for a page drawn for them alone (search, shortlist): the one they chose, else
 * where they are, else none. Calling it makes the page dynamic, so cached pages never do.
 */
export async function visitorCountry(): Promise<string | null> {
  const chosen = (await cookies()).get(COUNTRY_COOKIE)?.value?.toUpperCase();
  if (chosen && isCountryCode(chosen)) return chosen;
  const h = await headers();
  return geoCountry((name) => h.get(name));
}
