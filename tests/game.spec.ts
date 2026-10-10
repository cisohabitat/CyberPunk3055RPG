import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import type { GameState } from "../lib/types";
import { exportRun } from "../lib/vault";

function fixture(sceneId = "stall", extra: Partial<GameState> = {}): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 }, complication: "optic" }), sceneId, ...extra };
}
test("campaign integration warns about return work and preserves it after closing the week", async ({ page }) => {
  await openRun(page, fixture("act2_middle", { strain: 0, creds: 0, flags: { chapel_shift_owed: true, witness_shift_owed: true } }));
  await expect(page.getByTestId("objectives")).toContainText("Campaign commitments");
  await expect(page.getByTestId("choice-stand")).toContainText("2 campaign promises remain unresolved");
  await page.getByTestId("choice-work-chapel-shift").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-stand")).toContainText("1 campaign promise remains unresolved");
  await expect(page.getByTestId("choice-work-chapel-shift")).toHaveCount(0);
  await page.getByTestId("choice-stand").click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.strain).toBe(1); expect(state.flags.chapel_shift_kept).toBe(true); expect(state.flags.witness_shift_kept).toBeUndefined();
});
test("campaign integration Lumen reply records a visit without completing the work", async ({ page }) => {
  await openRun(page, fixture("act3_neighborhood", { strain: 0, creds: 0, flags: { chapel_method_face: true, chapel_shift_owed: true, watched: true, betrayed_lumen: true } }));
  await page.getByTestId("choice-visit-chapel-return").click();
  if (await page.getByTestId("show-rest").count()) await page.getByTestId("show-rest").click();
  await expect(page.getByTestId("scene-text")).toContainText("doesn't unsell it");
  await page.getByTestId("choice-record-chapel-return").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-visit-chapel-return")).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(state.flags.chapel_response_heard).toBe(true); expect(state.flags.chapel_shift_kept).toBeUndefined(); expect(state.flags.betrayed_lumen).toBe(true); expect(state.flags.watched).toBe(true); expect(state.creds).toBe(0); expect(state.strain).toBe(0);
});
test("controller reaches and opens the campaign aftermath disclosure", async ({ page }) => {
  await page.addInitScript(() => {
    const pressed = Array(16).fill(false); Object.defineProperty(window, "testPad", { value: pressed });
    Object.defineProperty(navigator, "getGamepads", { value: () => [{ index: 0, mapping: "standard", buttons: pressed.map(value => ({ pressed: value })) }] });
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ controller: true, reading: "all" }));
  });
  await openRun(page, fixture("ending_quiet", { flags: { witness_shift_owed: true } }));
  const recap = page.getByTestId("aftermath-details"); const summary = recap.locator("summary");
  await summary.focus(); await page.keyboard.press("Shift+Tab");
  async function press(id: number) {
    await page.evaluate(async id => {
      const buttons = (window as unknown as { testPad: boolean[] }).testPad;
      const frames = () => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      buttons[id] = true; await frames(); buttons[id] = false; await frames();
    }, id);
  }
  await press(13); await expect(summary).toBeFocused();
  await press(0); await expect(recap).toHaveAttribute("open", "");
  await expect(recap.getByRole("heading", { name: "Volunteer return shift" })).toBeVisible();
});
for (const finale of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) test(`campaign integration ${finale} offers a keyboard-readable factual recap`, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork: "none", text: 2, contrast: "high", reading: "all" })));
  await page.setViewportSize({ width: 320, height: 844 });
  const art: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) art.push(r.url()); });
  await openRun(page, fixture(finale, { flags: { opening_identity: true, witness_shift_owed: true, kerr_method_rig: true, notice_schedule_60: true, notice_privacy_refused: true } }));
  await expect(page.getByTestId("campaign-coda")).toContainText("not Nia’s");
  const recap = page.getByTestId("aftermath-details");
  await expect(recap).not.toHaveAttribute("open", "");
  await recap.locator("summary").focus(); await page.keyboard.press("Enter");
  await expect(recap.getByRole("heading", { name: "Borrowed depot rig" })).toBeVisible();
  await expect(recap).toContainText("deposit remains held"); await expect(recap).toContainText("unaccepted draft");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(art).toEqual([]);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
