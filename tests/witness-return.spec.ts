import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "../lib/engine";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { WITNESS_RETURN_QUOTES as Q } from "../lib/witness-return";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { voiceLevel } from "../lib/voice-level";
import type { GameState } from "../lib/types";
import type { ReplaySpec } from "../lib/story-replay";

const stages = [
  { route: "private-waiting-kept", scene: "act2_witness_return_private", quote: Q.waiting, art: "/art/nia-arrival.jpg" },
  { route: "private-paid", scene: "act2_witness_return_private", quote: Q.approved, art: "/art/nia-arrival.jpg" },
  { route: "private-waiting-kept", scene: "act2_witness_return_private", quote: Q.workKept, art: "/art/nia-arrival.jpg" },
  { route: "private-unkept", scene: "act2_witness_return_private", quote: Q.approved, art: "/art/nia-arrival.jpg" },
  { route: "registered", scene: "act2_witness_return_registered", quote: Q.registered, art: "/art/clinic-relay.jpg" },
  { route: "relocated", scene: "act2_witness_return_relocated", quote: Q.relocated, art: "/art/clinic-relay.jpg" },
  { route: "private-unkept", scene: "act3_witness_shift_return", quote: Q.workMissed, art: "/art/ordinary-rest.jpg" },
];
function checkpoint(stage: typeof stages[number]) {
  const spec = JSON.parse(readFileSync(`qa/routes/witness-return/${stage.route}.json`, "utf8")) as ReplaySpec;
  let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    if (state.sceneId === stage.scene && sceneText(getScene(state.sceneId), state).includes(stage.quote)) return state;
    const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === step.choiceId && c.enabled);
    if (!choice) throw new Error(`Unavailable checkpoint choice ${step.choiceId}`);
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
  }
  throw new Error(`Missing checkpoint ${stage.route}/${stage.quote}`);
}
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
const audio = (page: Page) => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, state: GameState, width: number, sound = false, automatic = false, paragraph = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound, automatic, paragraph }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: automatic, artwork: width === 320 ? "none" : "full", reading: paragraph ? "paragraph" : "all", textStep: width === 320 ? 2 : 0, contrast: "high", motion: "reduce" }));
  }, { state, width, sound, automatic, paragraph });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
