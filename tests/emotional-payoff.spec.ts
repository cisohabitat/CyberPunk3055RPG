import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getScene, sceneText, presentChoices, commitChoice } from "../lib/engine";
import { sceneIllustration } from "../lib/art";
import { PAYOFF_QUOTES as Q } from "../lib/emotional-payoff";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import bindings from "../qa/media/emotional-payoff-dialogue-bindings.json";

const profiles = [
  ["edda-authenticated-names", "act3_payoff_edda", Q.authenticated],
  ["edda-corroborated-witness", "act3_payoff_edda", Q.corroborated],
  ["edda-failed-quiet", "act3_payoff_edda", Q.unanswered],
  ["kerr-private-witness", "act3_payoff_kerr", Q.private],
  ["kerr-registered-listed", "act3_payoff_kerr", Q.registered],
  ["kerr-unfinished-names", "act3_payoff_kerr", Q.uncollected],
  ["edda-authenticated-names", "ending_names", Q.names],
  ["kerr-canceled-quiet", "ending_quiet", Q.quiet],
  ["edda-corroborated-witness", "ending_witness", Q.witness],
  ["both-returns-listed", "ending_listed", Q.listed],
] as const;
const stateFor = (row: typeof profiles[number]) => routeCheckpoint(`emotional-payoff/${row[0]}`, row[1]);
const saved = (page: Page) => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), preferences: localStorage.getItem("saint-shard-preferences"), codex: localStorage.getItem("saint-shard-codex") }));
const audio = (page: Page) => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, state: GameState, width = 390, sound = false, automatic = sound, paragraph = false, voices = 100) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound, automatic, paragraph, voices }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: automatic, voices, artwork: width === 320 ? "none" : "full", reading: paragraph ? "paragraph" : "all", textStep: width === 320 ? 2 : 0, contrast: "high", motion: "reduce" }));
  }, { state, width, sound, automatic, paragraph, voices });
  await page.goto("/"); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("goal")).toBeVisible();
}
async function exit(page: Page, state: GameState) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.enabled)!;
  await keyboardActivate(page, page.getByTestId(`choice-${choice.id}`));
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state, choice).state);
}
for (const width of [390, 1440, 320]) for (const row of profiles) test(`emotional payoff ${row[0]}/${row[1]}: words, art, history and reload at ${width}px`, async ({ page }, info) => {
  const state = stateFor(row), scene = getScene(state.sceneId); await open(page, state, width); const before = await saved(page);
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("scene-text")).toHaveText(sceneText(scene, state).split(/\n\n+/).filter(Boolean).join(""));
  await expect(page.getByTestId("scene-text")).toContainText(row[2]);
  const art = page.getByTestId("scene-illustration");
  if (width === 320) await expect(art).toHaveCount(0);
  else { const image = art.locator("img"); await image.scrollIntoViewIfNeeded(); await expect(image).toHaveAttribute("src", sceneIllustration(state.sceneId, state.flags)!.src); await image.evaluate((im: HTMLImageElement) => im.decode()); }
  const voice = page.getByTestId("voice-line"); await voice.locator("summary").click(); await expect(voice).toContainText(row[2]);
  if (scene.finale) {
    const facts = page.getByTestId("aftermath-details"), history = page.getByTestId("finale-history");
    await expect(facts).not.toHaveAttribute("open", ""); await expect(history).not.toHaveAttribute("open", "");
    expect(await page.getByTestId("scene-text").evaluate(node => !!(node.compareDocumentPosition(document.getElementById("ending-facts")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    await keyboardActivate(page, facts.locator("summary")); await expect(facts.getByRole("heading", { name: "Ward Nine", exact: true })).toBeVisible();
    await keyboardActivate(page, history.locator("summary")); await expect(page.getByTestId("night-retell")).toHaveCount(3);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await saved(page)).toEqual(before); await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: info.outputPath("scene.png"), fullPage: true });
  await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(before);
  if (scene.finale) { await expect(page.getByTestId("finale-history")).not.toHaveAttribute("open", ""); await page.getByRole("button", { name: "Title", exact: true }).click(); await expect(page.getByTestId("continue-run")).toBeVisible(); }
  else await exit(page, state);
});
for (const row of profiles) test(`emotional voice ${row[0]}/${row[1]}: exact actor, automatic words, gain and natural completion`, async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = stateFor(row), binding = bindings.find(b => b.scene === row[1] && b.quote === row[2])!;
  const queue = visibleCampaignDialogue(state.sceneId, getScene(state.sceneId).speaker, sceneText(getScene(state.sceneId), state));
  expect(queue.map(b => b.id)).toEqual([binding.id]);
  await open(page, state, 390, true); const before = await saved(page);
  await expect.poll(async () => (await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([`${binding.id}.mp3`]);
  await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute("data-speaker", binding.speaker);
  await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", binding.speaker); await expect(page.getByTestId("spoken-quote")).toContainText(binding.text);
  expect((await audio(page)).voiceLevels.find(l => l.file === `${binding.id}.mp3`)!.gain).toBe(1);
  await expect.poll(async () => (await audio(page)).disposed, { timeout: 20_000 }).toContain(`${binding.id}.mp3`);
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0); expect(await saved(page)).toEqual(before);
  if (getScene(state.sceneId).finale) await page.getByTestId("finale-history").locator("summary").click();
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([`${binding.id}.mp3`]); expect(await saved(page)).toEqual(before);
});
test("emotional paragraph/manual/no-art keeps hidden speech silent and respects Stop", async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = stateFor(profiles[2]), requests: string[] = [];
  page.on("request", r => { if (new URL(r.url()).pathname.startsWith("/art/")) requests.push(r.url()); });
  await open(page, state, 320, true, false, true); const before = await saved(page);
  await expect(page.getByTestId("voice-line")).toHaveCount(0); await expect(page.getByTestId("scene-text")).not.toContainText(Q.unanswered);
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]);
  await page.getByTestId("show-rest").click(); const voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
  await voice.getByRole("button", { name: "Listen to Edda", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "playing");
  await voice.getByRole("button", { name: "Stop line", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "idle");
  expect(await saved(page)).toEqual(before); expect(requests).toEqual([]); await exit(page, state);
});
for (const [sound, voices] of [[false, 100], [true, 0]] as const) test(`emotional dialogue stays readable without voice starts: sound=${sound}, voices=${voices}`, async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = stateFor(profiles[5]); await open(page, state, 390, sound, true, false, voices); const before = await saved(page);
  await expect(page.getByTestId("scene-text")).toContainText(Q.uncollected); const voice = page.getByTestId("voice-line"); await voice.locator("summary").click(); await expect(voice).toContainText(Q.uncollected);
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]); expect(await saved(page)).toEqual(before); await exit(page, state);
});
test("missing emotional recording and art preserve the entire scene and canonical exit", async ({ page }) => {
  await page.route("**/voice-campaign-emotional-payoff-*.mp3", route => route.abort()); await page.route("**/art/*.jpg", route => route.abort());
  const state = stateFor(profiles[0]); await open(page, state, 390, true); await expect(page.getByTestId("scene-text")).toContainText(Q.authenticated); await exit(page, state);
});
test("explicit contradictory imported contact state cannot speak a new Kerr invitation", async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const base = stateFor(profiles[4]), state = { ...base, flags: { ...base.flags, kerr_route_denied: true } };
  await open(page, state, 390, true); await expect(page.getByTestId("voice-line")).toHaveCount(0); await expect(page.getByTestId("scene-text")).not.toContainText(Q.registered);
  await expect(page.getByTestId("choice-payoff-keep-kerr")).toHaveCount(0); expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]); await exit(page, state);
});
