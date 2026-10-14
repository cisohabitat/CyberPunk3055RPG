import { test, expect } from "@playwright/test";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { dialogueExamples } from "../qa/production/dialogue-examples";

test("enabled menu music autoplays when permitted or starts on interaction without opting in", async ({ page }) => {
  await page.addInitScript(installAudioReview, {});
  const requests: string[] = [], errors: string[] = [];
  page.on("request", request => { if (request.url().includes("/audio/theme-title.flac")) requests.push(request.url()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByTestId("title-screen")).toBeVisible();
  await expect(page.getByTestId("title-music")).toContainText(/autoplay is waiting|Loading Under the Awning|now playing/);
  if ((await page.getByTestId("title-music").innerText()).includes("autoplay is waiting")) expect(requests).toEqual([]);
  await page.getByRole("heading", { name: "Saint Shard", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.started)).toContain("theme-title.flac");
  expect(requests).toHaveLength(1);
  expect(await page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.started.filter(file => file === "theme-title.flac"))).toHaveLength(1);
  await page.getByRole("button", { name: "Stop menu music", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.liveSources)).toBe(0);
  expect(errors).toEqual([]);
});

test("pagehide cancels a pending title download; Resume can fetch a fresh playable track", async ({ page }) => {
  await page.addInitScript(installAudioReview, {});
  let attempts = 0, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/theme-title.flac", async route => {
    if (++attempts === 1) { const response = await route.fetch(); await gate; await route.fulfill({ response }).catch(() => {}); }
    else await route.continue();
  });
  await page.goto("/");
  await page.getByRole("heading", { name: "Saint Shard", exact: true }).click();
  await expect(page.getByTestId("title-music")).toContainText("Loading");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  release();
  await expect(page.getByTestId("title-music")).toContainText("paused");
  await page.getByRole("button", { name: "Resume menu music", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.started)).toEqual(["theme-title.flac"]);
  expect(attempts).toBe(2);
  await page.getByRole("button", { name: "Stop menu music", exact: true }).click();
});

test("a replacement delivery keeps the previously preferred manual quotation", async ({ page }) => {
  const id = "voice-campaign-sera-names-performance";
  const state = dialogueExamples().get(id)!.state;
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ autoVoices: false, reading: "all", music: 0, ambience: 0, effects: 0 }));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await page.getByRole("button", { name: "Listen to Sera", exact: true }).click();
  await expect(page.getByTestId("spoken-quote")).toHaveText("The wall has room for a voice. It has never had room for an excuse.");
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
});
