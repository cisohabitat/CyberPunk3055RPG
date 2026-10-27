import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { replayCampaign } from "../lib/story-replay";
import { getScene, sceneText } from "../lib/engine";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { kerrTermsCoda, KERR_TERMS_QUOTES as Q } from "../lib/kerr-terms";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { dialogueExamples } from "../qa/production/dialogue-examples";
import type { GameState } from "../lib/types";
import bindings from "../qa/media/kerr-terms-dialogue-bindings.json";

const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
const final = (name: string) => replayCampaign(JSON.parse(readFileSync(`qa/routes/kerr/${name}.json`, "utf8"))).state;
async function open(page: Page, state: GameState, width: number, sound = false, paragraph = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound, paragraph }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: false, artwork: width === 320 ? "none" : "full", reading: paragraph ? "paragraph" : "all", textStep: width === 320 ? 2 : 0, motion: "reduce" }));
  }, { state, width, sound, paragraph });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

const stages = [
  ["named", "kerr_terms"], ["named", "kerr_terms_negotiate"], ["named", "kerr_terms_named"],
  ["bluffed", "kerr_terms_bluff"], ["bluffed", "kerr_terms_bluffed"],
  ["scarce-exposed", "kerr_terms_exposed"], ["scarce-withdrew", "kerr_terms_retreat"],
  ["bluffed-owned", "act2_kerr_terms_owned"],
];
for (const width of [390, 1440, 320]) {
  for (const [route, sceneId] of stages) test(`${sceneId} keeps the actual words, actor, art and choices at ${width}px`, async ({ page }) => {
    const state = routeCheckpoint(`kerr/${route}`, sceneId); await open(page, state, width); const before = await saved(page);
    await expect(page.getByTestId("goal")).toBeInViewport();
    await expect(page.getByTestId("scene-text")).toHaveText(sceneText(getScene(sceneId), state).replace(/\n\n/g, ""));
    const image = page.getByTestId("scene-illustration");
    if (width === 320 || sceneId === "act2_kerr_terms_owned") await expect(image).toHaveCount(0);
    else { await expect(image.locator("img")).toHaveAttribute("src", "/art/kerr-terms.jpg"); await image.scrollIntoViewIfNeeded(); await image.locator("img").evaluate((img: HTMLImageElement) => img.decode()); }
    await page.getByTestId("voice-line").locator("summary").click();
    for (const line of visibleCampaignDialogue(sceneId, "Kerr", sceneText(getScene(sceneId), state))) await expect(page.getByTestId("voice-line")).toContainText(line.text);
    expect(await saved(page)).toBe(before); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
  for (const route of ["named", "bluffed-owned", "scarce-withdrew"]) test(`${route} remembers the earned threshold cost at ${width}px`, async ({ page }) => {
    const state = final(route); await open(page, state, width); const before = await saved(page);
    await expect(page.getByTestId("goal")).toBeInViewport(); await expect(page.getByTestId("kerr-terms-coda")).toContainText(kerrTermsCoda(state)!);
    expect(await saved(page)).toBe(before); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`a ten-credit runner cannot buy a negotiated exit at ${width}px`, async ({ page }) => {
    const state = routeCheckpoint("kerr/scarce-withdrew", "kerr_terms"); await open(page, state, width);
    await page.getByTestId("choice-kerr-terms-offer").click();
    const pay = page.getByTestId("choice-kerr-terms-pay"); await expect(pay).toBeDisabled(); await expect(pay).toContainText("Need 20 creds");
    await page.getByTestId("choice-kerr-terms-back").click(); await expect(page.getByTestId("choice-kerr-open-terms")).toBeEnabled();
    expect(JSON.parse((await saved(page))!).creds).toBe(10);
  });
  test(`the named exit pays once, survives reload and keeps the actual report at ${width}px`, async ({ page }) => {
    const state = routeCheckpoint("kerr/named", "kerr_terms_negotiate"); await open(page, state, width);
    await page.getByTestId("choice-kerr-terms-pay").click(); const paid = JSON.parse((await saved(page))!);
    expect(paid.creds).toBe(state.creds - 20); expect(paid.flags.kerr_terms_named).toBe(true);
    await expect(page.getByTestId("scene-text")).toContainText("enters the name you gave him");
    await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toBe(JSON.stringify(paid));
    await page.getByTestId("choice-kerr-terms-named-exit").click(); expect(JSON.parse((await saved(page))!).creds).toBe(paid.creds);
  });
}

for (const [route, quote] of [["named", Q.returnNamed], ["bluffed", Q.returnBluffed], ["scarce-exposed", Q.returnExposed], ["scarce-withdrew", Q.returnWithdrew], ["bluffed-owned", Q.returnOwned]]) test(`${route} returns with only Kerr's actual reaction`, async ({ page }) => {
  const state = routeCheckpoint(`kerr/${route}`, "act2_kerr_door", "hear-kerr"); await open(page, state, 390);
  await expect(page.getByTestId("scene-text")).toContainText(quote); const before = await saved(page);
  await page.getByTestId("voice-line").locator("summary").click(); await expect(page.getByTestId("voice-line")).toContainText(quote);
  expect(await saved(page)).toBe(before);
});

test("paragraph pacing reveals only the current spoken terms", async ({ page }) => {
  const state = routeCheckpoint("kerr/named", "kerr_terms_negotiate"); await open(page, state, 390, false, true);
  await expect(page.getByTestId("scene-text")).not.toContainText(Q.negotiate);
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await page.getByTestId("show-rest").click(); await expect(page.getByTestId("voice-line")).toHaveCount(1);
  await expect(page.getByTestId("scene-text")).toContainText(Q.negotiate);
});

test("ordinary new-game creation enables the expanded encounter", async ({ page }) => {
  await page.goto("/"); await page.getByTestId("new-run").click();
  await page.getByTestId("complication-on-file").click();
  await page.getByTestId("plus-face").click(); await page.getByTestId("plus-face").click(); await page.getByTestId("start-run").click();
  await expect.poll(async () => JSON.parse((await saved(page)) ?? "{}").flags?.kerr_terms_enabled).toBe(true);
});

const examples = dialogueExamples();
for (const binding of bindings) test(`Kerr performance ${binding.key} plays exactly the selected visible words`, async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); const state = examples.get(binding.id)!.state;
  await open(page, state, 390, true); const before = await saved(page), voice = page.getByTestId("voice-line");
  await voice.locator("summary").click(); const selector = voice.getByLabel("Dialogue line");
  if (await selector.count()) await selector.selectOption(binding.key);
  await expect(voice).toHaveAttribute("data-voice-id", binding.id); await expect(voice).toContainText(binding.text);
  await voice.getByRole("button", { name: "Listen to Kerr", exact: true }).click();
  await expect(voice).toHaveAttribute("data-playback", "playing");
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.started.filter(file => file.startsWith("voice-")))).toEqual([`${binding.id}.mp3`]);
  await expect(voice).toHaveAttribute("data-playback", "idle", { timeout: 20_000 });
  expect(await saved(page)).toBe(before);
});
