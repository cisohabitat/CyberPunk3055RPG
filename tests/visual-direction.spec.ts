import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "../lib/engine";
import { SCENES } from "../lib/story";
import { choicePresentation, DISTRICT_PRESENTATIONS, sceneDistrict } from "../lib/visual-presentation";
import { notebookSources } from "../lib/investigation-notebook";
import { sourceReadiness } from "../lib/source-ledger";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import type { GameState } from "../lib/types";
import { portraitArt, sceneIllustration } from "../lib/art";

const base = createCharacter({ handle: "VisualDirection", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, autoVoices: false, artwork: "full", reading: "all", motion: "reduce", numberShortcuts: true, ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click(); await page.evaluate(() => document.fonts.ready);
}
for (const width of [390, 768, 1440]) test(`regular scene introduction and caption form a compact group at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = { ...base, sceneId: "act2_spire_sources", flags: { spire_consent: true } }; await open(page, state); const before = await saved(page);
  const scene = page.getByTestId("scene"), header = scene.locator('.scene-row[data-composition="reading"]');
  const identity = (await header.locator(".portrait-frame").boundingBox())!, location = (await header.locator(".kicker").boundingBox())!;
  if (width > 700) expect(location.x).toBeGreaterThanOrEqual(identity.x + identity.width);
  const figure = page.getByTestId("scene-illustration"); await expect(figure.locator(".progressive-art")).toHaveAttribute("data-ready", "true");
  const painting = (await figure.locator("img").boundingBox())!, button = (await figure.getByRole("button").boundingBox())!;
  expect(painting.width / painting.height).toBeCloseTo(1.5, 2);
  expect(button.x - painting.x - painting.width).toBeLessThan(40); expect(button.height).toBeGreaterThanOrEqual(44);
  if (width === 390) expect((await page.getByTestId("scene-text").locator("p").first().boundingBox())!.y).toBeLessThan(720);
  expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(sceneText(getScene(state.sceneId), state).split(/\n\n+/).filter(Boolean));
  await figure.getByRole("button").click(); await expect(page.getByRole("dialog").locator(".artwork-canvas img")).toHaveAttribute("src", "/art/edda-service-review.jpg"); await page.keyboard.press("Escape");
  expect(await saved(page)).toBe(before); expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

for (const width of [390, 1440, 320]) test(`all place identities retain readable prose and optional artwork at ${width}px`, async ({ browser, baseURL }) => {
  test.setTimeout(90_000); const tones = new Set<string>();
  for (const id of Object.keys(DISTRICT_PRESENTATIONS)) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage(), art: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) art.push(r.url()); });
      const scene = Object.values(SCENES).find(s => sceneDistrict(s.id) === id)!, state = { ...base, sceneId: scene.id };
      await open(page, state, { artwork: width === 320 ? "none" : "full", contrast: width === 320 ? "high" : "standard", textStep: width === 320 ? 2 : 0 });
      await expect(page.getByTestId("scene")).toHaveAttribute("data-district", id); await expect(page.locator(".district-emblem svg")).toHaveCount(1);
      tones.add(await page.getByTestId("scene").evaluate(el => getComputedStyle(el).getPropertyValue("--district-tone").trim()));
      const goal = (await page.getByTestId("goal").boundingBox())!; expect(goal.y + goal.height).toBeLessThan(900);
      expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(sceneText(scene, state).split(/\n\n+/).filter(Boolean));
      if (width === 320) expect(art).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); expect(JSON.parse((await saved(page))!)).toEqual(state);
    } finally { await context.close(); }
  }
  expect(tones.size).toBe(8);
});

for (const width of [390, 1440, 320]) test(`choice markers preserve canonical labels, disabled reasons, keyboard activation and checks at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = { ...base, sceneId: "route", creds: 0 }, choices = presentChoices(state, getScene(state.sceneId));
  await open(page, state, { artwork: "none", textStep: width === 320 ? 2 : 0 }); const before = await saved(page);
  for (const choice of choices) {
    const button = page.getByTestId(`choice-${choice.id}`); await expect(button).toHaveAttribute("data-choice-kind", choicePresentation(state.sceneId, choice).kind);
    await expect(button.locator(".label")).toHaveText(choice.label);
    if (!choice.enabled) { await expect(button).toBeDisabled(); await expect(button).toContainText(choice.disabledReason!); }
  }
  const choice = choices.find(c => c.enabled && !c.check)!, button = page.getByTestId(`choice-${choice.id}`);
  await page.keyboard.press("Tab"); await button.focus(); await expect(button).toBeFocused(); expect(await button.evaluate(el => getComputedStyle(el).outlineWidth)).toBe("3px");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); expect(await saved(page)).toBe(before);
  await page.keyboard.press("Enter"); expect(JSON.parse((await saved(page))!)).toEqual(commitChoice(state, choice).state);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [390, 1440, 320]) test(`document treatments preserve acquired source words, metadata and authority limits at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); const state = routeCheckpoint("memory-timeline-bounded", "act3_testimony_hearing");
  await open(page, state, { artwork: "none", textStep: width === 320 ? 2 : 0, contrast: width === 320 ? "high" : "standard" }); const before = await saved(page);
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) requests.push(r.url()); });
  await page.getByTestId("consult-sources").click();
  const dialog = page.getByRole("dialog", { name: "Investigation notebook" });
  for (const record of notebookSources(state)) {
    const card = page.getByTestId(`notebook-${record.id}`); await expect(card).toHaveAttribute("data-source-group", record.group);
    await expect(card.locator(".document-text")).toHaveText(record.text); await expect(card.locator(".record-stamp")).toHaveText(`Recorded as ${record.kind}`);
    if (record.time) { await expect(card.locator(".notebook-provenance")).toContainText(record.time); await expect(card.locator(".notebook-provenance")).toContainText(record.provenance!); }
  }
  const limits = sourceReadiness(state); await expect(dialog).toContainText(limits.cancellation); await expect(dialog).toContainText(limits.quotation);
  await dialog.getByRole("searchbox").fill("not-an-acquired-source"); await expect(dialog.getByTestId("notebook-empty")).toBeVisible();
  await dialog.getByRole("button", { name: "Show all records" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.keyboard.press("Escape"); await expect(page.getByTestId("consult-sources")).toBeFocused(); expect(requests).toEqual([]); expect(await saved(page)).toBe(before);
});

for (const contrast of ["standard", "high"]) test(`older portrait display finish preserves identity and honors ${contrast} contrast`, async ({ page }) => {
  const scene = Object.values(SCENES).find(scene => scene.speaker === "Mara" && portraitArt(scene.speaker, scene.id) === "/art/mara.jpg" && sceneIllustration(scene.id))!;
  expect(scene).toBeDefined();
  await page.setViewportSize({ width: 1440, height: 900 }); await open(page, { ...base, sceneId: scene.id }, { contrast }); const before = await saved(page);
  const portrait = page.locator(".scene-row .portrait-frame"); await expect(portrait).toHaveAttribute("data-finish", "legacy-paint");
  await expect(portrait.locator("img")).toHaveAttribute("src", "/art/mara.jpg");
  expect(await portrait.locator("img").evaluate(el => getComputedStyle(el).filter)).toBe(contrast === "high" ? "none" : "brightness(1.07) contrast(0.95)");
  await page.getByTestId("scene-illustration").getByRole("button").click();
  expect(await page.getByRole("dialog").locator(".artwork-canvas img").evaluate(el => getComputedStyle(el).filter)).toBe("none");
  await page.keyboard.press("Escape"); expect(await saved(page)).toBe(before);
});

for (const width of [390, 1440]) test(`pointer feedback distinguishes hovering, pressing and an unavailable choice at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const state = { ...base, sceneId: "route", creds: 0 }, choices = presentChoices(state, getScene(state.sceneId));
  await open(page, state, { artwork: "none" }); const before = await saved(page);
  const disabled = choices.find(choice => !choice.enabled)!;
  await expect(page.getByTestId(`choice-${disabled.id}`)).toBeDisabled();
  expect(await page.getByTestId(`choice-${disabled.id}`).evaluate(el => getComputedStyle(el).borderTopStyle)).toBe("dashed");
  const choice = choices.find(choice => choice.enabled && !choice.check)!, button = page.getByTestId(`choice-${choice.id}`);
  await button.hover(); expect(await button.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(25, 29, 38)");
  try {
    await page.mouse.down(); expect(await button.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(36, 42, 53)");
    await page.mouse.move(1, 1);
  } finally { await page.mouse.up(); }
  expect(await saved(page)).toBe(before);
});
