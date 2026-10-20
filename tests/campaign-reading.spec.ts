import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices } from "../lib/engine";
import type { GameState } from "../lib/types";
import type { ReplaySpec } from "../lib/story-replay";

function checkpoint(file: string, select: (state: GameState) => boolean) {
  const route = JSON.parse(readFileSync(`qa/routes/${file}.json`, "utf8")) as ReplaySpec;
  let state = createCharacter(route.character);
  for (const step of route.steps) {
    if (select(state)) return state;
    const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled)!;
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
  }
  throw new Error(`No checkpoint in ${file}`);
}
async function open(page: Page, state: GameState) {
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, reading: "all", artwork: "full", motion: "reduce" }));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

test("saved route planning returns keep the actual pause instead of replaying Ren's introduction", async ({ page }) => {
  const state = checkpoint("kerr-chrome", state => state.sceneId === "act2_middle" && state.log.at(-1) === "Pause with both crossings saved.");
  await open(page, state);
  await expect(page.getByTestId("scene-text")).toContainText("Both crossings are on the plan");
  await expect(page.getByTestId("scene-text")).not.toContainText("Junie Calder worked beside");
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src", /ren-canal/);
  await page.getByTestId("choice-answer-kerr-collection").click();
  await expect(page.getByTestId("choice-pause-kerr-route")).toBeVisible();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(restored.sceneId).toBe("act2_route_review");
  expect(restored.creds).toBe(state.creds); expect(restored.strain).toBe(state.strain);
  expect(restored.flags.kerr_route_started).toBeUndefined();
});

test("catalog actions shorten repeated narration and keep locator, record and key distinct", async ({ page }) => {
  const state = checkpoint("catalog-reader", state => state.sceneId === "act2_archive_compare");
  await open(page, state);
  await expect(page.getByTestId("scene-text")).toContainText("Mara's authorization precedes");
  await page.getByTestId("choice-open-archive-catalog").click();
  await expect(page.getByTestId("scene-text")).toContainText("none is a retrieved ledger");
  await expect(page.getByTestId("scene-text")).not.toContainText("Export: Mara's");
  await expect(page.getByTestId("goal")).toContainText("Submitting a locator leaves a trace");
  await page.getByTestId("choice-catalog-inspect-revision").click();
  await page.getByTestId("choice-catalog-request-revision").click();
  await expect(page.getByTestId("goal")).toContainText("lookup supplied no record");
  await expect(page.getByTestId("catalog-retrieval")).toBeVisible();
  const selected = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(selected.flags.archive_done).toBeUndefined(); expect(selected.flags.archive_key_authenticated).toBeUndefined();
  expect(selected.factions.helion).toBe(Math.min(5, state.factions.helion + 1));
  await page.getByTestId("choice-close-archive-catalog").click();
  await expect(page.getByTestId("scene-text")).toContainText("descriptions and query history kept");
  await page.getByTestId("choice-open-archive-catalog").click();
  await expect(page.getByTestId("catalog-retrieval")).toBeVisible();
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
});

for (const width of [320, 1440]) test(`task direction stays visible with enlarged text at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(() => localStorage.setItem("saint-shard-text", "2"));
  const state = checkpoint("integration-listed", state => state.sceneId === "act2_archive_custody");
  await open(page, state);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Text size", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("goal")).toContainText("employer trace");
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src", "/art/edda-archive.jpg");
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});
