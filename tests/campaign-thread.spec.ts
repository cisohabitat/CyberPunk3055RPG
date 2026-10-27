import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { replayCampaign, type ReplaySpec } from "../lib/story-replay";
import { getScene, presentChoices } from "../lib/engine";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { integratedArchive, closeIntegratedWeek } from "../qa/production/integrated-campaign";
import { campaignThreadLeads } from "../lib/campaign-thread";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { sceneText } from "../lib/engine";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";

const finished = (name: string) => replayCampaign(JSON.parse(readFileSync(`qa/routes/${name}.json`, "utf8")) as ReplaySpec).state;
const samples: { name: string; state: GameState }[] = [
  { name: "week boundary", state: routeCheckpoint("kit-archive", "card_week") },
  { name: "wall boundary", state: routeCheckpoint("kit-archive", "card_wall") },
  { name: "neighborhood follow-ups", state: routeCheckpoint("technique-face-cosign-process", "act3_neighborhood") },
  { name: "memorial decisions", state: routeCheckpoint("witness-permission", "act3_arrival") },
  ...(["reader", "carbon", "withdraw", "paused"] as const).map(variant => ({ name: `${variant} planned ending`, state: integratedArchive(variant).final })),
  { name: "deferred recording closed", state: closeIntegratedWeek(routeCheckpoint("witness-permission", "act2_middle", "return-witness")) },
  { name: "names ending", state: finished("witness-permission") },
  { name: "witness ending", state: finished("integration-witness") },
  { name: "listed ending", state: finished("integration-listed") },
];
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, width: number, sound = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, sound }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, autoVoices: true, artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0, contrast: width === 320 ? "high" : "standard", reading: "all", motion: "reduce" }));
  }, { state, width, sound });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

for (const width of [390, 1440, 320]) for (const sample of samples) test(`${sample.name} connects the campaign without altering play at ${width}px`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await open(page, sample.state, width);
  await expect(page.getByTestId("goal")).toBeInViewport();
  const before = await saved(page), prose = await page.getByTestId("scene-text").innerText();
  const thread = page.getByTestId("campaign-thread"), summary = thread.locator(":scope > summary");
  await expect(thread).toHaveCount(1); await expect(thread).not.toHaveAttribute("open", "");
  await summary.focus(); await page.keyboard.press("Enter");
  await expect(thread).toHaveAttribute("open", "");
  if (sample.name === "carbon planned ending") await expect(thread.getByTestId("thread-account")).toContainText("Independently corroborated; key not authenticated");
  if (sample.name === "paused planned ending") await expect(thread.getByTestId("thread-plan")).toContainText("week closed after the failed attempt");
  if (sample.name === "deferred recording closed") await expect(thread.getByTestId("thread-witness")).toContainText("week closed without an approved account");
  const leads = campaignThreadLeads(presentChoices(sample.state, getScene(sample.state.sceneId)));
  for (const lead of leads) {
    const link = thread.getByRole("link", { name: lead.label, exact: true });
    await link.focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId(`choice-${lead.id}`)).toBeFocused();
    expect(await saved(page)).toBe(before);
  }
  if (width === 320) await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.getByTestId("scene-text").innerText()).toBe(prose);
  expect(await saved(page)).toBe(before); expect(errors).toEqual([]);
  await summary.focus(); await page.keyboard.press("Enter"); await expect(thread).not.toHaveAttribute("open", "");
});

test("thread inspection leaves a natural performance and its source text intact", async ({ page }) => {
  test.setTimeout(45_000);
  await page.addInitScript(installAudioReview, {});
  const state = routeCheckpoint("witness-permission", "act3_arrival");
  await open(page, state, 390, true);
  const voice = page.getByTestId("voice-line"); await expect(voice).toHaveAttribute("data-playback", "playing");
  const before = await saved(page), prose = await page.getByTestId("scene-text").innerText();
  const thread = page.getByTestId("campaign-thread"); await thread.locator(":scope > summary").click();
  await expect(voice).toHaveAttribute("data-playback", "playing");
  await expect(thread).toContainText("Private account; public permission not given");
  const scene = getScene(state.sceneId), lines = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state));
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.started.filter(name => name.startsWith("voice-"))), { timeout: 30_000 }).toEqual(lines.map(line => `${line.id}${line.id.startsWith("voice-campaign-") ? ".mp3" : ".wav"}`));
  await expect(voice).toHaveAttribute("data-playback", "idle", { timeout: 30_000 });
  const audio = await page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  expect(audio.started.filter(name => name.startsWith("voice-")).length).toBeGreaterThan(0);
  expect(audio.stoppedSources.filter(name => name.startsWith("voice-"))).toEqual([]);
  expect(await saved(page)).toBe(before);
  expect(await page.getByTestId("scene-text").innerText()).toBe(prose);
});

for (const width of [390, 320]) test(`campaign follow-ups remain accessible and never auto-select at ${width}px`, async ({ page }) => {
  const state = routeCheckpoint("technique-face-cosign-process", "act3_neighborhood");
  await open(page, state, width); const thread = page.getByTestId("campaign-thread");
  await thread.locator(":scope > summary").click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const before = await saved(page), link = thread.getByRole("link").first();
  await link.focus(); await page.keyboard.press("Enter"); expect(await saved(page)).toBe(before);
  const id = await page.evaluate(() => (document.activeElement as HTMLElement)?.dataset.testid);
  expect(id).toMatch(/^choice-/);
  await page.keyboard.press("Enter"); expect(await saved(page)).not.toBe(before);
  await expect(page.getByTestId("campaign-thread")).toHaveCount(0);
});
