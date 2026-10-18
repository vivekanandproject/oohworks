/**
 * Test data goes only into a database whose name ends in `_test`, which `pnpm test:db` makes (see
 * scripts/test-env.mjs). Called before anything connects, so a wrong address is refused untouched.
 */
export function assertTestDatabase(): void {
  let name = "";
  try {
    name = new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);
  } catch {
    // No address, or not one; refused below.
  }
  if (!/_test$/.test(name))
    throw new Error(
      `Test data goes only into a test database, whose name ends in _test, not "${name || "none"}". ` +
        "Run pnpm --filter @ohworks/web test:db.",
    );
}
