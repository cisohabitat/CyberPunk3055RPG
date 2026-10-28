import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { canalThreads } from "../lib/canal-threads";
import { commitChoice, getScene, presentChoices, sceneText } from "../lib/engine";
import { keyboardActivate } from "../qa/production/keyboard";
import type { GameState } from "../lib/types";

async function openCanal(page: Page, state: GameState, width: number, artwork: string, preferences: { reading?: "paragraph"; numberShortcuts?: boolean } = {}) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, artwork, preferences }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    if (!localStorage.getItem("saint-shard-preferences")) localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", artwork, sound: false, textStep: 2, contrast: "high", motion: "reduce", ...preferences }));
  }, { state, artwork, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

test("canal navigation keeps paragraph pacing and original number-key choices", async ({ page }) => {
  const state = routeCheckpoint("integration-names", "act2_middle", "protect-witness");
  const choices = presentChoices(state, getScene(state.sceneId)), choice = choices[0];
  expect(choice.enabled).toBe(true); expect(choice.check).toBeUndefined();
  await openCanal(page, state, 390, "full", { reading: "paragraph", numberShortcuts: true });
  const saved = () => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  const before = await saved();
  await expect(page.getByTestId("scene-text").locator("p")).toHaveCount(1);
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
  await keyboardActivate(page, page.getByTestId("canal-threads").locator(":scope > summary"));
  await keyboardActivate(page, page.getByTestId(`find-thread-${choice.id}`));
  await expect(page.getByTestId(`choice-${choice.id}`)).toBeFocused();
  await expect(page.getByTestId("scene-text").locator("p")).toHaveCount(1);
  expect(await saved()).toBe(before);
  await page.keyboard.press("1");
  await expect.poll(() => saved().then(raw => JSON.parse(raw!))).toEqual(commitChoice(state, choice).state);
});

const profiles = [
  { route: "integration-names", choice: "protect-witness" },
  { route: "witness-known-room", choice: "protect-witness" },
  { route: "mara-account/sold-owned", choice: "hear-mara-response" },
];
for (const profile of profiles) for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  test(`canal threads preserve choices and history: ${profile.route} at ${width}px`, async ({ page }, info) => {
    const state = routeCheckpoint(profile.route, "act2_middle", profile.choice), choices = presentChoices(state, getScene(state.sceneId));
    const groups = canalThreads(state.sceneId, choices);
    const images: string[] = []; page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/art/")) images.push(request.url()); });
    const saved = () => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), codex: localStorage.getItem("saint-shard-codex"), preferences: localStorage.getItem("saint-shard-preferences") }));
    await openCanal(page, state, width, artwork);
    const before = await saved(), guide = page.getByTestId("canal-threads"), history = page.getByTestId("canal-history");
    await expect(guide).not.toHaveAttribute("open", "");
    expect(await page.getByTestId("scene-text").locator("p").allTextContents()).toEqual(sceneText(getScene(state.sceneId), state).split(/\n\n+/));
    const buttons = page.locator('#choices > button[data-testid^="choice-"]');
    expect(await buttons.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-testid")))).toEqual(choices.map(choice => `choice-${choice.id}`));
    for (const choice of choices) {
      const button = page.getByTestId(`choice-${choice.id}`);
      await expect(button.locator(".label")).toHaveText(choice.label);
      if (choice.enabled) await expect(button).toBeEnabled();
      else await expect(button).toBeDisabled();
      if (choice.disabledReason) await expect(button).toContainText(choice.disabledReason);
      else if (choice.detail) await expect(button).toContainText(choice.detail);
    }
    expect(await history.evaluate(node => !!(document.getElementById("choices")!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    await keyboardActivate(page, guide.locator(":scope > summary"));
    expect(await guide.locator("a").count()).toBe(groups.reduce((count, row) => count + row.choices.length, 0));
    for (const group of groups) {
      await expect(guide.getByRole("heading", { name: group.title, exact: true })).toBeVisible();
    }
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await keyboardActivate(page, guide.locator(":scope > summary"));
    const thread = history.getByTestId("campaign-thread");
    if (await thread.count()) { await keyboardActivate(page, thread.locator(":scope > summary")); expect(await saved()).toEqual(before); await keyboardActivate(page, thread.locator(":scope > summary")); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (artwork === "none") { await expect(page.locator("img")).toHaveCount(0); expect(images).toEqual([]); }
    await page.reload(); await page.getByTestId("continue-run").click();
    await expect(guide).not.toHaveAttribute("open", ""); expect(await saved()).toEqual(before);
    await page.screenshot({ path: info.outputPath(`canal-threads-${width}.png`), fullPage: true });
    // The guide grants no action: only selecting the existing button commits it.
    const choice = choices.find(choice => choice.id === profile.choice)!;
    await keyboardActivate(page, page.getByTestId(`choice-${choice.id}`));
    const expected = commitChoice(state, choice).state;
    await expect.poll(() => saved().then(row => JSON.parse(row.run!))).toEqual(expected);
    await expect(page.getByTestId("canal-threads")).toHaveCount(0);
  });
  const checkpoint = routeCheckpoint(profile.route, "act2_middle", profile.choice);
  for (const group of canalThreads(checkpoint.sceneId, presentChoices(checkpoint, getScene(checkpoint.sceneId)))) {
    test(`canal ${group.id} links only review work: ${profile.route} at ${width}px`, async ({ page }) => {
      await openCanal(page, checkpoint, width, artwork);
      const saved = () => page.evaluate(() => ({ run: localStorage.getItem("saint-shard-3055-v1"), codex: localStorage.getItem("saint-shard-codex"), preferences: localStorage.getItem("saint-shard-preferences") }));
      const before = await saved();
      await keyboardActivate(page, page.getByTestId("canal-threads").locator(":scope > summary"));
      for (const choice of group.choices) {
        await keyboardActivate(page, page.getByTestId(`find-thread-${choice.id}`));
        await expect(page.getByTestId(`choice-${choice.id}`)).toBeFocused();
        await expect(page.getByTestId(`choice-${choice.id}`)).toBeInViewport();
        expect(await saved()).toEqual(before);
      }
    });
  }
}