for (const width of [390, 1440, 320]) for (const [index, stage] of stages.entries()) {
  test(`witness return ${index}: exact words, art, reload and canonical exit at ${width}px`, async ({ page }) => {
    const state = checkpoint(stage); await open(page, state, width); const before = await saved(page);
    await expect(page.getByTestId("goal")).toBeInViewport();
    const paragraphs = sceneText(getScene(state.sceneId), state).split(/\n\n+/).filter(Boolean);
    await expect(page.getByTestId("scene-text")).toHaveText(paragraphs.join(""));
    const illustration = page.getByTestId("scene-illustration");
    if (width === 320) await expect(illustration).toHaveCount(0);
    else { const image = illustration.locator("img"); await image.scrollIntoViewIfNeeded(); await expect(image).toHaveAttribute("src", stage.art); await image.evaluate((img: HTMLImageElement) => img.decode()); }
    const voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
    for (const line of visibleCampaignDialogue(state.sceneId, getScene(state.sceneId).speaker, paragraphs.join("\n\n"))) await expect(voice).toContainText(line.text);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await saved(page)).toBe(before);
    await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toBe(before);
    const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.enabled)!;
    await page.getByTestId(`choice-${choice.id}`).focus(); await page.keyboard.press("Enter");
    await expect.poll(async () => JSON.parse((await saved(page))!)).toEqual(commitChoice(state, choice).state);
  });
}
for (const [index, stage] of stages.entries()) test(`witness return ${index}: actual automatic voice, actor and natural completion`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(installAudioReview, {});
  const state = checkpoint(stage), lines = visibleCampaignDialogue(state.sceneId, getScene(state.sceneId).speaker, sceneText(getScene(state.sceneId), state));
  await open(page, state, 390, true, true); const before = await saved(page);
  for (const [i, line] of lines.entries()) {
    await expect.poll(async () => (await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual(lines.slice(0, i + 1).map(l => `${l.id}.mp3`));
    await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute("data-speaker", line.speaker);
    await expect(page.getByTestId("scene-text")).toContainText(line.text);
    expect((await audio(page)).voiceLevels.find(l => l.file === `${line.id}.mp3`)!.gain).toBeCloseTo(voiceLevel(line.id), 4);
    await expect.poll(async () => (await audio(page)).disposed, { timeout: 40_000 }).toContain(`${line.id}.mp3`);
  }
  expect(await saved(page)).toBe(before);
});
test("witness paragraph/manual/text-only keeps speech hidden until revealed and stops without resume", async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = checkpoint(stages[1]); const requests: string[] = [];
  page.on("request", r => { if (new URL(r.url()).pathname.startsWith("/art/")) requests.push(r.url()); });
  await open(page, state, 320, true, false, true); const before = await saved(page);
  await expect(page.getByTestId("scene-text")).not.toContainText(Q.approved); await expect(page.getByTestId("voice-line")).toHaveCount(0);
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]);
  await page.getByTestId("show-rest").click(); const voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
  await expect(voice).toContainText(Q.approved); expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]);
  await voice.getByRole("button", { name: "Listen to Nia Pell", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "playing");
  await voice.getByRole("button", { name: "Stop line", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "idle");
  await page.getByTestId("choice-keep-witness-room-boundary").focus(); await page.keyboard.press("Enter");
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toHaveLength(1); expect(requests).toEqual([]);
  expect(JSON.parse(before!).sceneId).toBe(state.sceneId);
});
test("missing witness recording preserves all written speech and the legal exit", async ({ page }) => {
  await page.route("**/audio/voice-campaign-witness-return-*.mp3", route => route.abort());
  const state = checkpoint(stages[4]); await open(page, state, 390, true, true);
  await expect(page.getByTestId("scene-text")).toContainText(Q.registered);
  const choice = presentChoices(state, getScene(state.sceneId))[0]; await page.getByTestId(`choice-${choice.id}`).click();
  await expect.poll(async () => JSON.parse((await saved(page))!)).toEqual(commitChoice(state, choice).state);
});
test("muted witness dialogue retains text, transcript, exit and save without starting speech", async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = checkpoint(stages[2]);
  await open(page, state, 390, false, true); const before = await saved(page);
  const voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
  await expect(voice).toContainText(Q.workKept); await expect(voice).toContainText(Q.approved);
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]); expect(await saved(page)).toBe(before);
  await page.getByTestId("choice-keep-witness-room-boundary").click();
  expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]);
});
test("missing witness illustration leaves speech, goal and canonical exit usable", async ({ page }) => {
  await page.route("**/art/nia-arrival*.jpg", route => route.abort()); const state = checkpoint(stages[1]);
  await open(page, state, 390); await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("scene-text")).toContainText(Q.approved);
  const choice = presentChoices(state, getScene(state.sceneId))[0]; await page.getByTestId(`choice-${choice.id}`).click();
  await expect.poll(async () => JSON.parse((await saved(page))!)).toEqual(commitChoice(state, choice).state);
});
test("new UI runs enable witness returns while retaining the selected build", async ({ page }) => {
  await page.goto("/"); await page.getByTestId("new-run").click();
  await page.getByTestId("complication-on-file").click(); await page.getByTestId("plus-face").click(); await page.getByTestId("plus-face").click();
  await page.getByTestId("start-run").click();
  await expect.poll(async () => JSON.parse((await saved(page)) ?? "{}").flags?.witness_returns_enabled).toBe(true);
  expect(JSON.parse((await saved(page))!).stats.face).toBe(4);
});
