import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { commitChoice, createCharacter, getScene, presentChoices } from "../lib/engine";
import { keyboardActivate, keyboardSelect, tabTo } from "../qa/production/keyboard";
import type { ReplaySpec } from "../lib/story-replay";
import type { GameState } from "../lib/types";
function checkpoint(sceneId: string, route = "memory-timeline-bounded", choiceId?: string) {
  const spec = JSON.parse(readFileSync(`qa/routes/${route}.json`, "utf8")) as ReplaySpec;
  let s = createCharacter(spec.character);
  for (const step of spec.steps) {
    if (s.sceneId === sceneId && (!choiceId || step.choiceId === choiceId)) return s;
    const choice = presentChoices(s, getScene(s.sceneId)).find(c => c.id === step.choiceId && c.enabled)!;
    s = commitChoice(s, choice, step.roll ? { roll: step.roll } : undefined).state;
  }
  throw new Error(`Missing checkpoint ${sceneId}`);
}
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, artwork = "full", preferences = {}) {
  await page.addInitScript(({ state, artwork, preferences }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "paragraph", artwork, motion: "reduce", contrast: "high", textStep: 2, numberShortcuts: true, ...preferences }));
  }, { state, artwork, preferences });
  await page.goto("/"); await keyboardActivate(page, page.getByTestId("continue-run"));
}
for (const [width, artwork] of [[320, "none"], [390, "full"], [1440, "full"]] as const) test(`hearing notebook finds original timestamps and returns without committing at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = checkpoint("act3_testimony_hearing"); await open(page, state, artwork);
  const before = await saved(page), prose = await page.getByTestId("scene-text").textContent();
  const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThanOrEqual(900);
  await keyboardActivate(page, page.getByTestId("consult-sources"));
  const dialog = page.getByRole("dialog", { name: "Investigation notebook" });
  await expect(page.getByRole("searchbox")).toBeFocused();
  await expect(page.getByTestId("notebook-count")).toHaveText("Showing 9 of 9 acquired records");
  await page.keyboard.type("02:16");
  await expect(page.getByTestId("notebook-count")).toHaveText("Showing 1 of 9 acquired records");
  await expect(page.getByTestId("notebook-memory-order")).toContainText("02:16 · Helion command receipt");
  await expect(page.getByTestId("notebook-memory-order")).toContainText("issuing key still needs independent verification");
  await expect(dialog.getByLabel("Current source limits")).toContainText("Issuing key authenticated");
  expect(await saved(page)).toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0); await expect(page.getByTestId("consult-sources")).toBeFocused();
  expect(await page.getByTestId("scene-text").textContent()).toBe(prose); expect(await saved(page)).toBe(before);
  await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run"));
  expect(await saved(page)).toBe(before);
});
test("notebook preserves a partial chronology, blocks background shortcuts and retains original choice numbering", async ({ page }) => {
  const state = checkpoint("memory_sequence", "memory-timeline-bounded", "place-order"); await open(page, state, "none");
  const before = await saved(page); const choices = await page.locator('[data-testid^="choice-"]').evaluateAll(nodes => nodes.map(n => [n.getAttribute("data-testid"), n.getAttribute("aria-keyshortcuts")]));
  await keyboardActivate(page, page.getByTestId("consult-sources"));
  await keyboardSelect(page, page.getByLabel("Record group", { exact: true }), "memory");
  await expect(page.getByTestId("notebook-count")).toHaveText("Showing 3 of 3 acquired records");
  await tabTo(page, page.getByTestId("close-notebook")); await page.keyboard.press("2");
  expect(await saved(page)).toBe(before); await expect(page.getByRole("dialog", { name: "Investigation notebook" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("consult-sources")).toBeFocused();
  expect(await page.locator('[data-testid^="choice-"]').evaluateAll(nodes => nodes.map(n => [n.getAttribute("data-testid"), n.getAttribute("aria-keyshortcuts")]))).toEqual(choices);
  await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run")); expect(await saved(page)).toBe(before);
});
test("search and record groups retain allegations, corrections and empty-result recovery without upgrading evidence", async ({ page }) => {
  await open(page, checkpoint("act3_testimony_correction", "memory-timeline-corrected"), "none");
  const before = await saved(page); await keyboardActivate(page, page.getByTestId("consult-sources"));
  await keyboardSelect(page, page.getByLabel("Record group", { exact: true }), "interpretation");
  await expect(page.getByTestId("notebook-bench-verdict")).toContainText("Recorded as claim");
  await expect(page.getByTestId("notebook-bench-correction")).toBeVisible();
  await expect(page.getByTestId("notebook-packet-correction")).toBeVisible();
  await expect(page.getByLabel("Current source limits")).toContainText("Independent corroboration still needed");
  await tabTo(page, page.getByRole("searchbox")); await page.keyboard.type("not-a-record");
  await expect(page.getByTestId("notebook-empty")).toBeVisible();
  await keyboardActivate(page, page.getByRole("button", { name: "Show all records", exact: true }));
  await expect(page.getByTestId("notebook-memory-order")).toBeVisible(); expect(await saved(page)).toBe(before);
});

test("opening consultation stops selected dialogue and leaves a recorded timeline intact", async ({ page }) => {
  await open(page, checkpoint("memory_sequence_result"), "full", { sound: false, autoVoices: false });
  if (await page.getByTestId("show-rest").count()) await keyboardActivate(page, page.getByTestId("show-rest"));
  await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
  await keyboardActivate(page, page.getByLabel("Sound enabled", { exact: true }));
  await keyboardActivate(page, page.getByRole("button", { name: "Done", exact: true }));
  const before = await saved(page);
  const listen = page.getByTestId("voice-line").getByRole("button", { name: "Listen to Mara", exact: true });
  await keyboardActivate(page, listen);
  await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue", { timeout: 15_000 });
  await keyboardActivate(page, page.getByTestId("consult-sources"));
  await expect(page.getByTestId("voice-line").getByRole("button", { name: "Stop line", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(listen).toBeEnabled(); expect(await saved(page)).toBe(before);
});

test("first-fragment consultation does not name an undiscovered witness or reveal her roster", async ({ page }) => {
  await open(page, checkpoint("memory_table", "memory-timeline-bounded", "inspect-order"), "none");
  const before = await saved(page); await keyboardActivate(page, page.getByTestId("consult-sources"));
  const dialog = page.getByRole("dialog", { name: "Investigation notebook" });
  await expect(dialog).not.toContainText("Nia");
  await expect(page.getByTestId("notebook-memory-roster")).toHaveCount(0);
  await expect(page.getByTestId("notebook-memory-order")).toHaveCount(0);
  await expect(page.getByTestId("notebook-memory-signature")).toContainText("02:13");
  expect(await saved(page)).toBe(before);
});
