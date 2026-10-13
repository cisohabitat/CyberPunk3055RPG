import { test, expect } from "@playwright/test";
import { createCharacter } from "../lib/engine";
import briefs from "../qa/media/campaign-art-briefs.json";
import bindings from "../qa/media/campaign-art-bindings.json";
const base = createCharacter({ handle: "Art review", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const scenes = briefs.map(brief => ({ id: brief.id, scene: bindings.plates.find(plate => plate.src === `/art/${brief.id}.jpg`)!.scenes[0] }));
for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  for (let start = 0; start < scenes.length; start += 3) test(`campaign setting art at ${width}px, batch ${1 + start / 3}`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    for (const sample of scenes.slice(start, start + 3)) {
      const context = await browser.newContext({ baseURL, viewport: { width, height: width > 700 ? 900 : 844 } });
      try {
        const page = await context.newPage(); const requests: string[] = [], errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("request", r => { if (/\/(art|audio)\//.test(r.url())) requests.push(r.url()); });
        const run = { ...base, sceneId: sample.scene };
        await page.addInitScript(({ run, artwork }) => {
          localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
          localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", sound: false, artwork, textStep: 2, contrast: "high", motion: "reduce" }));
        }, { run, artwork });
        await page.goto("/"); await page.getByTestId("continue-run").click();
        const goal = await page.getByTestId("goal").boundingBox();
        expect(goal!.y).toBeGreaterThanOrEqual(0); expect(goal!.y + goal!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (artwork === "none") { await expect(page.getByTestId("scene-illustration")).toHaveCount(0); expect(requests).toEqual([]); }
        else {
          const image = page.getByTestId("scene-illustration").locator("img");
          await expect(image).toHaveAttribute("src", `/art/${sample.id}.jpg`); await image.scrollIntoViewIfNeeded();
          const size = await image.evaluate(async (image: HTMLImageElement) => { await image.decode(); const box = image.getBoundingClientRect(); return { width: image.naturalWidth, ratio: box.width / box.height, alt: image.alt }; });
          expect(size.width).toBeGreaterThan(0); expect(size.ratio).toBeCloseTo(1.5, 2); expect(size.alt.length).toBeGreaterThan(30);
        }
        expect(errors).toEqual([]); expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(run);
      } finally { await context.close(); }
    }
  });
}
