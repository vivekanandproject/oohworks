import { expect, test } from "@playwright/test";

const WIDTHS = [320, 360, 390, 414, 640, 768, 834, 1024, 1280, 1440, 1920];
const PAGES = [
  "/",
  "/charter/",
  "/for-owners/",
  "/search/",
  "/search/?city=bengaluru",
  "/search/?city=bengaluru&map=0",
  "/search/?city=bengaluru&filters=1",
  "/search/?city=pune&format=gantry",
  "/in/bengaluru/koramangala/hoarding-80-feet-road-ows0001/",
  "/in/bengaluru/indiranagar/led-screen-cmh-road-ows0006/",
  "/enquire/ows0001/",
  "/how-results-are-ordered/",
  "/shortlist/?sites=ows0001,ows0003,ows0002,ows0017&from=2027-01-01&to=2027-01-31",
  "/compare/?sites=ows0001,ows0002,ows0006,ows0017",
  "/quick/ows0001/",
  "/list-your-sites/",
  "/in/bengaluru/",
  "/in/bengaluru/hoardings/",
  "/enquire/plan/?sites=ows0001,ows0003,ows0017",
  "/shortlist/sheets/?sites=ows0001,ows0017",
  "/sign-in/",
  "/newsroom/",
  "/newsroom/all/",
  "/news/",
  "/guides/",
  "/analysis/most-billboards-cannot-be-found-online/",
  "/news/global-out-of-home-spend-2025-woo/",
  "/showcase/how-ohworks-shows-a-campaign/",
  "/authors/editorial-desk/",
  "/newsroom/corrections/",
];

test.describe("responsive: no horizontal overflow at any width", () => {
  // Each test loads its page at eleven widths, so it is given longer than a single page check.
  test.describe.configure({ timeout: 90_000 });
  for (const path of PAGES) {
    test(`${path}`, async ({ page }) => {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        // An entrance animation is not an overflow: let panels finish sliding in before measuring.
        await page.evaluate(() =>
          Promise.race([
            Promise.all(
              document
                .getAnimations()
                .filter(
                  (x) =>
                    x.playState === "running" &&
                    x.effect?.getComputedTiming().iterations !== Infinity,
                )
                .map((x) => x.finished.catch(() => undefined)),
            ),
            new Promise((done) => setTimeout(done, 1000)),
          ]),
        );
        const result = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const docOverflow = document.documentElement.scrollWidth - vw;
          const offenders: string[] = [];
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            // Shapes inside a drawing are clipped by the drawing itself; only its own box can overflow.
            if (el instanceof SVGElement && el.ownerSVGElement) continue;
            // A closed menu is not drawn, though some engines still report a size for what is inside it.
            if (typeof el.checkVisibility === "function" && !el.checkVisibility()) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.position === "fixed") continue;
            // Children of an intentional horizontal scroller may extend past the viewport.
            let scroller: HTMLElement | null = el.parentElement;
            let insideScroller = false;
            while (scroller && scroller !== document.body) {
              const o = getComputedStyle(scroller).overflowX;
              if (o === "auto" || o === "scroll") {
                insideScroller = true;
                break;
              }
              scroller = scroller.parentElement;
            }
            if (insideScroller) continue;
            if (r.right > vw + 1 || r.left < -1) {
              offenders.push(
                `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 3).join(".") : ""} right=${Math.round(r.right)} left=${Math.round(r.left)}`,
              );
            }
          }
          return { docOverflow, offenders: offenders.slice(0, 5) };
        });
        expect(
          result.docOverflow,
          `${path} at ${width}px: document overflows by ${result.docOverflow}px; ${result.offenders.join(" | ")}`,
        ).toBeLessThanOrEqual(0);
        expect(result.offenders, `${path} at ${width}px: elements outside the viewport`).toEqual(
          [],
        );
      }
    });
  }

  test("an open filter menu stays on screen at every width", async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/search/?city=bengaluru");
      const menus = page.locator("details.oh-dd");
      for (let i = 0; i < (await menus.count()); i++) {
        const menu = menus.nth(i);
        if (!(await menu.locator("summary").isVisible())) continue;
        await menu.locator("summary").click();
        const box = await menu.locator(".oh-pop").boundingBox();
        const name = await menu.getAttribute("data-filter");
        expect(box, `${name} menu at ${width}px opens`).not.toBeNull();
        expect(box!.x, `${name} menu at ${width}px starts on screen`).toBeGreaterThanOrEqual(0);
        expect(
          box!.x + box!.width,
          `${name} menu at ${width}px ends on screen`,
        ).toBeLessThanOrEqual(width + 1);
        await menu.locator("summary").click();
      }
    }
  });

  test("landscape phone keeps the hero usable", async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Find sites" })).toBeVisible();
  });
});
