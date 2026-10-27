import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { replayCampaign } from "../lib/story-replay";
import { getScene, sceneText } from "../lib/engine";
import { maraAccountCoda, MARA_ACCOUNT_QUOTES as Q } from "../lib/mara-account";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { dialogueExamples } from "../qa/production/dialogue-examples";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
import bindings from "../qa/media/mara-account-dialogue-bindings.json";

const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
const checkpoint = (route: string, scene: string, choice?: string) => routeCheckpoint(`mara-account/${route}`, scene, choice);
async function open(page: Page, state: GameState, width: number, sound = false, paragraph = false, automatic = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound, paragraph, automatic }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: automatic, artwork: width === 320 ? "none" : "full", reading: paragraph ? "paragraph" : "all", textStep: width === 320 ? 2 : 0, motion: "reduce" }));
  }, { state, width, sound, paragraph, automatic });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
const stages = [
  ["sold-owned", "act2_mara_account"], ["sold-owned", "act2_mara_account_told"],
  ["sold-owned", "act2_mara_account_owned"], ["partial-deflected", "act2_mara_account_deflected"],
  ["sold-distance", "act2_mara_account_distance"], ["sold-owned", "act3_mara_account_return"],
  ["sold-owned", "act3_mara_account_question"], ["destroyed-corrected", "act3_mara_account_repair"],
];
for (const width of [390, 1440, 320]) {
  for (const [route, sceneId] of stages) test(`${sceneId}: exact words, actor, fitting art and free review at ${width}px`, async ({ page }) => {
    const state = checkpoint(route, sceneId); await open(page, state, width); const before = await saved(page);
    await expect(page.getByTestId("goal")).toBeInViewport();
    await expect(page.getByTestId("scene-text")).toHaveText(sceneText(getScene(sceneId), state).replace(/\n\n/g, ""));
    const art = page.getByTestId("scene-illustration");
    if (width === 320) await expect(art).toHaveCount(0);
    else { const img = art.locator("img"); await img.scrollIntoViewIfNeeded(); await expect(img).toHaveAttribute("src", "/art/mara-account.jpg"); await img.evaluate((img: HTMLImageElement) => img.decode()); }
    await page.getByTestId("voice-line").locator("summary").click();
    for (const line of visibleCampaignDialogue(sceneId, "Mara", sceneText(getScene(sceneId), state))) await expect(page.getByTestId("voice-line")).toContainText(line.text);
    expect(await saved(page)).toBe(before); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
  for (const route of ["sold-owned", "sold-distance", "partial-deflected", "destroyed-corrected"]) test(`${route}: its own earned ending reflection at ${width}px`, async ({ page }) => {
    const state = replayCampaign(JSON.parse(readFileSync(`qa/routes/mara-account/${route}.json`, "utf8"))).state;
    await open(page, state, width); const before = await saved(page);
    await expect(page.getByTestId("goal")).toBeInViewport();
    await expect(page.getByTestId("mara-account-coda")).toContainText(maraAccountCoda(state)!);
    expect(await saved(page)).toBe(before); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`pausing and honesty retain letter, company and resources across reload at ${width}px`, async ({ page }) => {
    const state = checkpoint("sold-owned", "act2_mara_account"); await open(page, state, width);
    await page.getByTestId("choice-mara-account-pause").click();
    expect(JSON.parse((await saved(page))!).journal).toEqual(state.journal);
    await page.getByTestId("choice-mara-account-open").click(); await page.getByTestId("choice-mara-account-disclose").click();
    await expect(page.getByTestId("scene-text")).toContainText(Q.sold);
    await page.getByTestId("choice-mara-account-own").click();
    const own = JSON.parse((await saved(page))!); expect(own.creds).toBe(state.creds); expect(own.strain).toBe(state.strain);
    expect(own.flags.response_private_consent).toBe(true); expect(own.flags.response_sent).toBeUndefined();
    await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toBe(JSON.stringify(own));
    await page.getByTestId("choice-mara-account-dispatch").click();
    await expect(page.getByTestId("choice-ask-mara-tomorrow")).toBeEnabled(); await expect(page.getByTestId("choice-mara-account-open")).toHaveCount(0);
  });
  test(`acknowledgment retains deflection and the closed personal question at ${width}px`, async ({ page }) => {
    const state = checkpoint("destroyed-corrected", "act3_mara_account_return"); await open(page, state, width);
    await expect(page.getByTestId("choice-mara-account-ask")).toHaveCount(0);
    await page.getByTestId("choice-mara-account-correct").click();
    await expect(page.getByTestId("scene-text")).toContainText(Q.repair);
    const fixed = JSON.parse((await saved(page))!); expect(fixed.flags.mara_account_deflected).toBe(true); expect(fixed.flags.mara_account_repaired).toBe(true);
    expect(fixed.flags.mara_account_owned).toBeUndefined(); expect(fixed.creds).toBe(state.creds); expect(fixed.strain).toBe(state.strain);
    await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toBe(JSON.stringify(fixed));
    await expect(page.getByTestId("choice-mara-account-ask")).toHaveCount(0);
  });
}

test("paragraph reading does not voice a hidden personal question", async ({ page }) => {
  const state = checkpoint("sold-owned", "act3_mara_account_question"); await open(page, state, 390, false, true);
  await expect(page.getByTestId("scene-text")).not.toContainText(Q.question); await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await page.getByTestId("show-rest").click(); await expect(page.getByTestId("scene-text")).toContainText(Q.question);
  await expect(page.getByTestId("voice-line")).toHaveCount(1);
});
test("deflection closes further personal questions while keeping the letter usable", async ({ page }) => {
  const state = checkpoint("partial-deflected", "act2_mara_account_told"); await open(page, state, 390);
  await page.getByTestId("choice-mara-account-deflect").click();
  await page.getByTestId("choice-mara-account-dispatch").click();
  await expect(page.getByTestId("choice-ask-mara-tomorrow")).toHaveCount(0);
  await expect(page.getByTestId("choice-ask-lumen-staying")).toBeEnabled();
  await page.getByTestId("choice-arrange-response-dispatch").click();
  await expect(page.getByTestId("choice-courier-private-response")).toBeEnabled();
  expect(JSON.parse((await saved(page))!).creds).toBe(state.creds);
});
test("new UI creation enables Mara without changing the selected build", async ({ page }) => {
  await page.goto("/"); await page.getByTestId("new-run").click(); await page.getByTestId("complication-on-file").click();
  await page.getByTestId("plus-face").click(); await page.getByTestId("plus-face").click(); await page.getByTestId("start-run").click();
  await expect.poll(async () => JSON.parse((await saved(page)) ?? "{}").flags?.mara_account_enabled).toBe(true);
  expect(JSON.parse((await saved(page))!).stats.face).toBe(4);
});
test("text-only personal dialogue makes no art requests and remains keyboard accessible", async ({ page }) => {
  const requests: string[] = []; page.on("request", r => { if (new URL(r.url()).pathname.startsWith("/art/")) requests.push(r.url()); });
  await open(page, checkpoint("sold-distance", "act2_mara_account_distance"), 320);
  const button = page.getByTestId("choice-mara-account-dispatch"); await button.focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("choice-arrange-response-dispatch")).toBeEnabled(); expect(requests).toEqual([]);
});

const examples = dialogueExamples();
for (const line of bindings) test(`Mara ${line.key}: actual visible performance and actor without save changes`, async ({ page }) => {
  await page.addInitScript(installAudioReview, {}); await open(page, examples.get(line.id)!.state, 390, true);
  const before = await saved(page), voice = page.getByTestId("voice-line"); await voice.locator("summary").click();
  const selector = voice.getByLabel("Dialogue line"); if (await selector.count()) await selector.selectOption(line.key);
  await expect(voice).toHaveAttribute("data-voice-id", line.id); await expect(voice).toContainText(line.text);
  await voice.getByRole("button", { name: "Listen to Mara", exact: true }).click(); await expect(voice).toHaveAttribute("data-playback", "playing");
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.started.filter(f => f.startsWith("voice-")))).toEqual([`${line.id}.mp3`]);
  await expect(page.locator(".portrait-frame[data-speaking=\"true\"]")).toHaveAttribute("data-speaker", "Mara");
  await expect(voice).toHaveAttribute("data-playback", "idle", { timeout: 20_000 }); expect(await saved(page)).toBe(before);
});
