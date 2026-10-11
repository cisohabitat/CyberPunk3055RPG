import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { commitChoice, createCharacter, getScene, presentChoices } from "../lib/engine";
import { keyboardActivate } from "../qa/production/keyboard";
import type { GameState } from "../lib/types";

const base = (sceneId: string): GameState => ({ ...createCharacter({ handle: "Campaign", givenName: "Ada", origin: "spire", bonus: { face: 2, chrome: 0, ghost: 0, nerve: 0 } }), sceneId, creds: 150 });
const week = (): GameState => {
  const s = { ...base("act2_route_receipt"), flags: { memory_prepared: true, heard_memo: true, met_kerr: true, kerr_route_started: true, kerr_route_private: true, kerr_route_trace: true } };
  return commitChoice(s, presentChoices(s, getScene(s.sceneId)).find(c => c.id === "record-kerr-receipt")!).state;
};
const wall = (): GameState => {
  const s = { ...base("act3_testimony_record"), flags: { memory_prepared: true, response_started: true, testimony_source: true }, journal: [{ id: "ward-nine", text: "Mara Voss signed the Ward Nine coolant dump." }] };
  return commitChoice(s, presentChoices(s, getScene(s.sceneId)).find(c => c.id === "file-public-account")!).state;
};
const saved = (page: Page): Promise<GameState> => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
async function open(page: Page, run: GameState) {
  await page.addInitScript(run => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
  }, run);
  await page.goto("/");
  await keyboardActivate(page, page.getByTestId("continue-run"));
}

for (const [name, fixture, firstDecision] of [["Week", week, "stand"], ["Wall", wall, "read-names"]] as const) test(`campaign ${name} decision jump uses real keyboard focus without committing or hiding work`, async ({ page }) => {
  await open(page, fixture());
  const before = await saved(page), original = presentChoices(before, getScene(before.sceneId));
  await expect(page.getByRole("heading", { name: "People and unfinished work" })).toBeVisible();
  await keyboardActivate(page, page.getByTestId("decision-jump"));
  await expect(page.locator("#chapter-decision")).toBeFocused();
  expect(await saved(page)).toEqual(before);
  expect(await page.locator("#choices button.choice").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-testid")))).toEqual(original.map(c => `choice-${c.id}`));
  await page.keyboard.press("Tab");
  await expect(page.getByTestId(`choice-${firstDecision}`)).toBeFocused();
  await page.keyboard.press("Enter");
  expect((await saved(page)).sceneId).toBe(name === "Week" ? "ending_week_wards" : "ending_names");
});

test("campaign jump preserves the original number shortcuts and optional route", async ({ page }) => {
  await open(page, week());
  const before = await saved(page), choices = presentChoices(before, getScene(before.sceneId));
  const index = choices.findIndex(c => c.enabled);
  expect(index).toBeLessThan(9);
  await keyboardActivate(page, page.getByTestId("decision-jump"));
  for (let i = 0; i < Math.min(9, choices.length); i++) if (choices[i].enabled) await expect(page.getByTestId(`choice-${choices[i].id}`)).toHaveAttribute("aria-keyshortcuts", String(i + 1));
  await page.keyboard.press(String(index + 1));
  expect(await saved(page)).toEqual(commitChoice(before, choices[index]).state);
  expect((await saved(page)).sceneId).not.toBe("ending_week_wards");
});

for (const [width, artwork, reading] of [[320, "none", "all"], [390, "full", "paragraph"]] as const) test(`campaign return and decision navigation survive restore at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(prefs => localStorage.setItem("saint-shard-preferences", JSON.stringify(prefs)), { artwork, reading, textStep: 2, numberShortcuts: false, motion: "reduce" });
  await open(page, week());
  const before = await saved(page);
  await expect(page.getByTestId("scene-text")).toContainText("promise you cannot call kept");
  await keyboardActivate(page, page.getByTestId("decision-jump"));
  await expect(page.locator("#chapter-decision")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.reload();
  await keyboardActivate(page, page.getByTestId("continue-run"));
  await expect(page.getByTestId("scene-text")).toContainText("promise you cannot call kept");
  expect(await saved(page)).toEqual(before);
  await expect(page.locator("#chapter-decision")).toHaveText("Street or silence");
  if (artwork === "none") await expect(page.locator(".scene-frame img, .portrait img")).toHaveCount(0);
});
