import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { getScene, sceneText } from "../lib/engine";

const samples = [
  ["integration-names", "opening_city"], ["pacing-signed-face", "act3_edda_visit"],
  ["catalog-paid", "act2_workshop"], ["memory-timeline-corrected", "memory_sequence"],
] as const;
for (const width of [390, 1440]) for (const [route, sceneId] of samples) test(`${sceneId} leads with readable story at ${width}px`, async ({ page }) => {
  const state = routeCheckpoint(route, sceneId);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "full", reading: "all", motion: "reduce" }));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await page.evaluate(() => document.fonts.ready);
  await page.getByTestId("scene-illustration").locator("img").evaluate((img: HTMLImageElement) => img.decode());
  const prose = page.getByTestId("scene-text");
  await expect(prose).toContainText(sceneText(getScene(sceneId), state).split(/\n\n+/)[0]);
  expect((await prose.locator("p").first().boundingBox())!.y).toBeLessThan(width === 390 ? 700 : 650);
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (sceneId === "act2_workshop") {
    expect(await page.getByTestId("field-kit-brief").evaluate(el => Boolean(document.querySelector('[data-testid="scene-text"]')!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    await expect(page.locator(".kit-comparison")).toHaveCount(4);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(state);
});

for (const artwork of ["full", "none"]) test(`guide quick start and section links precede optional artwork (${artwork})`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(artwork => localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork, sound: false })), artwork);
  await page.goto("/guide");
  await expect(page.getByTestId("guide-quick-start")).toBeInViewport();
  const link = page.getByRole("link", { name: "Choices & dice", exact: true });
  await expect(link).toBeInViewport();
  await link.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Choices and dice", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBeNull();
});
