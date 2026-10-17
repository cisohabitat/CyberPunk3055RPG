import { test, expect } from "@playwright/test";
import { getScene, sceneText } from "../lib/engine";
import { portraitArt } from "../lib/art";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { dialogueExamples } from "../qa/production/dialogue-examples";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";

// These conditional examples are source checkpoints, not completed UI campaigns.
const ids = [
  "voice-campaign-quill-bca344313982",
  "voice-campaign-nia-pell-97c62dc0bb78",
  "voice-campaign-kerr-35739b2889fc",
  "voice-campaign-sera-b4f7128c2a13",
  "voice-campaign-sera-44d1f1b59758",
  "voice-campaign-nia-pell-bea4f8df04a1",
  "voice-campaign-kerr-684866ad9287",
  "voice-campaign-quill-2ab424110b96",
  "voice-campaign-quill-facb468bbd8c",
];
const examples = dialogueExamples();
const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

for (const width of [390, 1440]) for (let start = 0; start < ids.length; start += 3) {
  test(`conditional dialogue keeps its words, actor and progress at ${width}px, batch ${start / 3 + 1}`, async ({ browser, baseURL }) => {
    test.setTimeout(60_000);
    for (const id of ids.slice(start, start + 3)) {
      const example = examples.get(id)!;
      const scene = getScene(example.state.sceneId);
      const queue = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, example.state));
      const index = queue.findIndex(line => line.id === id);
      expect(index).toBeGreaterThanOrEqual(0);
      const line = queue[index];
      const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
      try {
        const page = await context.newPage(), errors: string[] = [], failedMedia: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("requestfailed", request => {
          if (/\/(art|audio)\//.test(request.url())) failedMedia.push(request.url());
        });
        page.on("response", response => {
          if (/\/(art|audio)\//.test(response.url()) && response.status() >= 400) failedMedia.push(response.url());
        });
        await page.addInitScript(installAudioReview, { suppressEnded: true });
        await page.addInitScript(state => {
          localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
          localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", autoVoices: false, artwork: "full", sound: true, music: 0, ambience: 0, effects: 0, motion: "reduce" }));
        }, example.state);
        await page.goto("/"); await page.getByTestId("continue-run").click();
        const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
        const control = page.getByTestId("scene").getByTestId("voice-line");
        const audio = (): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
        expect((await audio()).started.filter(file => file.startsWith("voice-"))).toEqual([]);
        await control.locator("summary").click();
        if (queue.length > 1) await control.getByLabel("Dialogue line", { exact: true }).selectOption(line.key);
        await expect(control.getByRole("status")).toContainText(`Selected dialogue · Line ${index + 1} of ${queue.length}`);
        await control.getByRole("button", { name: /^Listen to / }).click();
        await expect(control.getByRole("status")).toContainText(`Playing selected dialogue · ${line.speaker === "Sister Lumen" ? "Lumen" : line.speaker} · Line ${index + 1} of ${queue.length}`);
        const mark = page.getByTestId("spoken-quote");
        expect(words((await mark.textContent())!)).toEqual(words(line.text));
        await expect(mark).toHaveAttribute("data-speaker", line.speaker);
        const portrait = page.locator(".scene-row .portrait-frame");
        await expect(portrait).toHaveAttribute("data-speaker", line.speaker);
        await expect(portrait).toHaveAttribute("data-speaking", "true");
        await expect(portrait.locator("img")).toHaveAttribute("src", portraitArt(line.speaker, scene.id, example.state.flags)!);
        await expect(portrait.locator("img")).toBeVisible();
        await expect.poll(() => portrait.locator("img").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        expect((await audio()).started.filter(file => file.startsWith("voice-"))).toEqual([`${id}.mp3`]);
        await control.getByRole("button", { name: "Stop line", exact: true }).click();
        await expect(mark).toHaveCount(0);
        await expect(portrait).toHaveAttribute("data-speaking", "false");
        await expect.poll(async () => (await audio()).liveSources).toBe(0);
        expect((await audio()).disposed.filter(file => file.startsWith("voice-"))).toEqual([`${id}.mp3`]);
        expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(errors).toEqual([]); expect(failedMedia).toEqual([]);
      } finally { await context.close(); }
    }
  });
}
