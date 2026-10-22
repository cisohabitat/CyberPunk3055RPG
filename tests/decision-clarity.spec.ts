import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, getScene, presentChoices, effectPreview, checkResourceCosts } from "../lib/engine";
import { FIELD_KITS } from "../lib/loadout";

const base = createCharacter({ handle: "Clarity", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
for (const width of [390, 1440, 320]) test(`workshop review finds the real purchase without spending at ${width}px`, async ({ page }) => {
  const state = { ...base, sceneId: "act2_workshop", creds: 255 };
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0, motion: "reduce", reading: "all" }));
  }, { state, width });
  await page.goto("/"); await page.getByTestId("continue-run").click();
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  for (const kit of FIELD_KITS) {
    const review = page.getByTestId(`review-purchase-${kit.id}`);
    await review.focus(); await page.keyboard.press("Enter");
    const purchase = page.getByTestId(`choice-buy-${kit.id}`);
    await expect(purchase).toBeFocused(); await expect(purchase).toBeInViewport();
    const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === `buy-${kit.id}`)!;
    await expect(purchase.locator('[data-kind="effects"]')).toHaveText(effectPreview(state, choice).join(" · "));
    expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("mission check facts retain the engine's separate success and miss costs", async ({ page }) => {
  const state = { ...base, sceneId: "act2_archive_door", flags: { archive_briefed: true, memory_intact: true, perk_nerve: true } };
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "none", reading: "all" }));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  const choices = presentChoices(state, getScene(state.sceneId)).filter(c => c.enabled && c.check && checkResourceCosts(state, c).length);
  expect(choices.length).toBeGreaterThan(0);
  for (const choice of choices) {
    const button = page.getByTestId(`choice-${choice.id}`);
    await expect(button.locator('[data-kind="costs"]')).toHaveText(checkResourceCosts(state, choice).join("; "));
    await expect(button.locator(".choice-fact-label").last()).toHaveText("Roll outcomes");
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(state);
});