for (const [scene, ids, flags, finalFlag] of [
  ["chapel_methods", ["offer-chapel-service", "bargain-service-entry"], {}, "chapel_shift_owed"],
  ["chapel_window_plan", ["window-scout-gap", "window-use-gap", "window-quiet-exit"], { chapel_window_started: true, chapel_window_3: true }, "chapel_window_quiet_exit"],
  ["act2_notice_allocation", ["allocate-notice-33", "offer-notice-clinic-contact", "accept-notice-extra-trip", "record-private-notice"], { notice_started: true }, "notice_allocation_committed"],
] as const) test(`controller completes Phase 2 method in ${scene}`, async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.75;
    const pressed = Array(16).fill(false); Object.defineProperty(window, "testPad", { value: pressed });
    Object.defineProperty(navigator, "getGamepads", { value: () => [{ index: 0, mapping: "standard", buttons: pressed.map(value => ({ pressed: value })) }] });
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ controller: true, reading: "all" }));
  });
  await openRun(page, fixture(scene, { creds: 15, strain: 0, flags: { ...flags } }));
  async function activate(id: string) {
    await page.getByTestId(id).focus();
    await page.evaluate(async () => {
      const buttons = (window as unknown as { testPad: boolean[] }).testPad;
      const frames = () => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      buttons[0] = true; await frames(); buttons[0] = false; await frames();
    });
  }
  for (const id of ids) {
    await activate(`choice-${id}`);
    if (await page.getByTestId("roll-button").count()) { await activate("roll-button"); await activate("continue-check"); }
  }
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(s.flags[finalFlag]).toBe(true); expect(s.flags.witness_consent).toBeUndefined();
});
test("clinic allocation revises a capacity conflict and preserves a refused return contact", async ({ page }) => {
  await openRun(page, fixture("act2_notice_methods", { creds: 0, strain: 0, factions: { lumen: 5, quill: 0, wards: 0, helion: 0 }, flags: { notice_started: true, notice_card: true, notice_map: true, notice_slip: true } }));
  for (const id of ["compare-notice-allocation", "allocate-notice-60", "offer-notice-clinic-contact"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("scene-text")).toContainText("last two");
  for (const id of ["revise-notice-allocation", "allocate-notice-33", "offer-notice-home-contact", "revise-notice-allocation", "allocate-notice-33", "offer-notice-clinic-contact"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-fund-notice-extra-carrier")).toBeDisabled();
  await page.getByTestId("choice-accept-notice-extra-trip").focus(); await page.keyboard.press("Enter");
  await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("choice-record-private-notice").click();
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(s.creds).toBe(0); expect(s.strain).toBe(2); expect(s.flags.notice_plan_invalid).toBe(true); expect(s.flags.notice_privacy_refused).toBe(true); expect(s.flags.notice_allocation_33).toBe(true);
  expect(s.flags.notice_receipt_observed).toBeUndefined(); expect(s.flags.witness_consent).toBeUndefined();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
test("clinic counteroffer spends the carrier fee once through reload", async ({ page }) => {
  await openRun(page, fixture("act2_notice_counter", { creds: 10, strain: 0, flags: { notice_started: true, notice_schedule_33: true } }));
  await page.getByTestId("choice-fund-notice-extra-carrier").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-record-private-notice").click();
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(s.creds).toBe(0); expect(s.strain).toBe(0); expect(s.flags.notice_allocation_paid).toBe(true);
  await expect(page.getByTestId("choice-fund-notice-extra-carrier")).toHaveCount(0);
});
for (const width of [390, 1440, 320]) test(`clinic allocation draft fits and survives a free revision at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 900 }); const art: string[] = [];
  page.on("request", r => { if (r.url().includes("/art/")) art.push(r.url()); });
  if (width === 320) await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ textStep: 2, artwork: "none", contrast: "high", reading: "all", motion: "reduce" })));
  await openRun(page, fixture("act2_notice_allocation", { creds: 0, strain: 0, flags: { notice_started: true } }));
  await expect(page.getByTestId("goal")).toBeInViewport(); await page.getByTestId("choice-allocate-notice-33").click();
  await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("choice-revise-notice-allocation").click();
  if (await page.getByTestId("show-rest").count()) await page.getByTestId("show-rest").click();
  await expect(page.getByTestId("scene-text")).toContainText("Saved draft: 3 early / 3 later");
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(s.creds).toBe(0); expect(s.strain).toBe(0); expect(s.flags.notice_private_confirmed).toBeUndefined();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); if (width === 320) expect(art).toEqual([]);
});
test("saved Chapel window preserves a pending die and spends shared opportunities once", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.75; });
  await openRun(page, fixture("route", { creds: 0, strain: 0 }));
  for (const id of ["begin-chapel-window", "window-scout-gap"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("goal")).toContainText("2 opportunities");
  await page.getByTestId("choice-window-use-gap").focus(); await page.keyboard.press("Enter"); await page.getByTestId("roll-button").click();
  await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("goal")).toContainText("1 opportunity");
  await page.getByTestId("choice-window-quiet-exit").click();
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(s.flags.chapel_window_0).toBe(true); expect(s.flags.chapel_window_quiet_exit).toBe(true); expect(s.flags.watched).toBeUndefined();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
for (const width of [390, 1440, 320]) test(`expired Chapel exit stays usable without funds at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
  const art: string[] = []; page.on("request", r => { if (r.url().includes("/art/")) art.push(r.url()); });
  if (width === 320) await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ textStep: 2, artwork: "none", contrast: "high", reading: "all", motion: "reduce" })));
  await openRun(page, fixture("chapel_window_exit", { creds: 0, strain: 0, flags: { chapel_window_started: true, chapel_window_entered: true, chapel_window_0: true } }));
  await expect(page.getByTestId("goal")).toBeInViewport(); await expect(page.getByTestId("choice-window-quiet-exit")).toHaveCount(0);
  await page.getByTestId("choice-window-staffed-exit").click(); await page.reload(); await page.getByTestId("continue-run").click();
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(s.creds).toBe(0); expect(s.strain).toBe(1); expect(s.flags.chapel_window_expired).toBe(true); expect(s.flags.watched).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); if (width === 320) expect(art).toEqual([]);
});
test("prepared methods keep a service fee and recorded bargain die through reload", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.75; });
  await openRun(page, fixture("route", { creds: 15, strain: 0 }));
  for (const id of ["prepare-chapel-method", "offer-chapel-service", "bargain-service-entry"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("continue-check").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(0); expect(run.flags.chapel_method_face).toBe(true); expect(run.flags.watched).toBe(true); expect(run.pendingCheck).toBeUndefined();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
test("borrowed rig deposit survives reload and refunds only on recorded handover", async ({ page }) => {
  await openRun(page, fixture("act2_route_crossing", { creds: 20, strain: 0, flags: { kerr_route_started: true, kerr_exit_gap: true } }));
  for (const id of ["compare-depot-handling", "borrow-depot-rig"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).creds)).toBe(0);
  await page.getByTestId("choice-record-kerr-receipt").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(20); expect(run.strain).toBe(2); expect(run.flags.kerr_rig_returned).toBe(true);
});
test("Nia's volunteer bargain fits large text without art and keeps recording optional", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ textStep: 2, contrast: "high", artwork: "none", reading: "all", motion: "reduce" })));
  await openRun(page, fixture("act2_witness_support", { creds: 0, strain: 0, flags: { witness_briefed: true, witness_escort: true } }));
  await expect(page.getByTestId("goal")).toBeInViewport();
  for (const id of ["promise-volunteer-shift", "defer-account", "work-witness-shift"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.strain).toBe(1); expect(run.flags.witness_consent).toBeUndefined();
  await expect(page.getByTestId("choice-work-witness-shift")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
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
for (const [width, saved, large] of [[390, false, false], [1440, true, false], [320, true, true]] as const) test(`title key art and keyboard start controls at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
  await page.addInitScript(({ run, large }) => {
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ textStep: large ? 2 : 0, contrast: large ? "high" : "standard", motion: "reduce" }));
    if (run) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
  }, { run: saved ? fixture() : null, large });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Saint Shard", level: 1 })).toBeVisible();
  const image = page.getByTestId("title-art").locator("img");
  await expect(image).toHaveAttribute("src", "/art/title.jpg");
  await expect(image).toHaveAttribute("alt", /Symbolic title art: a lone runner/);
  expect(await image.evaluate((img: HTMLImageElement) => img.decode().then(() => img.naturalWidth))).toBeGreaterThan(0);
  for (const id of saved ? ["continue-run", "new-run"] : ["new-run"]) {
    const bounds = await page.getByTestId(id).boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(width < 700 ? 844 : 900);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  if (saved) {
    await page.getByTestId("continue-run").focus(); await page.keyboard.press("Tab");
    await expect(page.getByTestId("new-run")).toBeFocused(); await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Start over?" })).toBeVisible();
    await page.getByRole("button", { name: "Keep it", exact: true }).click();
    await expect(page.getByTestId("new-run")).toBeFocused();
    await page.getByTestId("continue-run").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("scene")).toBeVisible();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
    expect(state.sceneId).toBe("stall"); expect(state.handle).toBe("Rex");
  } else {
    await page.getByTestId("new-run").focus(); await page.keyboard.press("Enter");
    await expect(page.getByTestId("handle-input")).toBeVisible();
  }
});
test("unavailable title artwork leaves start and settings usable", async ({ page }) => {
  await page.route("**/art/title*.jpg", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByTestId("title-art")).toBeVisible();
  await expect.poll(() => page.getByTestId("title-art").locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 0)).toBe(true);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Artwork", { exact: true }).selectOption("none");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("title-art")).toHaveCount(0);
  await page.getByTestId("new-run").click(); await expect(page.getByTestId("handle-input")).toBeVisible();
});
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
  await expect(page.getByRole("status").filter({ hasText: "could not be saved" })).toContainText("could not be saved"); await page.getByTestId("choice-skip-opening").click(); await page.getByTestId("choice-ask-pay").click(); await expect(page.getByTestId("choice-haggle")).toBeVisible();
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

for (const [origin, complication, motive, root, reason] of [
  ["gutterwire", "debt", "opening-survival", "grew up below these pipes", "keep tomorrow yours"],
  ["spire", "optic", "opening-identity", "clearance stopped working", "claim on your name"],
  ["dustline", "on-file", "opening-exit", "carried parcels across the flats", "way beyond the next closed door"],
] as const) test(`new ${origin} runner enters through a personal prologue and resumes before the job`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/"); await page.getByTestId("new-run").click();
  await page.getByTestId("handle-input").fill("Rex");
  await page.getByTestId(`origin-${origin}`).click(); await page.getByTestId(`complication-${complication}`).click();
  await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click();
  await page.getByTestId("start-run").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("goal")).toContainText("Find Quill");
  await expect(page.getByTestId("choice-ask-pay")).toHaveCount(0);
  await page.getByTestId("show-rest").click();
  await expect(page.getByTestId("scene-text")).toContainText("People call you a runner");
  await expect(page.getByTestId("scene-text")).toContainText("sliver of glass called a shard");
  await expect(page.getByTestId("scene-text")).not.toContainText("Mara Voss");
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  await page.getByTestId("choice-begin-opening").click(); await page.getByTestId("show-rest").click();
  await expect(page.getByTestId("scene-text")).toContainText(root);
  await page.getByTestId(`choice-${motive}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText(reason);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Reading pace").selectOption("all");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByTestId("choice-hear-stallholder").click();
  await expect(page.getByTestId("scene-text")).toContainText("to make the rent");
  await expect(page.getByTestId("scene-text")).toContainText("Remembered getting paid. Didn't remember what he needed to apologize for.");
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByTestId("choice-take-the-stool").click();
  await expect(page.getByTestId("scene-text")).toContainText(reason);
  await expect(page.getByTestId("scene-text")).toContainText("stallholder’s story stays with you");
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  for (const key of ["creds", "strain", "items", "stats", "factions", "rolls"]) expect(after[key]).toEqual(before[key]);
  await expect(page.getByTestId("goal")).toContainText("Hear Quill's terms");
  await page.getByTestId("choice-accept").click();
  await expect(page.getByTestId("goal")).toContainText("Lift Mara Voss");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).flags.hired)).toBe(true);
});
for (const [width, textOnly] of [[390, false], [1440, true], [320, true]] as const) test(`Quill's offer stays unaccepted through questions and reload at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  if (textOnly) await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork: "none", textStep: 2, contrast: "high" })));
  await page.goto("/"); await page.getByTestId("new-run").click();
  await page.getByTestId("handle-input").fill("Rex");
  await page.getByTestId("complication-debt").click();
  await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click();
  await page.getByTestId("start-run").click();
  for (const id of ["begin-opening", "opening-survival", "hear-stallholder", "take-the-stool"]) await page.getByTestId(`choice-${id}`).click();
  // Default paragraph reading must expose the complete offer before any reveal click.
  for (const term of ["Mara Voss", "Glass Chapel", "dawn", "Fifty now", "two hundred", "Kerr"]) await expect(page.getByTestId("scene-text")).toContainText(term);
  await expect(page.getByTestId("goal")).toContainText("Hear Quill's terms");
  await expect(page.getByTestId("goal")).toBeInViewport();
  await page.getByTestId("choice-ask-owner").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("goal")).toContainText("Hear Quill's terms");
  await page.getByTestId("show-rest").click();
  await expect(page.getByTestId("scene-text")).toContainText("buyer is still a blank");
  let run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(20); expect(run.flags.hired).toBeUndefined(); expect(run.journal).toEqual([]);
  await page.getByTestId("choice-back-to-offer").click();
  await expect(page.getByTestId("choice-ask-owner")).toHaveCount(0);
  await expect(page.getByTestId("scene-text")).toContainText("Fifty now");
  await expect(page.getByTestId("scene-text")).not.toContainText("grew up below");
  await page.getByTestId("choice-accept").focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("goal")).toContainText("Lift Mara Voss");
  await expect(page.getByTestId("scene-text")).toContainText("tomorrow paid for");
  await expect(page.getByTestId("goal")).toBeInViewport();
  run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(70); expect(run.flags.hired).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  if (textOnly) await expect(page.locator("img.portrait")).toHaveCount(0);
});

test("returning runners can skip the prologue while old saves continue at the job", async ({ page }) => {
  await openRun(page, fixture("stall"));
  await expect(page.getByTestId("choice-begin-opening")).toHaveCount(0);
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Return to title", exact: true }).click();
  await page.getByTestId("new-run").click(); await page.getByRole("button", { name: "Start a new run", exact: true }).click();
  await page.getByTestId("handle-input").fill("Rex"); await page.getByTestId("complication-debt").click();
  await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click();
  await page.getByTestId("start-run").click(); await page.getByTestId("choice-skip-opening").click();
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.opening_skipped).toBe(true); expect(run.flags.opening_survival).toBeUndefined(); expect(run.creds).toBe(20);
});

function freightFixture(stat = "ghost", creds = 100): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "dustline", bonus: { chrome: 0, nerve: 0, face: 0, ghost: 2 } }), sceneId: "act2_origin_dustline", creds, flags: { perk_trained: true, [`perk_${stat}`]: true }, factions: { quill: 2, lumen: 0, helion: 0, wards: 0 } };
}
async function inspectFreight(page: Page) {
  for (const id of ["plan-freight", "accept-freight-terms", "inspect-freight-seal", "inspect-freight-manifest", "inspect-freight-window", "prepare-freight"]) await page.getByTestId(`choice-${id}`).click();
}
for (const [stat, prep, method] of [["ghost", "scout", "ghost-gap"], ["chrome", "reader", "chrome-stock"], ["face", "escort", "face-escort"], ["nerve", "brace", "nerve-ramp"]] as const) test(`freight ${stat} specialization observes custody before a one-use reward`, async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.75; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", textStep: 2, contrast: "high", artwork: "none" })); });
  await page.setViewportSize({ width: 320, height: 844 });
  await openRun(page, freightFixture(stat)); await inspectFreight(page);
  await page.getByTestId(`choice-prep-freight-${prep}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  await page.getByTestId(`choice-freight-${method}`).click();
  if (stat === "nerve") { await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("roll-button")).toHaveCount(0); await page.getByTestId("continue-check").click(); }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).items)).not.toContain("burner-route");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-acknowledge-freight-receipt").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.freight_delivered).toBe(true); expect(run.items).toContain("burner-route");
  expect(run.flags.order_verified).toBeUndefined(); expect(run.flags.nia_public_consent).toBeUndefined();
  await expect(page.getByTestId("scene-text")).toContainText("delivery, not patient treatment");
  await page.getByTestId("choice-return-freight-board").click();
  await expect(page.getByTestId("choice-origin-contract")).toHaveCount(0);
});
test("freight critical failure restores once and offers a free recorded recovery", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.05; });
  await openRun(page, freightFixture("face", 0)); await inspectFreight(page);
  await page.getByTestId("choice-freight-without-prep").click(); await page.getByTestId("choice-freight-service-run").click();
  await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("roll-button")).toHaveCount(0); await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("choice-freight-recovery-courier")).toBeDisabled();
  await page.getByTestId("choice-freight-recovery-desk").click(); await page.getByTestId("choice-acknowledge-freight-receipt").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(0); expect(run.strain).toBe(2); expect(run.flags.freight_exposed).toBe(true); expect(run.items).not.toContain("burner-route"); expect(run.rolls).toHaveLength(1);
});
test("a late freight reply confirms stock without retroactive reward", async ({ page }) => {
  await openRun(page, { ...freightFixture(), sceneId: "ward_wall", flags: { freight_started: true, freight_done: true, freight_unconfirmed: true, opening_exit: true } });
  for (const id of ["visit-asa", "query-freight-receipt", "record-freight-reply"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-query-freight-receipt")).toHaveCount(0);
  for (const id of ["reflect-freight-motive", "finish-freight-reflection"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-visit-asa")).toHaveCount(0);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.freight_late_received).toBe(true); expect(run.items).not.toContain("burner-route"); expect(run.flags.order_verified).toBeUndefined(); expect(run.sceneId).toBe("ward_wall");
});

function shelterFixture(stat = "nerve", creds = 100): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 0, nerve: 2, face: 0, ghost: 0 } }), sceneId: "act2_origin_gutterwire", creds, flags: { perk_trained: true, [`perk_${stat}`]: true }, factions: { quill: 0, lumen: 0, helion: 0, wards: 2 } };
}
for (const [stat, prep, method] of [["nerve", "brace", "turn-valve"], ["chrome", "controller", "local-control"], ["face", "crew", "crew-repair"], ["ghost", "ramp", "ghost-ramp"]] as const) test(`shelter ${stat} method separates resident care from referral capacity`, async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.75; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", textStep: 2, contrast: "high", artwork: "none" })); });
  await page.setViewportSize({ width: 320, height: 844 }); await openRun(page, shelterFixture(stat));
  for (const id of ["plan-shelter", "accept-shelter", `shelter-prep-${prep}`, `shelter-${method}`]) await page.getByTestId(`choice-${id}`).click();
  if (stat === "nerve") { await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("roll-button")).toHaveCount(0); await page.getByTestId("continue-check").click(); }
  else { await page.reload(); await page.getByTestId("continue-run").click(); }
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).items)).not.toContain("witness-token");
  await page.getByTestId(stat === "ghost" ? "choice-shelter-confirm-hall" : "choice-shelter-carry-annex").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.shelter_done).toBe(true); expect(run.flags.witness_safe).toBeUndefined(); expect(run.flags.order_verified).toBeUndefined();
  if (stat === "ghost") { expect(run.flags.shelter_restored).toBeUndefined(); expect(run.items).not.toContain("witness-token"); }
  else expect(run.items).toContain("witness-token");
  await page.getByTestId("choice-shelter-return-board").click(); await expect(page.getByTestId("choice-origin-contract")).toHaveCount(0);
});
test("shelter failed repair restores its die and offers evacuation at zero funds", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.05; }); await openRun(page, shelterFixture("face", 0));
  for (const id of ["plan-shelter", "accept-shelter", "shelter-no-prep", "shelter-turn-valve"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("continue-check").click();
  for (const id of ["shelter-guide-hall", "shelter-confirm-hall"]) await page.getByTestId(`choice-${id}`).click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(0); expect(run.strain).toBe(3); expect(run.rolls).toHaveLength(1); expect(run.flags.shelter_hall).toBe(true); expect(run.items).not.toContain("witness-token");
});
test("shelter later help preserves uncertainty and returns to its entry hub", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all" })); });
  await openRun(page, { ...shelterFixture(), sceneId: "ward_wall", flags: { shelter_started: true, shelter_done: true, shelter_unobserved: true } });
  await page.getByTestId("choice-visit-shelter-neighbors").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText("no arrival count"); await page.getByTestId("choice-shelter-fund-laundry").click();
  await expect(page.getByTestId("choice-visit-shelter-neighbors")).toHaveCount(0);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.sceneId).toBe("ward_wall"); expect(run.creds).toBe(80); expect(run.flags.shelter_hall).toBeUndefined(); expect(run.items).not.toContain("witness-token");
});

