import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import type { GameState } from "../lib/types";
import { exportRun } from "../lib/vault";

function fixture(sceneId = "stall", extra: Partial<GameState> = {}): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 }, complication: "optic" }), sceneId, ...extra };
}
test("cross-examination preserves attributed answers through a reload", async ({ page }) => {
  await openRun(page, fixture("memory_reconstruction"));
  for (const id of ["question-mara", "ask-evacuation-assurance", "record-assurance-limit"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-ask-evacuation-assurance")).toHaveCount(0);
  for (const id of ["ask-command-contact", "record-channel-limit", "close-cross-exam", "separate-decisions"]) await page.getByTestId(`choice-${id}`).click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.order_verified).toBeUndefined();
  expect(run.journal.filter((entry: {id: string}) => entry.id.startsWith("mara-")).map((entry: {kind: string}) => entry.kind)).toEqual(["claim", "claim"]);
});
test("clinic notice sources gate distribution and preserve private dispatch", async ({ page }) => {
  await openRun(page, fixture("act2_notice_brief", { creds: 20, flags: { memory_prepared: true } }));
  await page.getByTestId("choice-accept-notice").click();
  await expect(page.getByTestId("choice-plan-notice")).toHaveCount(0);
  for (const id of ["read-notice-slip", "read-notice-map", "read-notice-card", "plan-notice", "courier-notice", "record-private-notice"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-help-clinic-notice")).toHaveCount(0);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(0); expect(run.flags.notice_private_confirmed).toBe(true); expect(run.flags.order_verified).toBeUndefined();
  await page.getByTestId("objectives").locator("summary").click();
  await expect(page.getByTestId("objectives")).toContainText("still unobserved");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
test("a refused notice can recover without money or a repeated check", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.05; });
  await openRun(page, fixture("act2_notice_methods", { creds: 0, flags: { notice_started: true, notice_slip: true, notice_map: true, notice_card: true } }));
  await page.getByTestId("choice-negotiate-notice").click(); await page.getByTestId("roll-button").click();
  await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("choice-negotiate-notice")).toHaveCount(0);
  await expect(page.getByTestId("choice-courier-notice")).toBeDisabled();
  await page.getByTestId("choice-post-notice-map").click(); await page.getByTestId("choice-record-public-notice").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.notice_desk_refused).toBe(true); expect(run.flags.notice_public_route).toBe(true); expect(run.creds).toBe(0);
});
test("notice follow-up preserves observation after a funded response and reload", async ({ page }) => {
  await openRun(page, fixture("act3_neighborhood", { creds: 10, flags: { notice_started: true, notice_done: true, notice_public_route: true } }));
  for (const id of ["visit-notice", "record-public-reply", "return-notice-response", "fund-private-replies"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-leave-notice-result").click();
  await expect(page.getByTestId("choice-return-notice-response")).toHaveCount(0);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(0); expect(run.flags.notice_monitored).toBe(true); expect(run.flags.notice_private_reply_booked).toBe(true);
  await page.getByTestId("objectives").locator("summary").click();
  await expect(page.getByTestId("objectives")).toContainText("new appointments unconfirmed");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
test("Nia can pause questions without authorizing a recording", async ({ page }) => {
  await openRun(page, fixture("act3_witness_visit", { flags: { witness_safe: true } }));
  for (const id of ["ask-nia-contact", "give-nia-space"]) await page.getByTestId(`choice-${id}`).click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.nia_contact_paused).toBe(true); expect(run.flags.witness_consent).toBeUndefined(); expect(run.flags.nia_public_consent).toBeUndefined();
});
test("private receipt prose and choices fit largest text at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openRun(page, fixture("act3_notice_visit", { flags: { notice_started: true, notice_done: true, notice_private_confirmed: true } }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Text size").selectOption("2"); await page.getByLabel("Contrast", { exact: true }).selectOption("high");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("choice-record-private-reply")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("acquired sources are keyboard-readable without granting proof", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openRun(page, fixture("memory_publication", { flags: { memory_prepared: true, memory_assurance_heard: true }, journal: [
    { id: "mara-assurance", text: "Mara says she accepted a crew assignment; no dispatch confirmation is attached.", kind: "claim" },
    { id: "public-packet", text: "An earlier allegation.", kind: "claim" },
    { id: "packet-correction", text: "A later correction.", kind: "claim" },
  ] }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Text size").selectOption("2"); await page.getByLabel("Contrast", { exact: true }).selectOption("high");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByTestId("memory-review").locator(":scope > summary").click();
  const summary = page.getByTestId("source-ledger").locator("summary"); await summary.focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("source-ledger")).toHaveAttribute("open", "");
  await expect(page.getByTestId("source-ledger")).toContainText("Recorded as claim");
  await expect(page.getByTestId("source-ledger")).toContainText("Independent corroboration still needed");
  await expect(page.getByTestId("source-ledger")).toContainText("An earlier allegation");
  await expect(page.getByTestId("source-ledger")).toContainText("A later correction");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.order_verified).toBeUndefined(); expect(run.flags.nia_public_consent).toBeUndefined();
});
test("source review preserves quotation limits after relocation", async ({ page }) => {
  await openRun(page, fixture("act3_testimony_review", { flags: { order_verified: true, witness_lost: true, witness_relocated: true, nia_contact_relay: true }, journal: [
    { id: "nia-account", text: "Approved private recording.", kind: "fact" },
    { id: "verified-order", text: "Independent corroboration, not an authenticated key.", kind: "fact" },
  ] }));
  await page.getByTestId("source-ledger").locator("summary").click();
  await expect(page.getByTestId("source-ledger")).toContainText("key not authenticated");
  await expect(page.getByTestId("source-ledger")).toContainText("Public quotation withheld after location breach");
  await page.getByTestId("choice-scope-corroborated").click();
  await expect(page.getByTestId("choice-ask-public-permission")).toHaveCount(0);
});
async function openRun(page: Page, state = fixture()) {
  await page.addInitScript((run) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene")).toBeVisible();
}
test("new runner, settings, reading width and saved preferences", async ({ page }) => {
  await page.goto("/"); await page.getByTestId("new-run").click();
  await page.getByTestId("handle-input").fill("Rex"); await page.getByTestId("complication-debt").click();
  await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click(); await page.getByTestId("start-run").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  const scene = await page.getByTestId("scene").boundingBox(); const prose = await page.getByTestId("scene-text").boundingBox();
  expect(prose!.width).toBeGreaterThan(scene!.width * 0.8);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Reading pace").selectOption("all"); await page.getByLabel("Contrast", { exact: true }).selectOption("high");
  await page.getByLabel("Text size").selectOption("1"); await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.locator("html")).toHaveAttribute("data-text", "1"); await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  await expect(page.getByTestId("show-rest")).toHaveCount(0);
});
test("a recorded roll survives reload and cannot be rerolled", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/"); await page.evaluate((run) => localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)), fixture("pay"));
  await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("choice-haggle").click(); await page.getByTestId("roll-button").click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(stored.pendingCheck.roll).toBeGreaterThanOrEqual(1);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("roll-button")).toHaveCount(0); await expect(page.getByTestId("continue-check")).toBeVisible();
  await expect(page.locator(".total")).toContainText(String(stored.pendingCheck.roll));
  await page.getByTestId("continue-check").click();
  const committed = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(committed.pendingCheck).toBeUndefined(); expect(committed.rolls).toHaveLength(1); expect(errors).toEqual([]);
});
test("modal controls stay isolated and return focus", async ({ page }) => {
  await openRun(page);
  const settings = page.getByRole("button", { name: "Settings", exact: true }); await settings.click();
  await page.keyboard.press("1"); await page.keyboard.press("Escape"); await expect(settings).toBeFocused();
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  if (page.viewportSize()!.width <= 1100) {
    const toggle = page.getByTestId("sheet-toggle"); await toggle.click();
    await page.keyboard.press("1"); await expect(page.getByTestId("choice-ask-pay")).toBeAttached();
    await page.getByRole("tab", { name: "stats", exact: true }).focus();
    await page.keyboard.press("ArrowRight"); await expect(page.getByRole("tab", { name: "gear", exact: true })).toBeFocused();
    await page.keyboard.press("End"); await expect(page.getByRole("tab", { name: "journal", exact: true })).toBeFocused();
    await page.keyboard.press("Escape"); await expect(toggle).toBeFocused();
  }
});
test("slots, corrupted import, backup and export", async ({ page }) => {
  await openRun(page); await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Save to slot 1", exact: true }).click(); await expect(page.getByRole("dialog").getByRole("status")).toContainText("Slot 1 saved");
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Export run", exact: true }).click(); expect((await download).suggestedFilename()).toBe("saint-shard-run.json");
  await page.getByLabel("Import a saved run").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from('{"version":2,"stats":[]}') });
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("supported");
  await page.getByRole("button", { name: "Close saves", exact: true }).click(); await page.getByTestId("choice-ask-pay").click();
  await page.getByRole("button", { name: "Saves", exact: true }).click(); await page.getByRole("button", { name: "Load slot 1", exact: true }).click(); await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
});
test("imports preserve pending outcomes", async ({ page }) => {
  const state = fixture("pay", { pendingCheck: { sceneId: "pay", choiceId: "haggle", roll: 1 } });
  await page.goto("/"); await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByLabel("Import a saved run").setInputFiles({ name: "run.json", mimeType: "application/json", buffer: Buffer.from(exportRun(state)) });
  await expect(page.getByTestId("continue-check")).toBeVisible(); await expect(page.getByTestId("roll-button")).toHaveCount(0);
});
for (const mode of ["blocked", "quota"] as const) test(`plays with ${mode} storage`, async ({ page }) => {
  await page.addInitScript((kind) => {
    if (kind === "blocked") Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
    else Storage.prototype.setItem = function () { throw new DOMException("Full", "QuotaExceededError"); };
  }, mode);
  await page.goto("/"); await page.getByTestId("new-run").click(); await page.getByTestId("handle-input").fill("Rex"); await page.getByTestId("complication-debt").click(); await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click(); await page.getByTestId("start-run").click();
  await expect(page.getByRole("status").filter({ hasText: "could not be saved" })).toContainText("could not be saved"); await page.getByTestId("choice-ask-pay").click(); await expect(page.getByTestId("choice-haggle")).toBeVisible();
});
test("memory inspection, disposition and consequence entry", async ({ page }) => {
  await openRun(page, fixture("mara_why", { items: ["shard"], flags: { heard_memo: true }, journal: [{ id: "ward-nine", text: "The original memo." }] }));
  await page.getByTestId("choice-inspect-hour").click(); await expect(page.getByTestId("choice-seal-full")).toHaveCount(0);
  for (const id of ["signature", "order", "roster"]) await page.getByTestId(`choice-inspect-${id}`).click();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await expect(page.getByTestId("memory-plate")).toContainText("3 / 3 inspected");
  await expect(page.getByTestId("choice-seal-witness")).toHaveCount(0);
  for (const id of ["reconstruct", "separate-decisions", "label-unverified", "seal-witness"]) await page.getByTestId(`choice-${id}`).click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(state.flags.memory_witness).toBe(true);
});
for (const finale of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) test(`finale ${finale} and its aftermath are readable`, async ({ page }) => {
  await openRun(page, fixture(finale, { flags: { witness_safe: true, memory_witness: true, order_verified: true } }));
  await expect(page.getByTestId("ending-title")).toBeVisible(); await expect(page.getByRole("heading", { name: "What remains", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Title", exact: true }).click(); await expect(page.getByTestId("codex")).toContainText(/Said Aloud|Left to the Rain|Already Loose|On the Folio/);
});
test("automated accessibility checks for scene and settings", async ({ page }) => {
  await openRun(page); expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Settings", exact: true }).click(); expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("plays an uninterrupted campaign through evidence, practice, a contract and witness safety", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0.75; });
  await openRun(page);
  const route = ["ask-pay", "haggle", "pocket", "accept", "side", "spoof-door", "go", "honest", "pact-copy", "copy", "heard", "inspect-hour", "inspect-signature", "inspect-order", "inspect-roster", "reconstruct", "separate-decisions", "label-unverified", "seal-witness", "talk-leave", "both", "week-after", "into-week", "practice", "learn-ghost", "read-board", "origin-contract", "clear-key", "return-board", "to-lumen", "hear-lumen", "walk-with-her", "protect-witness", "agree-terms", "use-existing-plan", "pay-room", "review-account", "file-account", "stand", "back-to-board", "to-the-wall", "to-ward-nine", "visit-nia", "acknowledge-nia", "face-sera", "read-names"];
  for (const id of route) {
    await page.getByTestId(`choice-${id}`).click();
    if (await page.getByTestId("roll-button").count()) {
      await page.getByTestId("roll-button").click(); await page.getByTestId("continue-check").click();
    }
  }
  await expect(page.getByTestId("ending-title")).toBeVisible();
  await expect(page.locator(".aftermath")).toContainText("Nia");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(saved.flags.witness_safe).toBe(true); expect(saved.flags.order_verified).toBe(true);
  expect(saved.flags.perk_ghost).toBe(true); expect(saved.items).toContain("signal-baffle");
  expect(saved.sceneId).toBe("ending_names"); expect(errors).toEqual([]);
});

test("controller input navigates title and closes only the active dialog", async ({ page }) => {
  await page.addInitScript(() => {
    const pressed = Array(16).fill(false);
    Object.defineProperty(window, "testPad", { value: pressed });
    Object.defineProperty(navigator, "getGamepads", { value: () => [{ index: 0, mapping: "standard", buttons: pressed.map((value) => ({ pressed: value })) }] });
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ controller: true }));
  });
  await page.goto("/"); await page.getByRole("button", { name: "Settings", exact: true }).focus();
  async function press(index: number) {
    await page.evaluate(async (i) => {
      const buttons = (window as unknown as { testPad: boolean[] }).testPad;
      const frames = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      buttons[i] = true; await frames(); buttons[i] = false; await frames();
    }, index);
  }
  await press(0); await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Contrast", { exact: true }).focus(); await press(15);
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  await page.getByLabel("music volume").focus(); await press(15);
  await expect(page.getByLabel("music volume")).toHaveValue("61");
  await press(14); await expect(page.getByLabel("music volume")).toHaveValue("60");
  await press(13); await expect(page.getByRole("dialog")).toBeVisible();
  await press(1); await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeFocused();
});


