import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
test("dialogs fit a reduced visual viewport and release that fit during pinch zoom", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false }));
    const viewport = window.visualViewport!;
    let height = 844, top = 0, scale = 1;
    Object.defineProperties(viewport, { height: { get: () => height }, offsetTop: { get: () => top }, scale: { get: () => scale } });
    (window as unknown as { resizeReview: (h: number, t: number, s: number) => void }).resizeReview = (h, t, s) => {
      height = h; top = t; scale = s; viewport.dispatchEvent(new Event("resize"));
    };
  });
  await page.goto("/"); await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.evaluate(() => (window as unknown as { resizeReview: (h: number, t: number, s: number) => void }).resizeReview(320, 35, 1));
  const dialog = page.getByRole("dialog");
  await expect.poll(async () => (await dialog.boundingBox())!.height).toBeCloseTo(320, 0);
  const box = (await dialog.locator(".dialog").boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(355);
  expect(await dialog.locator(".dialog").evaluate(el => getComputedStyle(el).overscrollBehaviorY)).toBe("contain");
  await dialog.locator(".dialog").evaluate(el => el.scrollTo(0, el.scrollHeight));
  await expect(page.getByRole("button", { name: "Done", exact: true })).toBeInViewport();
  await page.evaluate(() => (window as unknown as { resizeReview: (h: number, t: number, s: number) => void }).resizeReview(160, 35, 2));
  expect(await dialog.evaluate(el => (el as HTMLElement).style.getPropertyValue("--dialog-viewport-height"))).toBe("");
  expect(await page.locator('meta[name="viewport"]').getAttribute("content")).not.toMatch(/user-scalable=no|maximum-scale=1/);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeFocused();
});

test("open dialogs adapt to portrait and landscape without losing their controls", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false })));
  await page.goto("/"); await page.getByRole("button", { name: "Settings", exact: true }).click();
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const dialog = page.getByRole("dialog");
    await expect.poll(async () => (await dialog.boundingBox())!.height).toBeCloseTo(viewport.height, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await dialog.locator(".dialog").evaluate(el => el.scrollTo(0, el.scrollHeight));
    await expect(page.getByRole("button", { name: "Done", exact: true })).toBeInViewport();
  }
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("new-run")).toBeVisible();
});
