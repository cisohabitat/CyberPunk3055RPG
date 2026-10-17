import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, getScene, sceneText } from "../lib/engine";
import { portraitArt } from "../lib/art";
import { visibleCampaignDialogue, type CampaignDialogue } from "../lib/campaign-dialogue";
import { dialogueExamples } from "../qa/production/dialogue-examples";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
import deliveries from "../qa/media/campaign-dialogue-provenance.json";
import old from "../qa/media/voice-provenance.json";

const examples = dialogueExamples();
const durations = new Map([...old.lines, ...deliveries.lines].map(line => [line.id, line.durationSeconds]));
const file = (line: CampaignDialogue) => `${line.id}.${line.id.startsWith("voice-campaign-") ? "mp3" : "wav"}`;
const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const samples = [...new Set(bindings.map(binding => binding.speaker))].sort().map(speaker => {
  const candidates = bindings.filter(binding => binding.speaker === speaker && !binding.choiceId && examples.has(binding.id));
  const choices = candidates.filter(binding => durations.get(binding.id)! > 3);
  const binding = choices.find(binding => binding.sceneSpeaker !== speaker) ?? choices[0] ?? candidates.sort((a, b) => durations.get(b.id)! - durations.get(a.id)!)[0];
  const state = examples.get(binding.id)!.state, scene = getScene(state.sceneId);
  const line = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state)).find(line => line.id === binding.id)!;
  return { state, line };
});
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, run: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ run, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", autoVoices: false, sound: true, music: 0, ambience: 0, effects: 0, textStep: 2, contrast: "high", motion: "reduce", ...preferences }));
  }, { run, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
async function select(page: Page, line: CampaignDialogue) {
  if (!await page.getByTestId("voice-line").locator("details").evaluate(details => details.hasAttribute("open"))) await page.getByTestId("voice-line").locator("summary").click();
  if (await page.getByLabel("Dialogue line", { exact: true }).count()) await page.getByLabel("Dialogue line", { exact: true }).selectOption(line.key);
  await page.getByTestId("voice-line").getByRole("button", { name: /^Listen to / }).click();
}

for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) for (let start = 0; start < samples.length; start += 5) {
  test(`all actors identify their audible words at ${width}px, batch ${start / 5 + 1}`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    for (const { state, line } of samples.slice(start, start + 5)) {
      const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
      try {
        const page = await context.newPage(), requests: string[] = [], errors: string[] = [];
        page.on("request", request => { if (request.url().includes("/art/")) requests.push(request.url()); });
        page.on("pageerror", error => errors.push(error.message));
        await open(page, state, { artwork });
        const before = await saved(page), text = await page.getByTestId("scene-text").textContent();
        const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThanOrEqual(900);
        await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
        await select(page, line);
        await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", line.speaker);
        expect(words((await page.getByTestId("spoken-quote").textContent())!)).toEqual(words(line.text));
        const portrait = page.locator(".scene-row .portrait-frame");
        await expect(portrait).toHaveAttribute("data-speaker", line.speaker); await expect(portrait).toHaveAttribute("data-speaking", "true");
        await expect(portrait.locator("figcaption")).toContainText("Speaking");
        const caption = await portrait.locator("figcaption").boundingBox();
        const face = await portrait.locator("img, .portrait-placeholder").boundingBox();
        expect(caption!.y).toBeGreaterThanOrEqual(face!.y + face!.height - 1);
        expect(await portrait.locator(".portrait-name").evaluate(name => parseFloat(getComputedStyle(name).fontSize))).toBeGreaterThanOrEqual(11);
        const captionSize = await portrait.locator("figcaption").evaluate(caption => ({ content: caption.scrollHeight, frame: caption.clientHeight }));
        expect(captionSize.content, `${line.speaker}: caption must contain name, role and speaking cue`).toBeLessThanOrEqual(captionSize.frame + 1);
        if (artwork === "full") await expect(portrait.locator("img")).toHaveAttribute("src", portraitArt(line.speaker, state.sceneId, state.flags)!);
        else { await expect(portrait.locator("img")).toHaveCount(0); expect(requests).toEqual([]); }
        expect((await audio(page)).started).toContain(file(line));
        expect(await page.getByTestId("scene-text").textContent()).toBe(text);
        expect(await saved(page)).toBe(before);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.getByRole("button", { name: "Stop line", exact: true }).click();
        await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
        await expect(portrait).toHaveAttribute("data-speaking", "false");
        expect((await portrait.locator("figcaption").boundingBox())!.height).toBeCloseTo(caption!.height, 0);
        if (getScene(state.sceneId).speaker) await expect(portrait).toHaveAttribute("data-speaker", getScene(state.sceneId).speaker!);
        expect(await saved(page)).toBe(before); expect((await audio(page)).liveSources).toBe(0); expect(errors).toEqual([]);
      } finally { await context.close(); }
    }
  });
}

const base = createCharacter({ handle: "Presentation", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
test("a split quote highlights only the audible part and never a custom player address", async ({ page }) => {
  const state = { ...base, sceneId: "stall", handle: "Custom Runner" };
  await open(page, state); const before = await saved(page);
  const scene = getScene(state.sceneId), queue = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state));
  for (const line of queue) {
    await select(page, line);
    const mark = page.getByTestId("spoken-quote");
    await expect(mark).toBeVisible(); expect(words((await mark.textContent())!)).toEqual(words(line.text));
    await expect(mark).not.toContainText("Custom Runner");
    await page.getByRole("button", { name: "Stop line", exact: true }).click();
  }
  expect(await saved(page)).toBe(before);
});

test("loading leaves context intact; playback never moves focus or scroll", async ({ page }) => {
  const sample = samples.find(sample => sample.line.speaker === "Dispatcher")!;
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/audio/${file(sample.line)}`, async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await open(page, sample.state); const before = await saved(page);
  await select(page, sample.line); await expect(page.getByTestId("voice-line")).toContainText("Loading selected dialogue");
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
  await expect(page.locator(".scene-row .portrait-frame")).toHaveAttribute("data-speaking", "false");
  await page.evaluate(() => { (window as unknown as { previousPortrait: Element | null }).previousPortrait = document.querySelector(".scene-row img.portrait"); });
  const y = await page.evaluate(() => scrollY); release();
  await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", "Dispatcher");
  await expect(page.getByRole("button", { name: "Stop line", exact: true })).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(y);
  expect(await page.evaluate(() => (window as unknown as { previousPortrait: Element }).previousPortrait.isConnected)).toBe(false);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  expect(await saved(page)).toBe(before);
});

test("missing actor art retains the right speaker and words; a dialog and pagehide clear the cue", async ({ page }) => {
  const sample = samples.find(sample => sample.line.speaker === "Ren")!;
  await page.route(`**${portraitArt("Ren", sample.state.sceneId, sample.state.flags)}`, route => route.abort());
  await open(page, sample.state); const before = await saved(page); await select(page, sample.line);
  await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", "Ren");
  await expect(page.locator(".scene-row .portrait-frame .portrait-placeholder")).toBeVisible();
  await expect(page.locator(".scene-row figcaption")).toContainText("Ren");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await select(page, sample.line);
  await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", "Ren");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume sound", exact: true }).click();
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0); expect(await saved(page)).toBe(before);
});
