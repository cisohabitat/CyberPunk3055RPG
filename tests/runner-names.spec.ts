import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { isValidName } from "../lib/character";
import { keyboardActivate } from "../qa/production/keyboard";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, motion: "reduce", reading: "all" })));
});

for (const width of [390, 1440]) test(`independent name buttons preserve the build and saved identity at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto("/");
  await page.evaluate(() => { Math.random = () => 0; });
  await page.getByTestId("new-run").click();
  const handle = page.getByLabel("Street handle", { exact: true }), given = page.getByLabel("Given name, optional", { exact: true });
  const initialHandle = await handle.inputValue(), initialGiven = await given.inputValue();
  expect(isValidName(initialHandle)).toBe(true); expect(isValidName(initialGiven, 24)).toBe(true);
  await page.getByTestId("origin-spire").click(); await page.getByTestId("complication-optic").click();
  await page.getByTestId("plus-face").click(); await page.getByTestId("plus-face").click();
  await expect(handle).toHaveValue(initialHandle); await expect(given).toHaveValue(initialGiven);
  const start = page.getByTestId("start-run"); await expect(start).toBeEnabled();
  await keyboardActivate(page, page.getByRole("button", { name: "Randomise street handle", exact: true }));
  await expect(handle).not.toHaveValue(initialHandle); await expect(given).toHaveValue(initialGiven);
  const changedHandle = await handle.inputValue(); expect(isValidName(changedHandle)).toBe(true);
  await keyboardActivate(page, page.getByRole("button", { name: "Randomise given name", exact: true }));
  await expect(given).not.toHaveValue(initialGiven); await expect(handle).toHaveValue(changedHandle);
  expect(isValidName(await given.inputValue(), 24)).toBe(true);
  await expect(page.getByTestId("origin-spire")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("complication-optic")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("group", { name: "0 points left", exact: true })).toBeVisible();
  await expect(start).toBeEnabled(); expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await handle.fill("Nightglass"); await given.fill("Lio"); await start.click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(saved.handle).toBe("Nightglass"); expect(saved.givenName).toBe("Lio"); expect(saved.stats.face).toBe(4);
  await page.reload(); await page.getByTestId("continue-run").click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(saved);
});

test("reopening creation draws fresh names rather than reusing the abandoned draft", async ({ page }) => {
  await page.goto("/"); await page.evaluate(() => { Math.random = () => 0; }); await page.getByTestId("new-run").click();
  const handle = await page.getByTestId("handle-input").inputValue(), given = await page.getByTestId("given-input").inputValue();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.evaluate(() => { Math.random = () => .99; }); await page.getByTestId("new-run").click();
  await expect(page.getByTestId("handle-input")).not.toHaveValue(handle); await expect(page.getByTestId("given-input")).not.toHaveValue(given);
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBeNull();
});

test("largest-text 320px creation keeps both buttons accessible and the given name optional", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, motion: "reduce", reading: "all", textStep: 2, contrast: "high" })));
  await page.goto("/"); await page.getByTestId("new-run").click();
  for (const name of ["Randomise street handle", "Randomise given name"]) {
    const button = page.getByRole("button", { name, exact: true }); await keyboardActivate(page, button);
    const box = (await button.boundingBox())!; expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  const handle = await page.getByTestId("handle-input").inputValue(); await page.getByTestId("given-input").fill("");
  await page.getByTestId("complication-debt").click(); await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click();
  await page.getByTestId("start-run").click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(saved.handle).toBe(handle); expect(saved.givenName).toBe(handle);
});
