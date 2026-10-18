import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";

const run = createCharacter({ handle: "Brand review", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
for (const [width, height, large] of [[1440, 900, false], [1024, 768, false], [768, 1024, false], [390, 844, false], [320, 844, true], [844, 390, false]] as const) {
  test(`responsive title branding and real menu at ${width}x${height}${large ? " enlarged" : ""}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(({ run, large }) => {
      localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
      localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, textStep: large ? 2 : 0, motion: "reduce" }));
    }, { run, large });
    await page.goto("/");
    const heading = page.getByRole("heading", { name: "Saint Shard", exact: true });
    await expect(heading).toHaveAttribute("data-ready", "true");
    const art = page.getByTestId("title-art").locator("img");
    await art.evaluate((img: HTMLImageElement) => img.decode());
    expect(await art.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(width <= 900 ? /\/title-portrait(?:-small)?\.jpg$/ : /\/title(?:-small)?\.jpg$/);
    const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
    if (height >= 768) {
      await expect(page.getByTestId("continue-run")).toBeInViewport();
      await expect(page.getByTestId("new-run")).toBeInViewport();
    }
    for (const id of ["continue-run", "new-run", "guide-link"]) {
      const box = (await page.getByTestId(id).boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `/tmp/title-branding-${info.project.name}-${width}.png`, fullPage: false });
    await page.getByTestId("new-run").focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Start over?" })).toBeVisible();
    await page.getByRole("button", { name: "Keep it", exact: true }).click();
    await expect(page.getByTestId("new-run")).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
  });
}

test("artwork-none title mounts no brand, background or hidden image requests", async ({ page }) => {
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "none" })));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Saint Shard", exact: true })).toBeVisible();
  await expect(page.getByTestId("title-screen").locator("img, source")).toHaveCount(0);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  expect(requests).toEqual([]);
  await page.getByTestId("new-run").click(); await expect(page.getByTestId("handle-input")).toBeVisible();
});

test("missing brand and portrait leave a readable heading and working guide/menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false })));
  await page.route("**/art/saint-shard-brand*.webp", r => r.abort());
  await page.route("**/art/title-portrait*.jpg", r => r.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Saint Shard", exact: true })).toHaveAttribute("data-ready", "false");
  await expect(page.locator(".title-brand-fallback")).toBeVisible();
  await expect(page.getByTestId("title-brand")).toHaveCount(0);
  await page.getByTestId("guide-link").click(); await expect(page.getByTestId("guide-screen")).toBeVisible();
  await page.getByTestId("guide-back").click(); await page.getByTestId("new-run").click();
  await expect(page.getByTestId("handle-input")).toBeVisible();
});

test("high contrast and forced colors retain visible text branding", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, contrast: "high" })));
  await page.goto("/");
  await expect(page.locator(".title-brand-fallback")).toHaveCSS("position", "static");
  await expect(page.getByTestId("title-brand")).toBeHidden();
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator(".title-brand-fallback")).toBeVisible();
  await page.getByTestId("new-run").focus();
  expect(await page.getByTestId("new-run").evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
});
