import { test, expect } from "@playwright/test";
import { createCharacter } from "../lib/engine";

for (const [origin, painting] of [["gutterwire", "stall"], ["spire", "spire"], ["dustline", "canal"]] as const) {
  test(`${origin} opening uses the smaller unchanged setting delivery`, async ({ page }) => {
    const state = { ...createCharacter({ handle: "Delivery", givenName: "Jo", origin, bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "opening_city" };
    await page.addInitScript(state => {
      localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
      localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "full", motion: "reduce" }));
    }, state);
    await page.goto("/"); await page.getByTestId("continue-run").click();
    const portrait = page.locator("img.portrait");
    await expect(portrait).toHaveAttribute("src", `/art/${painting}-origin.webp`);
    expect(await portrait.evaluate((img: HTMLImageElement) => img.decode().then(() => [img.naturalWidth, img.naturalHeight]))).toEqual([1280, 720]);
    await expect(page.getByTestId("goal")).toBeInViewport();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(state);
  });
}
