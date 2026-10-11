import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { commitChoice, createCharacter, getScene, presentChoices } from "../lib/engine";
import { keyboardActivate } from "../qa/production/keyboard";
import type { GameState } from "../lib/types";
import type { ReplaySpec } from "../lib/story-replay";

function failedCampaign() {
  const spec = JSON.parse(readFileSync("qa/routes/scarce-depot-courier.json", "utf8")) as ReplaySpec;
  let s = createCharacter(spec.character);
  for (const step of spec.steps) {
    if (step.choiceId === "pause-kerr-recovery") break;
    const choice = presentChoices(s, getScene(s.sceneId)).find(c => c.id === step.choiceId && c.enabled)!;
    s = commitChoice(s, choice, step.roll ? { roll: step.roll } : undefined).state;
  }
  return s;
}
const saved = (page: Page): Promise<GameState> => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
for (const [width, artwork] of [[320, "none"], [390, "full"], [1440, "full"]] as const) test(`zero-credit recovery pauses and resumes through real keyboard at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const run = failedCampaign();
  expect(run.creds).toBe(0);
  await page.addInitScript(({ run, artwork }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork, reading: "all", textStep: 2, motion: "reduce", numberShortcuts: false }));
  }, { run, artwork });
  await page.goto("/");
  await keyboardActivate(page, page.getByTestId("continue-run"));
  const goal = await page.getByTestId("goal").boundingBox();
  expect(goal!.y + goal!.height).toBeLessThanOrEqual(900);
  await expect(page.getByTestId("scene-text")).toContainText("You have 0 creds");
  await expect(page.getByTestId("choice-fund-kerr-courier")).toBeDisabled();
  await keyboardActivate(page, page.getByTestId("choice-pause-kerr-recovery"));
  const paused = await saved(page);
  expect(paused.creds).toBe(0); expect(paused.strain).toBe(run.strain);
  expect(paused.flags.kerr_route_failed).toBe(true); expect(paused.flags.kerr_route_done).toBeUndefined();
  await expect(page.getByTestId("scene-text")).toContainText("without calling Kerr's request closed");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.reload();
  await keyboardActivate(page, page.getByTestId("continue-run"));
  expect(await saved(page)).toEqual(paused);
  await keyboardActivate(page, page.getByTestId("choice-answer-kerr-collection"));
  const resumed = await saved(page);
  expect(resumed.sceneId).toBe("act2_route_recovery");
  expect(resumed.creds).toBe(0); expect(resumed.journal).toEqual(run.journal);
  await expect(page.getByTestId("choice-route-use-gap")).toHaveCount(0);
  if (artwork === "none") await expect(page.locator(".scene-frame img, .portrait img")).toHaveCount(0);
});
