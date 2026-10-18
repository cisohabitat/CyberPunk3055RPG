import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, commitChoice, getScene, stageCheck } from "../lib/engine";
import { choiceReceipt } from "../lib/play-feedback";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "Receipt", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(({ state, preferences }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "none", motion: "reduce", ...preferences }));
  }, { state, preferences });
  await page.goto("/");
}
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
test("same-scene acquired record gets an accurate receipt, reload does not replay it", async ({ page }) => {
  const state = { ...base, sceneId: "memory_table" }, choice = getScene(state.sceneId).choices.find(c => c.id.startsWith("inspect-"))!;
  await open(page, state); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("decision-receipt")).toHaveCount(0);
  await page.getByTestId(`choice-${choice.id}`).click();
  const next = commitChoice(state, choice).state;
  await page.getByTestId("decision-receipt").locator("summary").click();
  expect(await page.getByTestId("decision-receipt").locator("li").allTextContents()).toEqual(choiceReceipt(state, next));
  expect(await saved(page)).toEqual(next);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("decision-receipt")).toHaveCount(0);
});
test("held check shows a return reminder and only creates receipt after Continue", async ({ page }) => {
  const state = stageCheck({ ...base, sceneId: "lumen_deal", strain: 3 }, "fake-pact", 10);
  await open(page, state);
  const recap = page.getByTestId("run-recap"); await recap.locator("summary").click();
  await expect(recap).toContainText("A roll of 10 is held"); expect(await saved(page)).toEqual(state);
  await page.getByTestId("continue-run").click(); await expect(page.getByTestId("decision-receipt")).toHaveCount(0);
  await page.getByTestId("continue-check").click();
  const next = commitChoice(state, getScene(state.sceneId).choices.find(c => c.id === "fake-pact")!, { roll: 10 }).state;
  await page.getByTestId("decision-receipt").locator("summary").click();
  expect(await page.getByTestId("decision-receipt").locator("li").allTextContents()).toEqual(choiceReceipt(state, next));
  expect(await saved(page)).toEqual(next);
});
test("title and slot recap show only recorded history, with keyboard access and no art requests", async ({ page }) => {
  const state = { ...base, log: ["Older action", "First recent action", "Second recent action", "Last action"] };
  const art: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) art.push(r.url()); });
  await page.setViewportSize({ width: 320, height: 900 }); await open(page, state, { textStep: 2 });
  const recap = page.getByTestId("run-recap"); await recap.locator("summary").focus(); await page.keyboard.press("Enter");
  expect(await recap.locator("li").allTextContents()).toEqual(state.log.slice(-3)); await expect(recap).not.toContainText("Older action");
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Save to slot 1", exact: true }).click();
  const slot = page.getByRole("dialog").getByTestId("run-recap"); await slot.locator("summary").click();
  expect(await slot.locator("li").allTextContents()).toEqual(state.log.slice(-3));
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await saved(page)).toEqual(state); expect(art).toEqual([]);
});
for (const reduce of ["system", "saved", "none"] as const) test(`location entry honors ${reduce} motion without delaying decisions`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: reduce === "system" ? "reduce" : "no-preference" });
  await open(page, base, { motion: reduce === "saved" ? "reduce" : "system" });
  await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toBeVisible(); await expect(page.locator("#choices .choice").first()).toBeEnabled();
  expect(await page.locator(".location-entry").evaluate(el => getComputedStyle(el).animationName)).toBe(reduce === "none" ? "location-arrive" : "none");
  expect(await saved(page)).toEqual(base);
});
