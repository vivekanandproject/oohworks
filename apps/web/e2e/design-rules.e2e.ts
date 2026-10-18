import { expect, test, type Page } from "@playwright/test";

/**
 * The design system's rules that a visitor feels before they could name them, measured on real pages
 * (docs/ohworks-design-consistency-plan.md, section 5): one accent per view, every control tall
 * enough for a thumb, fixed bars that leave the screen to the page, and no label spilling out of
 * its button, chip or badge. Each rule is checked on the pages where it bit during the audit.
 */

const PAGES = [
  "/",
  "/search/?city=bengaluru",
  "/search/?city=bengaluru&q=hoardings+near+silk+board+bengaluru+outer+ring+road",
  "/search/?city=pune&format=gantry",
  "/in/bengaluru/",
  "/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/",
  "/shortlist/?sites=ows0001,ows0003,ows0002,ows0017",
  "/compare/?sites=ows0001,ows0002,ows0006,ows0017",
  "/list-your-sites/",
  "/sign-in/",
  "/newsroom/",
  "/analysis/most-billboards-cannot-be-found-online/",
];

/** Lets what reveals on scroll show, then returns to the top. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
}

test.describe("design rules", () => {
  test.describe.configure({ timeout: 120_000 });

  test("the accent appears at most once per view", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await settle(page);
      const accents = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".oh-btn.accent, .bg-survey"))
          .filter((el) => el.checkVisibility?.() !== false && !(el instanceof SVGElement))
          .map(
            (el) => `${el.tagName.toLowerCase()} “${(el.textContent ?? "").trim().slice(0, 40)}”`,
          ),
      );
      expect(accents, `${path} shows ${accents.length} accent elements`).toHaveLength(
        Math.min(accents.length, 1),
      );
    }
  });

  test("every control is at least 44px tall on a touch screen", async ({ page, isMobile }) => {
    test.skip(!isMobile, "the 36px look is allowed with a pointer");
    // Every page is measured before failing, so one run names every short control.
    const found: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await settle(page);
      // Menus are opened so their items are measured too.
      await page.evaluate(() =>
        document.querySelectorAll("details").forEach((d) => (d.open = true)),
      );
      const short = await page.evaluate(() => {
        const controls = document.querySelectorAll<HTMLElement>(
          "button, summary, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea, a.oh-btn, a.oh-chip, a.oh-opt, .oh-toc a, nav a, footer a",
        );
        const out: string[] = [];
        for (const el of Array.from(controls)) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (el.checkVisibility?.() === false) continue;
          // The skip link lives off screen until it has focus; bot-trap fields are never reachable.
          if (el.matches("a[href='#main'], [tabindex='-1']")) continue;
          if (r.height < 44 - 0.5)
            out.push(
              `${Math.round(r.width)}x${Math.round(r.height)} ${el.tagName.toLowerCase()} “${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}”`,
            );
        }
        return out;
      });
      found.push(...short.map((s) => `${path}  ${s}`));
    }
    expect(found, "controls under 44px").toEqual([]);
  });

  test("fixed and sticky bars leave three quarters of a phone screen to the page", async ({
    page,
  }) => {
    for (const [width, height] of [
      [360, 640],
      [740, 360],
    ] as const) {
      await page.setViewportSize({ width, height });
      for (const path of PAGES.filter((p) => !p.startsWith("/sign-in"))) {
        await page.goto(path);
        await settle(page);
        // Half way down, where every sticky element has stuck.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await page.waitForTimeout(150);
        const covered = await page.evaluate(() => {
          const vh = window.innerHeight;
          let top = 0;
          let bottom = vh;
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
            const cs = getComputedStyle(el);
            if (cs.position !== "fixed" && cs.position !== "sticky") continue;
            if (el.checkVisibility?.() === false) continue;
            const r = el.getBoundingClientRect();
            if (r.width < window.innerWidth * 0.5 || r.height === 0) continue;
            if (r.top <= 1) top = Math.max(top, r.bottom);
            if (r.bottom >= vh - 1) bottom = Math.min(bottom, r.top);
          }
          return { top, bottom: vh - bottom, vh };
        });
        const share = (covered.top + covered.bottom) / covered.vh;
        expect(
          share,
          `${path} at ${width}x${height}: bars cover ${covered.top}px above and ${covered.bottom}px below`,
        ).toBeLessThanOrEqual(0.25);
      }
    }
  });

  test("no label spills out of its button, chip or badge", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await settle(page);
      const spills = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".oh-btn, .oh-chip, .oh-badge"))
          .filter((el) => el.checkVisibility?.() !== false && el.scrollWidth > el.clientWidth + 1)
          .map(
            (el) =>
              `${el.className.split(" ").slice(0, 2).join(".")} “${(el.textContent ?? "").trim().slice(0, 40)}” ${el.scrollWidth}>${el.clientWidth}`,
          ),
      );
      expect(spills, `${path}: labels wider than their box`).toEqual([]);
    }
  });
});
