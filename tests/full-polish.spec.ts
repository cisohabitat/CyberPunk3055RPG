import { test, expect, type Page } from "@playwright/test";
import { createCharacter } from "../lib/engine";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { finaleCommitments } from "../lib/finale-commitments";
import type { GameState } from "../lib/types";

async function open(page: Page, state: GameState) {
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, motion: "reduce", reading: "all", artwork: "none" }));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

test("workshop shows zero-benefit purchase odds without changing the runner", async ({ page }) => {
  const state = { ...createCharacter({ handle: "Review", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "act2_workshop", flags: { perk_chrome: true } };
  await open(page, state);
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  await expect(page.locator(".kit-training")).toHaveCount(1);
  await expect(page.locator(".kit-comparison")).toHaveCount(4);
  await page.getByTestId("kit-odds-archive-probe").locator("summary").click();
  await expect(page.getByTestId("kit-odds-archive-probe")).toContainText("100% → 100%");
  await expect(page.getByTestId("kit-odds-archive-probe")).toContainText("No increase at current modifiers");
  await expect(page.getByTestId("field-kit-brief")).toContainText("room 90 + staffed rest 45");
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});

test("later Edda conversation remembers the signed employer trace without adding dialogue", async ({ page }) => {
  const state = routeCheckpoint("pacing-signed-face", "act3_edda_visit");
  await open(page, state);
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  const context = page.getByTestId("conversation-context");
  await context.locator("summary").click();
  await expect(context).toContainText("still identifies her work to her employer");
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});

for (const [route, ending] of [["integration-names", "ending_names"], ["integration-quiet", "ending_quiet"], ["integration-witness", "ending_witness"], ["integration-listed", "ending_listed"]]) test(`${ending} keeps every earned commitment and final choice intact`, async ({ page }) => {
  const state = routeCheckpoint(route, ending), expected = finaleCommitments(state)!;
  await open(page, state);
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  const summary = page.getByTestId("finale-commitments");
  await expect(summary).toContainText(`${expected.compromised} compromised`);
  await summary.locator("summary").click();
  for (const row of expected.rows) await expect(summary).toContainText(`${row.title} · ${row.status}`);
  await expect(page.getByTestId("ending-title")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});
