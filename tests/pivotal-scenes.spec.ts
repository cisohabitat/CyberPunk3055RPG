import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getScene, sceneText } from "../lib/engine";
import { voiceLevel } from "../lib/voice-level";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { dialogueExamples } from "../qa/production/dialogue-examples";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import phase from "../qa/media/pivotal-scenes.json";

const examples = [...dialogueExamples().values()];
const sample = (id: string) => examples.find(example => example.state.sceneId === id && !example.checkResult && example.source === "authored-route")!.state;
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
const words = (text: string) => text.match(/[\p{L}\p{N}]+/gu) ?? [];
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, reading: "all", motion: "reduce", ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

for (const [width, artwork, textStep] of [[390, "full", 0], [1440, "full", 0], [320, "none", 2]] as const) {
  test(`pivotal words and whole paintings remain readable at ${width}px`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    for (const row of phase.scenes) {
      const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
      try {
        const page = await context.newPage(), requests: string[] = [];
        page.on("request", request => { if (request.url().includes("/art/")) requests.push(request.url()); });
        const state = sample(row.sceneId), scene = getScene(state.sceneId);
        await open(page, state, { artwork, textStep, contrast: textStep ? "high" : "standard" });
        const before = await saved(page), stage = page.getByTestId("pivotal-scene"), prose = page.getByTestId("scene-text");
        await expect(stage).toHaveAttribute("data-kind", row.kind);
        await expect(prose).toHaveCount(1);
        const canonical = sceneText(scene, state).split(/\n\n+/).filter(Boolean);
        expect(await prose.locator("p").allTextContents()).toEqual(canonical);
        const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThanOrEqual(900);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await prose.locator(".pivotal-dialogue").count()).toBeGreaterThan(0);
        const copy = await stage.locator(".pivotal-copy").boundingBox();
        if (artwork === "full") {
          const painting = stage.locator(".scene-illustration img");
          await expect(painting).toHaveAttribute("src", row.illustration);
          await painting.scrollIntoViewIfNeeded(); await expect.poll(() => painting.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
          expect(await painting.evaluate(img => getComputedStyle(img).objectFit)).toBe("contain");
          const box = await painting.boundingBox(); expect(box!.width / box!.height).toBeCloseTo(1.5, 1);
          if (width >= 900) { expect(box!.x).toBeLessThan(copy!.x); expect(copy!.y).toBeLessThan(500); }
          else { expect(box!.y + await page.evaluate(() => scrollY)).toBeGreaterThan(copy!.y + copy!.height); }
          // Default-size quotations now start on the first screen, before mission panels.
          await page.evaluate(() => scrollTo(0, 0));
          expect((await prose.locator(".pivotal-dialogue").first().boundingBox())!.y).toBeLessThan(700);
        } else { await expect(stage.locator("img")).toHaveCount(0); expect(requests).toEqual([]); }
        await expect(page.locator("[data-testid^='choice-']").first()).toBeEnabled();
        expect(await saved(page)).toBe(before);
        if (row.sceneId === "act2_witness_brief") expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
      } finally { await context.close(); }
    }
  });
}

test("paragraph pacing reveals only earned text and missing paintings retain play", async ({ page }) => {
  await page.route("**/art/mara-revelation*.jpg", route => route.abort());
  const state = sample("memo"); await open(page, state, { reading: "paragraph" });
  const before = await saved(page), prose = page.getByTestId("scene-text");
  await expect(prose.locator("p")).toHaveCount(1); await expect(prose.locator(".pivotal-dialogue")).toHaveCount(0);
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await page.getByTestId("next-paragraph").click();
  await expect(prose.locator(".pivotal-dialogue")).toHaveCount(1);
  await expect(page.getByTestId("voice-line")).toContainText("Mara");
  await page.getByTestId("show-rest").click();
  expect(await prose.locator("p").allTextContents()).toEqual(sceneText(getScene("memo"), state).split(/\n\n+/));
  await expect(page.getByTestId("pivotal-scene").locator(".art-unavailable")).toBeVisible();
  expect(await saved(page)).toBe(before);
  await page.getByTestId("choice-heard").click(); await expect(page.getByTestId("pivotal-scene")).toHaveAttribute("aria-label", "The recorded explanation · Mara");
});

test("native pivotal playback preserves actor, words and voice level while focused beds restore on departure", async ({ page }) => {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(() => {
    const review = window as unknown as { bedTargets: number[] }; review.bedTargets = [];
    const target = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function(value, time, constant) { review.bedTargets.push(value); return target.call(this, value, time, constant); };
  });
  const state = sample("mara_why"), scene = getScene(state.sceneId), line = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state))[0];
  await open(page, state, { sound: true, autoVoices: false, music: 60, ambience: 50, effects: 0, voices: 75 });
  const before = await saved(page);
  const targets = () => page.evaluate(() => (window as unknown as { bedTargets: number[] }).bedTargets);
  const review = (): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  // Phase 5 confession focus: explicit new targets; departure must still restore normal.
  await expect.poll(targets).toContain(0.6 * 0.38); await expect.poll(targets).toContain(0.5 * 0.55);
  await page.getByRole("button", { name: "Listen to Mara", exact: true }).click();
  const mark = page.getByTestId("spoken-quote"); await expect(mark).toHaveAttribute("data-speaker", "Mara");
  expect(words((await mark.textContent())!)).toEqual(words(line.text));
  expect((await review()).started).toContain(`${line.id}.mp3`);
  expect((await review()).voiceLevels.find(row => row.file === `${line.id}.mp3`)!.gain).toBeCloseTo(voiceLevel(line.id), 5);
  expect(await targets()).toContain(0.6 * 0.22 * 0.38); expect(await targets()).toContain(0.5 * 0.44 * 0.55);
  await page.getByRole("button", { name: "Stop line", exact: true }).click(); await expect(mark).toHaveCount(0);
  expect(await saved(page)).toBe(before);
  // Restarting a zeroed bus retains the pivotal mix and does not restart speech.
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("music volume", { exact: true }).focus(); await page.keyboard.press("Home"); await page.keyboard.press("End");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect.poll(targets).toContain(0.38);
  expect((await review()).started.filter(file => file.startsWith("voice-"))).toHaveLength(1);
  await page.evaluate(() => { (window as unknown as { bedTargets: number[] }).bedTargets = []; });
  await page.getByTestId("choice-inspect-hour").click(); await expect(page.getByTestId("pivotal-scene")).toHaveCount(0);
  await expect.poll(targets).toContain(1); await expect.poll(targets).toContain(0.5);
  await expect(mark).toHaveCount(0);
});
