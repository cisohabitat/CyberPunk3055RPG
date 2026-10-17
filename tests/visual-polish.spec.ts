import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, getScene, sceneText } from "../lib/engine";
import { sceneIllustration } from "../lib/art";

const base = createCharacter({ handle: "Visual review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
for (const width of [390, 1440, 320]) for (const sceneId of ["stall", "memo"]) {
  test(`reading and dialogue controls remain usable at ${width}px in ${sceneId}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = { ...base, sceneId };
    await page.addInitScript(({ state, width }) => {
      localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
      localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", sound: false, motion: "reduce", artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0, contrast: width === 320 ? "high" : "standard" }));
    }, { state, width });
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto("/"); await page.getByTestId("continue-run").click();
    const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
    const paragraphs = sceneText(getScene(sceneId), state).split(/\n\n+/).filter(Boolean);
    expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(paragraphs);
    const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThanOrEqual(900);
    const voice = page.getByTestId("voice-line");
    for (const button of await voice.getByRole("button").all()) {
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await voice.locator("summary").click();
    await expect(voice.locator("details")).toHaveAttribute("open", "");
    await expect(voice.locator("ol")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const width of [390, 1440]) test(`paired art keeps its complete frame and stable fallback at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = { ...base, sceneId: "memo" }, art = sceneIllustration("memo")!;
  let release!: () => void; const held = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/art/${art.src.split("/").at(-1)!.replace(".jpg", "*")}`, async route => { await held; await route.abort(); });
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, reading: "all", motion: "reduce" }));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  const figure = page.getByTestId("scene-illustration"), image = figure.locator("img");
  const before = await image.boundingBox(); expect(before!.width / before!.height).toBeCloseTo(1.5, 2);
  release();
  const fallback = figure.locator(".art-unavailable"); await expect(fallback).toHaveText(art.description);
  const after = await fallback.boundingBox(); expect(after!.height).toBeCloseTo(before!.height, 0);
  await expect(page.getByTestId("choice-heard")).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(state);
});
