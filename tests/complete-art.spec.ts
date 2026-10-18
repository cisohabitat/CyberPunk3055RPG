import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, getScene, presentChoices, commitChoice, sceneText } from "../lib/engine";
import { mapDisplayRows } from "../lib/city-map";
import { inventoryArt } from "../lib/inventory-art";
import { ITEMS } from "../lib/items";
import { sceneIllustration } from "../lib/art";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { ART_PREVIEWS } from "../lib/art-previews";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "ArtReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "full", reading: "all", motion: "reduce", numberShortcuts: true, ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
async function sheet(page: Page, width: number) {
  if (width <= 1100) await page.getByRole("button", { name: "Sheet", exact: true }).click();
  return page.getByTestId("sheet");
}
for (const width of [390, 1440, 320]) test(`compact map prioritizes current and legal destinations at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = { ...base, sceneId: "act2_middle", flags: { memory_intact: true, hired: true } };
  await open(page, state, { textStep: width === 320 ? 2 : 0 }); const before = await saved(page);
  const panel = await sheet(page, width), trigger = panel.getByRole("button", { name: "City map", exact: true }); await trigger.click();
  const map = page.getByRole("dialog", { name: "Kite City · known places" }), rows = mapDisplayRows(state);
  expect(await map.locator(".district-nodes > li").evaluateAll(nodes => nodes.map(n => n.getAttribute("data-district")))).toEqual(rows.map(r => r.id));
  await expect(map.locator(".district-nodes > li").first()).toHaveAttribute("aria-current", "location");
  const action = map.getByRole("button", { name: /^Find:/ }).first();
  if (width === 390) expect((await action.boundingBox())!.y + (await action.boundingBox())!.height).toBeLessThan(700);
  if (width <= 700) for (const box of await map.locator(".map-landmark").evaluateAll(imgs => imgs.map(i => i.getBoundingClientRect().width))) expect(box).toBeLessThanOrEqual(72);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await map.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true); expect(await saved(page)).toBe(before);
  await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
  await trigger.click(); const choice = rows.flatMap(r => r.choices)[0];
  await map.getByRole("button", { name: `Find: ${choice.label}`, exact: true }).click();
  await expect(page.getByTestId(`choice-${choice.id}`)).toBeFocused(); expect(await saved(page)).toBe(before);
});
for (const width of [390, 1440]) test(`same-painting preview survives slow detail without shifting the frame at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: "no-preference" });
  let release!: () => void; const gate = new Promise<void>(r => { release = r; });
  await page.route("**/art/edda-service-review*.jpg", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  const state = { ...base, sceneId: "act2_spire_sources", flags: { spire_consent: true } };
  try {
    await open(page, state, { motion: "system" }); const before = await saved(page);
    const frame = page.getByTestId("scene-illustration").locator(".progressive-art"), preview = ART_PREVIEWS["/art/edda-service-review.jpg"];
    await expect(frame).toHaveAttribute("data-ready", "false"); expect(await frame.getAttribute("style")).toContain(preview);
    await expect.poll(async () => page.evaluate(path => performance.getEntriesByName(location.origin + path).length, preview)).toBeGreaterThan(0);
    const bounds = await frame.boundingBox(); await expect(page.getByTestId("choice-inspect-spire-billing")).toBeEnabled();
    release(); await expect(frame).toHaveAttribute("data-ready", "true");
    const after = await frame.boundingBox(); expect(after!.width).toBeCloseTo(bounds!.width, 1); expect(after!.height).toBeCloseTo(bounds!.height, 1);
    expect(await frame.locator("img").evaluate(img => getComputedStyle(img).transitionDuration)).toBe("0.18s");
    await page.emulateMedia({ reducedMotion: "reduce" }); expect(await frame.locator("img").evaluate(img => getComputedStyle(img).transitionDuration)).toBe("0s");
    expect(await saved(page)).toBe(before);
  } finally { release(); }
});
for (const failure of ["preview", "detail", "both"]) test(`artwork ${failure} failure preserves the scene and controls`, async ({ page }) => {
  const art = sceneIllustration("act2_spire_sources")!;
  if (failure !== "detail") await page.route(`**${ART_PREVIEWS[art.src]}`, route => route.abort());
  if (failure !== "preview") await page.route("**/art/edda-service-review*.jpg", route => route.abort());
  await open(page, { ...base, sceneId: "act2_spire_sources", flags: { spire_consent: true } }); const before = await saved(page);
  const figure = page.getByTestId("scene-illustration");
  if (failure === "preview") await expect(figure.locator(".progressive-art")).toHaveAttribute("data-ready", "true");
  else await expect(figure.locator(".art-unavailable")).toHaveText(art.description);
  await expect(page.getByTestId("choice-inspect-spire-billing")).toBeEnabled(); expect(await saved(page)).toBe(before);
});
for (const width of [390, 1440]) test(`all fourteen individual equipment inspections preserve their own design and save at ${width}px`, async ({ page }) => {
  test.setTimeout(60_000); await page.setViewportSize({ width, height: 900 }); const requests: string[] = [];
  page.on("request", r => { if (/\/art\/item-/.test(r.url())) requests.push(r.url()); });
  await open(page, { ...base, sceneId: "stall", items: Object.keys(ITEMS) }); const before = await saved(page);
  const panel = await sheet(page, width); await panel.getByRole("tab", { name: "gear", exact: true }).click(); expect(requests).toEqual([]);
  for (const [id, item] of Object.entries(ITEMS)) {
    const trigger = panel.getByRole("button", { name: `View artwork: ${item.name}`, exact: true }); await trigger.click();
    const dialog = page.getByRole("dialog", { name: item.name, exact: true }); const img = dialog.locator(".artwork-canvas img");
    await expect(img).toHaveAttribute("src", inventoryArt(id)!.src); await expect(img).toHaveJSProperty("naturalWidth", 1536);
    await expect(dialog.locator(".progressive-art")).toHaveAttribute("data-ready", "true");
    await page.keyboard.press("+"); await expect(dialog.getByLabel("Artwork zoom", { exact: true })).toHaveText("150%");
    await page.keyboard.press("Escape"); await expect(trigger).toBeFocused(); expect(await saved(page)).toBe(before);
  }
});
for (const [sceneId, actor] of [["act2_shelter_brief", "Sera"], ["act2_spire_sources", "Edda"], ["act2_lumen_quiet", "Sister Lumen"]] as const) for (const width of [390, 1440]) test(`literal ${sceneId} painting preserves dialogue, actor and nested voice stop at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); const state = { ...base, sceneId, flags: { spire_consent: true, betrayed_lumen: true } };
  await open(page, state, { sound: true, music: 0, ambience: 0, effects: 0, voices: 70, autoVoices: true }); const before = await saved(page);
  const art = sceneIllustration(sceneId)!, scene = getScene(sceneId), text = sceneText(scene, state);
  await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src", art.src);
  await expect(page.locator(".scene-row")).toHaveAttribute("data-compact", "true");
  await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
  await expect(page.locator(".scene-row .portrait-frame")).toHaveAttribute("data-speaker", actor);
  const lines = visibleCampaignDialogue(sceneId, scene.speaker, text);
  expect(await page.getByTestId("voice-line").locator("ol li").allTextContents()).toEqual(lines.map(l => `${l.speaker}: ${l.text}`));
  expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(text.split(/\n\n+/).filter(Boolean));
  if (sceneId === "act2_lumen_quiet") await expect(page.locator(".scene-row .portrait-frame img")).toHaveAttribute("src", "/art/lumen-guarded.jpg");
  await page.getByTestId("scene-illustration").getByRole("button", { name: /^View artwork:/ }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.liveSources)).toBe(0);
  await page.keyboard.press("Escape"); expect(await saved(page)).toBe(before);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
for (const sceneId of ["act2_shelter_brief", "act2_spire_sources", "act2_lumen_quiet"]) test(`new ${sceneId} art and previews are absent in artwork-none`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 }); const requests: string[] = [];
  page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
  await open(page, { ...base, sceneId, items: Object.keys(ITEMS) }, { artwork: "none", textStep: 2 }); const before = await saved(page);
  await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  const panel = await sheet(page, 320); await panel.getByRole("tab", { name: "gear", exact: true }).click(); await expect(panel.locator(".inventory-art")).toHaveCount(0);
  await panel.getByRole("button", { name: "City map", exact: true }).click(); await expect(page.locator(".map-landmark")).toHaveCount(0);
  expect(requests).toEqual([]); expect(await saved(page)).toBe(before);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("late decoding from a departed painting cannot replace the new scene", async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(r => { release = r; });
  await page.route("**/art/edda-service-review*.jpg", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  const state = { ...base, sceneId: "act2_spire_sources", flags: { spire_consent: true, spire_billing: true, spire_protocol: true, spire_receiver: true } };
  try {
    await open(page, state); const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === "plan-spire-key")!, next = commitChoice(state, choice).state;
    await page.getByTestId("choice-plan-spire-key").click(); release();
    await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src", sceneIllustration(next.sceneId)!.src);
    await expect(page.getByTestId("scene-illustration").locator(".progressive-art")).toHaveAttribute("data-ready", "true");
    expect(JSON.parse((await saved(page))!)).toEqual(next);
  } finally { release(); }
});
for (const mode of ["saved", "system"] as const) test(`${mode} reduced motion disables the decoded-art fade`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: mode === "system" ? "reduce" : "no-preference" });
  await open(page, { ...base, sceneId: "act2_spire_sources" }, { motion: mode === "saved" ? "reduce" : "system" });
  const frame = page.getByTestId("scene-illustration").locator(".progressive-art"); await expect(frame).toHaveAttribute("data-ready", "true");
  expect(await frame.locator("img").evaluate(img => getComputedStyle(img).transitionDuration)).toBe("0s");
});
