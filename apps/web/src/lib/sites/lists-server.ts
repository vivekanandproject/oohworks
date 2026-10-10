import { cookies } from "next/headers";
import { LISTS, parseIds } from "./lists";

export interface Lists {
  saved: string[];
  compare: string[];
}

/** The buyer's shortlist and compare picks, read from their own browser's cookies. */
export async function readLists(): Promise<Lists> {
  const jar = await cookies();
  return {
    saved: parseIds(jar.get(LISTS.saved.cookie)?.value, LISTS.saved.max),
    compare: parseIds(jar.get(LISTS.compare.cookie)?.value, LISTS.compare.max),
  };
}