test("commitments stay visible and week-closing choices warn about unfinished promises", async ({ page }) => {
  await openRun(page, fixture("act2_middle", { flags: { memory_witness: true } }));
  await expect(page.getByTestId("objectives")).toContainText("promise is still open");
  await page.getByTestId("objectives").locator("summary").click();
  await expect(page.getByTestId("objectives")).toContainText("Protect Nia Pell");
  await expect(page.getByTestId("choice-stand")).toContainText("promise remains unresolved");
  for (const id of ["protect-witness", "agree-terms", "use-existing-plan", "pay-room", "review-account"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("objectives")).toContainText("separate steps");
  await page.getByTestId("choice-file-account").click();
  await expect(page.getByTestId("objectives")).toContainText("1/1 complete");
  await expect(page.getByTestId("choice-stand")).not.toContainText("promise remains unresolved");
});

test("reduced motion preserves the selected paragraph reading pace", async ({ page }) => {
  await openRun(page, fixture("memo", { items: ["shard"] }));
  await expect(page.getByTestId("scene-text").locator("p")).toHaveCount(1);
  await page.getByTestId("show-rest").click();
  expect(await page.getByTestId("scene-text").locator("p").count()).toBeGreaterThan(1);
});

test("sheet tabs stay isolated from story shortcuts and restore focus", async ({ page }) => {
  await openRun(page);
  if (page.viewportSize()!.width <= 1100) await page.getByTestId("sheet-toggle").click();
  await page.getByRole("tab", { name: "journal", exact: true }).click(); await page.keyboard.press("1");
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  await page.keyboard.press("Home"); await expect(page.getByRole("tab", { name: "stats", exact: true })).toBeFocused();
  await page.keyboard.press("End"); await expect(page.getByRole("tab", { name: "journal", exact: true })).toBeFocused();
  if (page.viewportSize()!.width <= 1100) {
    await page.keyboard.press("Escape"); await expect(page.getByTestId("sheet-toggle")).toBeFocused();
  }
});


test("optional audio loads the scene score after an explicit player gesture", async ({ page }) => {
  await openRun(page, fixture("memory_table", { items: ["shard"], flags: { heard_memo: true } }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const score = page.waitForResponse((response) => response.url().endsWith("/audio/theme-chapel.wav") && response.status() === 200);
  await page.getByLabel("Sound enabled", { exact: true }).check(); await score;
  await page.getByLabel("Sound enabled", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByTestId("choice-inspect-order").click();
  await expect(page.getByTestId("memory-plate")).toContainText("1 / 3 inspected");
  await expect(page.locator("#memory-source-order")).toBeFocused();
  await expect(page.getByTestId("memory-plate").locator("details[open]")).toContainText("independent verification");
});

test("invalid slot dates do not appear as usable recovery points", async ({ page }) => {
  await page.addInitScript((snapshot) => {
    const data = JSON.parse(snapshot); data.savedAt = "invalid timestamp";
    localStorage.setItem("saint-shard-slot-1", JSON.stringify(data));
  }, exportRun(fixture()));
  await page.goto("/"); await page.getByRole("button", { name: "Saves", exact: true }).click();
  await expect(page.getByRole("button", { name: "Load slot 1", exact: true })).toBeDisabled();
  await expect(page.getByRole("dialog")).not.toContainText("Invalid Date");
});

test("a misleading interpretation can be revised without granting independent proof", async ({ page }) => {
  await openRun(page, fixture("memory_table", { flags: { heard_memo: true } }));
  for (const id of ["inspect-signature", "inspect-order", "inspect-roster"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("evidence-case")).toContainText("Still unknown");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  for (const id of ["reconstruct", "clear-mara"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("show-rest").click();
  await expect(page.getByTestId("scene-text")).toContainText("does not remove her authorization");
  for (const id of ["keep-both-decisions", "name-tower", "seal-full"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.flags.memory_public_claim).toBe(true); expect(state.flags.memory_intact).toBe(true); expect(state.flags.order_verified).toBeUndefined();
});

test("a prepared Ghost transfer keeps safety and consent separate across reload", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.75; });
  await openRun(page, fixture("act2_middle", { flags: { memory_witness: true, perk_trained: true, perk_ghost: true } }));
  for (const id of ["protect-witness", "agree-terms", "scout-patrol"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.getByTestId("continue-check").click();
  for (const id of ["ghost-transfer", "defer-account"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("objectives")).toContainText("Attach her account");
  await page.reload(); await page.getByTestId("continue-run").click();
  for (const id of ["return-witness", "review-account", "file-account"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("objectives")).toContainText("1/1 complete");
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.flags.witness_method_ghost).toBe(true); expect(state.flags.witness_consent).toBe(true); expect(state.flags.order_verified).toBe(true);
});

test("a second transfer retains the compromised promise and honest revisit", async ({ page }) => {
  await openRun(page, fixture("act2_middle", { creds: 150, flags: { memory_prepared: true, memory_witness: true, witness_lost: true, witness_done: true, order_verified: true }, journal: [{ id: "nia-account", text: "Approved account.", kind: "fact" }, { id: "ward-nine", text: "The memo.", kind: "fact" }] }));
  for (const id of ["repair-location", "fund-second-room"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("objectives")).toContainText("1 compromised");
  for (const id of ["stand", "back-to-board", "to-the-wall", "to-ward-nine", "visit-nia"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("scene-text")).toContainText("first one still gets calls");
  for (const id of ["acknowledge-nia", "face-sera", "read-names"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.locator(".aftermath")).toContainText("first location remains");
});

test("a specialist source answers the public challenge and changes the records visit", async ({ page }) => {
  await openRun(page, fixture("act2_middle", { flags: { memory_prepared: true, memory_public_claim: true, memory_intact: true, perk_trained: true, perk_chrome: true }, journal: [{ id: "ward-nine", text: "The memo.", kind: "fact" }] }));
  for (const id of ["trace-order", "agree-archive-terms", "skip-archive-prep", "separate-source-tests", "isolate-key", "withhold-technician", "keep-chain", "hear-response"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-repeat-public-claim")).toHaveCount(0);
  for (const id of ["answer-with-source", "stand", "back-to-board", "to-the-wall", "to-ward-nine", "visit-records"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("scene-text")).toContainText("independent source");
  for (const id of ["keep-limits", "go-wall", "face-sera", "read-names"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.locator(".aftermath")).toContainText("worker locations withheld");
});


test("a delayed audio resume cannot block optional score loading or play", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeContext = window.AudioContext;
    class DelayedContext extends NativeContext {
      get state(): AudioContextState { return "suspended"; }
      resume(): Promise<void> { return new Promise(() => {}); }
    }
    Object.defineProperty(window, "AudioContext", { value: DelayedContext });
  });
  await openRun(page, fixture("memory_table", { items: ["shard"], flags: { heard_memo: true } }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const score = page.waitForResponse((response) => response.url().endsWith("/audio/theme-chapel.wav") && response.status() === 200);
  await page.getByLabel("Sound enabled", { exact: true }).check(); await score;
  await page.getByLabel("Sound enabled", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByTestId("choice-inspect-signature").click();
  await expect(page.getByTestId("memory-plate")).toContainText("1 / 3 inspected");
});

test("archive comparison, custody and worker follow-through survive reload", async ({ page }) => {
  await openRun(page, fixture("act2_middle", { creds: 100, flags: { memory_prepared: true, memory_intact: true, perk_face: true } }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Reading pace").selectOption("all");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByTestId("choice-trace-order").click();
  await page.getByTestId("choice-agree-archive-terms").click();
  await page.getByTestId("choice-skip-archive-prep").click();
  await page.getByTestId("choice-catalog-is-proof").click();
  await expect(page.getByTestId("scene-text")).toContainText("It isn't the record");
  await page.getByTestId("choice-revise-source-test").click();
  await expect(page.getByTestId("archive-brief")).toContainText("Only a successful key match");
  const accessibility = await new AxeBuilder({ page }).analyze(); expect(accessibility.violations).toEqual([]);
  await page.getByTestId("choice-request-invoice").click();
  await expect(page.getByTestId("scene-text")).toContainText("Do not describe a maintenance countersignature");
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-withhold-technician").click();
  await page.getByTestId("choice-keep-chain").click();
  // Advance the same persisted run to the later visit without inventing a new source.
  await page.evaluate(() => { const run = JSON.parse(localStorage.getItem("saint-shard-3055-v1")!); run.sceneId = "act3_neighborhood"; localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)); });
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-visit-edda").click();
  await expect(page.getByTestId("scene-text")).toContainText("suspended pending a records review");
  await page.getByTestId("choice-bridge-edda-shift").click();
  await expect(page.getByTestId("choice-visit-edda")).toHaveCount(0);
  await page.getByTestId("choice-visit-records").click(); await page.getByTestId("choice-keep-limits").click();
  await expect(page.getByTestId("choice-visit-records")).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(stored.creds).toBe(60); expect(stored.flags.edda_supported).toBe(true); expect(stored.flags.archive_key_authenticated).toBeUndefined();
});

test("public quotation needs separate permission and the filed account survives reload", async ({ page }) => {
  await openRun(page, fixture("act3_arrival", { flags: { memory_prepared: true, order_verified: true, witness_safe: true, witness_consent: true }, journal: [{ id: "nia-account", text: "Nia approved a recording.", kind: "fact" }, { id: "ward-nine", text: "The original memo.", kind: "fact" }] }));
  await page.getByRole("button", { name: "Settings", exact: true }).click(); await page.getByLabel("Reading pace").selectOption("all"); await page.getByRole("button", { name: "Done", exact: true }).click();
  for (const id of ["prepare-public-account", "scope-corroborated"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("testimony-brief")).toContainText("separate from permission to quote");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-ask-public-permission").click(); await page.getByTestId("choice-accept-public-permission").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("testimony-brief")).toContainText("Nia authorized her approved words");
  await expect(page.getByTestId("choice-answer-authenticated-key")).toHaveCount(0);
  for (const id of ["answer-corroboration", "file-public-account"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-prepare-public-account")).toHaveCount(0);
  await page.getByTestId("choice-read-names").click();
  await expect(page.locator(".aftermath")).toContainText("Nia authorized her approved words");
});

test("an exposed witness cannot be publicly quoted and a draft can be withdrawn", async ({ page }) => {
  await openRun(page, fixture("act3_arrival", { flags: { memory_prepared: true, witness_lost: true, witness_relocated: true }, journal: [{ id: "nia-account", text: "The clinic recording.", kind: "fact" }] }));
  for (const id of ["prepare-public-account", "scope-bounded"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-ask-public-permission")).toHaveCount(0);
  await expect(page.getByTestId("testimony-brief")).toContainText("including after relocation");
  for (const id of ["keep-recording-private", "claim-key-anyway", "correct-hearing", "withdraw-public-account", "leave-wall"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.locator(".aftermath")).toContainText("withdrew the draft");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(saved.flags.order_verified).toBeUndefined(); expect(saved.flags.nia_public_consent).toBeUndefined(); expect(saved.flags.testimony_published).toBeUndefined(); expect(saved.flags.testimony_corrected).toBe(true);
});

test("field equipment costs compete with care and survive reload into check previews", async ({ page }) => {
  await openRun(page, fixture("districts", { creds: 150 }));
  await page.getByTestId("choice-visit-workshop").click();
  await expect(page.getByTestId("field-kit-brief")).toContainText("Private witness care costs 90");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-buy-archive-probe").click();
  await expect(page.getByTestId("choice-visit-workshop")).toHaveCount(0);
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.evaluate(() => { const run = JSON.parse(localStorage.getItem("saint-shard-3055-v1")!); run.sceneId = "act2_archive_door"; localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)); });
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("field-kit-brief")).toContainText("Archive Probe · equipped");
  await page.getByTestId("choice-trace-receipt").click();
  await expect(page.locator("dialog[open]")).toContainText("Archive Probe");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(stored.creds).toBe(10); expect(stored.stats.chrome).toBe(3); expect(stored.items).toContain("archive-probe");
});

test("paid recovery keeps a breach recorded and cannot be repeated after reload", async ({ page }) => {
  await openRun(page, fixture("act2_middle", { creds: 100, strain: 4, flags: { witness_lost: true } }));
  await page.getByTestId("choice-take-recovery").click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-pay-recovery").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-return-after-recovery").click();
  await expect(page.getByTestId("choice-take-recovery")).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.creds).toBe(55); expect(state.strain).toBe(1); expect(state.flags.witness_lost).toBe(true); expect(state.flags.order_verified).toBeUndefined();
});

test("coolant failure survives reload and offers care without inventing a repair", async ({ page }) => {
  await openRun(page, fixture("act2_pump_triage", { creds: 34, strain: 4, flags: { memory_prepared: true, pump_attempted: true, pump_failed: true } }));
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("choice-fund-cold-transfer")).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-carry-cold-transfer").click();
  await expect(page.getByTestId("choice-help-clinic-pump")).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.strain).toBe(5); expect(state.flags.pump_supplies_saved).toBe(true); expect(state.flags.pump_restored).toBeUndefined(); expect(state.flags.order_verified).toBeUndefined();
});

test("local repair record and later Kerr visit preserve the original ending choices", async ({ page }) => {
  await openRun(page, fixture("act2_pump_report", { flags: { memory_prepared: true, pump_attempted: true, pump_restored: true, pump_kerr: true } }));
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-keep-pump-local").click();
  for (const id of ["stand", "back-to-board", "to-the-wall", "to-ward-nine", "visit-pump"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click(); await page.getByLabel("Reading pace").selectOption("all"); await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("scene-text")).toContainText("kept a door open");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  for (const id of ["leave-pump-visit", "go-wall", "face-sera"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-leave-wall")).toBeVisible();
  await page.getByTestId("choice-leave-wall").click(); await expect(page.locator(".aftermath")).toContainText("authenticates no historical order");
});

test("private payroll consent leaves public source permission unchanged", async ({ page }) => {
  await openRun(page, fixture("act3_edda_visit", { flags: { archive_custody: true, archive_method_face: true, edda_name_withheld: true, origin_helped: true } }));
  await page.getByTestId("choice-review-edda-shift").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-authorize-shift-request").click();
  await expect(page.getByTestId("objectives")).toContainText("Campaign commitments");
  await page.getByTestId("choice-submit-key-closure").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-record-shift-response").click();
  await expect(page.getByTestId("choice-return-edda-payroll")).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.flags.edda_shift_paid).toBe(true); expect(state.flags.edda_public_consent).toBeUndefined(); expect(state.flags.edda_name_withheld).toBe(true);
  for (const id of ["go-wall", "face-sera", "leave-wall"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.locator(".aftermath")).toContainText("neither clears her name");
});

test("worker representation follows a paid bridge without restoring a shift", async ({ page }) => {
  await openRun(page, fixture("act3_edda_visit", { creds: 100, flags: { archive_custody: true, edda_exposed: true } }));
  for (const id of ["bridge-edda-shift", "return-edda-payroll", "authorize-shift-request"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("choice-fund-worker-representative").click();
  await page.getByRole("button", { name: "Settings", exact: true }).click(); await page.getByLabel("Reading pace").selectOption("all"); await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("scene-text")).toContainText("No shift has been restored");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-record-shift-response").click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.creds).toBe(0); expect(state.flags.edda_supported).toBe(true); expect(state.flags.edda_shift_paid).toBeUndefined();
  expect(state.journal.find((entry: { id: string }) => entry.id === "edda-shift-response").text).toContain("sixty-creds fee is spent");
});

test("a declined private application closes the optional route", async ({ page }) => {
  await openRun(page, fixture("act3_edda_terms", { flags: { archive_custody: true, edda_exposed: true } }));
  await page.getByTestId("choice-decline-shift-request").click();
  await expect(page.getByTestId("choice-visit-edda")).toHaveCount(0);
  await expect(page.getByTestId("choice-return-edda-payroll")).toHaveCount(0);
  await expect(page.getByTestId("choice-go-wall")).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.flags.edda_shift_done).toBe(true); expect(state.flags.edda_shift_consent).toBeUndefined(); expect(state.flags.edda_public_consent).toBeUndefined();
});

test("text-only mode avoids artwork requests through reload and a rolled result", async ({ page }) => {
  const art: string[]=[]; page.on("request",request=>{if(request.url().includes("/art/")) art.push(request.url());});
  await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({artwork:"none",motion:"reduce"})));
  await openRun(page,fixture("pay"));
  await expect(page.locator("img.portrait")).toHaveCount(0); await expect(page.getByTestId("goal")).toBeInViewport();
  await page.getByTestId("choice-haggle").click(); await page.getByTestId("roll-button").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.locator("img.portrait")).toHaveCount(0); await page.getByTestId("continue-check").click();
  expect(art).toEqual([]); expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.getByRole("button",{name:"Settings",exact:true}).click();
  await expect(page.getByLabel("Artwork",{exact:true})).toHaveValue("none");
  await page.getByLabel("Artwork",{exact:true}).selectOption("full"); await page.getByRole("button",{name:"Done",exact:true}).click();
  await expect(page.locator("img.portrait")).toBeVisible();
});

test("district cards omit images in text-only mode and Week audio loads on demand", async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({artwork:"none"})));
  await openRun(page,fixture("districts")); await expect(page.locator("img.card-art")).toHaveCount(0);
  await page.getByRole("button",{name:"Settings",exact:true}).click();
  const response=page.waitForResponse(r=>r.url().endsWith("/audio/theme-week.wav")&&r.status()===200);
  await page.getByLabel("Sound enabled",{exact:true}).check(); await response;
  await page.getByLabel("Sound enabled",{exact:true}).uncheck(); await page.getByRole("button",{name:"Done",exact:true}).click();
  await page.getByTestId("choice-to-kerr").click(); await expect(page.getByTestId("choice-hear-kerr")).toBeVisible();
});

test("a coolant follow-up spends trust once and describes a future appointment",async({page})=>{
  await openRun(page,fixture("act3_pump_visit",{flags:{pump_restored:true,pump_done:true},factions:{quill:0,lumen:0,helion:0,wards:2}}));
  for(const id of ["book-pump-inspection","wards-pump-inspection"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-book-pump-inspection")).toHaveCount(0);
  await page.getByRole("button",{name:"Settings",exact:true}).click(); await page.getByLabel("Reading pace").selectOption("all"); await page.getByRole("button",{name:"Done",exact:true}).click();
  await expect(page.getByTestId("scene-text")).toContainText("inspection itself is still due");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(saved.factions.wards).toBe(1); expect(saved.flags.order_verified).toBeUndefined();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

for (const reading of ["paragraph", "all"] as const) test(`fresh memory choices precede optional evidence in ${reading} mode`, async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 605 });
  await page.addInitScript((pace) => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: pace })), reading);
  await openRun(page, fixture("memory_publication", { flags: { memory_prepared: true } }));
  const review = page.getByTestId("memory-review");
  await expect(review).not.toHaveAttribute("open", "");
  expect(await page.locator("#choices").evaluate((choices) => Boolean(choices.compareDocumentPosition(document.querySelector('[data-testid="memory-review"]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  const skip = page.getByRole("link", { name: "Skip to choices" });
  await skip.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#choices")).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.locator("#choices button").first()).toBeFocused();
  await review.locator(":scope > summary").click();
  await expect(page.getByTestId("memory-plate")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("settings fit classic scrollbars at desktop and narrow widths in every text size", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({ content: ".dialog.wide { scrollbar-gutter: stable; }" });
  for (const width of [1180, 400, 320]) {
    await page.setViewportSize({ width, height: 756 });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    for (const size of ["0", "1", "2"]) {
      await page.getByLabel("Text size").selectOption(size);
      expect(await page.locator(".settings-grid").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.getByRole("dialog").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }
});
test("same-scene slot restores announce their source without gameplay deltas", async ({ page }) => {
  await openRun(page, fixture("after_kerr", { creds: 120, strain: 4 }));
  const other = fixture("after_kerr", { creds: 20, strain: 1 });
  await page.evaluate((snapshot) => localStorage.setItem("saint-shard-slot-1", snapshot), exportRun(other));
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).creds)).toBe(120);
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("restore-notice")).toContainText("Loaded Slot 1 — The Hour");
  await expect(page.getByTestId("run-delta")).toHaveCount(0);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(20); expect(run.strain).toBe(1);
  const nextChapter = fixture("act2_lumen_door", { creds: 300, strain: 3 });
  await page.evaluate((snapshot) => localStorage.setItem("saint-shard-slot-2", snapshot), exportRun(nextChapter));
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Load slot 2", exact: true }).click();
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("restore-notice")).toContainText("Loaded Slot 2 — The Week");
  await expect(page.getByTestId("run-delta")).toHaveCount(0);
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("restore-notice")).toContainText("Loaded Slot 1 — The Hour");
  await expect(page.getByTestId("run-delta")).toHaveCount(0);
});
test("ending discovery shows chapter counts and opt-in spoiler-light replay hints", async ({ page }) => {
  await page.goto("/");
  for (const title of ["The Hour · 0/8 discovered", "The Week · 0/3 discovered", "The Wall · 0/4 discovered"]) await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.locator(".codex .unseen")).toHaveCount(15);
  await expect(page.getByText("The sources you carry and the account you choose affect what can be said.")).toHaveCount(0);
  await page.getByRole("button", { name: "Show replay hints" }).click();
  await expect(page.getByText("The sources you carry and the account you choose affect what can be said.")).toBeVisible();
  await page.getByRole("button", { name: "Hide replay hints" }).click();
  await expect(page.locator(".codex .seen")).toHaveCount(0);
});


test("Lumen offers a marker without a handover through hearing and reload", async ({ page }) => {
  await openRun(page, fixture("act2_lumen_door", { items: [], flags: { act1_sold: true } }));
  await page.getByTestId("next-paragraph").click();
  await expect(page.getByTestId("scene-text")).toContainText("offers a clinic marker");
  await page.getByTestId("choice-hear-lumen").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Reading pace").selectOption("all");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("scene-text")).toContainText("still on her palm");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).items)).toEqual([]);
});
test("Fight Kerr displays costs before a saved critical result and commits once", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.95; });
  await openRun(page, fixture("kerr", { strain: 0 }));
  await expect(page.getByTestId("choice-fight")).toContainText("Success: Strain +1");
  await expect(page.getByTestId("choice-fight")).toContainText("Miss: Strain +2");
  await page.getByTestId("choice-fight").click();
  await expect(page.getByTestId("check-costs")).toContainText("successful 10 eases Strain by one");
  await page.getByTestId("roll-button").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("roll-button")).toHaveCount(0);
  await page.getByTestId("continue-check").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.strain).toBe(0); expect(run.rolls).toHaveLength(1); expect(run.rolls[0].roll).toBe(10);
});
