import { test, expect, type Page } from "@playwright/test";
import { createCharacter, getScene, sceneText } from "../lib/engine";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
const base = createCharacter({ handle: "Fresh runner", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
const speech = async (page: Page) => (await audio(page)).started.filter(name => name.startsWith("voice-"));
const file = (id: string) => `${id}.${id.startsWith("voice-campaign-") ? "mp3" : "wav"}`;
function expected(sceneId: string) { const scene = getScene(sceneId); return visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, { ...base, sceneId })).map(l => file(l.id)); }
async function open(page: Page, sceneId: string, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ run, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true, effects: 0, artwork: "none", ...preferences }));
  }, { run: { ...base, sceneId }, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

test("revealing a two-character conversation plays Sera then Ren and releases each voice", async ({ page }) => {
  test.setTimeout(40_000); await open(page, "act2_shelter_brief");
  expect(await speech(page)).toEqual([]); await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await page.getByTestId("show-rest").click(); const queue = expected("act2_shelter_brief");
  await expect.poll(() => speech(page), { timeout: 25_000 }).toEqual(queue);
  await expect(page.getByTestId("voice-line")).toHaveAttribute("aria-label", "Ren selected dialogue");
  expect((await audio(page)).disposed.filter(n => n.startsWith("voice-"))).toEqual(queue.slice(0, 1));
  await expect(page.getByRole("button", { name: "Play all dialogue", exact: true })).toBeEnabled({ timeout: 15_000 });
  expect((await audio(page)).disposed.filter(n => n.startsWith("voice-"))).toEqual(queue);
  await page.getByTestId("voice-line").locator("summary").click();
  await expect(page.getByTestId("voice-line").locator("details")).toContainText("Sera:");
  await expect(page.getByTestId("voice-line").locator("details")).toContainText("Ren:");
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1")))!).sceneId).toBe("act2_shelter_brief");
});

test("adding Lumen's revealed reply leaves Mara's current voice playing once", async ({ page }) => {
  test.setTimeout(40_000); await open(page, "act2_response_invitation");
  await page.getByTestId("next-paragraph").click();
  await expect.poll(() => speech(page)).toEqual(expected("act2_response_invitation").slice(0, 1));
  await page.getByTestId("show-rest").click();
  await expect.poll(() => speech(page), { timeout: 25_000 }).toEqual(expected("act2_response_invitation"));
  await expect(page.getByTestId("voice-line")).toHaveAttribute("aria-label", "Lumen selected dialogue");
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click(); await page.getByRole("button", { name: "Done", exact: true }).click();
  expect(await speech(page)).toEqual(expected("act2_response_invitation"));
});

test("manual mode permits the whole conversation or a selected actor without automatic fetching", async ({ page }) => {
  test.setTimeout(40_000); const requests: string[] = [];
  page.on("request", r => { if (r.url().includes("/audio/voice-")) requests.push(r.url()); });
  await open(page, "act2_shelter_brief", { reading: "all", autoVoices: false });
  expect(requests).toEqual([]); await page.getByRole("button", { name: "Play all dialogue", exact: true }).click();
  await expect.poll(() => speech(page), { timeout: 25_000 }).toEqual(expected("act2_shelter_brief"));
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  await page.getByTestId("voice-line").locator("summary").click();
  await page.getByLabel("Dialogue line", { exact: true }).selectOption({ index: 1 });
  await page.getByRole("button", { name: "Listen to Ren", exact: true }).click();
  await expect.poll(() => speech(page)).toEqual([...expected("act2_shelter_brief"), expected("act2_shelter_brief")[1]]);
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  expect(requests).toHaveLength(2);
});

test("unavailable first actor advances to the next voice while keeping dialogue and choices", async ({ page }) => {
  test.setTimeout(35_000); const queue = expected("act2_shelter_brief");
  await page.route(`**/audio/${queue[0]}`, route => route.abort());
  await open(page, "act2_shelter_brief", { reading: "all" });
  await expect.poll(() => speech(page)).toEqual(queue.slice(1));
  await expect(page.getByTestId("scene-text")).toContainText("Six households upstairs.");
  await expect(page.getByTestId("scene-text")).toContainText("My father needs the ramp");
  await expect(page.locator('[data-testid^="choice-"]:enabled').first()).toBeEnabled();
});

test("Nia's voice uses her words while Lumen remains the scene portrait", async ({ page }) => {
  await open(page, "act2_witness_door", { reading: "all", artwork: "full" });
  const queue = expected("act2_witness_door");
  await expect.poll(() => speech(page)).toEqual(queue.slice(0, 1));
  await expect(page.getByTestId("voice-line")).toHaveAttribute("aria-label", "Nia Pell selected dialogue");
  await expect(page.locator(".scene-row img.portrait")).toHaveAttribute("src", "/art/lumen.jpg");
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
});

test("pagehide during a new voice load cancels every queued actor without a late resume", async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  const queue = expected("act2_shelter_brief");
  await page.route(`**/audio/${queue[0]}`, async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await open(page, "act2_shelter_brief", { reading: "all" });
  await expect(page.getByTestId("voice-line")).toContainText("Loading selected dialogue");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }))); release();
  await expect.poll(async () => (await audio(page)).decoded).toContain(queue[0]);
  await page.getByRole("button", { name: "Resume sound", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play all dialogue", exact: true })).toBeEnabled(); expect(await speech(page)).toEqual([]);
  await page.getByRole("button", { name: "Play all dialogue", exact: true }).click();
  await expect.poll(() => speech(page)).toEqual(queue.slice(0, 1)); await page.getByRole("button", { name: "Stop line", exact: true }).click();
});
