import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">ohworks</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        The open map of out-of-home, where the owner is always the seller.
      </p>
      <ul className="mt-8 list-disc space-y-2 pl-5">
        <li>
          <Link
            className="underline"
            href="/in/bengaluru/koramangala/hoarding-80-feet-road-ow8k3x2/"
          >
            Sample unit page (200, JSON-LD)
          </Link>
        </li>
        <li>
          <Link className="underline" href="/in/nowhere/">
            Hub below threshold (404)
          </Link>
        </li>
        <li>
          <Link className="underline" href="/api/health/">
            Health
          </Link>
        </li>
      </ul>
    </main>
  );
}
