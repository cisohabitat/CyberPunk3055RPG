import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { commitChoice, getScene } from "../lib/engine";
import { FIELD_KITS, trainedKitAdvice } from "../lib/loadout";
import { missionSetup } from "../lib/matched-balance";
import type { GameState, StatId } from "../lib/types";

for (const stat of ["chrome", "nerve", "face", "ghost"] as StatId[]) for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) test(`earned ${stat} equipment advice is free and accessible at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const before = missionSetup({ origin: "spire", stat, complication: "optic", income: "sale", equipment: false, mission: "witness" }).beforeShopping;
  const state = commitChoice(before, getScene(before.sceneId).choices.find(c => c.id === "visit-workshop")!).state;
  const kit = FIELD_KITS.find(k => k.stat === stat)!;
  await page.addInitScript(({ state, artwork }) => {
    if (sessionStorage.getItem("kit-advice-test")) return;
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork, sound: false, reading: "all", contrast: "high", textStep: 2, motion: "reduce" }));
    sessionStorage.setItem("kit-advice-test", "true");
  }, { state, artwork });
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!) as GameState);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  const disclosure = page.getByTestId(`training-advice-${kit.id}`), summary = disclosure.locator("summary");
  await expect(disclosure).not.toHaveAttribute("open", "");
  expect(await page.locator(".kit-training").count()).toBe(1);
  await summary.focus(); await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure).toContainText(trainedKitAdvice(state, stat)!);
  expect(await saved()).toEqual(state);
  expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByTestId(`choice-buy-${kit.id}`).click();
  const purchased = await saved(); expect(purchased.creds).toBe(state.creds - kit.price); expect(purchased.items).toContain(kit.id);
  expect(purchased.flags.witness_safe).toBeUndefined(); expect(purchased.rolls).toEqual(state.rolls);
  await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved()).toEqual(purchased);
  expect(errors).toEqual([]);
});
