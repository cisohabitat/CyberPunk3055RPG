import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import type { GameState } from "../lib/types";

const fixture = (sceneId = "stall", extra: Partial<GameState> = {}): GameState => ({
  ...createCharacter({ handle: "Reader", givenName: "Ada", origin: "spire", bonus: { face: 2, nerve: 0, ghost: 0, chrome: 0 } }), sceneId, ...extra,
});
async function openRun(page: Page, run = fixture()) {
  await page.addInitScript(run => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
  }, run);
  await page.goto("/");
  await page.getByTestId("continue-run").click();
}
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));

test("cycle 8 number-key opt-out persists and leaves Enter choices usable", async ({ page }) => {
  await openRun(page);
  const before = await saved(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Number-key choices", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.keyboard.press("1");
  expect(await saved(page)).toEqual(before);
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.keyboard.press("1");
  expect(await saved(page)).toEqual(before);
  const accept = page.getByTestId("choice-accept");
  await expect(accept).not.toHaveAttribute("aria-keyshortcuts");
  await expect(accept).toHaveAccessibleName("Take the job.");
  await accept.focus(); await page.keyboard.press("Enter");
  expect((await saved(page)).sceneId).not.toBe("stall");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Number-key choices", { exact: true })).not.toBeChecked();
});

test("cycle 8 paragraph reveal focuses new text through the final paragraph", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "paragraph" })));
  await openRun(page, fixture("memo", { items: ["shard"] }));
  const before = await saved(page);
  const next = page.getByTestId("next-paragraph");
  let index = 1;
  while (await next.count()) {
    await next.focus(); await page.keyboard.press("Enter");
    await expect(page.locator(`#reading-paragraph-${index}`)).toBeFocused();
    index++;
  }
  expect(index).toBeGreaterThan(1);
  await expect(page.locator(".reading-progress")).toContainText(`${index} of ${index} paragraphs shown`);
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
  await page.locator('a[href="#choices"]').focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#choices")).toBeFocused();
});

test("cycle 8 showing the rest focuses the first newly revealed paragraph", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "paragraph" })));
  await openRun(page, fixture("memo", { items: ["shard"] }));
  const before = await saved(page);
  await page.getByTestId("show-rest").focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#reading-paragraph-1")).toBeFocused();
  await expect(page.getByTestId("show-rest")).toHaveCount(0);
  expect(await saved(page)).toEqual(before);
});

test("cycle 8 unavailable approaches are keyboard-readable without spending or revealing hidden routes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ textStep: 2, artwork: "none", contrast: "high", numberShortcuts: false, reading: "all" })));
  await openRun(page, fixture("act2_notice_counter", { creds: 0, flags: { notice_schedule_33: true } }));
  const before = await saved(page);
  await expect(page.getByTestId("choice-fund-notice-extra-carrier")).toBeDisabled();
  const review = page.getByTestId("unavailable-choices");
  await review.locator("summary").focus(); await page.keyboard.press("Enter");
  await expect(review).toContainText("Need 10 creds");
  expect(await saved(page)).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("cycle 8 sheet panels receive Tab focus and isolate story shortcuts", async ({ page }) => {
  await openRun(page);
  const before = await saved(page);
  if (page.viewportSize()!.width <= 1100) await page.getByTestId("sheet-toggle").click();
  for (const tab of ["stats", "gear", "journal"]) {
    await page.getByRole("tab", { name: tab, exact: true }).focus(); await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(page.locator(`#panel-${tab}`)).toBeFocused();
    await page.keyboard.press("1"); expect(await saved(page)).toEqual(before);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  }
  if (page.viewportSize()!.width <= 1100) {
    await page.keyboard.press("Escape"); await expect(page.getByTestId("sheet-toggle")).toBeFocused();
  }
});

test("cycle 8 abandon starts on Keep going and accidental Enter preserves the run", async ({ page }) => {
  await openRun(page);
  const before = await saved(page);
  const abandon = page.getByRole("button", { name: "Abandon", exact: true });
  await abandon.click();
  await expect(page.getByRole("button", { name: "Keep going", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(abandon).toBeFocused();
  expect(await saved(page)).toEqual(before);
});
