import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixture, openRun } from "./fixtures/game";

for (const [width, none] of [[390, false], [1440, false], [320, true]] as const) test(`directed art retains conduct and stages four finales at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
  const requests: string[] = []; page.on("request", request => { if (request.url().includes("/art/")) requests.push(request.url()); });
  await page.addInitScript(none => localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork: none ? "none" : "full", textStep: none ? 2 : 0, contrast: none ? "high" : "standard", reading: "all", motion: "reduce" })), none);
  await openRun(page, fixture("act3_kerr_collection", { flags: { kerr_route_private: true, kerr_route_trace: true, kerr_route_delivered: true, kerr_route_acknowledged: true } }));
  if (!none) await expect(page.locator(".scene-row .portrait")).toHaveAttribute("src", "/art/kerr-closed.jpg");
  const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y + goal!.height).toBeLessThan(844);
  await expect(page.getByTestId("scene-text")).toContainText("Don't call this private");
  for (const id of ["names", "quiet", "witness", "listed"]) {
    const run = fixture(`ending_${id}`, { flags: { confirmed_leak: true, betrayed_lumen: true, kerr_route_trace: true } });
    await page.evaluate(run => localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)), run);
    await page.reload(); await page.getByTestId("continue-run").click();
    const plate = page.getByTestId("scene-illustration");
    if (none) await expect(plate).toHaveCount(0);
    else {
      await expect(plate.locator("img")).toHaveAttribute("src", `/art/finale-${id}.jpg`);
      await plate.scrollIntoViewIfNeeded();
      await expect.poll(() => plate.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    await expect(page.getByTestId("aftermath-details")).not.toHaveAttribute("open");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(saved.flags).toEqual(run.flags);
  }
  if (none) expect(requests).toEqual([]);
});

test("unavailable directed scene and portrait art leaves the job readable and playable", async ({ page }) => {
  await page.route("**/art/**", route => route.abort());
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", motion: "reduce" })));
  await openRun(page, fixture());
  await expect(page.locator(".art-unavailable")).toContainText("Quill waits");
  await expect(page.locator(".scene-row .portrait-placeholder")).toBeVisible();
  await expect(page.getByTestId("goal")).toBeVisible();
  await expect(page.getByTestId("scene-text")).toContainText("Mara Voss");
  await page.getByTestId("choice-accept").click();
  await expect(page.getByTestId("scene-text")).toBeVisible();
});

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
