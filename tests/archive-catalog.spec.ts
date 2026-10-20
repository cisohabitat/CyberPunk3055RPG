import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { keyboardActivate } from "../qa/production/keyboard";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { getScene, sceneText } from "../lib/engine";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import type { GameState } from "../lib/types";

const saved = (page: Page): Promise<GameState> => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
const act = (page: Page, id: string) => keyboardActivate(page, page.getByTestId(`choice-${id}`));
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(({ state, preferences }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    if (!localStorage.getItem("saint-shard-preferences")) localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, autoVoices: false, reading: "all", motion: "reduce", ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await keyboardActivate(page, page.getByTestId("continue-run"));
}
async function locate(page: Page) {
  await act(page, "open-archive-catalog"); await act(page, "catalog-inspect-revision"); await act(page, "catalog-request-revision");
}

for (const [width, artwork] of [[320, "none"], [390, "full"], [1440, "full"]] as const) test(`catalog investigation keeps zero-cash alternatives and saved query history at ${width}px`, async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width, height: 900 });
  const requests: string[] = []; page.on("request", request => { if (request.url().includes("/art/")) requests.push(request.url()); });
  const initial = routeCheckpoint("scarce-archive-dustline", "act2_archive_compare");
  expect(initial.creds).toBe(0);
  await open(page, initial, { artwork, textStep: width === 320 ? 2 : 0, contrast: "high" });
  const prose = await page.getByTestId("scene-text").textContent();
  await act(page, "open-archive-catalog"); await expect(page.getByRole("heading", { name: "The catalog drawer", exact: true })).toBeFocused();
  const header = await page.locator(".topbar").boundingBox();
  const heading = await page.getByRole("heading", { name: "The catalog drawer", exact: true }).boundingBox();
  expect(heading!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  await act(page, "catalog-inspect-authorization");
  await expect(page.getByRole("heading", { name: "Flush authorizations", exact: true })).toBeFocused();
  const read = await saved(page); expect(read.factions).toEqual(initial.factions); expect(read.rolls).toEqual(initial.rolls);
  await act(page, "catalog-request-authorization");
  await expect(page.locator("#catalog-result-authorization")).toBeFocused();
  await expect(page.locator("#catalog-result-authorization")).toContainText("cannot corroborate the later cancellation");
  await act(page, "catalog-inspect-service"); await act(page, "catalog-inspect-revision"); await act(page, "catalog-request-revision");
  const located = await saved(page);
  expect(located.flags.archive_reader_alert).toBe(true); expect(located.flags.archive_catalog_located).toBe(true);
  expect(located.flags.order_verified).toBeUndefined(); expect(located.flags.archive_key_authenticated).toBeUndefined();
  expect(located.rolls).toEqual(initial.rolls); expect(located.creds).toBe(0); expect(located.strain).toBe(initial.strain);
  await expect(page.getByTestId("choice-catalog-buy-extraction")).toBeDisabled();
  await expect(page.getByTestId("choice-catalog-bill-employee")).toHaveCount(0);
  await act(page, "close-archive-catalog");
  await expect(page.getByTestId("choice-open-archive-catalog")).toBeFocused();
  const returned = await page.getByTestId("choice-open-archive-catalog").boundingBox();
  expect(returned!.y).toBeGreaterThanOrEqual(header!.height); expect(returned!.y + returned!.height).toBeLessThanOrEqual(900);
  await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run"));
  await act(page, "open-archive-catalog");
  const reopened = await saved(page); expect(reopened.factions).toEqual(located.factions); expect(reopened.rolls).toEqual(initial.rolls);
  await expect(page.getByTestId("choice-catalog-request-authorization")).toHaveCount(0);
  await expect(page.getByTestId("choice-catalog-request-revision")).toHaveCount(0);
  const returnedProse = await page.getByTestId("scene-text").textContent();
  expect(returnedProse).toContain("none is a retrieved ledger or an authenticated issuing key");
  expect(returnedProse!.length).toBeLessThan(prose!.length);
  await expect(page.getByTestId("archive-catalog")).toContainText("Mara authorized the coolant flush");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.evaluate(() => scrollTo(0, 0)); const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThan(900);
  if (artwork === "none") expect(requests).toEqual([]);
  await act(page, "separate-source-tests"); await expect(page.getByTestId("choice-trace-receipt")).toBeEnabled();
  await expect(page.getByTestId("archive-brief")).toContainText("locator itself supplies no evidence");
});

