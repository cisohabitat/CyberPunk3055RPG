import { test, expect, type Page } from "@playwright/test";
import { createCharacter } from "../lib/engine";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";

const run = (sceneId = "memo") => ({ ...createCharacter({ handle: "VoiceDefault", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId });
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
const speech = async (page: Page) => (await audio(page)).started.filter(name => name.startsWith("voice-"));
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, preferences?: object, scene = "memo") {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    if (preferences) localStorage.setItem("saint-shard-preferences", JSON.stringify(preferences));
  }, { state: run(scene), preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

test("fresh preferences enable voices; reveal plays once and Stop survives dialogs and page resume", async ({ page }) => {
  const requests: string[] = []; page.on("request", request => { if (request.url().includes("/audio/voice-")) requests.push(request.url()); });
  await open(page); const before = await saved(page);
  await expect(page.getByTestId("voice-line")).toHaveCount(0); expect(requests).toEqual([]);
  await page.getByTestId("show-rest").click();
  await expect.poll(() => speech(page)).toEqual(["voice-mara-revelation.wav"]);
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Sound enabled", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Play dialogue automatically", { exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await page.getByRole("button", { name: "Resume sound", exact: true }).click();
  await expect(page.getByRole("button", { name: "Listen to Mara", exact: true })).toBeVisible();
  expect(await speech(page)).toEqual(["voice-mara-revelation.wav"]); expect(await saved(page)).toBe(before);
  await page.getByTestId("choice-heard").click();
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await page.getByTestId("show-rest").click();
  await expect.poll(() => speech(page)).toEqual(["voice-mara-revelation.wav", "voice-mara-mara-why.wav"]);
});

test("automatic voice completes naturally, releases its buffer and permits explicit replay", async ({ page }) => {
  test.setTimeout(40_000);
  await open(page, { reading: "all", effects: 0 }, "job_owner"); const before = await saved(page);
  await expect.poll(() => speech(page)).toEqual(["voice-quill-job-owner.wav"]);
  await expect(page.getByRole("button", { name: "Listen to Quill", exact: true })).toBeVisible({ timeout: 25_000 });
  await expect.poll(async () => (await audio(page)).liveSources).toBe(2);
  expect((await audio(page)).buffersCleared).toBe(1); expect(await saved(page)).toBe(before);
  await page.getByRole("button", { name: "Listen to Quill", exact: true }).click();
  await expect.poll(() => speech(page)).toHaveLength(2);
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  await expect.poll(async () => (await audio(page)).liveSources).toBe(2);
});

for (const preferences of [{ sound: false }, { voices: 0 }, { autoVoices: false }]) test(`saved ${JSON.stringify(preferences)} prevents automatic speech`, async ({ page }) => {
  const requests: string[] = []; page.on("request", request => { if (request.url().includes("/audio/voice-")) requests.push(request.url()); });
  await open(page, { reading: "all", ...preferences });
  await expect(page.getByRole("button", { name: "Listen to Mara", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Sound enabled", { exact: true })).toBeChecked({ checked: preferences.sound !== false });
  expect(requests).toEqual([]); expect(await speech(page)).toEqual([]);
});

test("leaving during automatic loading cancels the late voice and preserves the next scene", async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/voice-mara-revelation.wav", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await open(page, { reading: "all" });
  await expect(page.getByTestId("voice-line")).toContainText("Loading selected dialogue");
  await page.getByTestId("choice-heard").click(); release();
  await expect.poll(async () => (await audio(page)).decoded).toContain("voice-mara-revelation.wav");
  await expect.poll(() => speech(page)).toEqual(["voice-mara-mara-why.wav"]);
  expect(JSON.parse((await saved(page))!).sceneId).toBe("mara_why");
});

test("missing automatic voice leaves readable text, a retry and working story choices", async ({ page }) => {
  await page.route("**/audio/voice-mara-revelation.wav", route => route.abort());
  await open(page, { reading: "all" }); const before = await saved(page);
  await expect(page.getByTestId("voice-line")).toContainText("Voice unavailable");
  await expect(page.getByTestId("scene-text")).toContainText("I signed the coolant dump");
  expect(await saved(page)).toBe(before);
  await page.unroute("**/audio/voice-mara-revelation.wav");
  await page.getByRole("button", { name: "Listen to Mara", exact: true }).click();
  await expect.poll(() => speech(page)).toEqual(["voice-mara-revelation.wav"]);
  await page.getByTestId("choice-heard").click();
  expect(JSON.parse((await saved(page))!).flags.heard_memo).toBe(true);
});
