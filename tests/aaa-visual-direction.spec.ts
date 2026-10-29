import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getScene, sceneText, presentChoices, commitChoice } from "../lib/engine";
import { sceneIllustration } from "../lib/art";
import { VISUAL_DIRECTIONS, VISUAL_SHOTS } from "../lib/visual-direction";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { installSequenceAudioReview, type SequenceAudioReview } from "../qa/production/sequence-audio-review";
import type { GameState } from "../lib/types";
import { GALLERY_ART } from "../lib/art-gallery";

const routes: Record<string, string> = {
  act2_craft_archive: "emotional-payoff/both-returns-listed",
  act2_craft_archive_challenge: "emotional-payoff/edda-authenticated-names",
  act2_craft_archive_issuer: "emotional-payoff/both-returns-listed",
  act2_craft_archive_ledger: "emotional-payoff/edda-corroborated-witness",
  act3_craft_archive_return: "encounter-craft/archive-badge-scarce",
  act3_payoff_edda: "emotional-payoff/edda-authenticated-names",
  act2_craft_kerr_offer: "emotional-payoff/both-returns-listed",
  act2_craft_kerr_settlement: "emotional-payoff/both-returns-listed",
  act3_craft_kerr_settlement: "encounter-craft/kerr-late-failed",
  act3_payoff_kerr: "emotional-payoff/both-returns-listed",
  ending_names: "emotional-payoff/edda-authenticated-names",
  ending_quiet: "emotional-payoff/edda-deferred-quiet",
  ending_witness: "emotional-payoff/edda-corroborated-witness",
  ending_listed: "emotional-payoff/both-returns-listed",
};
const stateFor = (id: string) => routeCheckpoint(routes[id], id);
const saved = (page: Page) => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), preferences: localStorage.getItem("saint-shard-preferences"), codex: localStorage.getItem("saint-shard-codex") }));
const audio = (page: Page) => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, state: GameState, width = 390, sound = false, automatic = sound, paragraph = false, voices = 100) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound, automatic, paragraph, voices }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    if (!localStorage.getItem("saint-shard-preferences")) localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: automatic, voices, artwork: width === 320 ? "none" : "full", reading: paragraph ? "paragraph" : "all", textStep: width === 320 ? 2 : 0, contrast: "high", motion: "reduce" }));
  }, { state, width, sound, automatic, paragraph, voices });
  await page.goto("/"); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("goal")).toBeVisible();
}
async function chooseView(page: Page, name: "Scene" | "Person" | "Detail", src: string) {
  const group = page.getByTestId("sequence-shots");
  await keyboardActivate(page, group.getByRole("button", { name, exact: true }));
  await expect(group).toHaveAttribute("data-view", name.toLowerCase());
  await expect(group.locator('[aria-pressed="true"]')).toHaveText(name);
  const figure = page.getByTestId("scene-illustration"); await expect(figure).toHaveCount(1);
  const image = figure.locator("img"); await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute("src", src); await image.evaluate((img: HTMLImageElement) => img.decode());
}
async function exit(page: Page, state: GameState) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.enabled)!;
  await keyboardActivate(page, page.getByTestId(`choice-${choice.id}`));
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state, choice).state);
}
for (const width of [390, 1440, 320]) for (const [id, direction] of Object.entries(VISUAL_DIRECTIONS)) test(`visual direction ${id}: views, reading, keyboard, save at ${width}px`, async ({ page }, info) => {
  const state = stateFor(id), scene = getScene(id), requests: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/art/")) requests.push(new URL(request.url()).pathname); });
  await open(page, state, width); const before = await saved(page);
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.locator(`[data-visual-stage="${id}"]`)).toHaveCount(1);
  await expect(page.getByTestId("scene-text")).toHaveText(sceneText(scene, state).split(/\n\n+/).filter(Boolean).join(""));
  const choices = presentChoices(state, scene);
  for (const choice of choices) { const button = page.getByTestId(`choice-${choice.id}`); await expect(button).toHaveCount(1); if (choice.enabled) await expect(button).toBeEnabled(); else await expect(button).toBeDisabled(); }
  const figure = page.getByTestId("scene-illustration"), group = page.getByTestId("sequence-shots");
  if (width === 320) { await expect(figure).toHaveCount(0); await expect(group).toHaveCount(0); expect(requests).toEqual([]); }
  else {
    await expect(group).toHaveAttribute("data-view", "scene"); await expect(figure.locator("img")).toHaveAttribute("src", sceneIllustration(id, state.flags)!.src);
    expect(requests.some(src => /edda-listening-wide|kerr-listening-wide|archive-question-detail|stall-quiet-detail/.test(src))).toBe(false);
    const proseBox = await page.getByTestId("scene-text").boundingBox(), artBox = await figure.boundingBox();
    if (width === 390) expect(artBox!.y).toBeGreaterThan(proseBox!.y + proseBox!.height - 1);
    else expect(proseBox!.x).toBeGreaterThan(artBox!.x + artBox!.width - 1);

  }
  expect(await saved(page)).toEqual(before); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: info.outputPath("sequence.png"), fullPage: true });
  await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(before);
  if (width !== 320) await expect(group).toHaveAttribute("data-view", "scene");
  if (!scene.finale) await exit(page, state);
});
for (const width of [390, 1440]) for (const [id, direction] of Object.entries(VISUAL_DIRECTIONS)) test(`visual shot interaction ${id}: one image, zoom, keyboard and reload at ${width}px`, async ({ page }) => {
  const state = stateFor(id); await open(page, state, width); const before = await saved(page);
  const figure = page.getByTestId("scene-illustration");
    if (direction.person) { await chooseView(page, "Person", direction.person.src); await expect(figure).toContainText(direction.person.caption); }
    await chooseView(page, "Detail", direction.detail.src); await expect(figure).toContainText(direction.detail.caption);
    const opener = figure.getByRole("button", { name: /^View artwork:/ }); await keyboardActivate(page, opener);
    await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("Escape"); await expect(opener).toBeFocused();
    await chooseView(page, "Scene", sceneIllustration(id, state.flags)!.src);
  expect(await saved(page)).toEqual(before);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("sequence-shots")).toHaveAttribute("data-view", "scene");
  expect(await saved(page)).toEqual(before);
});
for (const id of ["act2_craft_archive", "act2_craft_kerr_offer", "act3_payoff_edda", "ending_names"]) test(`visual changes preserve the exact natural voice: ${id}`, async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = stateFor(id), direction = VISUAL_DIRECTIONS[id], scene = getScene(id);
  const queue = visibleCampaignDialogue(id, scene.speaker, sceneText(scene, state)); expect(queue).toHaveLength(1); const file = `${queue[0].id}.mp3`;
  await open(page, state, 1440, true); const before = await saved(page);
  await expect.poll(async () => (await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([file]);
  await expect(page.getByTestId("spoken-quote")).toContainText(queue[0].text);
  await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", queue[0].speaker);
  if (direction.person) await chooseView(page, "Person", direction.person.src);
  await chooseView(page, "Detail", direction.detail.src); await chooseView(page, "Scene", sceneIllustration(id, state.flags)!.src);
  expect((await audio(page)).stoppedSources).not.toContain(file);
  await expect.poll(async () => (await audio(page)).disposed, { timeout: 20_000 }).toContain(file);
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([file]);
  expect((await audio(page)).stoppedSources).not.toContain(file); expect(await saved(page)).toEqual(before);
});
test("new artwork failures remain readable and recover to the canonical scene", async ({ page }) => {
  await page.route("**/art/edda-listening-wide*.jpg", route => route.fulfill({ status: 404, body: "Unavailable" }));
  const state = stateFor("act2_craft_archive"); await open(page, state); const before = await saved(page);
  await keyboardActivate(page, page.getByTestId("sequence-shots").getByRole("button", { name: "Person", exact: true }));
  const figure = page.getByTestId("scene-illustration"); await figure.scrollIntoViewIfNeeded(); await expect(figure).toHaveAttribute("data-unavailable", "true");
  await expect(figure).toContainText(VISUAL_SHOTS.edda.description);
  await chooseView(page, "Scene", sceneIllustration(state.sceneId, state.flags)!.src); expect(await saved(page)).toEqual(before); await exit(page, state);
});
test("paragraph/manual/no-art retains reveal, explicit Listen and Stop without art requests", async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const requests: string[] = []; page.on("request", r => { if (new URL(r.url()).pathname.startsWith("/art/")) requests.push(r.url()); });
  const state = stateFor("act3_payoff_edda"); await open(page, state, 320, true, false, true); const before = await saved(page);
  await expect(page.getByTestId("voice-line")).toHaveCount(0); expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]);
  await page.getByTestId("show-rest").click(); const voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
  await voice.getByRole("button", { name: "Listen to Edda", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "playing");
  await voice.getByRole("button", { name: "Stop line", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "idle");
  expect(requests).toEqual([]); expect(await saved(page)).toEqual(before); await exit(page, state);
});
for (const [sound, voices] of [[false, 100], [true, 0]] as const) test(`visual controls respect sound=${sound}, voices=${voices}`, async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = stateFor("act3_payoff_kerr"); await open(page, state, 390, sound, true, false, voices); const before = await saved(page);
  await chooseView(page, "Person", VISUAL_SHOTS.kerr.src); await chooseView(page, "Detail", VISUAL_SHOTS.counter.src);
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]); expect(await saved(page)).toEqual(before); await exit(page, state);
});
for (const shot of [VISUAL_SHOTS.edda, VISUAL_SHOTS.kerr, VISUAL_SHOTS.question, VISUAL_SHOTS.counter]) test(`new painting is deliberately revealed and viewable in gallery: ${shot.src}`, async ({ page }) => {
  await open(page, stateFor("act2_craft_archive")); const before = await saved(page); await page.goto("/artwork");
  await expect(page.locator(`[data-art-src="${shot.src}"]`)).toHaveCount(0); await page.getByRole("button", { name: "Open full gallery", exact: true }).click();
  const entry = GALLERY_ART.find(row => row.src === shot.src)!; await page.getByLabel("Search artwork", { exact: true }).fill(entry.caption);
  const opener = page.locator(`[data-art-src="${shot.src}"]`); await keyboardActivate(page, opener);
  const image = page.getByRole("dialog").locator("img"); await expect(image).toHaveAttribute("src", shot.src); await image.evaluate((img: HTMLImageElement) => img.decode());
  await page.keyboard.press("Escape"); await expect(opener).toBeFocused(); expect(await saved(page)).toEqual(before);
});
test("Settings preserves the selected view and canonical navigation resets it", async ({ page }) => {
  const state = stateFor("act2_craft_archive"); await open(page, state); const before = await saved(page);
  await chooseView(page, "Person", VISUAL_SHOTS.edda.src);
  await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
  await keyboardActivate(page, page.getByRole("button", { name: "Done", exact: true }));
  await expect(page.getByTestId("sequence-shots")).toHaveAttribute("data-view", "person"); expect(await saved(page)).toEqual(before);
  let next = state;
  for (const id of ["craft-read-export", "craft-read-plant", "craft-read-movement", "craft-question-conflate"]) {
    await keyboardActivate(page, page.getByTestId(`choice-${id}`));
    const choice = presentChoices(next, getScene(next.sceneId)).find(c => c.id === id)!;
    next = commitChoice(next, choice).state;
    await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(next);
    await expect(page.getByTestId("sequence-shots")).toHaveAttribute("data-view", next.sceneId === state.sceneId ? "person" : "scene");
  }
  expect(next.sceneId).not.toBe(state.sceneId);
  await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src", sceneIllustration(next.sceneId, next.flags)!.src);
});

