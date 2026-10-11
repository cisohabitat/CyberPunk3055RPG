import { expect, type Locator, type Page } from "@playwright/test";

/** QA navigation through the browser's actual Tab order. No programmatic focus,
 * pointer clicks, input fills or number shortcuts are used by these helpers. */
export async function tabTo(page: Page, target: Locator, limit = 240) {
  await expect(target).toBeVisible();
  for (let tabs = 0; tabs <= limit; tabs++) {
    if (await target.evaluate(element => element === document.activeElement)) return tabs;
    if (tabs < limit) await page.keyboard.press("Tab");
  }
  throw new Error(`Control not reached after ${limit} Tabs: ${await target.evaluate(element => element.outerHTML.slice(0, 300))}`);
}

export async function keyboardActivate(page: Page, target: Locator) {
  await expect(target).toBeEnabled();
  const tabs = await tabTo(page, target);
  const checkbox = await target.evaluate(element => element instanceof HTMLInputElement && element.type === "checkbox");
  await page.keyboard.press(checkbox ? "Space" : "Enter");
  return tabs;
}

export async function keyboardSelect(page: Page, target: Locator, value: string) {
  const tabs = await tabTo(page, target);
  const index = await target.evaluate((element, wanted) => Array.from((element as HTMLSelectElement).options).findIndex(option => option.value === wanted), value);
  if (index < 0) throw new Error(`Missing select option ${value}`);
  await page.keyboard.press("Home");
  for (let i = 0; i < index; i++) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(target).toHaveValue(value);
  return tabs;
}
