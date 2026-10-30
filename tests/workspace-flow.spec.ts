import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import baseline from "../qa/editorial/workspace-flow-baseline.json";
import checkpoints from "../qa/editorial/workspace-flow-checkpoints.json";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { commitChoice, getScene, presentChoices, sceneText } from "../lib/engine";
import { testimonyPacket } from "../lib/testimony";
import { routePlan } from "../lib/route-planning";
import { CRAFT_RECORDS } from "../lib/encounter-craft";
import type { GameState } from "../lib/types";
import { decisionFlowScene } from "../lib/decision-flow";

const saved = (page: Page) => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), preferences: localStorage.getItem("saint-shard-preferences"), codex: localStorage.getItem("saint-shard-codex") }));
async function open(page: Page, state: GameState, width = 390, artwork = "full", paragraph = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, artwork, paragraph }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, reading: paragraph ? "paragraph" : "all", artwork, textStep: 2, contrast: "high", motion: "reduce" }));
  }, { state, artwork, paragraph });
  await page.goto("/"); await page.getByTestId("continue-run").click(); await page.evaluate(() => document.fonts.ready);
}
for (const original of baseline) test(`workspace reading metrics and keyboard order: ${original.sceneId}/${original.width}`, async ({ page }, info) => {
  const state = routeCheckpoint(original.route, original.sceneId, original.sceneId === "act2_craft_archive" ? "craft-question-issuer" : undefined);
  await open(page, state, original.width, original.width === 320 ? "none" : "full"); const before = await saved(page);
  const measure = () => page.getByTestId("scene").evaluate(root => {
    const prose = root.querySelector('[data-testid="scene-text"]')!, choices = root.querySelector("#choices")!;
    return { text: (root as HTMLElement).innerText, gap: Math.round(choices.getBoundingClientRect().top - prose.getBoundingClientRect().bottom),
      focusOrder: [...root.querySelectorAll<HTMLElement>("a,button,summary,input,select,textarea")].filter(n => n.getBoundingClientRect().height > 0 && !n.hasAttribute("disabled")).map(n => ({ tag: n.tagName, id: n.dataset.testid || n.id, text: n.innerText })),
      typography: [...root.querySelectorAll<HTMLElement>("p,dd,dt,h2,h3,button,summary")].filter(n => n.getBoundingClientRect().height > 0).map(n => ({ text: n.innerText, size: getComputedStyle(n).fontSize, lineHeight: getComputedStyle(n).lineHeight })) };
  });
  const current = await measure();
  // Compare the preceding layout in this same browser; typography/innerText differ
  // legitimately between engines. Removing a presentation attribute changes no run.
  await page.getByTestId("scene").evaluate(n => { n.removeAttribute("data-workspace-flow"); n.removeAttribute("data-decision-flow"); });
  const preceding = await measure();
  await page.getByTestId("scene").evaluate(n => n.setAttribute("data-workspace-flow", "compact"));
  if (decisionFlowScene(original.sceneId)) await page.getByTestId("scene").evaluate(n => n.setAttribute("data-decision-flow", "nearby"));
  const words = (text: string) => text.replace(/\s+/g, " ").trim();
  if (decisionFlowScene(original.sceneId)) {
    // Phase11 moves only passive history after decisions. Preserve every visible
    // original block here; the new suite asserts the exact intended DOM order.
    let previous = original.text;
    if (original.sceneId === "act2_craft_archive") for (let i = 0; i < 3; i++) previous = previous.replace("Description inspected", "");
    expect(words(current.text.replace('Selecting an option commits it.', '')).split(' ').sort()).toEqual(words(previous).split(' ').sort());
  } else expect(words(current.text)).toBe(words(original.text));
  expect(words(current.text)).toBe(words(preceding.text)); expect(current.focusOrder).toEqual(preceding.focusOrder); expect(current.typography).toEqual(preceding.typography);
  expect(current.gap).toBeLessThan(preceding.gap - 40);
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(await saved(page)).toEqual(before);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("workspace.png"), fullPage: true });
});
for (const checkpoint of checkpoints) test(`workspace retains canonical controls, bounds and reload: ${checkpoint.sceneId}`, async ({ page }) => {
  const state = routeCheckpoint(checkpoint.route, checkpoint.sceneId, checkpoint.choiceId), scene = getScene(state.sceneId), choices = presentChoices(state, scene);
  await open(page, state); const before = await saved(page);
  await expect(page.getByTestId("scene")).toHaveAttribute("data-workspace-flow", "compact");
  await expect(page.getByTestId("scene-text")).toHaveText(sceneText(scene, state).split(/\n\n+/).filter(Boolean).join(""));
  for (const choice of choices) {
    const control = page.getByTestId(`choice-${choice.id}`);
    await expect(control).toHaveCount(1);
    if (choice.enabled) await expect(control).toBeEnabled(); else await expect(control).toBeDisabled();
    if (choice.disabledReason) await expect(control).toContainText(choice.disabledReason);
    else if (CRAFT_RECORDS.some(record => choice.id === `craft-read-${record.id}`)) {
      // Existing inspection buttons use the shared desk terms, not choice rows.
      const desk = page.getByTestId("archive-question-desk");
      await expect(desk).toContainText("Inspection retrieves no ledger and tests no issuing key.");
      await expect(desk.getByRole("status")).toContainText("Inspection is free.");
    } else if (choice.detail) await expect(control).toContainText(choice.detail);
    if (choice.enabled) { await control.scrollIntoViewIfNeeded(); expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44); }
  }
  if (state.sceneId.startsWith("act3_testimony_")) for (const row of testimonyPacket(state)) {
    const sources = page.getByTestId("testimony-brief").locator(":scope > dl"); await expect(sources).toContainText(row.text); await expect(sources).toBeVisible();
  }
  const board = page.getByTestId("route-board");
  if (await board.count()) {
    const plan = routePlan(state); await expect(board.locator(".route-summary")).toContainText(`${plan.creds} creds, +${plan.strain} strain`);
    if (plan.entry?.registered && state.flags.kerr_route_private) await expect(board).toContainText("It records your handle and Kerr’s recipient name");
    expect(await board.evaluate(n => !!(n.compareDocumentPosition(document.getElementById("choices")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  }
  expect(await saved(page)).toEqual(before); await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(before);
  const choice = choices.find(row => row.enabled && !row.check)!; await keyboardActivate(page, page.getByTestId(`choice-${choice.id}`));
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state, choice).state);
});
test("paragraph reveal, source review and free archive inspection keep focus and save boundaries at 320px", async ({ page }) => {
  const state = routeCheckpoint("emotional-payoff/both-returns-listed", "act2_craft_archive"); await open(page, state, 320, "none", true); const before = await saved(page);
  await expect(page.getByTestId("scene-text").locator("p")).toHaveCount(1); await keyboardActivate(page, page.getByTestId("show-rest"));
  expect(await saved(page)).toEqual(before); await keyboardActivate(page, page.getByTestId("choice-craft-read-export"));
  const heading = page.getByTestId("craft-record-export").locator("h3"); await expect(heading).toBeFocused(); await expect(heading).toBeInViewport();
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(await page.locator(".topbar").evaluate(n => n.getBoundingClientRect().bottom));
  const choice = presentChoices(state, getScene(state.sceneId)).find(row => row.id === "craft-read-export")!;
  await expect.poll(async () => JSON.parse((await saved(page)).run!)).toEqual(commitChoice(state, choice).state);
});
