import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { exportRun, importRun } from "../lib/vault";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { getScene, sceneText } from "../lib/engine";
const state = () => routeCheckpoint("district-private-rest", "act2_middle", "open-district-response");
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
async function open(page: Page, width: number, run = state(), sound = false) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ run, width, sound }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound, artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0, reading: "all", motion: "reduce", autoVoices: true }));
  }, { run, width, sound });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
async function pick(page: Page, id: string) { await page.getByTestId(`choice-${id}`).click(); }
for (const width of [390, 1440, 320]) for (const mode of ["public", "private"]) test(`${mode} depot response, saved costs and source limits at ${width}px`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await open(page, width); await pick(page, "open-district-response"); await pick(page, "district-edda-receipt");
  const before = await saved(page); await pick(page, mode === "public" ? "district-public-review" : "district-private-query");
  let run = await saved(page); expect(run.creds).toBe(before.creds); expect(run.flags.district_window_2).toBe(true);
  if (width !== 320) { const image = page.getByTestId("scene-illustration").locator("img"); await expect(image).toHaveAttribute("src", mode === "public" ? "/art/depot-review.jpg" : "/art/canal-dispatch.jpg"); await image.scrollIntoViewIfNeeded(); await image.evaluate((i: HTMLImageElement) => i.decode()); }
  else await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  await page.getByTestId("district-ledger").locator(":scope > summary").click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await pick(page, "district-read-notice"); await pick(page, "district-return-notice"); expect((await saved(page)).flags.district_window_2).toBe(true);
  await pick(page, "district-speak-kerr"); await pick(page, "district-withhold-kerr");
  await pick(page, "district-kerr-introduce"); await pick(page, mode === "public" ? "district-register-work" : "district-book-rest");
  run = await saved(page); expect(run.creds).toBe(before.creds); expect(run.flags.district_window_1).toBe(true); expect(importRun(exportRun(run))).toEqual(run);
  await page.reload(); await page.getByTestId("continue-run").click();
  await pick(page, mode === "public" ? "district-finish-work" : "district-finish-rest");
  run = await saved(page); expect(run.flags.district_window_0).toBe(true); expect(run.creds).toBe(before.creds + (mode === "public" ? 20 : 0));
  for (const f of ["archive_key_authenticated", "nia_public_consent", "edda_public_consent"]) expect(run.flags[f]).toBe(before.flags[f]);
  expect(importRun(exportRun(run))).toEqual(run); await pick(page, "district-return-result");
  await expect(page.getByTestId("choice-district-register-work")).toHaveCount(0); await expect(page.getByTestId("choice-district-book-rest")).toHaveCount(0);
  await pick(page, "district-close"); expect((await saved(page)).flags.district_window_closed).toBe(true); expect(errors).toEqual([]);
});
for (const answer of ["acknowledge", "deny"]) test(`Kerr's known privacy breach ${answer} controls this introduction without erasing the trace`, async ({ page }) => {
  const run = state(); Object.assign(run.flags, { kerr_route_private: true, kerr_route_trace: true, kerr_route_delivered: true });
  await open(page, 390, run); await pick(page, "open-district-response"); await pick(page, "district-edda-receipt"); await pick(page, "district-public-review");
  await pick(page, "district-speak-kerr"); await pick(page, "district-withhold-kerr"); await expect(page.getByTestId("choice-district-kerr-introduce")).toHaveCount(0);
  await pick(page, `district-kerr-${answer}`);
  if (answer === "acknowledge") await expect(page.getByTestId("choice-district-kerr-introduce")).toBeEnabled();
  else await expect(page.getByTestId("choice-district-kerr-introduce")).toHaveCount(0);
  const after = await saved(page); expect(after.flags.kerr_route_trace).toBe(true); expect(after.flags.kerr_contact_open).toBe(run.flags.kerr_contact_open); expect(after.creds).toBe(run.creds);
});
test("the competing correction leaves one action and no unfinished wage can be claimed", async ({ page }) => {
  await open(page, 320); await pick(page, "open-district-response"); await pick(page, "district-edda-receipt"); await pick(page, "district-public-review");
  await pick(page, "district-speak-kerr"); await pick(page, "district-withhold-kerr"); await pick(page, "district-kerr-introduce");
  await pick(page, "district-carry-correction"); await pick(page, "district-return-result");
  await expect(page.getByTestId("choice-district-register-work")).toHaveCount(0); expect((await saved(page)).flags.district_window_1).toBe(true);
  await pick(page, "district-close"); expect((await saved(page)).flags.district_work_paid).toBeUndefined();
});
for (const checkpoint of [
  ["district-private-rest", "act2_district_edda", "district-private-query"],
  ["district-public-work", "act2_district_kerr_reply", "district-kerr-acknowledge"],
  ["district-public-work", "act2_district_work", "district-leave-work"],
] as const) test(`automatic dialogue matches the actual actor and revealed words in ${checkpoint[1]}`, async ({ page }) => {
  test.setTimeout(40_000); await page.addInitScript(installAudioReview, {});
  const run = routeCheckpoint(checkpoint[0], checkpoint[1], checkpoint[2]), scene = getScene(run.sceneId), lines = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, run));
  await open(page, 390, run, true); const widget = page.getByTestId("voice-line");
  await expect(widget).toHaveCount(1); await expect(widget).toHaveAttribute("data-playback", "playing");
  await expect(widget).toHaveAttribute("aria-label", `${scene.speaker} selected dialogue`);
  await expect.poll(async () => (await page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview)).started.filter(n => n.startsWith("voice-")), { timeout: 30_000 }).toEqual(lines.map(l => `${l.id}.mp3`));
  await widget.locator("summary").click(); for (const line of lines) await expect(widget).toContainText(line.text);
  expect(await saved(page)).toEqual(run);
});
