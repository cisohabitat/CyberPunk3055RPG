import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { keyboardActivate } from "../qa/production/keyboard";
import { createCharacter } from "../lib/engine";

async function observe(page: Page, suppressEnded = false) {
  await page.addInitScript(installAudioReview, { suppressEnded });
  await page.addInitScript(() => {
    const review = window as unknown as { titlePlayback?: { node: AudioBufferSourceNode; duration: number; startedAt: number; seam: number[] } };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args: Parameters<typeof start>) {
      if (this.buffer && this.buffer.numberOfChannels === 2 && this.buffer.duration > 60) {
        const buffer = this.buffer, sample = Math.round(this.loopStart * buffer.sampleRate);
        review.titlePlayback = { node: this, duration: buffer.duration, startedAt: this.context.currentTime,
          seam: Array.from({ length: buffer.numberOfChannels }, (_, c) => Math.abs(buffer.getChannelData(c)[buffer.length - 1] - buffer.getChannelData(c)[sample])) };
      }
      return start.apply(this, args);
    };
  });
}
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function clean(page: Page) {
  await expect.poll(async () => (await audio(page)).liveSources).toBe(0);
  const current = await audio(page); expect(current.sourcesCreated).toBe(current.sourcesDisposed); expect(current.buffersCleared).toBe(current.sourcesCreated);
}

test("fresh title music starts by default and crosses its prepared loop before stopping", async ({ page }) => {
  test.setTimeout(90_000);
  await observe(page);
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/audio/")) requests.push(r.url()); });
  await page.goto("/"); await expect(page.getByTestId("title-screen")).toBeVisible();
  const before = await saved(page);
  // A browser may suspend autoplay. An ordinary title interaction unlocks it;
  // the player never has to opt into the soundtrack with its Play button.
  await page.getByRole("heading", { name: "Saint Shard", exact: true }).click();
  await expect.poll(async () => (await audio(page)).started).toContain("theme-title.flac");
  expect(requests).toHaveLength(1); expect(requests[0]).toContain("theme-title.flac");
  const loop = await page.evaluate(() => {
    const p = (window as unknown as { titlePlayback: { node: AudioBufferSourceNode; duration: number; startedAt: number; seam: number[] } }).titlePlayback;
    return { loop: p.node.loop, start: p.node.loopStart, end: p.node.loopEnd, duration: p.duration, seam: p.seam };
  });
  expect(loop.loop).toBe(true); expect(loop.start).toBe(4); expect(loop.end).toBe(loop.duration);
  expect(loop.duration).toBeGreaterThan(60); expect(loop.duration).toBeLessThan(65); expect(loop.seam.every(jump => jump < .02)).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    const p = (window as unknown as { titlePlayback: { node: AudioBufferSourceNode; duration: number; startedAt: number } }).titlePlayback;
    return p.node.context.currentTime - p.startedAt > p.duration + 1;
  }), { timeout: 75_000, intervals: [1000] }).toBe(true);
  expect((await audio(page)).started.filter(name => name === "theme-title.flac")).toHaveLength(1);
  expect((await audio(page)).liveSources).toBe(1); expect(await saved(page)).toBe(before);
  await keyboardActivate(page, page.getByRole("button", { name: "Stop menu music", exact: true })); await clean(page);
  await keyboardActivate(page, page.getByRole("button", { name: "Show replay hints", exact: true })); await clean(page);
  await keyboardActivate(page, page.getByTestId("new-run")); await expect(page.getByTestId("handle-input")).toBeVisible(); await clean(page);
});

for (const muted of [{ sound: false }, { music: 0 }]) {
  test(`default title music respects saved ${"sound" in muted ? "Sound off" : "zero Music volume"}`, async ({ page }) => {
    await observe(page);
    await page.addInitScript(preferences => localStorage.setItem("saint-shard-preferences", JSON.stringify(preferences)), muted);
    const requests: string[] = []; page.on("request", r => { if (r.url().includes("/audio/")) requests.push(r.url()); });
    await page.goto("/");
    await keyboardActivate(page, page.getByRole("button", { name: "Show replay hints", exact: true }));
    await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
    await expect(page.getByLabel("Sound enabled", { exact: true })).toBeChecked({ checked: !("sound" in muted) });
    await keyboardActivate(page, page.getByRole("button", { name: "Done", exact: true }));
    expect(requests).toEqual([]); await clean(page);
  });
}

