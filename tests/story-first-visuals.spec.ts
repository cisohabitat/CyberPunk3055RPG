import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CHOICE_SECTIONS, choiceSection } from "../lib/choice-sections";
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from "../lib/engine";
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

for (const width of [390, 1440, 320]) test(`choice sections preserve actions and shortcuts at ${width}px`, async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  for (const sceneId of Object.keys(CHOICE_SECTIONS)) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), state = { ...base, sceneId }, choices = presentChoices(state, getScene(sceneId));
      await page.addInitScript(({ state, width }) => {
        localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
        localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "none", numberShortcuts: true, textStep: width === 320 ? 2 : 0 }));
      }, { state, width });
      await page.goto("/"); await page.getByTestId("continue-run").click();
      const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
      const region = page.getByRole("region", { name: "Your next move" });
      expect(await region.locator("button.choice").evaluateAll(buttons => buttons.map(button => button.getAttribute("data-testid")))).toEqual(choices.map(choice => `choice-${choice.id}`));
      const expected = choices.map(choice => choiceSection(sceneId, choice.id)).filter((title, index, list) => title && title !== list[index - 1]);
      expect(await region.getByTestId("choice-section").allTextContents()).toEqual(expected);
      for (const [index, choice] of choices.entries()) {
        const button = region.getByTestId(`choice-${choice.id}`);
        await expect(button).toBeEnabled({ enabled: choice.enabled });
        await expect(button.locator(".index")).toHaveText(String(index + 1));
        if (choice.enabled && index < 9) await expect(button).toHaveAttribute("aria-keyshortcuts", String(index + 1));
        if (choice.enabled && choice.detail) await expect(button).toContainText(choice.detail);
        if (!choice.enabled) await expect(button).toContainText(choice.disabledReason!);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
      if (sceneId === "stall") {
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.keyboard.press("1");
        expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(commitChoice(state, choices[0]).state);
      }
    } finally { await context.close(); }
  }
});

for (const width of [390, 1440, 320]) test(`chapter textures stay distinct and optional at ${width}px`, async ({ browser, baseURL }) => {
  for (const sceneId of ["card_week", "card_wall"]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), state = { ...base, sceneId }, requests: string[] = [];
      page.on("request", request => { if (request.url().includes("/art/")) requests.push(request.url()); });
      await page.addInitScript(({ state, width }) => {
        localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
        localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0 }));
      }, { state, width });
      await page.goto("/"); await page.getByTestId("continue-run").click();
      const scene = page.getByTestId("scene"), backdrop = await scene.evaluate(el => getComputedStyle(el).backgroundImage);
      if (width === 320) { expect(backdrop).toBe("none"); expect(requests).toEqual([]); }
      else {
        expect(backdrop).toContain(`/art/chapter-${sceneId === "card_week" ? "week" : "wall"}.jpg`);
        await expect.poll(() => requests.some(url => url.includes(`/art/chapter-${sceneId === "card_week" ? "week" : "wall"}.jpg`))).toBe(true);
      }
      await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
      expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(sceneText(getScene(sceneId), state).split(/\n\n+/).filter(Boolean));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(state);
    } finally { await context.close(); }
  }
});
