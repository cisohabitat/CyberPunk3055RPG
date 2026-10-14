import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CAST } from "../lib/story/cast";
import { createCharacter, getScene, sceneText } from "../lib/engine";
import { CAST_PORTRAIT_VARIANTS } from "../lib/art";
import { visibleCampaignDialogue } from "../lib/campaign-dialogue";
import { dialogueExamples } from "../qa/production/dialogue-examples";
import { installAudioReview } from "../qa/production/audio-review";
import type { GameState } from "../lib/types";
const base = createCharacter({ handle: "Portrait review", givenName: "Jo", origin: "dustline", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    if (sessionStorage.getItem("cast-review-seeded")) return;
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", sound: true, autoVoices: false, music: 0, ambience: 0, effects: 0, motion: "reduce", ...preferences }));
    sessionStorage.setItem("cast-review-seeded", "true");
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
async function sheet(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) <= 1100) await page.getByRole("button", { name: "Sheet", exact: true }).click();
  return page.getByTestId("sheet");
}

for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  test(`all fifteen character cards preserve identity, saves and readable layout at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    const requests: string[] = []; page.on("request", request => { if (request.url().includes("/art/cast-")) requests.push(request.url()); });
    const state = { ...base, sceneId: "front", items: [...base.items, "counterfeit-pass"], flags: Object.fromEntries(CAST.map(person => [person.metFlag, true])) };
    await open(page, state, { artwork, textStep: 2, contrast: "high" });
    const before = await saved(page);
    const panel = await sheet(page);
    await expect(panel.locator(".cast-portrait")).toHaveCount(0); expect(requests).toEqual([]);
    const people = panel.locator(".cast-roster > summary"); await people.focus(); await page.keyboard.press("Enter");
    await expect(panel.locator(".cast-card")).toHaveCount(15);
    for (const person of CAST) {
      const card = panel.locator(`.cast-card[data-speaker="${person.speaker}"]`);
      await expect(card).toContainText(person.name); await expect(card).toContainText(person.role);
      if (artwork === "full") {
        await card.scrollIntoViewIfNeeded();
        await expect(card.locator("img")).toHaveAttribute("src", person.thumbnail);
        expect(await card.locator("img").evaluate((image: HTMLImageElement) => image.decode().then(() => image.naturalWidth))).toBe(160);
      } else await expect(card.locator("img")).toHaveCount(0);
    }
    if (artwork === "none") expect(requests).toEqual([]);
    expect(await saved(page)).toBe(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`cast-${width}.png`), fullPage: true });
  });
}

test("paragraph reading reveals the attributed supporting actor and remembers them after departure", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, { ...base, sceneId: "opening_approach" }, { reading: "paragraph" });
  let panel = await sheet(page); await panel.locator(".cast-roster > summary").click();
  await expect(panel.locator('.cast-card[data-speaker="Stallholder"]')).toHaveCount(0);
  await panel.getByRole("button", { name: "Close sheet", exact: true }).click();
  await page.getByTestId("show-rest").click();
  panel = await sheet(page);
  if (!await panel.locator(".cast-roster").evaluate(details => details.hasAttribute("open"))) await panel.locator(".cast-roster > summary").click();
  await expect(panel.locator('.cast-card[data-speaker="Stallholder"]')).toBeVisible();
  await expect(panel.locator('.cast-card[data-speaker="Mara"]')).toHaveCount(0);
  await panel.getByRole("button", { name: "Close sheet", exact: true }).click();
  await page.getByTestId("choice-meet-quill").click();
  expect(JSON.parse((await saved(page))!).flags.met_stallholder).toBe(true);
  await page.reload(); await page.getByTestId("continue-run").click();
  panel = await sheet(page); await panel.locator(".cast-roster > summary").click();
  await expect(panel.locator('.cast-card[data-speaker="Stallholder"]')).toBeVisible();
});

test("an unavailable character thumbnail keeps the name and history readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/art/cast-quill.jpg", route => route.abort());
  await open(page, { ...base, sceneId: "stall", flags: { quill_refused: true } });
  const panel = await sheet(page); await panel.locator(".cast-roster > summary").click();
  const card = panel.locator('.cast-card[data-speaker="Quill"]');
  await expect(card.locator(".cast-placeholder")).toBeVisible(); await expect(card).toContainText("Quill");
  await expect(panel.locator("#tab-stats")).toBeVisible();
});

const examples = [...dialogueExamples().values()];
for (const row of CAST_PORTRAIT_VARIANTS) {
  test(`${row.speaker}'s new expression follows their exact audible quotation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const example = examples.find(({ state }) => (row.scenes as readonly string[]).includes(state.sceneId)
      && visibleCampaignDialogue(state.sceneId, getScene(state.sceneId).speaker, sceneText(getScene(state.sceneId), state)).some(line => line.speaker === row.speaker));
    expect(example, row.speaker).toBeTruthy();
    const state = example!.state, scene = getScene(state.sceneId);
    const line = visibleCampaignDialogue(scene.id, scene.speaker, sceneText(scene, state)).find(line => line.speaker === row.speaker)!;
    await open(page, state); const before = await saved(page);
    await page.getByTestId("voice-line").locator("summary").click();
    if (await page.getByLabel("Dialogue line", { exact: true }).count()) await page.getByLabel("Dialogue line", { exact: true }).selectOption(line.key);
    await page.getByTestId("voice-line").getByRole("button", { name: /^Listen to / }).click();
    await expect(page.getByTestId("spoken-quote")).toHaveAttribute("data-speaker", row.speaker);
    await expect(page.locator(".scene-row img.portrait")).toHaveAttribute("src", row.asset);
    expect(await page.locator(".scene-row img.portrait").evaluate((image: HTMLImageElement) => image.decode().then(() => image.naturalWidth))).toBe(600);
    await expect(page.getByTestId("goal")).toBeVisible();
    await page.getByRole("button", { name: "Stop line", exact: true }).click();
    expect(await saved(page)).toBe(before);
  });
}
