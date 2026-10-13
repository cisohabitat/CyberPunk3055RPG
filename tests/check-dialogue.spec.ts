import { test, expect, type Page } from "@playwright/test";
import { createCharacter, commitChoice, getScene, presentChoices } from "../lib/engine";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
const clip = bindings.find(line => "choiceId" in line && line.choiceId === "fake-pact")!;
const name = `${clip.id}.mp3`;
const run = { ...createCharacter({ handle: "Check voice", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "lumen_deal" };
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ run, preferences }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", artwork: "none", effects: 0, motion: "reduce", ...preferences }));
  }, { run, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-fake-pact").click();
  expect((await audio(page)).started.filter(n => n.startsWith("voice-"))).toEqual([]);
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await page.evaluate(() => { Math.random = () => .01; }); await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("continue-check")).toBeVisible();
}

test("Lumen speaks her revealed check result naturally without committing or rerolling the saved die", async ({ page }) => {
  await open(page); await expect.poll(async () => (await audio(page)).started).toContain(name);
  const dialog = page.getByRole("dialog"), before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  await expect(dialog.getByRole("button", { name: "Listen to Lumen", exact: true })).toBeVisible();
  expect((await audio(page)).disposed.filter(n => n === name)).toHaveLength(1);
  await dialog.getByTestId("voice-line").locator("summary").click(); await expect(dialog.getByTestId("voice-line")).toContainText("Kerr,");
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
  const staged = JSON.parse(before!), choice = presentChoices(staged, getScene(staged.sceneId)).find(c => c.id === "fake-pact")!;
  const expected = commitChoice(staged, choice, { roll: 1 }).state;
  await page.reload(); await page.getByTestId("continue-run").click();
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1")))!)).toEqual(staged);
  await page.getByTestId("continue-check").click();
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1")))!)).toEqual(expected);
});

for (const preference of [{ sound: false }, { voices: 0 }, { autoVoices: false }]) test(`check-result speech honors saved ${JSON.stringify(preference)}`, async ({ page }) => {
  const requests: string[] = []; page.on("request", r => { if (r.url().endsWith(name)) requests.push(r.url()); });
  await open(page, preference);
  const listen = page.getByRole("dialog").getByRole("button", { name: "Listen to Lumen", exact: true });
  await expect(listen).toBeVisible(); expect(requests).toEqual([]);
  if ("autoVoices" in preference) { await listen.click(); await expect.poll(async () => (await audio(page)).started).toContain(name); }
  else await expect(listen).toBeDisabled();
});

test("departing a loading check-result voice prevents its late start", async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/audio/${name}`, async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await open(page);
  await expect(page.getByRole("dialog").getByTestId("voice-line")).toContainText("Loading selected dialogue");
  await page.getByTestId("continue-check").click(); release();
  await expect.poll(async () => (await audio(page)).decoded).toContain(name);
  expect((await audio(page)).started).not.toContain(name);
});
