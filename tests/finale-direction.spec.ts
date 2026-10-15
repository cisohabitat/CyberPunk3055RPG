import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { getScene, sceneText } from "../lib/engine";
import { voiceLevel } from "../lib/voice-level";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import phase from "../qa/media/finale-direction.json";

async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, reading: "all", motion: "reduce", ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
const words = (text: string) => text.match(/[\p{L}\p{N}]+/gu) ?? [];
for (const [width, artwork, textStep] of [[390, "full", 0], [1440, "full", 0], [320, "none", 2]] as const) {
  test(`all four finales lead with the scene and retain accessible history at ${width}px`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    for (const row of phase.scenes) {
      const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
      try {
        const page = await context.newPage(), artRequests: string[] = [], state = routeCheckpoint(row.route, row.sceneId);
        page.on("request", request => { if (request.url().includes("/art/")) artRequests.push(request.url()); });
        await open(page, state, { artwork, textStep, contrast: textStep ? "high" : "standard" });
        const before = await saved(page), stage = page.getByTestId("finale-scene"), prose = page.getByTestId("scene-text");
        await expect(stage).toHaveAttribute("aria-label", row.label); await expect(prose).toHaveCount(1);
        expect(await prose.locator("p").allTextContents()).toEqual(sceneText(getScene(row.sceneId), state).split(/\n\n+/).filter(Boolean));
        expect((await page.getByTestId("goal").boundingBox())!.y + (await page.getByTestId("goal").boundingBox())!.height).toBeLessThan(900);
        if (!textStep) expect((await prose.boundingBox())!.y).toBeLessThan(450);
        const history = page.getByTestId("finale-history"), aftermath = page.getByTestId("aftermath-details");
        await expect(history).not.toHaveAttribute("open", ""); await expect(aftermath).not.toHaveAttribute("open", "");
        await expect(page.getByTestId("night-retell").first()).not.toBeVisible();
        if (artwork === "full") {
          const img = stage.locator("img"), copy = await stage.locator(".pivotal-copy").boundingBox();
          await expect(img).toHaveAttribute("src", row.illustration);
          await img.scrollIntoViewIfNeeded(); await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
          expect(await img.evaluate(image => getComputedStyle(image).objectFit)).toBe("contain");
          const box = await img.boundingBox(); expect(box!.width / box!.height).toBeCloseTo(1.5, 1);
          if (width >= 900) expect(box!.x).toBeLessThan(copy!.x);
          else expect(box!.y + await page.evaluate(() => scrollY)).toBeGreaterThan(copy!.y + copy!.height);
        } else { await expect(page.locator("img")).toHaveCount(0); expect(artRequests).toEqual([]); }
        await history.locator("summary").focus(); await page.keyboard.press("Enter");
        await expect(page.getByTestId("night-retell")).toHaveCount(3); await expect(page.getByTestId("ending-recap")).toContainText(`${state.creds} cr`);
        await aftermath.locator("summary").focus(); await page.keyboard.press("Enter"); await expect(aftermath.getByRole("heading", { name: "Ward Nine", exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await saved(page)).toBe(before);
        if (row.sceneId === "ending_listed") expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
        await page.getByRole("button", { name: "Title", exact: true }).click(); await page.getByTestId("continue-run").click();
        await expect(history).not.toHaveAttribute("open", ""); expect(await saved(page)).toBe(before);
      } finally { await context.close(); }
    }
  });
}

test("saved paragraph pacing and a missing finale painting retain complete text and a playable exit", async ({ page }) => {
  const row = phase.scenes.find(row => row.sceneId === "ending_listed")!, state = routeCheckpoint(row.route, row.sceneId);
  await page.route("**/art/finale-listed*.jpg", route => route.abort());
  await open(page, state, { reading: "paragraph" }); const before = await saved(page), prose = page.getByTestId("scene-text");
  await expect(prose.locator("p")).toHaveCount(1); await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await page.getByTestId("show-rest").click();
  expect(await prose.locator("p").allTextContents()).toEqual(sceneText(getScene(row.sceneId), state).split(/\n\n+/));
  await expect(page.getByTestId("voice-line")).toBeVisible();
  await expect(page.getByTestId("finale-scene").locator(".art-unavailable")).toBeVisible();
  expect(await saved(page)).toBe(before);
  await page.getByRole("button", { name: "Title", exact: true }).click(); await expect(page.getByTestId("continue-run")).toBeVisible();
});

for (const row of phase.scenes) test(`finale voices match the visible actor and finish naturally: ${row.sceneId}`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(() => {
    const review = window as unknown as { bedTargets: number[] }; review.bedTargets = [];
    const target = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function(value, time, constant) { review.bedTargets.push(value); return target.call(this, value, time, constant); };
  });
  const state = routeCheckpoint(row.route, row.sceneId);
  await open(page, state, { sound: true, autoVoices: false, music: 60, ambience: 50, effects: 0, voices: 75 });
  const before = await saved(page), targets = () => page.evaluate(() => (window as unknown as { bedTargets: number[] }).bedTargets);
  const audio = (): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  await expect.poll(targets).toContain(.6 * .65); await expect.poll(targets).toContain(.5 * .55);
  await page.getByRole("button", { name: "Play all dialogue", exact: true }).click();
  const mark = page.getByTestId("spoken-quote");
  for (const line of row.dialogue) {
    await expect.poll(() => audio().then(review => review.started.filter(file => file.startsWith("voice-")).length)).toBe(row.dialogue.indexOf(line) + 1);
    await expect(mark).toHaveAttribute("data-speaker", line.speaker);
    expect(words((await mark.textContent())!)).toEqual(words(line.text));
    const delivery = (await audio()).started.findLast(file => file.startsWith("voice-"))!;
    expect(delivery.replace(/\.(wav|mp3)$/, "")).toBe(line.id);
    expect((await audio()).voiceLevels.find(item => item.file === delivery)!.gain).toBeCloseTo(voiceLevel(line.id), 5);
    await expect.poll(() => audio().then(review => review.disposed.includes(delivery)), { timeout: 40_000 }).toBe(true);
  }
  await expect(mark).toHaveCount(0); expect(await saved(page)).toBe(before);
  expect(await targets()).toContain(.6 * .22 * .65); expect(await targets()).toContain(.5 * .44 * .55);
  // Reopening history does not replay consumed lines or move the scene.
  await page.getByTestId("finale-history").locator("summary").click();
  expect((await audio()).started.filter(file => file.startsWith("voice-"))).toHaveLength(row.dialogue.length);
  await page.getByRole("button", { name: "Title", exact: true }).click();
  await expect.poll(() => audio().then(review => review.started.filter(file => file.startsWith("voice-")))).toHaveLength(row.dialogue.length);
  // Muting from the title disposes both scene beds; the saved run is untouched.
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Sound enabled", { exact: true }).uncheck(); await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect.poll(() => audio().then(review => review.liveSources)).toBe(0); expect(await saved(page)).toBe(before);
});