test("staffed extraction spends once, keeps the existing Edda performance and never upgrades corroboration to authentication", async ({ page }) => {
  await page.addInitScript(installAudioReview, {});
  const audio = (): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
  const requests: string[] = []; page.on("request", request => { if (request.url().includes("/audio/")) requests.push(request.url()); });
  const initial = routeCheckpoint("catalog-paid", "act2_archive_compare");
  await open(page, initial, { sound: true, music: 0, ambience: 0, effects: 70, voices: 70 });
  await act(page, "open-archive-catalog"); await act(page, "catalog-inspect-revision");
  expect(requests.filter(url => /foley-|voice-/.test(url))).toEqual([]);
  await act(page, "catalog-request-revision");
  await expect.poll(async () => (await audio()).started.filter(file => file === "foley-reader.wav").length).toBe(1);
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await act(page, "catalog-buy-extraction");
  const paid = await saved(page); expect(paid.creds).toBe(initial.creds - 25); expect(paid.rolls).toEqual(initial.rolls);
  expect(paid.flags.order_verified).toBe(true); expect(paid.flags.archive_key_authenticated).toBeUndefined();
  expect(paid.flags.edda_public_consent).toBeUndefined(); expect(paid.flags.nia_public_consent).toBeUndefined();
  await expect(page.getByTestId("archive-brief")).toContainText("Staffed extraction received");
  const scene = getScene(paid.sceneId), line = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, paid))[0];
  await page.getByTestId("voice-line").locator("summary").click();
  await page.getByLabel("Dialogue line", { exact: true }).selectOption(line.key);
  await page.getByRole("button", { name: "Listen to Edda", exact: true }).click();
  await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", line.speaker);
  const words = (s: string) => s.match(/[\p{L}\p{N}]+/gu);
  expect(words((await page.getByTestId("spoken-quote").textContent())!)).toEqual(words(line.text));
  await page.getByRole("button", { name: "Stop line", exact: true }).click(); expect(await saved(page)).toEqual(paid);
  await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run")); expect(await saved(page)).toEqual(paid);
  expect(requests.filter(url => url.includes("foley-reader.wav"))).toHaveLength(1);
  await keyboardActivate(page, page.getByTestId("consult-sources"));
  await expect(page.getByTestId("notebook-archive-catalog")).toContainText("Recorded as claim");
  await expect(page.getByTestId("notebook-archive-catalog-extraction")).toContainText("Recorded as fact");
  await page.keyboard.press("Escape"); await act(page, "withhold-technician"); await act(page, "keep-chain");
  expect((await saved(page)).creds).toBe(paid.creds);
});

test("employee billing preserves money and records its additional badge trace without source permission", async ({ page }) => {
  const initial = routeCheckpoint("catalog-badge", "act2_archive_compare"); await open(page, initial); await locate(page);
  const located = await saved(page); await act(page, "catalog-bill-employee");
  const billed = await saved(page); expect(billed.creds).toBe(initial.creds); expect(billed.rolls).toEqual(initial.rolls);
  expect(billed.factions.helion).toBe(Math.min(5, located.factions.helion + 1)); expect(billed.flags.old_badge_traced).toBe(true);
  expect(billed.flags.archive_catalog_badge).toBe(true); expect(billed.flags.archive_key_authenticated).toBeUndefined();
  expect(billed.flags.edda_public_consent).toBeUndefined();
  await expect(page.getByTestId("archive-brief")).toContainText("Billed to your old badge");
  await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run")); expect(await saved(page)).toEqual(billed);
});

test("missing art and explicit paragraph pacing keep canonical words, catalog controls and original methods usable", async ({ page }) => {
  await page.route("**/art/archive-desk*.jpg", route => route.abort());
  const initial = routeCheckpoint("catalog-reader", "act2_archive_compare"); await open(page, initial, { reading: "paragraph" });
  const prose = page.getByTestId("scene-text"); await expect(prose.locator("p")).toHaveCount(1);
  await expect(page.getByTestId("scene-illustration").locator(".art-unavailable")).toBeVisible();
  await locate(page); await expect(prose.locator("p")).toHaveCount(1); await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await act(page, "close-archive-catalog"); await act(page, "separate-source-tests");
  await expect(page.getByTestId("choice-trace-receipt")).toBeEnabled();
  expect((await saved(page)).flags.archive_catalog_located).toBe(true);
});