for (const [sceneId, path] of [["act3_witness_visit", "/art/nia.jpg"], ["act3_edda_visit", "/art/edda.jpg"], ["act2_freight_brief", "/art/asa.jpg"]]) test(`generated character portrait loads for ${sceneId}`, async ({ page }) => {
  await openRun(page, fixture(sceneId));
  const portrait = page.locator("img.portrait").first(); await expect(portrait).toHaveAttribute("src", path);
  expect(await portrait.evaluate((image: HTMLImageElement) => image.decode().then(() => image.naturalWidth))).toBe(440);
  await expect(page.getByTestId("goal")).toBeInViewport();
});
for (const [sceneId, name] of [["opening_city", "opening"], ["memory_table", "memory-bench"], ["act2_shelter_brief", "shelter"], ["act2_freight_brief", "freight"], ["act2_spire_brief", "spire-counter"], ["act2_spire_methods", "spire-terminal"], ["act3_spire_visit", "spire-payroll"]]) test(`encounter illustration ${sceneId} preserves largest-text phone goals`, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ textStep: 2, contrast: "high", motion: "reduce" })));
  await page.setViewportSize({ width: 390, height: 844 });
  await openRun(page, fixture(sceneId));
  const plate = page.getByTestId("scene-illustration").locator("img");
  await expect(plate).toHaveAttribute("src", `/art/${name}.jpg`);
  const decoded = await plate.evaluate((image: HTMLImageElement) => image.decode().then(() => ({ width: image.naturalWidth, source: image.currentSrc })));
  expect(decoded.width).toBeGreaterThan(0); expect(decoded.source).toMatch(new RegExp(`/art/${name}(-small)?[.]jpg$`));
  await expect(plate).toHaveAttribute("alt", /.+/); await expect(page.getByTestId("goal")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(plate).toBeVisible();
});
for (const sceneId of ["opening_city", "act2_spire_brief", "act2_spire_methods", "act3_spire_visit"]) test(`text-only title and encounter ${sceneId} avoid generated art requests across reload`, async ({ page }) => {
  const requests: string[] = []; page.on("request", (request) => { if (request.url().includes("/art/")) requests.push(request.url()); });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork: "none" })));
  await openRun(page, fixture(sceneId)); await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  await page.reload(); await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  await page.getByTestId("continue-run").click(); await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  expect(requests).toEqual([]);
});
test("the authored stereo score decodes after an explicit sound-enabled continuation", async ({ page }) => {
  type DecodedScore = { channels: number; duration: number; sampleRate: number };
  await page.addInitScript(() => {
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true }));
    const recorded = window as unknown as { decodedScores: DecodedScore[] };
    recorded.decodedScores = [];
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function(data: ArrayBuffer) {
      return decode.call(this, data).then((buffer) => { recorded.decodedScores.push({ channels: buffer.numberOfChannels, duration: buffer.duration, sampleRate: buffer.sampleRate }); return buffer; });
    };
  });
  await openRun(page, fixture("districts"));
  await expect.poll(() => page.evaluate(() => (window as unknown as { decodedScores: DecodedScore[] }).decodedScores)).toEqual(expect.arrayContaining([expect.objectContaining({ channels: 2 })]));
  const score = await page.evaluate(() => (window as unknown as { decodedScores: DecodedScore[] }).decodedScores.find((buffer) => buffer.channels === 2)!);
  // WebKit resampling can trim one output frame from the exact 32-second WAV.
  expect(Math.abs(score.duration - 32)).toBeLessThanOrEqual(1 / score.sampleRate + Number.EPSILON);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Sound enabled", { exact: true }).uncheck(); await page.getByRole("button", { name: "Done", exact: true }).click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.sceneId).toBe("districts"); expect(run.pendingCheck).toBeUndefined();
});

