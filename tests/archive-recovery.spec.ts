import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { createCharacter, commitChoice, getScene, presentChoices } from "../lib/engine";
import { keyboardActivate } from "../qa/production/keyboard";
import type { ReplaySpec } from "../lib/story-replay";
import type { GameState } from "../lib/types";

function checkpoint(route: string, scene: string, next?: string) {
  const spec = JSON.parse(readFileSync(`qa/routes/${route}.json`, "utf8")) as ReplaySpec;
  let state = createCharacter(spec.character);
  for (const entry of spec.steps) {
    if (state.sceneId === scene && (!next || entry.choiceId === next)) return state;
    const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === entry.choiceId && c.enabled)!;
    state = commitChoice(state, choice, choice.check ? { roll: entry.roll! } : undefined).state;
  }
  if (state.sceneId === scene && !next) return state;
  throw new Error(`Missing ${route}/${scene}/${next}`);
}
const saved = (page: Page): Promise<GameState> => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
async function open(page: Page, state: GameState, artwork = "full") {
  await page.addInitScript(({ state, artwork }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "paragraph", artwork, motion: "reduce", contrast: "high", textStep: 2, numberShortcuts: true }));
  }, { state, artwork });
  await page.goto("/"); await keyboardActivate(page, page.getByTestId("continue-run"));
}
async function reveal(page: Page) {
  if (await page.getByTestId("show-rest").count()) await keyboardActivate(page, page.getByTestId("show-rest"));
}
async function choose(page: Page, id: string) {
  await reveal(page); await keyboardActivate(page, page.getByTestId(`choice-${id}`));
}
for (const [width, artwork] of [[320, "none"], [390, "full"], [1440, "full"]] as const) test(`zero-credit archive pause survives reload and returns to the same ledger desk at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const failed = checkpoint("scarce-archive-dustline", "act2_archive_gap", "pause-archive-recovery");
  await open(page, failed, artwork); await reveal(page);
  await expect(page.getByTestId("choice-buy-ledger")).toBeDisabled();
  await choose(page, "pause-archive-recovery");
  const paused = await saved(page);
  expect(paused.creds).toBe(0); expect(paused.strain).toBe(5);
  expect(paused.rolls).toEqual(failed.rolls); expect(paused.factions).toEqual(failed.factions);
  expect(paused.flags.archive_done).toBeUndefined(); expect(paused.flags.archive_paused).toBe(true);
  await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run"));
  expect(await saved(page)).toEqual(paused);
  await reveal(page); await expect(page.getByTestId("choice-trace-order")).toHaveCount(0);
  await keyboardActivate(page, page.getByTestId("objectives").locator("summary"));
  await expect(page.getByTestId("objectives")).toContainText("ledger request is paused");
  await expect(page.getByTestId("objectives")).toContainText("not digital-key authentication");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await choose(page, "resume-archive-recovery"); await reveal(page);
  const returned = await saved(page);
  expect(returned.sceneId).toBe("act2_archive_gap"); expect(returned.rolls).toEqual(failed.rolls);
  await expect(page.getByTestId("scene-text")).toContainText("does not repeat the failed archive roll");
  await expect(page.getByTestId("choice-buy-ledger")).toBeDisabled();
  await keyboardActivate(page, page.getByTestId("consult-sources"));
  await expect(page.getByTestId("notebook-archive-gap")).toContainText("Recorded as claim");
  await expect(page.getByTestId("notebook-verified-order")).toHaveCount(0);
  await page.keyboard.press("Escape"); expect(await saved(page)).toEqual(returned);
  await choose(page, "pause-archive-recovery");
  const again = await saved(page); expect(again.creds).toBe(0); expect(again.rolls).toEqual(failed.rolls);
  expect(again.journal.filter(row => row.id === "archive-gap")).toHaveLength(1);
});
test("earned funding pays once and preserves failed authentication beside ledger corroboration", async ({ page }) => {
  const funded = checkpoint("scarce-archive-dustline", "act2_archive_gap", "buy-ledger");
  await open(page, funded); await choose(page, "buy-ledger");
  const bought = await saved(page); expect(bought.creds).toBe(funded.creds - 25);
  expect(bought.sceneId).toBe("act2_archive_custody"); expect(bought.flags.archive_paused).toBeUndefined();
  expect(bought.flags.archive_flagged).toBe(true); expect(bought.flags.archive_key_authenticated).toBeUndefined();
  await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run")); expect(await saved(page)).toEqual(bought);
  await choose(page, "withhold-technician"); await choose(page, "keep-chain"); await reveal(page);
  const done = await saved(page); expect(done.creds).toBe(bought.creds); expect(done.rolls).toEqual(funded.rolls);
  expect(done.flags.order_verified).toBe(true); expect(done.flags.archive_key_authenticated).toBeUndefined();
  expect(done.flags.edda_public_consent).toBeUndefined(); expect(done.flags.nia_public_consent).toBeUndefined();
  expect(done.journal.find(row => row.id === "archive-gap")?.kind).toBe("claim");
  expect(done.journal.find(row => row.id === "verified-order")?.kind).toBe("fact");
  await expect(page.getByTestId("choice-resume-archive-recovery")).toHaveCount(0);
});
test("closing a resumed search removes the retry and retains an unresolved commitment", async ({ page }) => {
  await open(page, checkpoint("scarce-archive-closed", "act2_archive_gap", "keep-gap"));
  await choose(page, "keep-gap"); await reveal(page);
  const closed = await saved(page); expect(closed.flags.archive_unresolved).toBe(true);
  expect(closed.flags.archive_done).toBe(true); expect(closed.flags.archive_paused).toBeUndefined();
  await expect(page.getByTestId("choice-resume-archive-recovery")).toHaveCount(0);
  await expect(page.getByTestId("choice-trace-order")).toHaveCount(0);
  await keyboardActivate(page, page.getByTestId("objectives").locator("summary"));
  await expect(page.getByTestId("objectives")).toContainText("gap is recorded, not repaired");
});
test("a week left with the search paused reveals no recovered ledger in the finale", async ({ page }) => {
  await open(page, checkpoint("scarce-archive-open", "ending_quiet"), "none"); await reveal(page);
  await keyboardActivate(page, page.getByTestId("aftermath-details").locator("summary"));
  await expect(page.getByTestId("aftermath-details")).toContainText("No ledger was retrieved");
  const state = await saved(page); expect(state.flags.archive_paused).toBe(true);
  expect(state.flags.order_verified).toBeUndefined(); expect(state.flags.archive_key_authenticated).toBeUndefined();
  expect(state.flags.witness_safe).toBeUndefined(); expect(state.flags.nia_public_consent).toBeUndefined();
});
