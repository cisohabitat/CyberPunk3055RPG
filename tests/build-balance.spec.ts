import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, getScene, sceneText } from "../lib/engine";
import { FIELD_KITS } from "../lib/loadout";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "Balance review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 0, nerve: 2, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!) as GameState);
async function open(page: Page, state: GameState, artwork = "full") {
  await page.addInitScript(({ state, artwork }) => {
    if (sessionStorage.getItem("balance-seeded")) return;
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", artwork, sound: false, textStep: 2, contrast: "high", motion: "reduce" }));
    sessionStorage.setItem("balance-seeded", "true");
  }, { state, artwork });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  test(`kit cash comparisons preserve care choices and saves at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, { ...base, sceneId: "act2_workshop", creds: 255 }, artwork);
    const before = await saved(page);
    for (const kit of FIELD_KITS) await expect(page.getByTestId(`budget-${kit.id}`)).toContainText(`After purchase: ${255 - kit.price} creds.`);
    await expect(page.getByTestId("budget-chair-harness")).toContainText("Enough cash remains for a room and staffed rest");
    await expect(page.getByTestId("budget-chair-harness")).toContainText("15 more");
    await expect(page.getByTestId("budget-archive-probe")).toContainText("20 more needed");
    expect(await saved(page)).toEqual(before);
    await expect(page.getByTestId("goal")).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.getByTestId("choice-buy-chair-harness").click();
    const bought = await saved(page); expect(bought.creds).toBe(135); expect(bought.items).toContain("chair-harness");
    expect(bought.flags.witness_safe).toBeUndefined(); expect(bought.flags.witness_consent).toBeUndefined();
    await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved(page)).toEqual(bought);
  });
}

for (const trained of [true, false]) test(`equipped chair handling ${trained ? "uses earned Steady hands" : "retains the untrained effort"}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const state = { ...base, sceneId: "act2_witness_support", strain: 3, items: ["chair-harness"], flags: { witness_briefed: true, witness_braced: true, perk_nerve: trained } };
  await open(page, state);
  const scene = getScene(state.sceneId), text = sceneText(scene, state);
  expect(visibleCampaignDialogue(scene.id, scene.speaker, text).some(line => line.text.includes("Tell me whose work"))).toBe(true);
  const choice = page.getByTestId("choice-harness-chair-transfer");
  if (trained) await expect(choice).not.toContainText("Strain +2"); else await expect(choice).toContainText("Strain +2");
  await choice.click();
  const moved = await saved(page); expect(moved.strain).toBe(trained ? 3 : 5); expect(moved.flags.witness_safe).toBe(true);
  expect(moved.flags.witness_consent).toBeUndefined(); expect(moved.flags.nia_public_consent).toBeUndefined();
  expect(moved.items).toContain("chair-harness");
});

test("unaffordable equipment cannot replace zero-cash recovery and ordinary exits", async ({ page }) => {
  await open(page, { ...base, sceneId: "act2_workshop", creds: 0 });
  for (const kit of FIELD_KITS) {
    await expect(page.getByTestId(`budget-${kit.id}`)).toContainText(`Need ${kit.price} more`);
    await expect(page.getByTestId(`choice-buy-${kit.id}`)).toBeDisabled();
  }
  await page.getByTestId("choice-leave-workshop").click(); expect((await saved(page)).creds).toBe(0);
  await expect(page.getByTestId("goal")).toBeVisible();
});
