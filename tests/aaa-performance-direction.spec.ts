import { test, expect, type Page } from "@playwright/test";
import { getScene, sceneText, presentChoices, commitChoice } from "../lib/engine";
import { performanceVoicePath } from "../lib/performance-delivery";
import { BED_FOCUS, type BedFocus } from "../lib/pivotal-scenes";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { installSequenceAudioReview, type SequenceAudioReview } from "../qa/production/sequence-audio-review";
import phase from "../qa/media/aaa-performance-direction.json";
import type { GameState } from "../lib/types";
const rows = phase.deliveries.map(delivery => ({ delivery, example: phase.examples.find(e => e.id === delivery.id)! }));
const audio = (page: Page) => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
const mix = (page: Page) => page.evaluate(() => (window as unknown as { sequenceAudioReview: SequenceAudioReview }).sequenceAudioReview.sample());
const saved = (page: Page) => page.evaluate(() => ({ save: localStorage.getItem("saint-shard-3055-v1"), preferences: localStorage.getItem("saint-shard-preferences"), codex: localStorage.getItem("saint-shard-codex") }));
const stateFor = (row: typeof rows[number]) => routeCheckpoint(row.example.route, row.example.sceneId, row.example.nextChoiceId);
async function open(page: Page, state: GameState, width = 390, sound = true, automatic = true, paragraph = false, voices = 70) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound, automatic, paragraph, voices }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: automatic, voices, music: 60, ambience: 50, effects: 0, artwork: width === 320 ? "none" : "full", reading: paragraph ? "paragraph" : "all", textStep: width === 320 ? 2 : 0, motion: "reduce", contrast: "high" }));
  }, { state, width, sound, automatic, paragraph, voices });
  await page.goto("/"); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("goal")).toBeVisible();
}
async function observe(page: Page, row: typeof rows[number]) {
  await page.addInitScript(installAudioReview, {}); await page.addInitScript(installSequenceAudioReview);
  const requests: string[] = [], original = `/audio/${row.delivery.id}.mp3`, directed = performanceVoicePath(row.delivery.id)!;
  page.on("request", request => { const path = new URL(request.url()).pathname; if ([original, directed].includes(path)) requests.push(path); });
  return { requests, original, directed, file: `${row.delivery.id}.mp3` };
}
async function natural(page: Page, file: string, count = 1) {
  await expect.poll(async () => (await audio(page)).disposed.filter(f => f === file).length, { timeout: 20_000 }).toBe(count);
  expect((await audio(page)).stoppedSources).not.toContain(file);
}
async function exit(page: Page, state: GameState) {
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.enabled && !c.check)!; expect(choice).toBeDefined();
  await page.getByTestId(`choice-${choice.id}`).click(); await expect.poll(async () => JSON.parse((await saved(page)).save!)).toEqual(commitChoice(state, choice).state);
}
for (const width of [390, 1440]) for (const row of rows) test(`directed performance ${row.delivery.id} completes with matching actor, art and actual buses at ${width}px`, async ({ page }) => {
  const observation = await observe(page, row), state = stateFor(row), focus = BED_FOCUS[row.example.focus as BedFocus];
  let release!: () => void; const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route(observation.directed, async route => { await ready; await route.continue(); });
  try {
    await open(page, state, width); const before = await saved(page);
    await expect.poll(async () => (await mix(page)).music).toBeCloseTo(.6 * focus.music, 5);
    await expect.poll(async () => (await mix(page)).ambience).toBeCloseTo(.5 * focus.ambience, 5);
    await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src", row.example.art.src); release();
    await expect.poll(async () => (await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([observation.file]);
    const quote = page.getByTestId("spoken-quote"); await expect(quote).toContainText(row.delivery.text); await expect(quote).toHaveAttribute("data-speaker", row.delivery.speaker);
    await expect(page.locator('.portrait-frame[data-speaking="true"]')).toHaveAttribute("data-speaker", row.delivery.speaker);
    expect((await audio(page)).voiceLevels.find(l => l.file === observation.file)!.gain).toBe(1);
    await expect.poll(async () => (await mix(page)).music).toBeCloseTo(.6 * focus.music * .22, 5);
    await expect.poll(async () => (await mix(page)).ambience).toBeCloseTo(.5 * focus.ambience * .44, 5);
    expect((await mix(page)).voices).toBeCloseTo(.7, 5);
    await page.getByTestId("sequence-shots").getByRole("button", { name: "Detail", exact: true }).click();
    await natural(page, observation.file); await expect(quote).toHaveCount(0);
    expect(observation.requests).toEqual([observation.directed]); expect(await saved(page)).toEqual(before);
    await expect.poll(async () => (await mix(page)).music).toBeCloseTo(.6 * focus.music, 5);
    await expect(page.getByTestId("scene-text")).toHaveText(sceneText(getScene(state.sceneId), state).split(/\n\n+/).filter(Boolean).join(""));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { release(); await page.unrouteAll({ behavior: "ignoreErrors" }); }
});
for (const row of rows) test(`missing alternative falls back to its exact original once: ${row.delivery.id}`, async ({ page }) => {
  const observation = await observe(page, row), state = stateFor(row);
  await page.route(observation.directed, route => route.fulfill({ status: 404, body: "Unavailable" }));
  await open(page, state); const before = await saved(page);
  await expect.poll(async () => (await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([observation.file]);
  await expect(page.getByTestId("spoken-quote")).toContainText(row.delivery.text); await natural(page, observation.file);
  expect(observation.requests).toEqual([observation.directed, observation.original]); expect(await saved(page)).toEqual(before);
});
for (const row of [rows[0], rows.at(-1)!]) test(`undecodable alternative uses the retained original: ${row.delivery.id}`, async ({ page }) => {
  const observation = await observe(page, row); await page.route(observation.directed, route => route.fulfill({ status: 200, contentType: "audio/mpeg", body: "Invalid audio" }));
  await open(page, stateFor(row)); const before = await saved(page); await natural(page, observation.file);
  expect(observation.requests).toEqual([observation.directed, observation.original]); expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([observation.file]); expect(await saved(page)).toEqual(before);
});
test("missing both versions consumes the unavailable line and leaves canonical play readable", async ({ page }) => {
  const row = rows[0], observation = await observe(page, row), state = stateFor(row);
  await page.route(observation.directed, route => route.abort()); await page.route(observation.original, route => route.abort());
  await open(page, state); const before = await saved(page); await expect(page.getByTestId("voice-line")).toHaveAttribute("data-playback", "unavailable");
  expect(observation.requests).toEqual([observation.directed, observation.original]); expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]);
  await expect(page.getByTestId("scene-text")).toContainText(row.delivery.text); expect(await saved(page)).toEqual(before); await exit(page, state);
});
for (const speaker of ["Edda", "Kerr", "Sera", "Ives"]) test(`paragraph/manual/text-only ${speaker} retains reveal, Listen and Stop`, async ({ page }) => {
  const row = rows.find(r => r.delivery.speaker === speaker)!, observation = await observe(page, row), state = stateFor(row), art: string[] = [];
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/art/")) art.push(request.url()); });
  await open(page, state, 320, true, false, true); const before = await saved(page); expect(observation.requests).toEqual([]);
  const reveal = page.getByTestId("show-rest"); if (await reveal.count()) await reveal.click();
  const widget = page.getByTestId("voice-line"); await widget.locator("summary").click(); await widget.getByRole("button", { name: `Listen to ${speaker}`, exact: true }).click();
  await expect(widget).toHaveAttribute("data-playback", "playing"); await widget.getByRole("button", { name: "Stop line", exact: true }).click(); await expect(widget).toHaveAttribute("data-playback", "idle");
  expect(observation.requests).toEqual([observation.directed]); expect(art).toEqual([]); expect(await saved(page)).toEqual(before);
});
for (const [sound, voices] of [[false, 70], [true, 0]] as const) test(`alternative requests respect sound=${sound}, voices=${voices}`, async ({ page }) => {
  const row = rows[0], observation = await observe(page, row); await open(page, stateFor(row), 390, sound, true, false, voices); const before = await saved(page);
  await page.getByTestId("sequence-shots").getByRole("button", { name: "Person", exact: true }).click(); await page.getByTestId("voice-line").locator("summary").click();
  expect(observation.requests).toEqual([]); expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]); expect(await saved(page)).toEqual(before);
});
for (const fallback of [false, true]) test(`logical voice cache replays one delivery without another download; fallback=${fallback}`, async ({ page }) => {
  const row = rows[0], observation = await observe(page, row);
  let release!: () => void; const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route(observation.directed, async route => { await ready; if (fallback) await route.fulfill({ status: 404, body: "Unavailable" }); else await route.continue(); });
  try {
    await open(page, stateFor(row)); const before = await saved(page);
    // Measure reuse after actual cold beds settle. The existing bounded LRU
    // may evict an earlier voice while a larger score finishes decoding.
    await expect.poll(async () => (await mix(page)).music).toBeCloseTo(.6, 5);
    await expect.poll(async () => (await mix(page)).ambience).toBeCloseTo(.5, 5); release();
    await natural(page, observation.file);
    const widget = page.getByTestId("voice-line"); await widget.locator("summary").click(); await widget.getByRole("button", { name: `Listen to ${row.delivery.speaker}`, exact: true }).click();
    await natural(page, observation.file, 2); expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([observation.file, observation.file]);
    expect(observation.requests).toEqual(fallback ? [observation.directed, observation.original] : [observation.directed]); expect(await saved(page)).toEqual(before);
  } finally { release(); await page.unrouteAll({ behavior: "ignoreErrors" }); }
});
for (const holdOriginal of [false, true]) test(`Stop during ${holdOriginal ? "fallback" : "alternative"} loading cannot start late speech`, async ({ page }) => {
  const row = rows[0], observation = await observe(page, row); let release!: () => void; const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route(observation.directed, async route => { if (!holdOriginal) await ready; await route.fulfill({ status: 404, body: "Unavailable" }); });
  if (holdOriginal) await page.route(observation.original, async route => { await ready; await route.continue(); });
  try {
    await open(page, stateFor(row)); const before = await saved(page);
    await expect.poll(() => observation.requests).toContain(holdOriginal ? observation.original : observation.directed);
    const widget = page.getByTestId("voice-line"); await widget.locator("summary").click(); await widget.getByRole("button", { name: "Stop line", exact: true }).click(); release();
    await expect.poll(async () => (await audio(page)).decoded).toContain(observation.file);
    expect((await audio(page)).started.filter(f => f.startsWith("voice-"))).toEqual([]); await expect(widget).toHaveAttribute("data-playback", "idle"); expect(await saved(page)).toEqual(before);
  } finally { release(); await page.unrouteAll({ behavior: "ignoreErrors" }); }
});
