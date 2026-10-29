import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText, stageCheck } from "../lib/engine";
import { sceneIllustration } from "../lib/art";
import { CRAFT_RECORDS } from "../lib/encounter-craft";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import type { ReplaySpec } from "../lib/story-replay";
import phase from "../qa/media/encounter-craft.json";
import bindings from "../qa/media/encounter-craft-dialogue-bindings.json";

// Checkpoints come from complete legal campaigns, including the exact settlement variant.
function checkpoint(action: string, route = "archive-reader-success") {
  const spec = JSON.parse(readFileSync(`qa/routes/encounter-craft/${route}.json`, "utf8")) as ReplaySpec;
  let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    if (step.choiceId === action) return state;
    const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === step.choiceId && c.enabled)!;
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
  }
  throw Error(`Missing checkpoint ${route}/${action}`);
}
const saved = (page: Page) => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), preferences: localStorage.getItem("saint-shard-preferences"), codex: localStorage.getItem("saint-shard-codex") }));
const audio = (page: Page) => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, state: GameState, width = 390, sound = false, automatic = sound, paragraph = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound, automatic, paragraph }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: automatic, reading: paragraph ? "paragraph" : "all", artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0, contrast: "high", motion: "reduce" }));
  }, { state, width, sound, automatic, paragraph });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
