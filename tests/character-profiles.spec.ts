import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CAST } from "../lib/story/cast";
import { PORTRAIT_ART } from "../lib/art";
import { createCharacter, commitChoice, getScene } from "../lib/engine";
import { CHARACTER_PROFILES } from "../lib/character-profiles";
import type { GameState } from "../lib/types";

const base = createCharacter({ handle: "Profile review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 0, nerve: 2, face: 0, ghost: 0 } });
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(({ state, preferences }) => {
    if (sessionStorage.getItem("profiles-seeded")) return;
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", sound: false, motion: "reduce", ...preferences }));
    sessionStorage.setItem("profiles-seeded", "true");
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
async function people(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) <= 1100) await page.getByRole("button", { name: "Sheet", exact: true }).click();
  const panel = page.getByTestId("sheet");
  await panel.locator(".cast-roster > summary").click();
  return panel;
}

for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  test(`all fifteen earned profiles open by keyboard without changing the run at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    const largeRequests: string[] = [], largeAssets = new Set(Object.values(PORTRAIT_ART));
    page.on("request", request => { if (largeAssets.has(new URL(request.url()).pathname)) largeRequests.push(request.url()); });
    const state = { ...base, flags: Object.fromEntries(CAST.map(person => [person.metFlag, true])) };
    await open(page, state, { artwork, textStep: 2, contrast: "high" });
    // The current scene can already request Quill. Measure only requests added
    // by People, so ordinary scene art is not mistaken for profile loading.
    await page.waitForLoadState("networkidle");
    const before = await saved(page), priorRequests = [...largeRequests], panel = await people(page);
    await expect(panel.locator(".cast-profile-portrait")).toHaveCount(0); expect(largeRequests).toEqual(priorRequests);
    for (const person of CAST) {
      const card = panel.locator(`.cast-card[data-speaker="${person.speaker}"]`);
      const about = card.getByText(`About ${person.name}`, { exact: true });
      await about.focus(); await page.keyboard.press("Enter");
      await expect(card.getByTestId("character-profile")).toContainText(CHARACTER_PROFILES[person.speaker].introduction);
      if (artwork === "full") {
        const image = card.locator(".cast-profile-portrait");
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute("src", PORTRAIT_ART[person.speaker]);
        expect(await image.evaluate((image: HTMLImageElement) => image.decode().then(() => image.naturalWidth))).toBeGreaterThan(300);
        expect((await image.boundingBox())!.width).toBeGreaterThan(120);
      } else await expect(card.locator("img")).toHaveCount(0);
      if (person.speaker === "Quill") await page.screenshot({ path: test.info().outputPath(`profile-${width}.png`), fullPage: true });
      expect(await saved(page)).toBe(before);
      await about.focus(); await page.keyboard.press("Enter");
      await expect(card.getByTestId("character-profile")).toHaveCount(0);
    }
    if (artwork === "none") expect(largeRequests).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    if (width <= 1100) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Sheet", exact: true })).toBeFocused();
    }
    await expect(page.getByTestId("goal")).toBeVisible();
  });
}

test("profile notes retain Nia's contact refusal, permissions and promises without creating new facts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const initial = { ...base, sceneId: "act3_nia_contact", flags: { met_nia: true, witness_safe: true } };
  const state = commitChoice(initial, getScene(initial.sceneId).choices.find(choice => choice.id === "give-nia-space")!).state;
  await open(page, state, { artwork: "none" });
  const before = await saved(page), panel = await people(page);
  const card = panel.locator('.cast-card[data-speaker="Nia Pell"]');
  await card.getByText("About Nia Pell", { exact: true }).click();
  await card.getByText("Encounter notes · 1", { exact: true }).click();
  await expect(card).toContainText(state.journal.find(entry => entry.id === "nia-contact")!.text);
  await expect(card).toContainText("pause further questions");
  await expect(card).toContainText("No public quotation permission is recorded");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("1"); expect(await saved(page)).toBe(before);
  await page.keyboard.press("Escape"); await page.reload(); await page.getByTestId("continue-run").click();
  expect(await saved(page)).toBe(before);
});

test("a missing large portrait preserves the biography, notes and sheet keyboard controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/art/quill.jpg", route => route.abort());
  await open(page, base);
  const before = await saved(page), panel = await people(page);
  const card = panel.locator('.cast-card[data-speaker="Quill"]');
  await card.getByText("About Quill", { exact: true }).click();
  await expect(card.locator(".cast-profile-portrait")).toHaveCount(0);
  await expect(card.getByTestId("character-profile")).toContainText(CHARACTER_PROFILES.Quill.introduction);
  await expect(card.locator(".cast-portrait")).toBeVisible();
  await page.keyboard.press("Escape"); expect(await saved(page)).toBe(before);
  await expect(page.getByRole("button", { name: "Sheet", exact: true })).toBeFocused();
});

test("partial reading keeps undisclosed supporting profiles hidden", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, { ...base, sceneId: "opening_approach" }, { reading: "paragraph", artwork: "none" });
  let panel = await people(page);
  await expect(panel.getByText("About Stallholder", { exact: true })).toHaveCount(0);
  await expect(panel.getByText("About Mara Voss", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape"); await page.getByTestId("show-rest").click();
  await page.getByRole("button", { name: "Sheet", exact: true }).click(); panel = page.getByTestId("sheet");
  if (!await panel.locator(".cast-roster").evaluate(details => details.hasAttribute("open"))) await panel.locator(".cast-roster > summary").click();
  await panel.getByText("About Stallholder", { exact: true }).click();
  await expect(panel.getByTestId("character-profile")).toContainText(CHARACTER_PROFILES.Stallholder.introduction);
  await expect(panel.getByText("About Mara Voss", { exact: true })).toHaveCount(0);
});
