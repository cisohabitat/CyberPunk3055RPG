import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, getScene, sceneText, commitChoice, presentChoices } from "../lib/engine";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { notebookSources } from "../lib/investigation-notebook";
import { exportRun } from "../lib/vault";
import { sourceReadiness } from "../lib/source-ledger";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "DetailReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "full", reading: "all", motion: "reduce", numberShortcuts: true, ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function sheet(page: Page, width: number) {
  if (width <= 1100) await page.getByRole("button", { name: "Sheet", exact: true }).click();
  return page.getByTestId("sheet");
}
for (const width of [390, 1440, 320]) test(`notebook brings records forward while preserving source limits at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = routeCheckpoint("memory-timeline-bounded", "act3_testimony_hearing");
  await open(page, state, { textStep: width === 320 ? 2 : 0 }); const before = await saved(page);
  await page.getByTestId("consult-sources").click();
  const dialog = page.getByRole("dialog", { name: "Investigation notebook" });
  const readiness = sourceReadiness(state);
  await expect(dialog.getByLabel("Current source limits")).toContainText(readiness.cancellation);
  await expect(dialog.getByLabel("Current source limits")).toContainText(readiness.quotation);
  if (width === 390) expect((await dialog.locator(".record-card").first().boundingBox())!.y).toBeLessThan(600);
  await dialog.getByRole("searchbox").fill("no-matching-source-phrase"); await expect(dialog.getByTestId("notebook-empty")).toBeVisible();
  await dialog.getByRole("button", { name: "Show all records" }).click();
  await expect(dialog.locator(".record-card")).toHaveCount(notebookSources(state).length);
  await dialog.getByText("About these records", { exact: true }).click(); await expect(dialog).toContainText("original wording");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.keyboard.press("Escape"); expect(await saved(page)).toBe(before);
});
for (const width of [390, 1440, 320]) test(`committed changes appear by the affected values and clear on the next choice at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = { ...base, sceneId: "stall" };
  await open(page, state, { textStep: width === 320 ? 2 : 0 });
  await expect(page.locator(".resource-change")).toHaveCount(0);
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === "accept")!, next = commitChoice(state, choice).state;
  await page.getByTestId("choice-accept").click();
  expect(JSON.parse((await saved(page))!)).toEqual(next);
  await expect(page.getByTestId("creds").locator(".resource-change")).toHaveText(`+${next.creds - state.creds}`);
  const panel = await sheet(page, width);
  await expect(panel.getByTestId("faction-quill").locator(".resource-change")).toHaveText("+1");
  if (width <= 1100) await page.getByRole("button", { name: "Close sheet", exact: true }).click();
  await expect(page.getByTestId("goal")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const go = presentChoices(next, getScene(next.sceneId)).find(c => c.enabled && !c.check && !c.effects)!;
  expect(go).toBeTruthy(); await page.getByTestId(`choice-${go.id}`).click(); await expect(page.locator(".resource-change")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
for (const width of [390, 1440]) test(`dedicated equipment art loads only on inspection at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/art/item-")) requests.push(r.url()); });
  await open(page, { ...base, sceneId: "stall", items: ["shard", "archive-probe", "witness-token"], flags: { ash: true } }); const before = await saved(page);
  const panel = await sheet(page, width); await panel.getByRole("tab", { name: "gear", exact: true }).click(); expect(requests).toEqual([]);
  for (const [name, asset] of [["Saint Shard", "item-shard-damaged"], ["Archive Probe", "item-archive-probe"], ["Shelter Token", "item-witness-token"]]) {
    const trigger = panel.getByRole("button", { name: `View artwork: ${name}`, exact: true }); await trigger.click();
    const viewer = page.getByRole("dialog", { name, exact: true }); await expect(viewer.locator(".artwork-canvas img")).toHaveAttribute("src", `/art/${asset}.jpg`);
    await expect(viewer.locator(".artwork-canvas img")).toHaveJSProperty("naturalWidth", 1536);
    await page.keyboard.press("+"); await expect(viewer.getByLabel("Artwork zoom", { exact: true })).toHaveText("150%");
    await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
  }
  expect(await saved(page)).toBe(before);
});
for (const [sceneId, flags, asset, speaker] of [
  ["vault_quiet", { lumen_here: true, pact_copy: true }, "chapel-shared", "Sister Lumen"],
  ["act3_arrival", { on_file: true, act2_deal: true }, "wall-shared", "Sera"],
] as const) for (const width of [390, 1440]) test(`shared ${asset} painting retains actual dialogue actor at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); const state = { ...base, sceneId, flags: { ...flags } };
  await open(page, state, { sound: true, music: 0, ambience: 0, effects: 0, voices: 70, autoVoices: true }); const before = await saved(page);
  await expect(page.getByTestId("scene-illustration").locator("img")).toHaveAttribute("src", `/art/${asset}.jpg`);
  const scene = getScene(sceneId), prose = sceneText(scene, state), line = visibleCampaignDialogue(sceneId, scene.speaker, prose)[0]; expect(line.speaker).toBe(speaker);
  await expect(page.locator(".scene-row .portrait-frame")).toHaveAttribute("data-speaker", speaker);
  await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
  await expect(page.getByTestId("voice-line").locator("ol li").first()).toHaveText(`${line.speaker}: ${line.text}`);
  expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(prose.split(/\n\n+/).filter(Boolean));
  await page.getByTestId("scene-illustration").getByRole("button", { name: /^View artwork:/ }).click();
  await expect.poll(async () => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview.liveSources)).toBe(0);
  await page.keyboard.press("Escape"); expect(await saved(page)).toBe(before);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("discovered landmarks fail independently while map choices remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await page.route("**/art/canal.jpg", r => r.abort());
  await open(page, { ...base, sceneId: "act2_middle", flags: { memory_intact: true, hired: true } }); const before = await saved(page);
  const panel = await sheet(page, 390); await panel.getByRole("button", { name: "City map", exact: true }).click();
  const map = page.getByRole("dialog", { name: "Kite City · known places" });
  await expect(map.locator('[data-district="canal"] .map-landmark')).toHaveCount(0);
  await expect(map.locator('[data-district="chapel"] .map-landmark')).toBeVisible();
  await expect(map.locator(".map-connections button").first()).toBeVisible();
  await page.keyboard.press("Escape"); expect(await saved(page)).toBe(before);
});

