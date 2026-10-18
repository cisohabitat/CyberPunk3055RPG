import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync, readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText, stageCheck } from "../lib/engine";
import { reactionLine } from "../components/Portrait";
import { visibleCheckDialogue } from "../lib/campaign-dialogue";
import { sceneIllustration } from "../lib/art";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import type { ReplaySpec } from "../lib/story-replay";

const base = createCharacter({ handle: "Composition", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, autoVoices: false, music: 0, ambience: 0, effects: 0, artwork: "full", motion: "reduce", ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

for (const width of [768, 1440, 1920]) test(`regular desktop/tablet paintings bring complete prose into the first screen at ${width}px`, async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  for (const sceneId of ["act2_shelter_brief", "act2_spire_sources", "act2_lumen_quiet"]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), state = { ...base, sceneId, flags: { spire_consent: true } }; await open(page, state); const before = await saved(page);
      const art = sceneIllustration(sceneId)!, figure = page.getByTestId("scene-illustration");
      await expect(figure.locator(".progressive-art")).toHaveAttribute("data-ready", "true");
      await page.evaluate(() => document.fonts.ready);
      const image = (await figure.locator("img").boundingBox())!, caption = (await figure.locator("figcaption").boundingBox())!;
      expect(image.width / image.height).toBeCloseTo(1.5, 2); expect(image.width).toBeLessThan(350);
      expect(caption.x).toBeGreaterThanOrEqual(image.x + image.width - 1);
      const first = (await page.getByTestId("scene-text").locator("p").first().boundingBox())!; expect(first.y + Math.min(first.height, 32)).toBeLessThan(900);
      expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(sceneText(getScene(sceneId), state).split(/\n\n+/).filter(Boolean));
      await figure.getByRole("button", { name: /^View artwork:/ }).click();
      await expect(page.getByRole("dialog").locator(".artwork-canvas img")).toHaveAttribute("src", art.src);
      await page.keyboard.press("Escape"); expect(await saved(page)).toBe(before);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await context.close(); }
  }
});

// Derive held checks from real authored replay routes, one per context identity.
const checkStates = new Map<string, GameState>();
for (const file of readdirSync("qa/routes").filter(file => file.endsWith(".json")).sort()) {
  const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec; let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    const scene = getScene(state.sceneId), choice = presentChoices(state, scene).find(choice => choice.id === step.choiceId && choice.enabled)!;
    if (!choice) throw new Error(`Unavailable authored step ${file}/${step.choiceId}`);
    if (choice.check && !checkStates.has(scene.speaker ?? "Runner")) checkStates.set(scene.speaker ?? "Runner", stageCheck(state, choice.id, step.roll!));
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
  }
}
const samples = [...checkStates];
for (const width of [320, 390, 1440]) for (let start = 0; start < samples.length; start += 3) test(`result identity strips retain names, reactions and saved dice at ${width}px, batch ${start / 3 + 1}`, async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  for (const [identity, state] of samples.slice(start, start + 3)) for (const artwork of ["full", "none"]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), requests: string[] = []; page.on("request", request => { if (request.url().includes("/art/")) requests.push(request.url()); });
      await open(page, state, { artwork, textStep: 2 }); const before = await saved(page), portrait = page.locator(".check-dialog .reaction .portrait-frame");
      const name = identity === "Runner" ? state.handle : identity === "Sister Lumen" ? "Lumen" : identity;
      await expect(portrait.locator(".portrait-name")).toHaveText(name); await expect(portrait).toHaveAttribute("data-layout", "compact");
      const caption = (await portrait.locator("figcaption").boundingBox())!, face = (await portrait.locator("img, .portrait-placeholder").boundingBox())!;
      expect(caption.x).toBeGreaterThanOrEqual(face.x + face.width - 1);
      expect(await portrait.locator("figcaption").evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      if (identity !== "Runner") expect(await portrait.locator(".portrait-name").evaluate(el => {
        const text = el.firstChild!, value = text.textContent!; return [...value.matchAll(/\S+/g)].every(match => { const range = document.createRange(); range.setStart(text, match.index!); range.setEnd(text, match.index! + match[0].length); return range.getClientRects().length === 1; });
      }), `${identity}: whole words in the nameplate`).toBe(true);
      const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === state.pendingCheck!.choiceId)!, expected = commitChoice(state, choice, { roll: state.pendingCheck!.roll });
      await expect(page.locator(".check-dialog .reaction > p")).toHaveText(reactionLine(getScene(state.sceneId).speaker, expected.check!.success));
      await expect(page.locator(".die.plate")).toHaveText(String(state.pendingCheck!.roll)); expect(await saved(page)).toBe(before);
      if (artwork === "none") { await expect(portrait.locator("img")).toHaveCount(0); expect(requests).toEqual([]); }
      expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    } finally { await context.close(); }
  }
});

for (const width of [320, 390, 1440]) for (const sound of [false, true]) test(`compact voice controls retain feedback, transcript and Stop at ${width}px with sound ${sound}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = stageCheck({ ...base, sceneId: "lumen_deal" }, "fake-pact", 1);
  await open(page, state, { sound, artwork: "none", textStep: width === 320 ? 2 : 0 });
  const before = await saved(page), voice = page.getByRole("dialog").getByTestId("voice-line"), caption = page.locator(".check-dialog .reaction figcaption");
  const initialCaption = (await caption.boundingBox())!, listen = voice.getByRole("button", { name: "Listen to Lumen", exact: true }), summary = voice.locator("summary");
  expect((await listen.boundingBox())!.height).toBeGreaterThanOrEqual(44); expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  if (width === 390) { expect((await voice.boundingBox())!.height).toBeLessThan(125); expect((await summary.boundingBox())!.y).toBeCloseTo((await listen.boundingBox())!.y, 0); }
  if (sound) {
    await listen.click(); await expect(voice.getByRole("status")).toContainText("Playing selected dialogue · Lumen · Line 1 of 1");
    await expect(page.locator(".check-dialog .reaction .portrait-frame")).toHaveAttribute("data-speaking", "true");
    expect((await caption.boundingBox())!.height).toBe(initialCaption.height);
    await voice.getByRole("button", { name: "Stop line", exact: true }).click(); await expect.poll(async () => (await audio(page)).liveSources).toBe(0);
    await expect(page.locator(".check-dialog .reaction .portrait-frame")).toHaveAttribute("data-speaking", "false"); expect((await caption.boundingBox())!.height).toBe(initialCaption.height);
  } else { await expect(listen).toBeDisabled(); await expect(voice.getByRole("status")).toHaveText("Enable Sound and voice volume in Settings to listen."); }
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === "fake-pact")!, check = commitChoice(state, choice, { roll: 1 }).check!;
  const spoken = visibleCheckDialogue(state.sceneId, choice.id, getScene(state.sceneId).speaker, check.success, check.flavor);
  await expect(page.getByTestId("check-flavor")).toHaveText(check.flavor);
  await summary.click(); expect(await voice.locator("ol li").allTextContents()).toEqual(spoken.map(line => `${line.speaker}: ${line.text}`));
  await expect(voice.getByRole("status")).toBeVisible(); await summary.click(); await expect(voice.locator("details")).not.toHaveAttribute("open", "");
  expect(await saved(page)).toBe(before); expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
