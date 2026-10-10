import { expect, test } from "@playwright/test";

const WIDTHS = [320, 360, 390, 414, 640, 768, 834, 1024, 1280, 1440, 1920];
const PAGES = [
  "/",
  "/charter/",
  "/for-owners/",
  "/search/",
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
  for (const path of PAGES) {
    test(`${path}`, async ({ page }) => {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const result = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const docOverflow = document.documentElement.scrollWidth - vw;
          const offenders: string[] = [];
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
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

  test("landscape phone keeps the hero usable", async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Find sites" })).toBeVisible();
  });
});