test("a keyboard menu interaction starts the default theme without using Play", async ({ page }) => {
  await observe(page); await page.goto("/");
  await keyboardActivate(page, page.getByRole("button", { name: "Show replay hints", exact: true }));
  await expect.poll(async () => (await audio(page)).started).toContain("theme-title.flac");
  await keyboardActivate(page, page.getByRole("button", { name: "Stop menu music", exact: true })); await clean(page);
});

test("title music respects mixer, hidden-page pause and voiced gameplay handoff", async ({ page }) => {
  await observe(page, true); await page.setViewportSize({ width: 320, height: 844 });
  const run = { ...createCharacter({ handle: "MenuQA", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "memo" };
  await page.addInitScript(run => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ autoVoices: false, reading: "all", motion: "reduce", artwork: "none", effects: 0, textStep: 2, contrast: "high" }));
  }, run);
  await page.goto("/"); const before = await saved(page);
  await keyboardActivate(page, page.getByRole("button", { name: "Show replay hints", exact: true }));
  await expect.poll(async () => (await audio(page)).liveSources).toBe(1);
  await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
  await page.getByLabel("music volume", { exact: true }).focus(); await page.keyboard.press("Home"); await clean(page);
  await keyboardActivate(page, page.getByRole("button", { name: "Done", exact: true }));
  await expect(page.getByRole("button", { name: "Play menu music", exact: true })).toBeDisabled();
  await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
  await page.getByLabel("music volume", { exact: true }).focus(); await page.keyboard.press("ArrowRight");
  await keyboardActivate(page, page.getByRole("button", { name: "Done", exact: true }));
  await expect.poll(async () => (await audio(page)).liveSources).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }))); await clean(page);
  await keyboardActivate(page, page.getByRole("button", { name: "Resume menu music", exact: true }));
  await expect.poll(async () => (await audio(page)).liveSources).toBe(1); expect(await saved(page)).toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await keyboardActivate(page, page.getByTestId("continue-run"));
  await expect(page.getByTestId("title-screen")).toHaveCount(0);
  await expect.poll(async () => (await audio(page)).liveSources).toBe(2);
  await expect.poll(() => page.evaluate(() => (window as unknown as { titlePlayback: { node: AudioBufferSourceNode } }).titlePlayback.node.buffer === null)).toBe(true);
  await keyboardActivate(page, page.getByRole("button", { name: "Listen to Mara", exact: true }));
  await expect.poll(async () => (await audio(page)).started).toContain("voice-mara-revelation.wav");
  await keyboardActivate(page, page.getByRole("button", { name: "Stop line", exact: true }));
  await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
  await keyboardActivate(page, page.getByLabel("Sound enabled", { exact: true })); await clean(page);
  expect(await saved(page)).toBe(before);
});

test("unavailable title music preserves menu actions and can retry", async ({ page }) => {
  await observe(page); let attempts = 0;
  await page.route("**/audio/theme-title.flac", route => ++attempts === 1 ? route.abort() : route.continue());
  await page.goto("/"); await keyboardActivate(page, page.getByRole("button", { name: "Show replay hints", exact: true }));
  await expect(page.getByTestId("title-music")).toContainText("Music unavailable");
  await expect(page.getByTestId("new-run")).toBeEnabled(); await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeEnabled();
  await keyboardActivate(page, page.getByRole("button", { name: "Play menu music", exact: true }));
  await expect.poll(async () => (await audio(page)).liveSources).toBe(1); expect(attempts).toBe(2);
  await keyboardActivate(page, page.getByRole("button", { name: "Stop menu music", exact: true })); await clean(page);
});

test("leaving title with pending music prevents a late menu start", async ({ page }) => {
  await observe(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/theme-title.flac", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await page.goto("/"); await keyboardActivate(page, page.getByRole("button", { name: "Show replay hints", exact: true }));
  await expect(page.getByTestId("title-music")).toContainText("Loading Under the Awning");
  await keyboardActivate(page, page.getByTestId("new-run")); release();
  await expect.poll(async () => (await audio(page)).decoded).toContain("theme-title.flac");
  expect((await audio(page)).started).not.toContain("theme-title.flac"); await clean(page);
  expect(await saved(page)).toBeNull(); await expect(page.getByTestId("handle-input")).toBeVisible();
});