function spireFixture(stat = "chrome", creds = 100): GameState {
  return { ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "act2_origin_spire", creds, flags: { perk_trained: true, [`perk_${stat}`]: true }, factions: { quill: 0, lumen: 0, helion: 2, wards: 0 } };
}
async function readSpireSources(page: Page) {
  for (const id of ["plan-spire-key", "accept-spire-key", "inspect-spire-billing", "inspect-spire-protocol", "inspect-spire-receiver", "plan-spire-key"]) await page.getByTestId(`choice-${id}`).click();
}
for (const [stat, prep, method] of [["chrome", "reader", "local-reader"], ["face", "clerk", "clerk-signature"], ["ghost", "mirror", "mirror-cycle"], ["nerve", "latch", "hold-latch"]] as const) test(`Spire ${stat} preparation earns only a matched closure and receiver`, async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.75; localStorage.setItem("saint-shard-preferences", JSON.stringify({ textStep: 2, reading: "all", contrast: "high", motion: "reduce" })); });
  await page.setViewportSize({ width: 320, height: 844 }); await openRun(page, spireFixture(stat));
  await page.getByTestId("choice-plan-spire-key").click(); await page.getByTestId("choice-accept-spire-key").click();
  await expect(page.getByTestId("choice-plan-spire-key")).toHaveCount(0);
  await page.getByTestId("choice-inspect-spire-billing").click();
  await expect(page.getByTestId("scene-text")).toContainText("1/3 checked");
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-inspect-spire-billing")).toHaveCount(0);
  for (const id of ["inspect-spire-protocol", "inspect-spire-receiver", "plan-spire-key", `spire-prep-${prep}`]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  await page.getByTestId(`choice-spire-${method}`).click();
  if (stat === "nerve") { await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("roll-button")).toHaveCount(0); await page.getByTestId("continue-check").click(); }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).items)).not.toContain("signal-baffle");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-acknowledge-spire-closure").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.spire_closure_recorded).toBe(true); expect(run.items).toContain("signal-baffle");
  for (const flag of ["order_verified", "archive_key_authenticated", "witness_safe", "edda_shift_paid", "nia_public_consent"]) expect(run.flags[flag]).toBeUndefined();
  await expect(page.getByTestId("scene-text")).toContainText("Earlier disputed charges still need review");
  await page.getByTestId("choice-spire-return-board").click(); await expect(page.getByTestId("choice-origin-contract")).toHaveCount(0);
});
test("Spire failed retirement restores once and permits a zero-fund pending request", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.05; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all" })); });
  await openRun(page, spireFixture("face", 0)); await readSpireSources(page);
  await page.getByTestId("choice-spire-no-prep").click(); await page.getByTestId("choice-spire-retire-terminal").click();
  await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("roll-button")).toHaveCount(0); await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("choice-spire-recovery-processor")).toBeDisabled();
  await expect(page.getByTestId("choice-spire-retire-terminal")).toHaveCount(0);
  await page.getByTestId("choice-spire-file-request").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText("Acceptance is not closure");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.spire_pending).toBe(true); expect(run.flags.old_badge_traced).toBe(true); expect(run.flags.spire_closure_recorded).toBeUndefined();
  expect(run.creds).toBe(0); expect(run.strain).toBe(2); expect(run.rolls).toHaveLength(1); expect(run.pendingCheck).toBeUndefined(); expect(run.items).not.toContain("signal-baffle");
});
test("Spire paid recovery preserves the badge trail and withholds the receiver", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.05; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all" })); });
  await openRun(page, spireFixture("face")); await readSpireSources(page);
  for (const id of ["spire-no-prep", "spire-retire-terminal"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.getByTestId("continue-check").click();
  await page.getByTestId("choice-spire-recovery-processor").click(); await page.getByTestId("choice-acknowledge-spire-closure").click();
  await expect(page.getByTestId("scene-text")).toContainText("later closure did not erase it");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.spire_closure_recorded).toBe(true); expect(run.flags.old_badge_traced).toBe(true); expect(run.flags.origin_helped).toBeUndefined();
  expect(run.creds).toBe(65); expect(run.items).not.toContain("signal-baffle");
});
for (const hub of ["ward_wall", "act3_neighborhood"]) test(`Spire late payroll reply preserves exposure and returns to ${hub}`, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all" })));
  await openRun(page, { ...spireFixture(), sceneId: hub, flags: { origin_done: true, spire_started: true, spire_done: true, spire_pending: true, spire_consent: true, old_badge_traced: true, archive_custody: true, edda_exposed: true } });
  for (const id of ["visit-spire-key", "query-spire-reply"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText("Don’t date it last week");
  await page.getByTestId("choice-record-spire-reply").click(); await expect(page.getByTestId("choice-visit-spire-key")).toHaveCount(0);
  let run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.sceneId).toBe(hub); expect(run.flags.spire_late_closed).toBe(true); expect(run.flags.spire_pending).toBeUndefined(); expect(run.flags.old_badge_traced).toBe(true);
  expect(run.items).not.toContain("signal-baffle"); expect(run.flags.edda_shift_paid).toBeUndefined(); expect(run.flags.order_verified).toBeUndefined();
  if (hub === "act3_neighborhood") {
    for (const id of ["visit-edda", "review-edda-shift", "authorize-shift-request", "submit-key-closure", "record-shift-response"]) await page.getByTestId(`choice-${id}`).click();
    run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
    expect(run.flags.edda_shift_paid).toBe(true); expect(run.flags.edda_exposed).toBe(true); expect(run.flags.old_badge_traced).toBe(true); expect(run.flags.edda_public_consent).toBeUndefined();
  }
});

