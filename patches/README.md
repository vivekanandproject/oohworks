# Patches

Applied by `pnpm install` from the `pnpm.patchedDependencies` entry in the root `package.json`.

## next@15.5.27

Next.js 15.5 bundles its own copy of React (`19.2.0-canary-0bdb9206-20250818`). That copy has a
hydration bug which React fixed later, and which is in React 19.3.

**What went wrong.** A page's data reaches the browser in several pieces. If React starts waking the
page up before the last piece has arrived, and the missing piece is the content of a plain element,
React waits and then tries that element again. On the second try it claimed the next server-made
node instead of the same one. It then reported error 418, threw the whole page away and drew it
again from scratch. Anything a visitor had typed into a form by then was lost. It showed on slow
connections and busy machines, on any page.

**The fix.** Seven lines in `replayBeginWork`, copied from React 19.3, in the four client builds
under `dist/compiled/react-dom/cjs/`. Before the second try the hydration cursor is put back on the
node the element already claimed.

**When to remove it.** When Next.js is moved to a release that bundles React 19.3 or later. Check
with:

```
grep -n "nextHydratableInstance = fiber.stateNode" \
  node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js
```

If the line is there without this patch, delete the patch file and the `patchedDependencies` entry.
pnpm stops the install if the Next.js version changes while the entry is still present, so the patch
cannot be dropped without someone noticing.

**How it was confirmed.** The owner sign-up journey, run 48 times six at a time on a loaded machine:
13 of about 60 runs hit error 418 before the patch, none of 96 after.
