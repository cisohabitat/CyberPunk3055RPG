import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import type { GameState } from "../lib/types";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
import { keyboardActivate, keyboardSelect, tabTo } from "../qa/production/keyboard";

const fixture = (sceneId = "memo", extra: Partial<GameState> = {}): GameState => ({ ...createCharacter({ handle: "ExperienceQA", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } }), sceneId, ...extra });
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
const audio = (page: Page) => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
async function setup(page: Page, state: GameState, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ state, preferences }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", artwork: "none", sound: true, autoVoices: false, effects: 0, ...preferences }));
  }, { state, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}

test("experience natural voice completion releases its source and leaves current beds active", async ({ page }) => {
  await setup(page, fixture("stall"));
  await expect.poll(async () => (await audio(page)).liveSources).toBe(2);
  const before = await saved(page), created = (await audio(page)).sourcesCreated;
  await keyboardActivate(page, page.getByRole("button", { name: "Listen to Quill", exact: true }));
  await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
  await expect.poll(async () => (await audio(page)).sourcesCreated).toBe(created + 1);
  await expect(page.getByRole("button", { name: "Listen to Quill", exact: true })).toBeVisible({ timeout: 25_000 });
  const ended = await audio(page);
  expect(ended.liveSources).toBe(2); expect(ended.sourcesDisposed).toBe(1); expect(ended.buffersCleared).toBe(1);
  expect(await saved(page)).toEqual(before);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Sound enabled", { exact: true }).uncheck();
  await expect.poll(async () => (await audio(page)).liveSources).toBe(0);
  const off = await audio(page); expect(off.sourcesDisposed).toBe(off.sourcesCreated); expect(off.buffersCleared).toBe(off.sourcesCreated);
});

test("experience failure of every audio request preserves dialogue, choices and saves", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.route("**/audio/**", route => route.abort()); await setup(page, fixture());
  const before = await saved(page);
  await keyboardActivate(page, page.getByRole("button", { name: "Listen to Mara", exact: true }));
  await expect(page.getByTestId("voice-line")).toContainText("Voice unavailable");
  await expect(page.getByTestId("scene-text")).toContainText("I signed the coolant dump");
  expect(await saved(page)).toEqual(before); expect((await audio(page)).liveSources).toBe(0);
  await keyboardActivate(page, page.getByTestId("choice-heard"));
  expect((await saved(page)).flags.heard_memo).toBe(true);
  expect((await saved(page)).sceneId).toBe("mara_why"); expect(errors).toEqual([]);
});

test("experience narrow largest-text entry works through real Tab order and typing", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 }); await page.goto("/");
  await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
  await keyboardSelect(page, page.getByLabel("Text size", { exact: true }), "2");
  await keyboardSelect(page, page.getByLabel("Contrast", { exact: true }), "high");
  await keyboardSelect(page, page.getByLabel("Artwork", { exact: true }), "none");
  await keyboardActivate(page, page.getByLabel("Number-key choices", { exact: true }));
  await keyboardActivate(page, page.getByRole("button", { name: "Done", exact: true }));
  await keyboardActivate(page, page.getByTestId("new-run"));
  await tabTo(page, page.getByTestId("handle-input")); await page.keyboard.type("KeyboardQA");
  await keyboardActivate(page, page.getByTestId("origin-dustline"));
  await keyboardActivate(page, page.getByTestId("complication-on-file"));
  await keyboardActivate(page, page.getByTestId("plus-ghost"));
  await keyboardActivate(page, page.getByTestId("plus-ghost"));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await keyboardActivate(page, page.getByTestId("start-run"));
  await expect(page.getByTestId("goal")).toBeInViewport();
  await keyboardActivate(page, page.getByTestId("show-rest"));
  await expect(page.locator("#reading-paragraph-1")).toBeFocused();
  await keyboardActivate(page, page.getByTestId("choice-begin-opening"));
  expect((await saved(page)).sceneId).toBe("opening_self");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("experience expanded sources and native dialogs remain usable at phone tablet and desktop widths", async ({ page }) => {
  test.setTimeout(60_000);
  const state = fixture("memory_sequence", { flags: { heard_memo: true, memory_signature: true, memory_order: true, memory_roster: true } });
  await setup(page, state, { sound: false, textStep: 2, contrast: "high", numberShortcuts: false, artwork: "full" });
  const before = await saved(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const summary of await page.getByTestId("memory-workspace").locator("summary").all()) {
      if (!await summary.evaluate(element => (element.parentElement as HTMLDetailsElement).open)) await keyboardActivate(page, summary);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await keyboardActivate(page, page.getByRole("button", { name: "Settings", exact: true }));
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Native dialogs can pass through browser chrome, but must never focus background story.
    for (let index = 0; index < 20; index++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement === document.body || Boolean(document.activeElement?.closest("dialog")))).toBe(true);
    }
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeFocused();
    expect(await saved(page)).toEqual(before);
  }
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