for (const [width, textOnly] of [[1440, false], [390, false], [320, true]] as const) test(`playable memory timeline saves source tests at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
  await page.addInitScript((none) => localStorage.setItem("saint-shard-preferences", JSON.stringify(none ? { artwork: "none", textStep: 2, contrast: "high" } : {})), textOnly);
  const artwork: string[] = []; page.on("request", (request) => { if (request.url().includes("/art/")) artwork.push(request.url()); });
  await openRun(page, fixture("memory_reconstruction", { flags: { heard_memo: true, memory_signature: true, memory_order: true, memory_roster: true } }));
  await page.getByTestId("choice-assemble-timeline").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  if (textOnly) await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  else expect(await page.getByTestId("scene-illustration").locator("img").evaluate((img: HTMLImageElement) => img.decode().then(() => img.naturalWidth))).toBeGreaterThan(0);
  await page.getByTestId("memory-workspace").getByText("The signature · available", { exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("memory-workspace")).toContainText("02:13");
  if (!textOnly) expect(await page.getByTestId("memory-workspace").locator(".source-art img").evaluate((img: HTMLImageElement) => img.decode().then(() => img.naturalWidth))).toBeGreaterThan(0);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-place-signature").focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#timeline-source-signature")).toBeFocused();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("draft-timeline").locator("li").first()).toContainText("The signature");
  await expect(page.locator(".fragment-placed")).toHaveCount(0);
  await expect(page.getByTestId("choice-place-signature")).toHaveCount(0);
  await expect(page.getByTestId("choice-test-timeline")).toHaveCount(0);
  for (const id of ["place-order", "place-roster", "test-timeline", "choose-model", "model-issuer", "verdict-unresolved", "record-tested-account", "label-unverified"]) await page.getByTestId(`choice-${id}`).click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.memory_sequence_checked).toBe(true); expect(run.flags.memory_model_sound).toBe(true);
  expect(run.flags.order_verified).toBeUndefined(); expect(run.flags.nia_public_consent).toBeUndefined(); expect(run.creds).toBe(fixture().creds);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (textOnly) expect(artwork).toEqual([]);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
test("memory timeline recovers a mismatch and retains a disputed verdict after reload", async ({ page }) => {
  await openRun(page, fixture("memory_sequence", { flags: { heard_memo: true, memory_signature: true, memory_order: true, memory_roster: true } }));
  for (const id of ["place-roster", "place-order", "place-signature", "test-timeline"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-choose-model")).toHaveCount(0);
  for (const id of ["rebuild-timeline", "place-signature", "place-order", "place-roster", "test-timeline", "choose-model", "model-absolution", "verdict-supported", "carry-disputed-model", "label-unverified", "seal-full"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.memory_sequence_error).toBe(true); expect(run.flags.memory_sequence_checked).toBe(true);
  expect(run.flags.memory_model_pending).toBe(true); expect(run.flags.order_verified).toBeUndefined();
  expect(run.journal.some((entry: {id: string}) => entry.id === "bench-challenge")).toBe(true);
  expect(run.sceneId).toBe("kerr");
});

async function observeVoices(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true }));
    const review = window as unknown as { voiceReview: { decoded: number; started: number; stopped: number; gains: number[] } };
    review.voiceReview = { decoded: 0, started: 0, stopped: 0, gains: [] };
    const voices = new WeakSet<AudioBuffer>();
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function(data: ArrayBuffer) {
      const voice = data.byteLength > 44 && new DataView(data).getUint32(24, true) === 24000;
      return decode.call(this, data).then((buffer) => { if (voice) { voices.add(buffer); review.voiceReview.decoded++; } return buffer; });
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args: Parameters<typeof start>) { if (this.buffer && voices.has(this.buffer)) review.voiceReview.started++; return start.apply(this, args); };
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop = function(...args: Parameters<typeof stop>) { if (this.buffer && voices.has(this.buffer)) review.voiceReview.stopped++; return stop.apply(this, args); };
    const target = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function(...args: Parameters<typeof target>) { review.voiceReview.gains.push(args[0]); return target.apply(this, args); };
  });
}
const voiceReview = (page: Page) => page.evaluate(() => (window as unknown as { voiceReview: { decoded: number; started: number; stopped: number; gains: number[] } }).voiceReview);

test("selective voices follow visible text, duck the bed and retain separate volume", async ({ page }) => {
  await observeVoices(page);
  const requests: string[] = []; page.on("request", (request) => { if (request.url().includes("/audio/voice-")) requests.push(request.url()); });
  await openRun(page, fixture("memory_publication"));
  await expect(page.getByTestId("voice-line")).toHaveCount(0); expect(requests).toEqual([]);
  await page.getByTestId("next-paragraph").click();
  await expect(page.getByRole("button", { name: "Listen to Lumen" })).toBeVisible(); expect(requests).toEqual([]);
  expect(await page.locator("img.portrait").evaluate((img: HTMLImageElement) => img.decode().then(() => img.currentSrc))).toContain("lumen-challenging.jpg");
  await page.getByRole("button", { name: "Listen to Lumen" }).click();
  await expect.poll(async () => (await voiceReview(page)).started).toBe(1);
  expect((await voiceReview(page)).gains).toContain(0.24);
  const gainsBeforeStop = (await voiceReview(page)).gains.length;
  await page.getByRole("button", { name: "Stop line" }).click();
  await expect.poll(async () => (await voiceReview(page)).stopped).toBeGreaterThan(0);
  expect((await voiceReview(page)).gains.slice(gainsBeforeStop)).toContain(0.6);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("voices volume").focus(); await page.keyboard.press("Home"); await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-preferences")!));
  expect(prefs.voices).toBe(1); expect(prefs.music).toBe(60); expect(prefs.effects).toBe(70);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("cancelling a loading voice prevents late playback after Sound off", async ({ page }) => {
  await observeVoices(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/audio/voice-mara-assurance.wav", async (route) => {
    const response = await route.fetch(); await gate; await route.fulfill({ response });
  });
  await openRun(page, fixture("memory_assurance"));
  await page.getByTestId("show-rest").click();
  await page.getByRole("button", { name: "Listen to Mara" }).click();
  await expect(page.getByTestId("voice-line")).toContainText("Loading selected dialogue");
  await page.getByRole("button", { name: "Stop line" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Sound enabled", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  release();
  await expect.poll(async () => (await voiceReview(page)).decoded).toBe(1);
  expect((await voiceReview(page)).started).toBe(0);
  await expect(page.getByRole("button", { name: "Listen to Mara" })).toBeDisabled();
  await page.getByTestId("choice-record-assurance-limit").click();
  expect((await voiceReview(page)).started).toBe(0);
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).flags.memory_assurance_heard).toBe(true);
});

test("unavailable voices and source images preserve the playable evidence", async ({ page }) => {
  await observeVoices(page);
  await page.route("**/audio/voice-mara-channel.wav", (route) => route.abort());
  await page.route("**/art/fragment-*.jpg", (route) => route.abort());
  await openRun(page, fixture("memory_channel", { flags: { memory_signature: true, memory_order: true, memory_roster: true } }));
  await page.getByTestId("show-rest").click();
  await page.getByRole("button", { name: "Listen to Mara" }).click();
  await expect(page.getByTestId("voice-line")).toContainText("Voice unavailable");
  await page.getByTestId("memory-review").locator("summary").first().click();
  await page.locator("#memory-source-order").click();
  await expect(page.locator(".source-art-missing")).toContainText("source text remains below");
  await expect(page.getByTestId("memory-review")).toContainText("evacuation");
  await page.getByTestId("choice-record-channel-limit").click();
  await expect(page.getByTestId("choice-ask-command-contact")).toHaveCount(0);
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).flags.order_verified).toBeUndefined();
});

for (const [width, textOnly] of [[390, false], [1440, false], [320, true]] as const) test(`Kerr route draft, recorded roll and delayed receipt at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
  await page.addInitScript((none) => { Math.random = () => .75; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", ...(none ? { artwork: "none", textStep: 2, contrast: "high" } : {}) })); }, textOnly);
  const artwork: string[] = []; page.on("request", r => { if(r.url().includes("/art/")) artwork.push(r.url()); });
  await openRun(page, fixture("act2_middle", { creds: 100, strain: 0, flags: { kerr_talked: true } }));
  for(const id of ["answer-kerr-collection", "promise-private-collection"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  if(textOnly) await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  else expect(await page.getByTestId("scene-illustration").locator("img").evaluate((img:HTMLImageElement) => img.decode().then(() => img.naturalWidth))).toBeGreaterThan(0);
  await page.getByTestId("choice-route-entry-lift").focus(); await page.keyboard.press("Enter");
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("route-board")).toContainText("Coin lift · selected");
  await expect(page.getByTestId("creds")).toContainText("100");
  await page.getByTestId("choice-route-exit-gap").click();
  await expect(page.getByTestId("choice-depart-kerr-lift")).toContainText("-10 cr");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for(const id of ["depart-kerr-lift", "route-use-gap"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("roll-button")).toHaveCount(0);
  await page.getByTestId("continue-check").click(); await page.getByTestId("choice-record-kerr-receipt").click();
  await expect(page.getByTestId("choice-answer-kerr-collection")).toHaveCount(0);
  for(const id of ["stand", "back-to-board", "to-the-wall", "to-ward-nine", "face-sera", "visit-kerr-collection", "acknowledge-private-collection", "ask-kerr-personal-question", "keep-kerr-personal-answer", "leave-wall"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.locator(".aftermath")).toContainText("Kerr received his closed brace case");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(90); expect(run.flags.kerr_route_trace).toBeUndefined(); expect(run.flags.kerr_question_done).toBe(true); expect(run.flags.order_verified).toBeUndefined();
  if(textOnly) expect(artwork).toEqual([]);
});

test("Kerr failed collection preserves registration and refusal of further contact", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .05; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all" })); });
  await openRun(page, fixture("act2_middle", { creds: 20, strain: 0, stats: {chrome:1,face:1,ghost:1,nerve:1}, flags: { kerr_talked: true, kerr_sold_you: true } }));
  for(const id of ["answer-kerr-collection", "promise-private-collection", "route-entry-gate", "route-exit-gap"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("route-board")).toContainText("This entry breaks your private terms");
  for(const id of ["depart-kerr-foot", "route-use-gap"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("choice-route-use-gap")).toHaveCount(0);
  await page.getByTestId("choice-fund-kerr-courier").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("creds")).toContainText("0"); await page.getByTestId("choice-record-kerr-receipt").click();
  for(const id of ["stand", "back-to-board", "to-the-wall", "to-ward-nine", "face-sera", "visit-kerr-collection", "answer-kerr-breach", "deny-kerr-disclosure"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-ask-kerr-personal-question")).toHaveCount(0);
  if (await page.getByTestId("sheet-toggle").isVisible()) await page.getByTestId("sheet-toggle").click();
  await expect(page.locator("#runner-sheet .cast")).toContainText("He sold your account to Helion");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.kerr_route_trace).toBe(true); expect(run.flags.kerr_route_denied).toBe(true); expect(run.flags.kerr_route_delivered).toBe(true);
});

for (const [width,textOnly] of [[390,false],[1440,false],[320,true]] as const) test(`present-day response refusals, private dispatch and finale at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width<700?844:900});
 await page.addInitScript(none=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",motion:"reduce",...(none?{artwork:"none",textStep:2,contrast:"high"}:{})})),textOnly);
 const art:string[]=[];page.on("request",r=>{if(r.url().includes("/art/"))art.push(r.url())});
 await openRun(page,fixture("act2_middle",{creds:15,strain:0,flags:{heard_memo:true,met_mara:true}}));
 await page.getByTestId("choice-hear-mara-response").click();await expect(page.getByTestId("goal")).toBeInViewport();await expect(page.getByTestId("scene-text")).toContainText("her voice now");
 if(textOnly)await expect(page.getByTestId("scene-illustration")).toHaveCount(0);else expect(await page.getByTestId("scene-illustration").locator("img").evaluate((x:HTMLImageElement)=>x.decode().then(()=>x.naturalWidth))).toBeGreaterThan(0);
 for(const id of ["listen-response-terms","propose-public-response"])await page.getByTestId(`choice-${id}`).click();await page.reload();await page.getByTestId("continue-run").click();
 await expect(page.getByTestId("scene-text")).toContainText("Not the board");await page.getByTestId("choice-revise-private-response").focus();await page.keyboard.press("Enter");
 expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
 for(const id of ["ask-mara-tomorrow","keep-mara-quiet-answer","defer-private-response","hear-mara-response","courier-private-response"])await page.getByTestId(`choice-${id}`).click();
 await page.reload();await page.getByTestId("continue-run").click();await expect(page.getByTestId("creds")).toContainText("0");await expect(page.getByTestId("choice-courier-private-response")).toHaveCount(0);
 const dispatched=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(dispatched.flags.response_received).toBeUndefined();expect(dispatched.flags.response_public_refused).toBe(true);
 for(const id of ["record-response-dispatch","stand","back-to-board","to-the-wall","to-ward-nine","face-sera","visit-mara-response","read-response-intake","finish-mara-response","visit-lumen-boundary","respect-lumen-boundary","leave-wall"])await page.getByTestId(`choice-${id}`).click();
 await expect(page.getByTestId("relationship-coda")).toContainText("Mara’s cup");await expect(page.locator(".aftermath")).toContainText("unanswered queue");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const run=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(run.flags.response_received).toBe(true);expect(run.flags.order_verified).toBeUndefined();expect(run.flags.nia_public_consent).toBeUndefined();if(textOnly)expect(art).toEqual([]);
});
for(const [scene,speaker] of [["act2_mara_quiet","Mara"],["act2_lumen_quiet","Sister Lumen"]]) test(`current quiet dialogue is explicit and stops on departure: ${speaker}`,async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",sound:true})));
 await openRun(page,fixture(scene,{flags:{heard_memo:true,response_started:true,response_private_consent:true}}));
 const line=page.getByTestId("voice-line");await expect(line).toContainText("synthetic");await line.getByRole("button",{name:`Listen to ${speaker === "Sister Lumen" ? "Lumen" : speaker}`}).click();await expect(line).toContainText("Playing selected dialogue");
 await page.getByTestId(`choice-${speaker==="Mara"?"keep-mara-quiet-answer":"keep-lumen-quiet-answer"}`).click();await expect(line).toHaveCount(0);
});

test("recorded interview replay survives reload without becoming a live response", async ({page}) => {
 await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",sound:true})));
 await openRun(page,fixture("memory_cross_exam",{flags:{heard_memo:true,memory_signature:true,memory_order:true,memory_roster:true}}));
 await expect(page.getByTestId("scene-text")).toContainText("she cannot hear you now");
 await page.getByTestId("choice-ask-evacuation-assurance").click();
 await page.getByRole("button",{name:"Listen to Mara",exact:true}).click();
 await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
 await page.getByTestId("choice-record-assurance-limit").click();await page.reload();await page.getByTestId("continue-run").click();
 await expect(page.getByTestId("scene-text")).toContainText("testimony, not an evacuation confirmation");
 for(const id of ["ask-command-contact","record-channel-limit","close-cross-exam","separate-decisions"])await page.getByTestId(`choice-${id}`).click();
 const run=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
 expect(run.flags.order_verified).toBeUndefined();expect(run.flags.response_started).toBeUndefined();expect(run.journal.filter((j:{id:string})=>j.id.startsWith("mara-")).every((j:{kind:string})=>j.kind==="claim")).toBe(true);
});

test("edited neighborhood return keeps choices and commitments through a narrow text-only reload", async ({page}) => {
 await page.setViewportSize({width:320,height:844});await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({reading:"all",artwork:"none",textStep:2,contrast:"high",motion:"reduce"})));
 const artwork:string[]=[];page.on("request",r=>{if(r.url().includes("/art/"))artwork.push(r.url())});
 await openRun(page,fixture("act3_neighborhood",{creds:0,flags:{memory_prepared:true,memory_intact:true,archive_custody:true}}));
 await page.getByTestId("choice-visit-records").click();await page.getByTestId("choice-keep-limits").click();await page.reload();await page.getByTestId("continue-run").click();
 await expect(page.getByTestId("goal")).toBeInViewport();await expect(page.getByTestId("choice-visit-records")).toHaveCount(0);await expect(page.getByTestId("choice-go-wall")).toBeEnabled();
 expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(artwork).toEqual([]);
 const run=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));expect(run.creds).toBe(0);expect(run.flags.visited_records).toBe(true);expect(run.flags.order_verified).toBeUndefined();expect(run.flags.witness_safe).toBeUndefined();
});
