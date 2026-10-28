import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { commitChoice, getScene, presentChoices, sceneText } from "../lib/engine";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { nextStep, weekClosingPromises } from "../lib/objectives";
import type { GameState } from "../lib/types";
const profiles = [
  ["scarce-archive-open", "act2_middle"],
  ["witness-known-room", "act2_middle"],
  ["mara-account/sold-owned", "act2_mara_account_told"],
  ["witness-return/private-unkept", "act2_witness_return_private"],
  ["witness-return/private-unkept", "act3_witness_visit"],
  ["mara-account/sold-owned", "act3_mara_account_return"],
  ["scarce-archive-open", "act3_arrival"],
];
const saved = (page: Page) => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), preferences: localStorage.getItem("saint-shard-preferences"), codex: localStorage.getItem("saint-shard-codex") }));
async function open(page: Page, state: GameState, width: number, paragraph = false, sound = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, paragraph, sound }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: sound, reading: paragraph ? "paragraph" : "all", artwork: width === 320 ? "none" : "full", textStep: 2, contrast: "high", motion: "reduce" }));
  }, { state, width, paragraph, sound });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
for (const width of [390, 1440, 320]) for (const [route, sceneId] of profiles) test(`decisions before records: ${route}/${sceneId} at ${width}px`, async ({ page }) => {
  const state = routeCheckpoint(route, sceneId), choices = presentChoices(state, getScene(sceneId));
  await open(page, state, width); const before = await saved(page), records = page.getByTestId("decision-records");
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("scene-text")).toHaveText(sceneText(getScene(sceneId), state).split(/\n\n+/).filter(Boolean).join(""));
  expect(await records.evaluate(node => !!(document.getElementById("choices")!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  expect(await page.locator('#choices > button[data-testid^="choice-"]').evaluateAll(nodes => nodes.map(n => n.getAttribute("data-testid")))).toEqual(choices.map(c => `choice-${c.id}`));
  for (const choice of choices) {
    const button = page.getByTestId(`choice-${choice.id}`); await expect(button.locator(".label")).toHaveText(choice.label);
    if (choice.enabled) await expect(button).toBeEnabled(); else await expect(button).toBeDisabled();
    if (choice.disabledReason) await expect(button).toContainText(choice.disabledReason); else if (choice.detail) await expect(button).toContainText(choice.detail);
    if ([choice.next, choice.nextSuccess, choice.nextFail].some(next => typeof next === "string" && ["ending_week_wards", "ending_week_deal", "ending_exposed"].includes(next))) {
      const promises = weekClosingPromises(state); if (promises.length) for (const promise of promises) await expect(button).toContainText(promise.title);
    }
  }
  await keyboardActivate(page, page.getByTestId("review-decision-records")); await expect(records).toBeFocused();
  await expect(records.getByRole("region", { name: "Choice reference" })).toContainText("Selecting an option commits it");
  if (nextStep(state)) await expect(records.getByTestId("objectives")).toContainText(nextStep(state));
  const summary = records.getByTestId("objectives").locator("details > summary").first();
  if (await summary.count()) { await keyboardActivate(page, summary); await expect(summary.locator("..")).toHaveAttribute("open", ""); }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(await saved(page)).toEqual(before);
  await keyboardActivate(page, page.getByTestId("return-to-choices")); await expect(page.locator("#choices")).toBeFocused();
  expect(await saved(page)).toEqual(before);
  await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(before);
  const first = choices.find(c => c.enabled && !c.check)!; await keyboardActivate(page, page.getByTestId(`choice-${first.id}`));
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state, first).state);
});
for (const [route, sceneId, testId] of [
  ["scarce-archive-open", "act2_archive_gap", "archive-brief"],
  ["witness-known-room", "act2_witness_checkpoint", "transfer-brief"],
  ["integration-names", "memory_table", "memory-plate"],
]) test(`active preparation stays before choices: ${sceneId}`, async ({ page }) => {
  const state = routeCheckpoint(route, sceneId); await open(page, state, 320);
  await expect(page.getByTestId("decision-records")).toHaveCount(0); await expect(page.getByTestId("review-decision-records")).toHaveCount(0);
  const preparation = page.getByTestId(testId); await expect(preparation).toBeVisible();
  expect(await preparation.evaluate(node => !!(node.compareDocumentPosition(document.getElementById("choices")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  if (sceneId === "act2_witness_checkpoint") {
    if (state.flags.witness_alert) await expect(preparation).toContainText("The desk is alerted");
    else await expect(preparation).not.toContainText("The desk is alerted");
    await expect(preparation).toContainText("She reviews any recording after arrival");
  }
});
test("paragraph reading and records review preserve unrevealed words and the held save", async ({ page }) => {
  const state = routeCheckpoint("mara-account/sold-owned", "act2_mara_account_told"); await open(page, state, 390, true); const before = await saved(page);
  await expect(page.getByTestId("scene-text").locator("p")).toHaveCount(1); await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await keyboardActivate(page, page.getByTestId("review-decision-records")); await keyboardActivate(page, page.getByTestId("return-to-choices"));
  await expect(page.getByTestId("scene-text").locator("p")).toHaveCount(1); await expect(page.getByTestId("voice-line")).toHaveCount(0); expect(await saved(page)).toEqual(before);
  await keyboardActivate(page, page.getByTestId("show-rest")); await expect(page.getByTestId("voice-line")).toHaveCount(1);
});

test("records focus leaves actual automatic dialogue, actor and save intact", async ({ page }) => {
  await page.addInitScript(installAudioReview, {});
  const state = routeCheckpoint("mara-account/sold-owned", "act2_mara_account_told");
  const line = visibleCampaignDialogue(state.sceneId, "Mara", sceneText(getScene(state.sceneId), state))[0];
  await open(page, state, 390, false, true); const before = await saved(page);
  const audio = () => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  await expect.poll(async () => (await audio()).started.filter(f => f.startsWith("voice-"))).toEqual([`${line.id}.mp3`]);
  await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", "Mara");
  await expect(page.getByTestId("spoken-quote")).toContainText(line.text);
  await keyboardActivate(page, page.getByTestId("review-decision-records")); await keyboardActivate(page, page.getByTestId("return-to-choices"));
  expect(await saved(page)).toEqual(before);
  await expect.poll(async () => (await audio()).disposed, { timeout: 20_000 }).toContain(`${line.id}.mp3`);
  expect((await audio()).started.filter(f => f.startsWith("voice-"))).toEqual([`${line.id}.mp3`]); expect(await saved(page)).toEqual(before);
});