for (const [sceneId, flags] of [["vault_quiet", { lumen_here: true, pact_copy: true }], ["act3_arrival", { on_file: true, act2_deal: true }]] as const) test(`shared ${sceneId} art stays entirely optional at enlarged 320px`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 }); const requests: string[] = [];
  page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
  const state = { ...base, sceneId, flags: { ...flags }, items: ["shard", "archive-probe"] };
  await open(page, state, { artwork: "none", textStep: 2 }); const before = await saved(page);
  await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  const panel = await sheet(page, 320); await panel.getByRole("tab", { name: "gear", exact: true }).click();
  await expect(panel.locator(".inventory-art")).toHaveCount(0);
  await panel.getByRole("button", { name: "City map", exact: true }).click();
  await expect(page.locator(".map-landmark")).toHaveCount(0); expect(requests).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape"); expect(await saved(page)).toBe(before);
});

test("loading another snapshot clears receipts from the preceding runner", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 }); await open(page, { ...base, sceneId: "stall" });
  await page.getByTestId("choice-accept").click(); await expect(page.getByTestId("creds").locator(".resource-change")).toHaveText("+50");
  const restored = { ...base, handle: "Restored", sceneId: "stall" };
  await page.evaluate(snapshot => localStorage.setItem("saint-shard-slot-1", snapshot), exportRun(restored));
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click(); await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.locator(".resource-change")).toHaveCount(0);
  expect(JSON.parse((await saved(page))!)).toEqual(restored);
});
