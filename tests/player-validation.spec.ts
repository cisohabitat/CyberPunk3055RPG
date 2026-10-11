import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import type { GameState } from "../lib/types";

const base = (sceneId: string, extra: Partial<GameState> = {}): GameState => ({ ...createCharacter({ handle: "Validation", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId, ...extra });
async function open(page: Page, state: GameState, none = false) {
  await page.addInitScript(({ state, none }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", artwork: none ? "none" : "full", textStep: none ? 2 : 0, contrast: none ? "high" : "standard" }));
    localStorage.setItem("saint-shard-sound", "off");
  }, { state, none });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
const stored = (page: Page): Promise<GameState> => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));

for (const width of [320, 390, 1440]) test(`validation effective faction previews match outcomes at ${width}px`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
  const factions = { ...base("act3_arrival").factions, wards: -2, helion: 5 };
  await open(page, base("act3_arrival", { factions, flags: { on_file: true, act2_deal: true } }), width === 320);
  const choice = page.getByTestId("choice-let-ives");
  await expect(choice).toContainText("The wards -1"); await expect(choice).toContainText("Helion unchanged (at limit)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThan(width < 700 ? 844 : 900);
  await choice.click(); expect((await stored(page)).factions).toEqual({ ...factions, wards: -3 });
  await page.reload(); await page.getByTestId("continue-run").click(); expect((await stored(page)).factions.wards).toBe(-3);
  await expect(page.getByTestId("aftermath-details")).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("validation Chapel modifier and exhausted objective survive a pending reload", async ({ page }) => {
  await open(page, base("chapel_window_plan", { strain: 0, creds: 0, flags: { chapel_window_started: true, chapel_window_3: true } }));
  await expect(page.getByTestId("goal")).toContainText("3 opportunities");
  await page.evaluate(() => { Math.random = () => 0; });
  await page.getByTestId("choice-window-inspect-reader").click(); await page.getByTestId("roll-button").click(); await page.getByTestId("continue-check").click();
  await page.getByTestId("choice-window-scout-gap").click();
  await expect(page.getByTestId("goal")).toContainText("1 opportunity");
  await page.getByTestId("choice-window-use-gap").click();
  await expect(page.locator(".math li").filter({ hasText: "Query noticed" })).toHaveText("Query noticed-1");
  await expect(page.locator(".math li").filter({ hasText: "Scouted patrol" })).toHaveText("Scouted patrol+2");
  await page.evaluate(() => { Math.random = () => 0.75; });
  await page.getByTestId("roll-button").click(); await expect(page.getByTestId("continue-check")).toBeVisible();
  const pending = await stored(page); expect(pending.pendingCheck?.roll).toBe(8);
  await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("goal")).toContainText("0 opportunities left. Use the staffed stair");
  await expect(page.getByTestId("goal")).not.toContainText("Save one");
  await expect(page.getByTestId("choice-window-quiet-exit")).toHaveCount(0);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("goal")).toContainText("staffed stair");
  await page.getByTestId("choice-window-staffed-exit").click();
  const done = await stored(page); expect(done.sceneId).toBe("undercroft"); expect(done.creds).toBe(0); expect(done.flags.watched).toBe(true);
  expect(done.rolls).toHaveLength(2); expect(done.pendingCheck).toBeUndefined();
});

const witness = () => base("act3_nia_contact", { flags: { witness_safe: true, witness_consent: true, order_verified: true, testimony_source: true }, journal: [{ id: "nia-account", text: "Approved private recording.", kind: "fact" }] });
for (const finish of ["file-public-account", "withdraw-public-account"]) test(`validation paused contact stays private through ${finish}`, async ({ page }) => {
  await open(page, witness()); await page.getByTestId("choice-give-nia-space").click();
  const paused = await stored(page);
  await page.evaluate(s => localStorage.setItem("saint-shard-3055-v1", JSON.stringify({ ...s, sceneId: "act3_testimony_consent" })), paused);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText("A hearing isn't an exception");
  await expect(page.getByTestId("choice-ask-public-permission")).toHaveCount(0);
  await expect(page.getByTestId("testimony-brief")).toContainText("Contact is paused");
  await page.getByTestId("choice-keep-recording-private").click(); await page.getByTestId("choice-answer-corroboration").click(); await page.getByTestId(`choice-${finish}`).click();
  await page.getByTestId("choice-leave-wall").click();
  await page.getByTestId("aftermath-details").locator("summary").focus(); await page.keyboard.press("Enter");
  await page.reload(); await page.getByTestId("continue-run").click();
  const done = await stored(page); expect(done.flags.nia_contact_paused).toBe(true); expect(done.flags.witness_consent).toBe(true); expect(done.flags.nia_public_consent).toBeUndefined();
  expect(done.journal.find(j => j.id === "nia-account")?.text).toBe("Approved private recording.");
  expect(done.flags.testimony_published).toBe(finish === "file-public-account" ? true : undefined);
});
test("validation old paused-contact reply preserves explicit consent without reopening contact", async ({ page }) => {
  const s = witness(); await open(page, { ...s, sceneId: "act3_testimony_nia", flags: { ...s.flags, nia_contact_paused: true } });
  await expect(page.getByTestId("scene-text")).toContainText("doesn't reopen contact");
  await page.getByTestId("choice-accept-public-permission").click(); await page.getByTestId("choice-answer-corroboration").click(); await page.getByTestId("choice-file-public-account").click();
  const done = await stored(page); expect(done.flags.nia_contact_paused).toBe(true); expect(done.flags.nia_public_consent).toBe(true);
});
