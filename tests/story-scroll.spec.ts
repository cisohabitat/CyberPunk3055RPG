import { test, expect, type Page } from "@playwright/test";
import { createCharacter } from "../lib/engine";
const state = { ...createCharacter({ handle: "Scroll review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "act2_shelter_brief" };
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "no-preference" });
async function open(page: Page) {
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, motion: "system", artwork: "full" }));
    const original = window.scrollTo.bind(window);
    (window as unknown as { scrollCalls: ScrollToOptions[] }).scrollCalls = [];
    window.scrollTo = ((...args: [ScrollToOptions] | [number, number]) => {
      if (typeof args[0] === "object") (window as unknown as { scrollCalls: ScrollToOptions[] }).scrollCalls.push(args[0]);
      if (typeof args[0] === "number") original(args[0], args[1] as number); else original(args[0]);
    }) as typeof window.scrollTo;
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toBeVisible();
  await page.locator('.scene-row img').evaluate((img: HTMLImageElement) => img.decode());
}
test("changing motion while reading does not scroll the story back to its beginning", async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.scrollTo({ top: 550, behavior: "instant" }));
  const before = await page.evaluate(() => scrollY); expect(before).toBeGreaterThan(300);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Motion", { exact: true }).selectOption("reduce");
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
});
test("touch scene entry does not start a competing smooth scroll or live header blur", async ({ page }) => {
  await open(page);
  const calls = await page.evaluate(() => (window as unknown as { scrollCalls: ScrollToOptions[] }).scrollCalls);
  expect(calls.length).toBeGreaterThan(0); expect(calls.every(call => call.behavior !== "smooth")).toBe(true);
  expect(await page.locator('.topbar').evaluate(el => getComputedStyle(el).backdropFilter)).toBe("none");
});
test("reading can scroll down and back up without changing the saved scene", async ({ page, browserName }) => {
  await open(page); const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  const session = browserName === "chromium" ? await page.context().newCDPSession(page) : null;
  async function swipe(distance: number) {
    if (session) {
      const start = distance > 0 ? 720 : 300;
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 200, y: start }] });
      for (let step = 1; step <= 12; step++) {
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 200, y: start - distance * step / 12 }] });
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    }
    else { await page.mouse.move(200, 650); await page.mouse.wheel(0, distance); }
  }
  await swipe(500);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  const down = await page.evaluate(() => scrollY);
  await swipe(-250);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(down - 100);
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});

test("story remains scrollable after rotation and reopening Settings", async ({ page }) => {
  await open(page);
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.setViewportSize(viewport);
    const dialog = page.getByRole("dialog");
    await dialog.locator(".dialog").evaluate(el => el.scrollTo(0, el.scrollHeight));
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.mouse.move(200, viewport.height - 80);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(250);
    const down = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, -400);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(down - 100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
});
