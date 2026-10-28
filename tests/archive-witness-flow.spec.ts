import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { keyboardActivate } from "../qa/production/keyboard";
import { fixture, openRun, archiveCustodyFixture } from "./fixtures/game";

test("a misleading interpretation can be revised without granting independent proof", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "paragraph" })));
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
  await page.addInitScript(() => localStorage.setItem("saint-shard-sound", "off"));
  await openRun(page, fixture("memory_table", { items: ["shard"], flags: { heard_memo: true } }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const score = page.waitForResponse((response) => response.url().endsWith("/audio/theme-chapel.flac") && response.status() === 200);
  await page.getByLabel("Sound enabled", { exact: true }).check(); await score;
  await page.getByLabel("Sound enabled", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByTestId("choice-inspect-signature").click();
  await expect(page.getByTestId("memory-plate")).toContainText("1 / 3 inspected");
});

test("archive comparison and custody survive reload", async ({ page }) => {
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
  await expect(page.getByTestId("scene-text")).toContainText("The ledger corroborates the cancellation; no reader authenticated its issuing key.");
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-withhold-technician").click();
  await page.getByTestId("choice-keep-chain").click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(stored).toEqual(archiveCustodyFixture());
});

test("archive worker follow-through preserves custody after reload", async ({ page }) => {
  // This checkpoint is replayed through canonical choices and independently
  // checked against the browser's exact persisted state in the preceding case.
  await openRun(page, archiveCustodyFixture());
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

for (const exposure of ["none", "edda_exposed", "archive_method_face", "archive_method_nerve"] as const) test(`Edda ${exposure} visit keeps posted shifts and suspension remedies distinct`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", textStep: 2, contrast: "high" })));
  const flags = { archive_custody: true, edda_name_withheld: true, ...(exposure === "none" ? {} : { [exposure]: true }) };
  await openRun(page, fixture("act3_edda_visit", { creds: 75, flags }));
  const text = page.getByTestId("scene-text");
  if (exposure === "none") {
    await expect(text).toContainText("shifts are still posted");
    await expect(text).not.toContainText("bridge");
    await expect(text).not.toContainText("suspended");
    await expect(page.getByTestId("choice-bridge-edda-shift")).toHaveCount(0);
    await expect(page.getByTestId("choice-review-edda-shift")).toHaveCount(0);
  } else {
    await expect(text).toContainText("suspended pending a records review");
    await expect(page.getByTestId("choice-bridge-edda-shift")).toBeEnabled();
    await expect(page.getByTestId("choice-review-edda-shift")).toBeVisible();
  }
  await expect(page.getByTestId("goal")).toBeInViewport();
  const keep = page.getByTestId("choice-respect-edda-source");
  await expect(keep).toHaveText(/Record her limits and keep the source available/);
  await keyboardActivate(page, keep);
  await expect(text).toContainText(exposure === "none" ? "shifts are still posted" : "shift remains suspended");
  const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run"));
  await expect(text).toContainText(exposure === "none" ? "shifts are still posted" : "shift remains suspended");
  expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
  const state = JSON.parse(before!); expect(state.creds).toBe(75); expect(state.flags.visited_edda).toBe(true);
  expect(state.flags.edda_supported).toBeUndefined(); expect(state.flags.edda_shift_paid).toBeUndefined(); expect(state.flags.edda_public_consent).toBeUndefined();
  expect(state.log.at(-1)).toBe("Record her limits and keep the source available.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});

test("neighborhood saved replies keep legacy Edda labels and paused unrecorded Nia contact", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce", textStep: 2, contrast: "high", artwork: "none" })));
  const old = "Record her limits and leave the employment review unresolved.";
  const cases: { flags: Record<string, boolean>; log: string[]; expected: string }[] = [
    { flags: { visited_edda: true }, log: [old], expected: "shifts are still posted" },
    { flags: { visited_edda: true, archive_method_face: true }, log: [old], expected: "shift remains suspended" },
    { flags: { visited_nia: true, nia_contact_paused: true }, log: ["Offer no further questions. Let her pause contact."], expected: "recorder stays off" },
    { flags: { visited_nia: true, nia_contact_paused: true, nia_contact_relay: true }, log: ["Accept a clinic relay; Nia decides whether to answer."], expected: "places at the neighborhood table" },
  ];
  for (const [index, item] of cases.entries()) {
    const state = fixture("act3_neighborhood", { flags: item.flags, log: item.log });
    if (!index) await openRun(page, state);
    else { await page.evaluate(run => localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)), state); await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run")); }
    const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
    await expect(page.getByTestId("scene-text")).toContainText(item.expected);
    await expect(page.getByTestId("goal")).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload(); await keyboardActivate(page, page.getByTestId("continue-run"));
    await expect(page.getByTestId("scene-text")).toContainText(item.expected);
    expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
    expect(JSON.parse(before!).flags.nia_public_consent).toBeUndefined();
    expect(JSON.parse(before!).journal.some((entry: { id: string }) => entry.id === "nia-account")).toBe(false);
  }
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
