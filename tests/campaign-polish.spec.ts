import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { integratedArchive, takeIntegrated } from "../qa/production/integrated-campaign";
import { replayCampaign, type ReplaySpec } from "../lib/story-replay";
import { getScene, presentChoices } from "../lib/engine";
import { districtActorKnowledge } from "../lib/district-response";
import type { GameState } from "../lib/types";

const finished = (name: string) => replayCampaign(JSON.parse(readFileSync(`qa/routes/${name}.json`, "utf8")) as ReplaySpec).state;
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, width: number, paragraph = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width, paragraph }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: width === 320 ? "none" : "full", reading: paragraph ? "paragraph" : "all", textStep: width === 320 ? 2 : 0, motion: "reduce" }));
  }, { state, width, paragraph });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
for (const width of [390, 1440, 320]) {
  test(`consolidated depot history keeps every knowledge boundary at ${width}px`, async ({ page }) => {
    const state = routeCheckpoint("technique-face-cosign-process", "act2_middle", "hear-response");
    await open(page, state, width); const before = await saved(page);
    await expect(page.getByTestId("goal")).toBeInViewport();
    await expect(page.getByTestId("district-ledger")).toHaveCount(0);
    const thread = page.getByTestId("campaign-thread"); await thread.locator(":scope > summary").click();
    const people = page.getByTestId("thread-people"); await people.locator(":scope > summary").click();
    for (const person of districtActorKnowledge(state)) for (const detail of [person.firsthand, person.told, person.response]) await expect(people).toContainText(detail);
    expect(await saved(page)).toBe(before);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  for (const [route, phrase] of [["technique-face-cosign-process", "gave up the sorting wage"], ["witness-known-room", "earlier address private again"], ["scarce-archive-open", "question still open"]]) test(`${route} shows its earned written cost at ${width}px`, async ({ page }) => {
    const state = finished(route); await open(page, state, width); const before = await saved(page);
    await expect(page.getByTestId("goal")).toBeInViewport();
    await expect(page.getByTestId("consequence-echo")).toContainText(phrase);
    await expect(page.getByTestId("district-ledger")).toHaveCount(0);
    await expect(page.getByTestId("archive-planner")).toHaveCount(0);
    expect(await saved(page)).toBe(before);
    if (width === 320) await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
  test(`decision review is keyboard navigation and retains all actual costs at ${width}px`, async ({ page }) => {
    const state = routeCheckpoint("scarce-archive-open", "act2_middle"); await open(page, state, width);
    const before = await saved(page), choices = page.locator("#choices"), copy = await choices.innerText();
    const jump = page.getByTestId("review-choices"); await jump.focus(); await page.keyboard.press("Enter");
    await expect(choices).toBeFocused(); expect(await choices.innerText()).toBe(copy); expect(await saved(page)).toBe(before);
    const ids = await page.locator("#choices button[data-testid^=choice-]").evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.testid!.slice(7)));
    expect(ids).toEqual(presentChoices(state, getScene(state.sceneId)).map(choice => choice.id));
    await expect(page.getByTestId("campaign-thread").locator(":scope > summary")).toContainText("1 connection");
    await expect(page.getByTestId("campaign-thread").locator(":scope > summary")).not.toContainText("1 connections");
  });
}
test("the full ledger remains at the actual depot rather than unrelated conversations", async ({ page }) => {
  await open(page, routeCheckpoint("technique-face-cosign-process", "act2_district_canal"), 390);
  await expect(page.getByTestId("district-ledger")).toHaveCount(1);
  await expect(page.getByTestId("campaign-thread")).toHaveCount(0);
});
test("a closed paused plan cannot advertise recovery at the hearing", async ({ page }) => {
  let state = integratedArchive("paused").checkpoint;
  for (const id of ["stand", "back-to-board", "to-the-wall", "to-ward-nine"]) state = takeIntegrated(state, id);
  if (state.sceneId === "act3_neighborhood") state = takeIntegrated(state, "go-wall");
  state = takeIntegrated(takeIntegrated(state, "face-sera"), "prepare-public-account");
  await open(page, state, 390); const before = await saved(page);
  await page.getByTestId("archive-planner").locator(":scope > summary").click();
  await expect(page.getByTestId("archive-plan-status")).toContainText("week closed");
  await expect(page.getByTestId("archive-plan-status")).not.toContainText("free pause");
  expect(await saved(page)).toBe(before);
});
test("paragraph pacing reveals decision review only after the scene is shown", async ({ page }) => {
  await open(page, routeCheckpoint("scarce-archive-open", "act2_middle"), 390, true);
  await expect(page.getByTestId("review-choices")).toHaveCount(0);
  await page.getByTestId("show-rest").click(); await expect(page.getByTestId("review-choices")).toHaveCount(1);
});
test("the archive catalog keeps its own source-selection decisions", async ({ page }) => {
  await open(page, routeCheckpoint("technique-face-cosign-process", "act2_archive_compare"), 390);
  await expect(page.getByTestId("review-choices")).toHaveCount(0);
  await expect(page.getByTestId("choice-open-archive-catalog")).toBeEnabled();
});
