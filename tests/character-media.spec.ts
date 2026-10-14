import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, getScene, sceneText } from "../lib/engine";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { portraitArt } from "../lib/art";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "Media review", givenName: "Jo", origin: "dustline", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", sound: true, autoVoices: false, music: 0, ambience: 0, effects: 0, textStep: 2, contrast: "high", motion: "reduce", ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  test(`campaign art follows actual assignment and conduct at ${width}px`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    const cases = [
      { sceneId: "act3_edda_reply", flags: { edda_shift_attempted: true, edda_shift_paid: true }, expected: "/art/edda-assignment.jpg", voice: "One shift." },
      { sceneId: "act3_edda_reply", flags: { edda_shift_attempted: true, edda_shift_pending: true }, expected: "/art/edda.jpg", voice: "Tell Sera what arrived." },
      { sceneId: "act2_route_receipt", flags: { kerr_route_collected: true, kerr_route_private: true }, expected: "/art/kerr-considering.jpg", voice: "" },
      { sceneId: "act2_route_receipt", flags: { kerr_route_collected: true, kerr_route_private: true, kerr_route_trace: true }, expected: "/art/kerr-closed.jpg", voice: "" },
      { sceneId: "act3_quill_introduction", flags: { quill_refused: true, quill_repaid_late: true }, expected: "/art/quill-waiting.jpg", voice: "You paid what you had postponed." },
      { sceneId: "act2_freight_brief", flags: {}, expected: "/art/asa.jpg", voice: "Diagnostic cartridge." },
    ];
    for (const sample of cases) {
      const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
      try {
        const page = await context.newPage(), requests: string[] = [], errors: string[] = [];
        page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
        page.on("pageerror", error => errors.push(error.message));
        const state = { ...base, sceneId: sample.sceneId, flags: sample.flags } as GameState;
        await open(page, state, { artwork }); const before = await saved(page);
        const portrait = page.locator(".scene-row img.portrait");
        if (artwork === "full") {
          await expect(portrait).toHaveAttribute("src", sample.expected);
          if (sample.sceneId === "act2_freight_brief") await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src", "/art/asa-dispatch.jpg");
        } else { await expect(portrait).toHaveCount(0); expect(requests).toEqual([]); }
        const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThanOrEqual(900);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const scene = getScene(state.sceneId), line = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state)).find(line => line.text.includes(sample.voice));
        if (line) {
          await page.getByTestId("voice-line").locator("summary").click();
          if (await page.getByLabel("Dialogue line", { exact: true }).count()) await page.getByLabel("Dialogue line", { exact: true }).selectOption(line.key);
          await page.getByTestId("voice-line").getByRole("button", { name: /^Listen to / }).click();
          await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", line.speaker);
          if (artwork === "full") await expect(portrait).toHaveAttribute("src", portraitArt(line.speaker, scene.id, state.flags)!);
          await page.getByRole("button", { name: "Stop line", exact: true }).click();
          await expect(page.getByTestId("spoken-quote")).toHaveCount(0); expect((await audio(page)).liveSources).toBe(0);
        }
        expect(await saved(page)).toBe(before); expect(errors).toEqual([]);
      } finally { await context.close(); }
    }
  });
}

test("the remastered conversation finishes naturally with stable text, save and accessible controls", async ({ page }) => {
  test.setTimeout(45_000);
  const state = { ...base, sceneId: "job_owner" };
  await open(page, state, { autoVoices: true, artwork: "full" });
  const before = await saved(page), text = await page.getByTestId("scene-text").textContent();
  const scene = getScene(state.sceneId), queue = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state)).map(line => `${line.id}.${line.id.startsWith("voice-campaign-") ? "mp3" : "wav"}`);
  await expect.poll(async () => (await audio(page)).disposed.filter(name => name.startsWith("voice-")), { timeout: 30_000 }).toEqual(queue);
  await expect(page.getByRole("button", { name: "Play all dialogue", exact: true })).toBeEnabled();
  await expect(page.getByTestId("spoken-quote")).toHaveCount(0);
  expect((await audio(page)).started.filter(name => name.startsWith("voice-"))).toEqual(queue);
  expect((await audio(page)).liveSources).toBe(0);
  expect(await page.getByTestId("scene-text").textContent()).toBe(text); expect(await saved(page)).toBe(before);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
