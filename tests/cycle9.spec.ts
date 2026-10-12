import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import type { GameState } from "../lib/types";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";

const fixture = (sceneId = "memo", extra: Partial<GameState> = {}): GameState => ({ ...createCharacter({ handle: "DeviceQA", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } }), sceneId, items: ["shard"], ...extra });
async function setup(page: Page, run = fixture(), preferences = {}, suppressEnded = false) {
  await page.addInitScript(installAudioReview, { suppressEnded });
  await page.addInitScript(({ run, preferences }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", sound: true, autoVoices: false, ...preferences }));
    let visibility = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    (window as unknown as { changeVisibility: (value: string) => void }).changeVisibility = value => { visibility = value; document.dispatchEvent(new Event("visibilitychange")); };
  }, { run, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
const review = (page: Page) => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
const visibility = (page: Page, value: string) => page.evaluate(value => (window as unknown as { changeVisibility: (value: string) => void }).changeVisibility(value), value);
async function volume(page: Page, channel: string, value: number) {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const slider = page.getByLabel(`${channel} volume`); await slider.focus(); await page.keyboard.press("Home");
  for (let index = 0; index < value; index++) await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

test("cycle 9 muted channels avoid requests and unmuting one starts only that channel", async ({ page }) => {
  const audio: string[] = []; page.on("request", r => { if (r.url().includes("/audio/")) audio.push(r.url().split("/").at(-1)!); });
  await setup(page, fixture(), { music: 0, ambience: 0, effects: 0, voices: 0 });
  const before = await saved(page); await expect(page.getByTestId("scene-text")).toContainText("Ward Nine");
  expect(audio).toEqual([]); expect((await review(page)).liveSources).toBe(0);
  await volume(page, "ambience", 1); await expect.poll(async () => (await review(page)).started).toContain("ambience-chapel.flac");
  expect(audio).toEqual(["ambience-chapel.flac"]);
  await volume(page, "music", 1); await expect.poll(async () => (await review(page)).started).toContain("theme-reading.flac");
  expect(audio.sort()).toEqual(["ambience-chapel.flac", "theme-reading.flac"]);
  await volume(page, "music", 0); await expect.poll(async () => (await review(page)).liveSources).toBe(1);
  await volume(page, "ambience", 0); await expect.poll(async () => (await review(page)).liveSources).toBe(0);
  expect(await saved(page)).toEqual(before);
});

test("cycle 9 muting music releases both sides of a crossfade without ended callbacks", async ({ page }) => {
  await setup(page, fixture("mara_why"), { effects: 0 }, true);
  await expect.poll(async () => (await review(page)).liveSources).toBe(2);
  await page.getByTestId("choice-inspect-hour").click();
  await expect.poll(async () => (await review(page)).liveSources).toBe(3);
  const before = await saved(page);
  await volume(page, "music", 0);
  await expect.poll(async () => (await review(page)).liveSources).toBe(1);
  await volume(page, "ambience", 0);
  const current = await review(page);
  expect(current.liveSources).toBe(0); expect(current.sourcesDisposed).toBe(current.sourcesCreated);
  expect(current.buffersCleared).toBe(current.sourcesCreated); expect(await saved(page)).toEqual(before);
});

test("cycle 9 hidden sound releases sources without ended callbacks and resumes without replaying voice", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await setup(page, fixture(), { artwork: "none", contrast: "high", textStep: 2, numberShortcuts: false }, true);
  await expect.poll(async () => (await review(page)).liveSources).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", { name: "Listen to Mara", exact: true }).click();
  await expect.poll(async () => (await review(page)).started).toContain("voice-mara-revelation.wav");
  const before = await saved(page); await visibility(page, "hidden");
  await expect.poll(async () => (await review(page)).liveSources).toBe(0);
  let current = await review(page); expect(current.buffersCleared).toBe(current.sourcesCreated);
  await visibility(page, "visible"); await expect(page.getByTestId("audio-paused")).toBeVisible();
  const starts = current.starts; expect((await review(page)).starts).toBe(starts);
  await expect(page.getByTestId("voice-line")).toContainText("Resume sound to listen");
  await page.getByRole("button", { name: "Resume sound", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("scene")).toBeFocused();
  await expect.poll(async () => (await review(page)).liveSources).toBe(2);
  current = await review(page); expect(current.started.filter(n => n === "voice-mara-revelation.wav")).toHaveLength(1);
  expect(await saved(page)).toEqual(before); await expect(page.getByTestId("goal")).toBeInViewport();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("cycle 9 a voice loading before pagehide cannot start on return", async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/voice-mara-revelation.wav", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await setup(page); await page.getByRole("button", { name: "Listen to Mara", exact: true }).click();
  await expect(page.getByTestId("voice-line")).toContainText("Loading selected dialogue");
  const before = await saved(page); await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await expect(page.getByTestId("audio-paused")).toBeVisible(); release();
  await expect.poll(async () => (await review(page)).decoded).toContain("voice-mara-revelation.wav");
  expect((await review(page)).started).not.toContain("voice-mara-revelation.wav");
  await page.getByRole("button", { name: "Resume sound", exact: true }).click();
  await expect.poll(async () => (await review(page)).liveSources).toBeGreaterThanOrEqual(2);
  expect((await review(page)).started).not.toContain("voice-mara-revelation.wav"); expect(await saved(page)).toEqual(before);
});

test("cycle 9 repeated Sound off releases every source while preserving a recorded roll", async ({ page }) => {
  const run = fixture("chapel_window_plan", { flags: { chapel_window_started: true, chapel_window_2: true, chapel_window_scouted: true } });
  await page.addInitScript(() => { Math.random = () => .75; }); await setup(page, run, {}, true);
  await page.getByTestId("choice-window-use-gap").click(); await page.getByTestId("roll-button").click(); await page.getByTestId("continue-check").waitFor();
  const recorded = await saved(page); expect(recorded.pendingCheck.roll).toBe(8);
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toBeVisible();
  await visibility(page, "hidden"); await expect.poll(async () => (await review(page)).liveSources).toBe(0);
  await visibility(page, "visible"); expect(await saved(page)).toEqual(recorded);
  await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(recorded);
  await page.getByTestId("continue-check").click();
  const committed = await saved(page); expect(committed.pendingCheck).toBeUndefined();
  for (let index = 0; index < 3; index++) {
    await page.getByRole("button", { name: "Settings", exact: true }).click(); await page.getByLabel("Sound enabled", { exact: true }).uncheck();
    await expect.poll(async () => (await review(page)).liveSources).toBe(0);
    await page.getByLabel("Sound enabled", { exact: true }).check(); await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect.poll(async () => (await review(page)).liveSources).toBeGreaterThanOrEqual(2);
  }
  expect(await saved(page)).toEqual(committed);
});

for (const sceneId of ["memory_table", "memory_sequence"]) test(`cycle 9 shortcut opt-out includes ${sceneId} source controls`, async ({ page }) => {
  await setup(page, fixture(sceneId, { flags: { memory_signature: true, memory_order: true, memory_roster: sceneId === "memory_sequence" } }), { numberShortcuts: false, sound: false });
  const controls = page.locator(`[data-testid="${sceneId === "memory_table" ? "memory-plate" : "memory-workspace"}"] button`);
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) await expect(control).not.toHaveAttribute("aria-keyshortcuts");
  const before = await saved(page); await page.keyboard.press("1"); expect(await saved(page)).toEqual(before);
  await controls.first().focus(); await page.keyboard.press("Enter"); expect(await saved(page)).not.toEqual(before);
});

test("cycle 9 controller reaches the active sheet panel without making a choice", async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array(16).fill(false); (window as unknown as { padButtons: boolean[] }).padButtons = buttons;
    Object.defineProperty(navigator, "getGamepads", { value: () => [{ index: 0, mapping: "standard", buttons: buttons.map(pressed => ({ pressed })) }] });
  });
  await setup(page, fixture("stall"), { sound: false, controller: true }); const before = await saved(page);
  if (page.viewportSize()!.width <= 1100) await page.getByTestId("sheet-toggle").click();
  await page.getByRole("tab", { name: "journal", exact: true }).click();
  await page.evaluate(() => { (window as unknown as { padButtons: boolean[] }).padButtons[13] = true; });
  await expect(page.locator("#panel-journal")).toBeFocused();
  await page.evaluate(() => { (window as unknown as { padButtons: boolean[] }).padButtons[13] = false; });
  expect(await saved(page)).toEqual(before);
});
