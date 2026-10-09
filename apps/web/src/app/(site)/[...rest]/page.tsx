import { notFound } from "next/navigation";

/** Every URL that matches no site route renders the site's 404 with a real 404 status. */
export default function CatchAll() {
  notFound();
}
