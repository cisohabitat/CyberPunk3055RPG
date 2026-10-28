import { test, expect } from "@playwright/test";
import { createCharacter } from "../lib/engine";
import { fixture, openRun } from "./fixtures/game";

for (const [origin, context] of [["gutterwire", "dry place to sleep"], ["spire", "build a life without it"], ["dustline", "next crossing"]] as const) test(`skipped ${origin} opening retains practical context without accepting the job`, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", textStep: 2, contrast: "high" })));
  const run = createCharacter({ handle: "Clarity", givenName: "Ada", origin, complication: "on-file", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 }, startWithPrologue: true });
  await openRun(page, run);
  await page.getByTestId("choice-skip-opening").click();
  await expect(page.getByTestId("scene-text")).toContainText(context);
  const goal = await page.getByTestId("goal").boundingBox();
  expect(goal!.y).toBeGreaterThanOrEqual(0); expect(goal!.y + goal!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText(context);
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(restored.flags.opening_skipped).toBe(true); expect(restored.flags.hired).toBeUndefined();
  expect(restored.creds).toBe(run.creds); expect(restored.journal).toEqual(run.journal);
  for (const flag of ["opening_survival", "opening_identity", "opening_exit"]) expect(restored.flags[flag]).toBeUndefined();
  await page.getByTestId("choice-ask-owner").click(); await page.getByTestId("choice-back-to-offer").click();
  await expect(page.getByTestId("scene-text")).not.toContainText(context);
  await page.getByTestId("choice-accept").click();
  const accepted = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(accepted.creds).toBe(run.creds + 50); expect(accepted.flags.hired).toBe(true);
});

for (const [sceneId, choice, price] of [["act2_middle", "deal", "eighty"], ["act2_folio", "cheap-deal", "forty"]] as const) test(`${price}-creds silence deal survives the chapter card and finale reload`, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", artwork: "none", textStep: 2, contrast: "high" })));
  const run = { ...createCharacter({ handle: "Clarity", givenName: "Ada", origin: "spire", complication: "on-file", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId };
  await openRun(page, run);
  await page.getByTestId(`choice-${choice}`).click(); await page.getByTestId("choice-back-to-board").click();
  await expect(page.getByTestId("scene-text")).toContainText(`${price}-creds offer for a week of silence`);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText(`${price}-creds offer for a week of silence`);
  for (const id of ["to-the-wall", "to-ward-nine", "face-sera", "leave-wall"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("finale-history").locator("summary").click();
  await expect(page.getByTestId("night-retell").nth(1)).toContainText(`${price}-creds offer for a week of silence`);
  const final = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(final.sceneId).toBe("ending_quiet"); expect(final.creds).toBe(run.creds + (price === "forty" ? 40 : 80));
  for (const flag of ["order_verified", "archive_key_authenticated", "witness_safe", "nia_public_consent", "testimony_published"]) expect(final.flags[flag]).toBeUndefined();
});

test("later copy success replaces failed-copy prose across a saved check", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", artwork: "none" }));
  });
  const run = { ...createCharacter({ handle: "Continuity", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 }, complication: "optic" }), sceneId: "vault_quiet", flags: { quiet: true, pact_copy: true }, items: ["spoof-chip"] };
  await openRun(page, run);
  await page.getByTestId("choice-copy").click(); await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("continue-check")).toBeVisible();
  await expect(page.locator(".total")).toContainText("9");
  await page.getByTestId("continue-check").click();
  await page.getByTestId("choice-heard").click(); await page.getByTestId("choice-why-signed").click();
  await page.evaluate(() => { Math.random = () => 0.3; });
  await page.getByTestId("choice-copy-hot").click(); await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("continue-check")).toBeVisible();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.locator(".total")).toContainText("12");
  await expect(page.getByTestId("roll-button")).toHaveCount(0);
  await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("scene-text")).toContainText("Two copies of Mara's hour exist");
  await expect(page.getByTestId("scene-text")).not.toContainText("copy collapsed");
  await expect(page.getByTestId("scene-text")).not.toContainText("copying window is closed");
  await expect(page.getByTestId("choice-both")).toBeEnabled();
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  await page.getByTestId("choice-both").click();
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(after.sceneId).toBe("ending_both"); expect(after.creds).toBe(before.creds + 200);
  expect(after.flags.copy_failed).toBe(true); expect(after.flags.copied).toBe(true); expect(after.rolls).toHaveLength(2);
  expect(after.items).not.toContain("shard");
});

test("hearing without a Nia account retains absence through filing and the finale", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce" })));
  await openRun(page, fixture("act3_arrival", { flags: { memory_prepared: true, order_verified: true, archive_key_authenticated: true } }));
  for (const id of ["prepare-public-account", "scope-corroborated", "keep-recording-private", "answer-authenticated-key"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("scene-text")).toContainText("No approved recording from Nia was obtained");
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).not.toContainText("recording remains private");
  await page.getByTestId("choice-file-public-account").click(); await page.getByTestId("choice-leave-wall").click();
  const recap = page.getByTestId("aftermath-details"); await recap.locator("summary").click();
  await expect(recap).toContainText("No approved recording from Nia was obtained");
  await expect(recap).not.toContainText("private recording was not quoted");
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.journal.find((entry: { id: string }) => entry.id === "wall-account").text).toContain("No approved recording from Nia was obtained");
  expect(state.journal.some((entry: { id: string }) => entry.id === "nia-account")).toBe(false);
  expect(state.flags.nia_public_consent).toBeUndefined(); expect(state.flags.archive_key_authenticated).toBe(true);
});
