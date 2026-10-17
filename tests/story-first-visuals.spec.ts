import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import { FACTIONS, STATS, FACTION_CHECK, STAT_INFO } from "../lib/character";
const base = createCharacter({ handle: "Visual review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
for (const width of [390, 1440, 320]) test(`compact sheet preserves rules and state at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "none", textStep: width === 320 ? 2 : 0 }));
  }, { state: { ...base, sceneId: "stall" }, width });
  await page.goto("/"); await page.getByTestId("continue-run").click();
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  if (width <= 1100) await page.getByRole("button", { name: "Sheet", exact: true }).click();
  const sheet = page.getByTestId("sheet");
  for (const stat of STATS) await expect(sheet.getByText(STAT_INFO[stat].name, { exact: true }).first()).toBeVisible();
  for (const faction of FACTIONS) await expect(sheet.getByTestId(`faction-${faction}`)).toBeVisible();
  for (const id of ["stat-reference", "faction-reference"]) {
    const details = sheet.getByTestId(id), summary = details.locator("summary");
    await expect(details).not.toHaveAttribute("open", "");
    await summary.focus(); await page.keyboard.press("Enter"); await expect(details).toHaveAttribute("open", "");
    if (id === "stat-reference") for (const stat of STATS) await expect(details).toContainText(STAT_INFO[stat].blurb);
    else for (const faction of FACTIONS) await expect(details).toContainText(FACTION_CHECK[faction]);
    await page.keyboard.press("Enter"); await expect(details).not.toHaveAttribute("open", "");
  }
  await sheet.getByRole("tab", { name: "stats" }).focus(); await page.keyboard.press("ArrowRight");
  await expect(sheet.getByRole("tab", { name: "gear" })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});