for (const id of ["act2_craft_archive", "act2_craft_kerr_offer"]) test(`visual frame preserves the current authored sequence focus: ${id}`, async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); await page.addInitScript(installSequenceAudioReview);
  const state = stateFor(id); await open(page, state, 1440, true, false); const before = await saved(page);
  const focus = id === "act2_craft_archive" ? {music:.55,ambience:.75} : {music:1,ambience:1};
  const mix = () => page.evaluate(() => (window as unknown as { sequenceAudioReview: SequenceAudioReview }).sequenceAudioReview.sample());
  await expect.poll(async () => (await mix()).music).toBeCloseTo(.6 * focus.music, 5);
  await expect.poll(async () => (await mix()).ambience).toBeCloseTo(.5 * focus.ambience, 5);
  const voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
  await voice.getByRole("button", { name: `Listen to ${getScene(id).speaker}`, exact: true }).click();
  await expect.poll(async () => (await mix()).music).toBeCloseTo(.6 * focus.music * .22, 5);
  await expect.poll(async () => (await mix()).ambience).toBeCloseTo(.5 * focus.ambience * .44, 5);
  const group = page.getByTestId("sequence-shots");
  await group.getByRole("button", { name: "Person", exact: true }).click();
  await expect.poll(async () => (await mix()).music).toBeCloseTo(.6 * focus.music * .22, 5);
  await voice.getByRole("button", { name: "Stop line", exact: true }).click();
  await expect.poll(async () => (await mix()).music).toBeCloseTo(.6 * focus.music, 5);
  await expect.poll(async () => (await mix()).ambience).toBeCloseTo(.5 * focus.ambience, 5);
  expect(await saved(page)).toEqual(before);
});
