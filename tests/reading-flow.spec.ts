import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText, stageCheck, runDelta, effectPreview, checkResourceCosts, previewCheck } from "../lib/engine";
import { sceneIllustration } from "../lib/art";
import { checkpointLabel } from "../lib/checkpoints";
import { STAT_INFO } from "../lib/character";
import { weekClosingPromises } from "../lib/objectives";
import { installAudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "FlowReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "full", motion: "reduce", numberShortcuts: true, ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
for (const width of [390, 1440, 320]) test(`regular scene reading and complete restore notices at ${width}px`, async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  for (const sceneId of ["act2_shelter_brief", "act2_spire_sources", "act2_lumen_quiet"]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), state = { ...base, sceneId, flags: { spire_consent: true } };
      await open(page, state, { textStep: width === 320 ? 2 : 0 }); const before = await saved(page);
      const figure = page.getByTestId("scene-illustration"), art = sceneIllustration(sceneId)!;
      await expect(figure).toHaveAttribute("data-reading", "true"); await expect(figure.locator(".progressive-art")).toHaveAttribute("data-ready", "true");
      await expect(figure.locator("img")).toHaveAttribute("src", art.src);
      const frame = await figure.locator("img").boundingBox(); expect(frame!.width / frame!.height).toBeCloseTo(1.5, 2);
      if (width === 390) {
        expect(frame!.width).toBeLessThan(150);
        expect((await page.getByTestId("scene-text").locator("p").first().boundingBox())!.y).toBeLessThan(760);
        expect((await page.getByTestId("restore-notice").boundingBox())!.height).toBeLessThan(44);
      }
      await expect(page.getByTestId("restore-notice")).toHaveText(`Loaded Autosave — ${checkpointLabel(state)}`);
      expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(sceneText(getScene(sceneId), state).split(/\n\n+/).filter(Boolean));
      const trigger = figure.getByRole("button", { name: /^View artwork:/ }); await trigger.click();
      const viewer = page.getByRole("dialog", { name: art.caption, exact: true }); await expect(viewer.locator(".artwork-canvas img")).toHaveAttribute("src", art.src);
      await page.keyboard.press("Escape"); await expect(trigger).toBeFocused(); expect(await saved(page)).toBe(before);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await context.close(); }
  }
});
for (const width of [390, 1440, 320]) test(`choice rows retain canonical order, wording, numeric previews and warnings at ${width}px`, async ({ browser, baseURL }) => {
  test.setTimeout(60_000);
  for (const sceneId of ["lumen_deal", "vault_quiet", "act2_middle"]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), state = { ...base, sceneId, flags: { memory_prepared: true, response_private_consent: true } };
      await open(page, state, { artwork: "none", textStep: width === 320 ? 2 : 0 }); const before = await saved(page), choices = presentChoices(state, getScene(sceneId));
      expect(await page.locator("#choices > .choice").evaluateAll(nodes => nodes.map(n => n.getAttribute("data-testid")))).toEqual(choices.map(c => `choice-${c.id}`));
      for (const choice of choices) {
        const button = page.getByTestId(`choice-${choice.id}`); await expect(button.locator(".label")).toHaveText(choice.label);
        await expect(button).toBeEnabled({ enabled: choice.enabled });
        await expect(button).toHaveAttribute("aria-describedby", `choice-detail-${choice.id}`);
        if (choice.disabledReason !== undefined) { await expect(button.locator(".choice-meta")).toHaveCount(1); await expect(button.locator(".choice-meta")).toHaveText(choice.disabledReason); continue; }
        if (choice.detail) await expect(button.locator('[data-kind="detail"]')).toHaveText(choice.detail);
        if (choice.check) { const odds = previewCheck(state, choice.check); const chance = odds.hits === 10 ? "certain" : odds.hits === 0 ? "no chance" : `${odds.hits} in 10`;
          await expect(button.locator('[data-kind="check"]')).toHaveText(`${STAT_INFO[odds.stat].name} · DC ${odds.dc} · ${chance}`); }
        const effects = effectPreview(state, choice), costs = checkResourceCosts(state, choice);
        if (effects.length) await expect(button.locator('[data-kind="effects"]')).toHaveText(effects.join(" · "));
        if (costs.length) await expect(button.locator('[data-kind="costs"]')).toHaveText(costs.join("; "));
      }
      if (sceneId === "act2_middle") { expect(weekClosingPromises(state).length).toBeGreaterThan(0); await expect(page.locator('[data-kind="promise"]').first()).toContainText("unresolved if the week closes"); }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); expect(await saved(page)).toBe(before);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await context.close(); }
  }
});
for (const width of [390, 1440, 320]) for (const roll of [1, 10]) test(`held ${roll} has one accurate resolved score and actual consequences at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const staged = stageCheck({ ...base, sceneId: "lumen_deal", strain: 4 }, "fake-pact", roll);
  const choice = presentChoices(staged, getScene(staged.sceneId)).find(c => c.id === "fake-pact")!, expected = commitChoice(staged, choice, { roll });
  await page.addInitScript(() => { Math.random = () => .51; });
  await open(page, staged, { textStep: width === 320 ? 2 : 0 }); const before = await saved(page), dialog = page.getByRole("dialog");
  await expect(dialog.locator(".die.plate")).toHaveCount(1); await expect(dialog.locator(".die.plate")).toHaveText(String(roll));
  await expect(dialog.locator(".total")).toContainText(`${roll} + ${expected.check!.bonus} = ${expected.check!.total}`);
  await expect(dialog.locator(".check-outcome")).toHaveText(expected.check!.success ? "Success" : "Miss");
  await expect(dialog.locator(".check-target")).toHaveText(`Against DC ${expected.check!.dc}`);
  await expect(dialog.getByTestId("check-flavor")).toHaveText(expected.check!.flavor);
  expect(await dialog.locator(".check-consequences li").allTextContents()).toEqual(runDelta(staged, expected.state));
  await expect(dialog.getByTestId("continue-check")).toBeFocused(); expect(await saved(page)).toBe(before);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await dialog.locator(".check-dialog").evaluate(el => el.scrollTo({ top: el.scrollHeight, behavior: "instant" }));
  const changes = await dialog.locator(".check-consequences").boundingBox(), continuation = await dialog.getByTestId("continue-check").boundingBox();
  expect(changes!.y + changes!.height).toBeLessThanOrEqual(continuation!.y);
  await page.reload(); await page.getByTestId("continue-run").click(); await expect(page.locator(".die.plate")).toHaveText(String(roll));
  await page.getByTestId("continue-check").click(); expect(JSON.parse((await saved(page))!)).toEqual(expected.state);
});
for (const reduce of [false, true]) test(`fresh result retains roll staging and ${reduce ? "reduced" : "normal"} motion`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: reduce ? "reduce" : "no-preference" });
  const state = { ...base, sceneId: "lumen_deal", strain: 5 };
  await open(page, state, { artwork: "none", motion: reduce ? "reduce" : "system" }); await page.getByTestId("choice-fake-pact").click();
  const before = await saved(page); await expect(page.getByRole("dialog").locator(".check-result")).toHaveCount(0);
  await page.getByRole("button", { name: "Back", exact: true }).click(); expect(await saved(page)).toBe(before);
  await page.getByTestId("choice-fake-pact").click(); await page.evaluate(() => { Math.random = () => .01; }); await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("continue-check")).toBeVisible(); await expect(page.locator(".die.plate")).toHaveCount(1); await expect(page.locator(".die.plate")).toHaveText("1");
  const staged = JSON.parse((await saved(page))!), choice = presentChoices(staged, getScene(staged.sceneId)).find(c => c.id === "fake-pact")!, expected = commitChoice(staged, choice, { roll: 1 });
  expect(staged.pendingCheck.roll).toBe(1); expect(staged.strain).toBe(5);
  expect(await page.locator(".check-consequences li").allTextContents()).toEqual(runDelta(staged, expected.state));
  await expect(page.locator(".check-consequences")).toHaveCount(0);
  await page.getByTestId("continue-check").click(); expect(JSON.parse((await saved(page))!)).toEqual(expected.state);
});
test("missing compact painting exposes a readable description and all decisions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await page.route("**/art/edda-service-review*.jpg", r => r.abort());
  const state = { ...base, sceneId: "act2_spire_sources", flags: { spire_consent: true } }; await open(page, state); const before = await saved(page);
  await expect(page.locator(".art-unavailable")).toHaveText(sceneIllustration(state.sceneId)!.description);
  await expect(page.getByTestId("choice-inspect-spire-billing")).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(await saved(page)).toBe(before);
});
