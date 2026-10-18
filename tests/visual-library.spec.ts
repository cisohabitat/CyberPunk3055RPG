import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, getScene, sceneText } from "../lib/engine";
import { ITEMS } from "../lib/items";
import { inventoryArt } from "../lib/inventory-art";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "ArtReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "full", reading: "all", motion: "reduce", numberShortcuts: true, ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

for (const width of [390, 1440, 320]) test(`painted conversation and inventory remain readable and optional at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
  const state = { ...base, sceneId: "act2_archive_brief", items: Object.keys(ITEMS), flags: { ash: true } };
  await open(page, state, { artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0 });
  const before = await saved(page), text = await page.getByTestId("scene-text").textContent();
  await expect(page.locator(".scene-row")).toHaveAttribute("data-compact", width === 320 ? "false" : "true");
  const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThan(900);
  expect(requests.some(url => url.includes("equipment-atlas"))).toBe(false);
  if (width <= 1100) await page.getByRole("button", { name: "Sheet", exact: true }).click();
  const sheet = page.getByTestId("sheet"); await sheet.getByRole("tab", { name: "gear", exact: true }).click();
  await expect(sheet.locator(".gear li")).toHaveCount(14);
  await expect(sheet.locator(".gear")).toContainText("Damaged. Half a voice, flickering.");
  for (const item of Object.values(ITEMS)) await expect(sheet.locator(".gear")).toContainText(item.name);
  if (width === 320) { await expect(sheet.locator(".inventory-art")).toHaveCount(0); expect(requests).toEqual([]); }
  else {
    await expect(sheet.locator(".inventory-art")).toHaveCount(14);
    for (const id of Object.keys(ITEMS)) await expect(sheet.getByRole("button", { name: `View artwork: ${ITEMS[id].name}`, exact: true }).locator(".equipment-tile")).toHaveAttribute("data-tile", String(inventoryArt(id, true)!.tile));
    const trigger = sheet.getByRole("button", { name: "View artwork: Saint Shard", exact: true }); await trigger.click();
    const viewer = page.getByRole("dialog", { name: "Saint Shard", exact: true });
    await expect(viewer.getByRole("button", { name: "Close artwork" })).toBeFocused();
    await expect(viewer.locator(".equipment-tile")).toHaveAttribute("data-tile", "14");
    await expect(viewer).toContainText("chipped and cracked");
    const fitted = await viewer.locator(".artwork-canvas").boundingBox(), frame = await viewer.getByRole("region", { name: "Artwork detail" }).boundingBox();
    expect(fitted!.width).toBeLessThanOrEqual(frame!.width); expect(fitted!.height).toBeLessThanOrEqual(frame!.height);
    await page.keyboard.press("Shift+Tab"); await expect(viewer.getByRole("region", { name: "Artwork detail" })).toBeFocused();
    await page.keyboard.press("Tab"); await expect(viewer.getByRole("button", { name: "Close artwork" })).toBeFocused();
    await page.keyboard.press("+"); await expect(viewer.getByLabel("Artwork zoom", { exact: true })).toHaveText("150%");
    await viewer.getByRole("button", { name: "Zoom in", exact: true }).click();
    await expect(viewer.getByLabel("Artwork zoom", { exact: true })).toHaveText("200%");
    const viewport = viewer.getByRole("region", { name: "Artwork detail" }); await viewport.focus();
    expect(await viewport.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    await viewport.evaluate(el => el.scrollTo({ left: 80, top: 80 }));
    await page.keyboard.press("0"); await expect(viewer.getByLabel("Artwork zoom", { exact: true })).toHaveText("100%");
    expect(await viewport.evaluate(el => el.scrollLeft)).toBe(0);
    await page.keyboard.press("1"); expect(await saved(page)).toBe(before);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape"); await expect(viewer).toHaveCount(0); await expect(trigger).toBeFocused();
    if (width <= 1100) await expect(page.getByRole("dialog", { name: "ArtReview", exact: true })).toBeVisible();
  }
  expect(await saved(page)).toBe(before); expect(await page.getByTestId("scene-text").textContent()).toBe(text);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [390, 1440]) test(`earned illustrations retain exact story words at ${width}px`, async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  for (const [sceneId, flags, asset] of [
    ["act2_mara_company_kept", { mara_company_chosen: true, mara_company_waited: true }, "mara-shared-hour"],
    ["act2_mara_company_kept", {}, "mara-window"],
    ["act3_edda_visit", { archive_custody: true, edda_exposed: true }, "archive-held-original"],
    ["act3_edda_visit", { order_verified: true }, "edda-visit"],
  ] as const) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), state = { ...base, sceneId, flags: flags as Record<string, boolean> };
      await open(page, state); const before = await saved(page);
      // The registry selects the actual neutral plate as well as the earned variants.
      const { sceneIllustration } = await import("../lib/art");
      const art = sceneIllustration(sceneId, state.flags)!;
      if (asset !== "edda-visit") expect(art.src).toBe(`/art/${asset}.jpg`);
      const picture = page.getByTestId("scene-illustration"); await expect(picture.locator("img")).toHaveAttribute("src", art.src);
      await picture.getByRole("button", { name: /^View artwork:/ }).click();
      const viewer = page.getByRole("dialog", { name: art.caption, exact: true }); await expect(viewer).toContainText(art.description);
      await viewer.getByRole("button", { name: "Close artwork" }).click();
      expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(sceneText(getScene(sceneId), state).split(/\n\n+/).filter(Boolean));
      expect(await saved(page)).toBe(before);
    } finally { await context.close(); }
  }
});

for (const loading of [false, true]) test(`art viewer consumes ${loading ? "loading" : "playing"} speech without resuming or changing a save`, async ({ page }) => {
  const clip = "voice-campaign-mara-revelation-performance.mp3";
  let release!: () => void; const gate = new Promise<void>(r => { release = r; });
  if (loading) await page.route(`**/audio/${clip}`, async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await open(page, { ...base, sceneId: "memo" }, { sound: true, music: 0, ambience: 0, effects: 0, voices: 70, autoVoices: true });
  const before = await saved(page);
  if (loading) await expect(page.getByTestId("voice-line")).toContainText("Loading selected dialogue");
  else await expect.poll(async () => (await audio(page)).started).toContain(clip);
  const trigger = page.getByTestId("scene-illustration").getByRole("button", { name: /^View artwork:/ }); await trigger.click();
  const viewer = page.getByRole("dialog"); await expect(viewer).toBeVisible();
  if (loading) { release(); await expect.poll(async () => (await audio(page)).decoded).toContain(clip); }
  await expect.poll(async () => (await audio(page)).liveSources).toBe(0);
  await page.keyboard.press("1"); expect(await saved(page)).toBe(before);
  await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
  await expect(page.getByRole("button", { name: "Listen to Mara", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click(); await page.getByRole("button", { name: "Done", exact: true }).click();
  expect((await audio(page)).started.filter(n => n.startsWith("voice-"))).toEqual(loading ? [] : [clip]);
  expect(await saved(page)).toBe(before);
});

test("missing full-size equipment keeps the description and returns to the mobile sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route("**/art/equipment-atlas.jpg", route => route.abort());
  await open(page, { ...base, sceneId: "stall", items: ["shard"] }); const before = await saved(page);
  await page.getByRole("button", { name: "Sheet", exact: true }).click();
  await page.getByRole("tab", { name: "gear", exact: true }).click();
  const trigger = page.getByRole("button", { name: "View artwork: Saint Shard", exact: true }); await trigger.click();
  await expect(page.getByRole("dialog", { name: "Saint Shard", exact: true })).toContainText("Artwork unavailable.");
  await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Close sheet", exact: true }).click();
  expect(await saved(page)).toBe(before); await expect(page.getByRole("region", { name: "Your next move" })).toBeVisible();
});

test("guide painting opens the same keyboard viewer without touching a campaign save", async ({ page }) => {
  await page.addInitScript(({ state }) => { localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state)); localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false })); }, { state: base });
  await page.goto("/guide"); const before = await saved(page);
  const trigger = page.getByRole("button", { name: /^View artwork:/ }); await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("+");
  await expect(page.getByLabel("Artwork zoom", { exact: true })).toHaveText("150%");
  await page.keyboard.press("Escape"); await expect(trigger).toBeFocused(); expect(await saved(page)).toBe(before);
});
