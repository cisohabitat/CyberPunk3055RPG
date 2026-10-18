import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, stageCheck } from "../lib/engine";
import { cityMap } from "../lib/city-map";
import { campaignRecap } from "../lib/presentation-art";
import { notebookSources } from "../lib/investigation-notebook";
import { journalKind } from "../lib/journal";
import { exportRun } from "../lib/vault";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import finale from "../qa/media/finale-direction.json";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "ScreenReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function open(page: Page, state: GameState, preferences = {}, slots: string[] = []) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences, slots }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "full", reading: "all", motion: "reduce", numberShortcuts: true, ...preferences }));
    slots.forEach((slot, index) => localStorage.setItem(`saint-shard-slot-${index + 1}`, slot));
  }, { state, preferences, slots });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
async function sheet(page: Page, width: number) {
  if (width <= 1100) await page.getByRole("button", { name: "Sheet", exact: true }).click();
  return page.getByTestId("sheet");
}

for (const width of [390, 1440, 320]) test(`map reveals known places, preserves state and finds legal choices at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
  const state = { ...base, sceneId: "act2_middle", flags: { memory_intact: true, hired: true } }, rows = cityMap(state);
  await open(page, state, { artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0 });
  const before = await saved(page); expect(requests.some(url => url.includes("city-schematic"))).toBe(false);
  const panel = await sheet(page, width), trigger = panel.getByRole("button", { name: "City map", exact: true }); await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Kite City · known places", exact: true });
  await expect(dialog.getByRole("button", { name: "Close map" })).toBeFocused();
  expect(await dialog.locator(".district-nodes > li").evaluateAll(nodes => nodes.map(n => n.getAttribute("data-district")))).toEqual(rows.map(r => r.id));
  await expect(dialog.locator('[aria-current="location"]')).toContainText("Canal district");
  await expect(dialog).not.toContainText("Ward Four shelter");
  await page.keyboard.press("1"); expect(await saved(page)).toBe(before);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
  if (width <= 1100) await expect(panel).toBeVisible();
  await trigger.click(); const action = rows.flatMap(row => row.choices).find(c => c.id === "trace-order")!;
  await dialog.getByRole("button", { name: `Find: ${action.label}`, exact: true }).click();
  await expect(page.getByTestId("choice-trace-order")).toBeFocused(); expect(await saved(page)).toBe(before);
  if (width === 320) expect(requests).toEqual([]);
  else expect(requests.some(url => url.includes("city-schematic"))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [390, 1440, 320]) test(`record cards retain exact sources, kinds and permission limits at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = routeCheckpoint("memory-timeline-bounded", "act3_testimony_hearing");
  await open(page, state, { artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0 });
  const before = await saved(page); await page.getByTestId("consult-sources").click();
  for (const record of notebookSources(state)) {
    const card = page.getByTestId(`notebook-${record.id}`); await expect(card).toHaveAttribute("data-kind", record.kind);
    await expect(card.locator("p").last()).toHaveText(record.text); await expect(card.locator("h3")).toHaveText(record.title);
  }
  await expect(page.getByLabel("Current source limits")).toContainText("Public quotation");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape"); const panel = await sheet(page, width);
  await panel.getByRole("tab", { name: "journal", exact: true }).click();
  const cards = panel.locator(".record-card"); await expect(cards).toHaveCount(state.journal.length);
  for (let i = 0; i < state.journal.length; i++) {
    await expect(cards.nth(i)).toHaveAttribute("data-kind", journalKind(state.journal[i]));
    await expect(cards.nth(i).locator(":scope > span")).toHaveText(state.journal[i].text);
  }
  expect(await saved(page)).toBe(before); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [390, 1440, 320]) test(`save thumbnails use individual snapshots and preserve confirmation at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const held = stageCheck({ ...base, sceneId: "lumen_deal" }, "fake-pact", 1);
  const slots = [exportRun({ ...base, handle: "Stayed", sceneId: "act2_mara_company_kept", flags: { mara_company_chosen: true, mara_company_waited: true } }), exportRun({ ...base, handle: "Unresolved", sceneId: "act2_mara_company_kept" }), exportRun(held)];
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
  await open(page, { ...base, sceneId: "memo" }, { artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0 }, slots);
  const before = await saved(page); await page.getByRole("button", { name: "Saves", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Saves & recovery", exact: true }), sections = dialog.locator(".save-slot");
  if (width === 320) { await expect(dialog.locator(".checkpoint-art")).toHaveCount(0); expect(requests).toEqual([]); }
  else { await expect(sections.nth(0).locator("img")).toHaveAttribute("src", "/art/mara-shared-hour-small.jpg"); await expect(sections.nth(1).locator("img")).toHaveAttribute("src", "/art/mara-window-small.jpg"); }
  await expect(sections.nth(0)).toContainText("Stayed"); await expect(sections.nth(1)).toContainText("Unresolved");
  await dialog.getByRole("button", { name: "Load slot 2", exact: true }).click(); await expect(dialog.getByRole("button", { name: "Confirm load", exact: true })).toBeVisible();
  expect(await saved(page)).toBe(before); await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.getByRole("button", { name: "Save to slot 1", exact: true }).click(); await expect(dialog.getByRole("button", { name: "Confirm save", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await page.evaluate(() => [1, 2, 3].map(id => localStorage.getItem(`saint-shard-slot-${id}`)))).toEqual(slots);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); expect(await saved(page)).toBe(before);
  await dialog.getByRole("button", { name: "Load slot 3", exact: true }).click();
  await page.evaluate(() => { Math.random = () => .99; });
  await dialog.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("continue-check")).toBeVisible();
  await expect(page.locator(".die.plate")).toHaveText("1");
  expect(JSON.parse((await saved(page))!)).toEqual(held);
});

for (const width of [390, 1440, 320]) test(`all finale recaps show three recorded moments without new outcomes at ${width}px`, async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  for (const row of finale.scenes) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), requests: string[] = [], state = routeCheckpoint(row.route, row.sceneId);
      page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
      await open(page, state, { artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0 });
      await page.getByRole("link", { name: "Skip to ending", exact: true }).focus(); await page.keyboard.press("Enter");
      await expect(page.getByTestId("scene")).toBeFocused();
      const before = await saved(page), recap = page.locator(".campaign-recap"); await expect(recap.locator("img")).toHaveCount(0);
      await recap.locator("summary").click();
      const moments = campaignRecap(state); await expect(recap.locator(".recap-moments > li")).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        const card = page.getByTestId(`recap-moment-${i}`); await expect(card.locator(":scope > p").last()).toHaveText(moments[i].text);
        if (width !== 320) await expect(card.locator("img")).toHaveAttribute("src", moments[i].art!.src);
      }
      if (width === 320) expect(requests).toEqual([]);
      else {
        const trigger = page.getByTestId("recap-moment-0").getByRole("button", { name: /^View artwork:/ }); await trigger.click();
        await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); expect(await saved(page)).toBe(before);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await context.close(); }
  }
});

for (const loading of [false, true]) test(`city map consumes ${loading ? "loading" : "playing"} dialogue without restarting it`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); const clip = "voice-campaign-mara-revelation-performance.mp3";
  let release!: () => void; const gate = new Promise<void>(r => { release = r; });
  if (loading) await page.route(`**/audio/${clip}`, async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await open(page, { ...base, sceneId: "memo" }, { sound: true, music: 0, ambience: 0, effects: 0, voices: 70, autoVoices: true });
  if (loading) await expect(page.getByTestId("voice-line")).toContainText("Loading selected dialogue");
  else await expect.poll(async () => (await audio(page)).started).toContain(clip);
  const before = await saved(page), trigger = page.getByRole("button", { name: "City map", exact: true }); await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible(); if (loading) { release(); await expect.poll(async () => (await audio(page)).decoded).toContain(clip); }
  await expect.poll(async () => (await audio(page)).liveSources).toBe(0); await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused(); await expect(page.getByRole("button", { name: "Listen to Mara", exact: true })).toBeVisible();
  expect((await audio(page)).started.filter(n => n.startsWith("voice-"))).toEqual(loading ? [] : [clip]); expect(await saved(page)).toBe(before);
});

test("missing map and saved artwork keep place names, choices and save controls usable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/art/city-schematic*.jpg", route => route.abort()); await page.route("**/art/mara-shared-hour-small.jpg", route => route.abort());
  await open(page, { ...base, sceneId: "act2_middle", flags: { memory_intact: true } }, {}, [exportRun({ ...base, sceneId: "act2_mara_company_kept", flags: { mara_company_chosen: true, mara_company_waited: true } })]);
  const before = await saved(page); await page.getByRole("button", { name: "City map", exact: true }).click(); await expect(page.getByRole("dialog")).toContainText("Map artwork unavailable");
  await expect(page.getByRole("dialog").getByRole("button", { name: /Find: Trace/ })).toBeEnabled(); await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Saves", exact: true }).click(); await expect(page.getByRole("dialog").locator(".checkpoint-art")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Load slot 1", exact: true })).toBeEnabled(); expect(await saved(page)).toBe(before);
});
