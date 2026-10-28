import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixture, openRun, spireFixture, readSpireSources } from "./fixtures/game";

for (const [sceneId, path, pixels] of [["act3_witness_visit", "/art/nia-speaking.jpg", 600], ["act3_edda_visit", "/art/edda.jpg", 440], ["act2_freight_brief", "/art/asa.jpg", 440]] as const) test(`generated character portrait loads for ${sceneId}`, async ({ page }) => {
  await openRun(page, fixture(sceneId));
  const portrait = page.locator("img.portrait").first(); await expect(portrait).toHaveAttribute("src", path);
  expect(await portrait.evaluate((image: HTMLImageElement) => image.decode().then(() => image.naturalWidth))).toBe(pixels);
  await expect(page.getByTestId("goal")).toBeInViewport();
});

for (const [sceneId, name] of [["opening_city", "opening"], ["memory_table", "memory-bench"], ["act2_shelter_brief", "shelter-conversation"], ["act2_freight_brief", "asa-dispatch"], ["act2_spire_brief", "spire-counter"], ["act2_spire_methods", "spire-terminal"], ["act3_spire_visit", "spire-payroll"]]) test(`encounter illustration ${sceneId} preserves largest-text phone goals`, async ({ page }) => {
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
  type DecodedScore = { name: string; channels: number; duration: number; sampleRate: number };
  await page.addInitScript(() => {
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true, autoVoices: false, reading: "paragraph" }));
    const recorded = window as unknown as { decodedScores: DecodedScore[] };
    recorded.decodedScores = [];
    const names = new WeakMap<ArrayBuffer, string>();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = function() {
      const name = this.url.split("/").at(-1) ?? "unnamed";
      return arrayBuffer.call(this).then(data => { names.set(data, name); return data; });
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function(data: ArrayBuffer) {
      return decode.call(this, data).then((buffer) => { recorded.decodedScores.push({ name: names.get(data) ?? "unnamed", channels: buffer.numberOfChannels, duration: buffer.duration, sampleRate: buffer.sampleRate }); return buffer; });
    };
  });
  await openRun(page, fixture("districts"));
  await expect.poll(() => page.evaluate(() => (window as unknown as { decodedScores: DecodedScore[] }).decodedScores)).toEqual(expect.arrayContaining([expect.objectContaining({ name: "theme-week.flac", channels: 2 })]));
  const score = await page.evaluate(() => (window as unknown as { decodedScores: DecodedScore[] }).decodedScores.find((buffer) => buffer.name === "theme-week.flac")!);
  // Identify the gameplay score, even when the automatic title theme decoded
  // first. WebKit resampling can trim one frame from the 32-second PCM master.
  expect(Math.abs(score.duration - 32)).toBeLessThanOrEqual(1 / score.sampleRate + Number.EPSILON);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Sound enabled", { exact: true }).uncheck(); await page.getByRole("button", { name: "Done", exact: true }).click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.sceneId).toBe("districts"); expect(run.pendingCheck).toBeUndefined();
});

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
  // This flow audits source art, keyboard input and saves. Dedicated voice
  // suites cover sound; don't queue unrelated audio work for every placement.
  await page.addInitScript((none) => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, ...(none ? { artwork: "none", textStep: 2, contrast: "high" } : {}) })), textOnly);
  const artwork: string[] = []; page.on("request", (request) => { if (request.url().includes("/art/")) artwork.push(request.url()); });
  await openRun(page, fixture("memory_reconstruction", { flags: { heard_memo: true, memory_signature: true, memory_order: true, memory_roster: true } }));
  await page.getByTestId("choice-assemble-timeline").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  if (textOnly) await expect(page.getByTestId("scene-illustration")).toHaveCount(0);
  else expect(await page.getByTestId("scene-illustration").locator("img").evaluate((img: HTMLImageElement) => img.decode().then(() => img.naturalWidth))).toBeGreaterThan(0);
  await page.getByTestId("memory-workspace").getByText("The signature · available", { exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("memory-workspace")).toContainText("02:13");
  if (!textOnly) {
    const sourceImage = page.getByTestId("memory-workspace").locator(".source-art img");
    // Native lazy loading needs viewport entry; decode() alone need not fetch.
    await sourceImage.scrollIntoViewIfNeeded();
    expect(await sourceImage.evaluate((img: HTMLImageElement) => img.decode().then(() => img.naturalWidth))).toBeGreaterThan(0);
  }
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