async function choose(page: Page, state: GameState, id: string) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === id && c.enabled)!;
  await keyboardActivate(page, page.getByTestId(`choice-${id}`));
  const next = commitChoice(state, choice).state;
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(next);
  return next;
}
const stages = phase.newScenes.map(scene => {
  const route = scene === "act2_craft_archive_challenge" ? "archive-staffed-scope" : scene === "act2_craft_archive_ledger" ? "archive-staffed-scope" : scene.startsWith("act3_craft_kerr") ? "kerr-late-settlement" : scene.includes("kerr") ? "kerr-cash-private" : "archive-reader-success";
  return routeCheckpoint(`encounter-craft/${route}`, scene);
});
for (const width of [390, 1440, 320]) for (const state of stages) test(`crafted scene ${state.sceneId}: canonical text, art, access and reload at ${width}px`, async ({ page }, testInfo) => {
  await open(page, state, width); const before = await saved(page), scene = getScene(state.sceneId);
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("scene-text")).toHaveText(sceneText(scene, state).split(/\n\n+/).filter(Boolean).join(""));
  const art = page.getByTestId("scene-illustration");
  if (width === 320) await expect(art).toHaveCount(0);
  else { const image = art.locator("img"); await image.scrollIntoViewIfNeeded(); await expect(image).toHaveAttribute("src", sceneIllustration(state.sceneId, state.flags)!.src); await image.evaluate((image: HTMLImageElement) => image.decode()); }
  const voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
  for (const binding of bindings.filter(b => b.scene === state.sceneId && sceneText(scene, state).includes(b.quote))) await expect(voice).toContainText(binding.text);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await saved(page)).toEqual(before);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("scene.png"), fullPage: true });
  await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(before);
  const exit = presentChoices(state, scene).find(c => c.enabled && !c.check)!; await choose(page, state, exit.id);
});
for (const roll of [1, 10]) test(`crafted network key test retains held ${roll}, reload and canonical recovery`, async ({ page }) => {
  const original = checkpoint("craft-trace-receipt", "archive-reader-failure"), state = stageCheck(original, "craft-trace-receipt", roll);
  await open(page, state, 320); const before = await saved(page);
  await expect(page.locator(".die.plate")).toHaveText(String(roll)); expect(await saved(page)).toEqual(before);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.locator(".die.plate")).toHaveText(String(roll)); expect(await saved(page)).toEqual(before);
  const choice = presentChoices(original, getScene(original.sceneId)).find(c => c.id === "craft-trace-receipt")!;
  await page.getByTestId("continue-check").click();
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state, choice, { roll }).state);
  if (roll === 1) { await expect(page.getByTestId("scene-text")).toContainText("Your archive attempt supplied no independent record"); await expect(page.getByTestId("choice-craft-archive-question")).toHaveCount(0); }
});
for (const width of [320, 390, 1440]) test(`archive descriptions are free, once-only, persisted and focusable at ${width}px`, async ({ page }) => {
  let state = routeCheckpoint("encounter-craft/archive-reader-success", "act2_craft_archive"); await open(page, state, width);
  const resources = { creds: state.creds, strain: state.strain, items: state.items, journal: state.journal, factions: state.factions, rolls: state.rolls };
  await expect(page.getByTestId("choice-craft-question-issuer")).toHaveCount(0);
  for (const [index, record] of CRAFT_RECORDS.entries()) {
    state = await choose(page, state, `craft-read-${record.id}`);
    const card = page.getByTestId(`craft-record-${record.id}`), heading = card.locator("h3");
    await expect(card).toContainText(record.text); await expect(heading).toBeFocused(); await expect(heading).toBeInViewport();
    expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(await page.locator(".topbar").evaluate(n => n.getBoundingClientRect().bottom));
    await expect(page.getByTestId(`choice-craft-read-${record.id}`)).toHaveCount(0);
    await expect(page.getByTestId("archive-question-desk").getByRole("status")).toContainText(`${index + 1} of 3`);
  }
  expect({ creds: state.creds, strain: state.strain, items: state.items, journal: state.journal, factions: state.factions, rolls: state.rolls }).toEqual(resources);
  await page.reload(); await page.getByTestId("continue-run").click();
  for (const record of CRAFT_RECORDS) await expect(page.getByTestId(`craft-record-${record.id}`)).toContainText(record.text);
  state = await choose(page, state, "craft-question-conflate"); expect(state.flags.craft_archive_conflated).toBe(true);
  state = await choose(page, state, "craft-revise-question"); expect(state.flags.craft_archive_conflated).toBe(true);
  await choose(page, state, "craft-question-issuer");
});
for (const [route, action] of [["archive-reader-success", "craft-isolate-key"], ["archive-staffed-scope", "craft-extract-paid"], ["archive-face-countersign", "craft-extract-face"], ["archive-badge-scarce", "craft-extract-badge"], ["kerr-cash-private", "craft-bond-cash"], ["kerr-tool-private", "craft-bond-tool"], ["kerr-self-funded", "craft-bond-self"], ["kerr-refused", "craft-refuse-kerr"]]) test(`crafted commitment ${route}/${action}: exact resources, history and reload`, async ({ page }) => {
  const state = checkpoint(action, route); await open(page, state, 320); const next = await choose(page, state, action);
  await page.reload(); await page.getByTestId("continue-run").click(); expect(JSON.parse((await saved(page)).run!)).toEqual(next);
  if (action.startsWith("craft-bond-")) {
    expect(next.flags.kerr_route_promised).toBe(true); expect(next.journal.some(j => j.id === "craft-kerr-terms")).toBe(true);
    if (action === "craft-bond-tool") expect(next.items).not.toContain("signal-baffle");
  } else if (action.startsWith("craft-extract-")) { expect(next.flags.order_verified).toBe(true); expect(next.flags.archive_key_authenticated).toBeUndefined(); }
});
for (const route of ["kerr-cash-private", "kerr-tool-private", "kerr-self-funded", "kerr-breached", "kerr-failed", "kerr-cancel", "kerr-late-settlement", "kerr-late-failed"]) test(`settlement ${route}: actual return, preserved traces and no repeat collection`, async ({ page }) => {
  const state = checkpoint("craft-record-settlement", route); await open(page, state, 320); const next = await choose(page, state, "craft-record-settlement");
  expect(next.flags.craft_kerr_settled).toBe(true);
  await page.reload(); await page.getByTestId("continue-run").click(); expect(JSON.parse((await saved(page)).run!)).toEqual(next);
  await expect(page.getByTestId("choice-craft-settle-kerr")).toHaveCount(0);
});
const deliveries = [...new Map(bindings.map(binding => [binding.id, binding])).values()];
function speakingState(binding: typeof bindings[number]) {
  for (const route of phase.newRoutes) {
    const spec = JSON.parse(readFileSync(`qa/routes/${route}`, "utf8")) as ReplaySpec;
    let state = createCharacter(spec.character);
    for (const step of spec.steps) {
      if (state.sceneId === binding.scene && sceneText(getScene(state.sceneId), state).includes(binding.quote)) return state;
      const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === step.choiceId && c.enabled)!;
      state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
    }
  }
  throw Error(`No legal delivery ${binding.id}`);
}
for (const binding of deliveries) test(`crafted voice ${binding.id}: automatic exact actor, words, level and completion`, async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = speakingState(binding); await open(page, state, 390, true); const before = await saved(page);
  await expect.poll(async () => (await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([`${binding.id}.mp3`]);
  await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute("data-speaker", binding.speaker);
  await expect(page.getByTestId("spoken-quote")).toContainText(binding.text);
  expect((await audio(page)).voiceLevels.find(l => l.file === `${binding.id}.mp3`)!.gain).toBe(1);
  if (state.sceneId === "act2_craft_archive") await choose(page, state, "craft-read-export");
  await expect.poll(async () => (await audio(page)).disposed, { timeout: 20_000 }).toContain(`${binding.id}.mp3`);
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([`${binding.id}.mp3`]);
  if (state.sceneId !== "act2_craft_archive") expect(await saved(page)).toEqual(before);
});
test("crafted paragraph/manual/text-only respects reveal, Stop and preferences", async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = stages[0], requests: string[] = [];
  page.on("request", r => { if (new URL(r.url()).pathname.startsWith("/art/")) requests.push(r.url()); });
  await open(page, state, 320, true, false, true); const before = await saved(page);
  await expect(page.getByTestId("voice-line")).toHaveCount(0); expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]);
  await page.getByTestId("show-rest").click(); const voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
  await voice.getByRole("button", { name: "Listen to Edda", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "playing");
  await voice.getByRole("button", { name: "Stop line", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "idle");
  expect(await saved(page)).toEqual(before); expect(requests).toEqual([]);
});
test("missing crafted art and recordings leave written speech and a legal exit", async ({ page }) => {
  await page.route("**/voice-campaign-encounter-craft-*.mp3", route => route.abort());
  await page.route("**/art/*.jpg", route => route.abort());
  const state = stages[5]; await open(page, state, 390, true);
  await expect(page.getByTestId("scene-text")).toHaveText(sceneText(getScene(state.sceneId), state).split(/\n\n+/).filter(Boolean).join(""));
  await choose(page, state, "craft-refuse-kerr");
});
