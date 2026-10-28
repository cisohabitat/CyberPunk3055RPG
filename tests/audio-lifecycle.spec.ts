import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixture, openRun } from "./fixtures/game";
import { observeVoices, voiceReview, observeBeds, bedReview } from "./fixtures/audio";

test("present-day room quotes follow refusal and handover terms without autoplay", async ({ page }) => {
  await observeBeds(page);
  const requests: string[] = []; page.on("request", request => { if (request.url().includes("/audio/voice-")) requests.push(request.url()); });
  const cases = [
    ["act2_witness_arrival", {}, "Nia Pell", "voice-nia-arrival", "witness"],
    ["act2_response_invitation", {}, "Mara", "voice-mara-response", "clinic"],
    ["act2_response_refusal", { response_public_refused: true }, "Mara", "voice-mara-public-refusal", "clinic"],
    ["act2_route_receipt", {}, "Kerr", "voice-kerr-handover-private", "stall"],
    ["act2_route_receipt", { kerr_route_private: true, kerr_route_trace: true }, "Kerr", "voice-kerr-handover-breached", "stall"],
    ["act2_route_receipt", { kerr_route_registered: true, kerr_route_trace: true }, "Kerr", "voice-kerr-handover-registered", "stall"],
  ] as const;
  for (const [index, [sceneId, flags, speaker, voice, room]] of cases.entries()) {
    if (!index) await openRun(page, fixture(sceneId, { flags }));
    else { await page.evaluate(run => localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)), fixture(sceneId, { flags })); await page.reload(); await page.getByTestId("continue-run").click(); }
    await expect.poll(async () => (await bedReview(page)).started).toContain(`ambience-${room}.flac`);
    const before = await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1")), count = requests.length;
    const listen = page.getByRole("button", { name: `Listen to ${speaker}`, exact: true });
    await expect(listen).toBeVisible(); expect(requests.length).toBe(count);
    await listen.click(); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
    expect(requests.at(-1)).toContain(`${voice}.wav`);
    await page.getByRole("button", { name: "Stop line", exact: true }).click();
    expect(await page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"))).toBe(before);
  }
  await page.evaluate(run => localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)), fixture("act2_response_refusal", { flags: { response_clinic_refused: true } }));
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByRole("button", { name: "Listen to Lumen", exact: true })).toBeVisible();
  await expect(page.getByTestId("voice-line")).toContainText("A chair and a lamp are what I offered.");
});

test("leaving the clinic cancels its late ambience while the new district keeps playing", async ({ page }) => {
  await observeBeds(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/ambience-clinic.flac", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await openRun(page, fixture("act2_response_invitation"));
  await page.getByTestId("choice-decline-response-request").click();
  await expect.poll(async () => (await bedReview(page)).started).toContain("theme-week.flac");
  release(); await expect.poll(async () => (await bedReview(page)).decoded).toContain("ambience-clinic.flac");
  expect((await bedReview(page)).started).not.toContain("ambience-clinic.flac");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.response_declined).toBe(true); expect(run.flags.response_sent).toBeUndefined();
});

test("directed audio follows the saved local window without spending or rerolling for sound", async ({ page }) => {
  await observeBeds(page); await page.addInitScript(() => { Math.random = () => .75; });
  await openRun(page, fixture("chapel_window_plan", { flags: { chapel_window_started: true, chapel_window_2: true, chapel_window_scouted: true } }));
  await expect.poll(async () => (await bedReview(page)).started).toContain("theme-pressure.flac");
  await expect.poll(async () => (await bedReview(page)).started).toContain("ambience-chapel.flac");
  await page.getByTestId("choice-window-use-gap").click(); await page.getByTestId("roll-button").click();
  const recorded = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(recorded.pendingCheck.roll).toBe(8); expect(recorded.flags.chapel_window_2).toBe(true);
  await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("continue-check").click();
  await expect.poll(async () => (await bedReview(page)).started).toContain("theme-pressure.flac");
  await page.getByTestId("choice-window-quiet-exit").click();
  await expect.poll(async () => (await bedReview(page)).started).toContain("theme-chapel.flac");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.chapel_window_0).toBe(true); expect(run.flags.chapel_window_done).toBe(true); expect(run.pendingCheck).toBeUndefined();
  await page.getByRole("button", { name: "Settings", exact: true }).click(); await page.getByLabel("Sound enabled", { exact: true }).uncheck(); await page.getByRole("button", { name: "Done", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(run);
});

test("directed audio cancels an obsolete pending bed without delaying the new district", async ({ page }) => {
  await observeBeds(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/theme-pressure.flac", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await openRun(page, fixture("chapel_window_plan", { flags: { chapel_window_started: true, chapel_window_2: true } }));
  await page.getByTestId("choice-pause-chapel-window").click();
  await expect.poll(async () => (await bedReview(page)).started).toContain("theme.flac");
  release(); await expect.poll(async () => (await bedReview(page)).decoded).toContain("theme-pressure.flac");
  expect((await bedReview(page)).started).not.toContain("theme-pressure.flac");
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(run.flags.chapel_window_2).toBe(true);
});

test("directed audio returning to an active bed cancels a late pressure start", async ({ page }) => {
  await observeBeds(page); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/theme-pressure.flac", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  await openRun(page, fixture("route", { flags: { chapel_window_started: true, chapel_window_2: true } }));
  await expect.poll(async () => (await bedReview(page)).started.filter(name => name !== "theme-title.flac").length).toBe(2);
  const initial = (await bedReview(page)).started;
  await page.getByTestId("choice-begin-chapel-window").click();
  await page.getByTestId("choice-pause-chapel-window").click();
  release(); await expect.poll(async () => (await bedReview(page)).decoded).toContain("theme-pressure.flac");
  expect((await bedReview(page)).started).toEqual(initial);
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).flags.chapel_window_2).toBe(true);
});

test("directed audio keeps available ambience and readable dialogue when music and voice fail", async ({ page }) => {
  await observeBeds(page); await page.route("**/audio/theme-reading.flac", route => route.abort()); await page.route("**/audio/voice-campaign-mara-revelation-performance.mp3", route => route.abort());
  await openRun(page, fixture("memo"));
  await expect.poll(async () => (await bedReview(page)).started).toContain("ambience-chapel.flac");
  await page.getByRole("button", { name: "Listen to Mara" }).click(); await expect(page.getByTestId("voice-line")).toContainText("Voice unavailable");
  await expect(page.getByTestId("scene-text")).toContainText("I signed the coolant dump");
  await page.getByTestId("choice-heard").click();
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).flags.heard_memo).toBe(true);
});

test("directed dialogue candidates require Listen at the offer, revelation, boundaries and four finales", async ({ page }) => {
  await observeVoices(page);
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true, autoVoices: false, reading: "all", motion: "reduce" })));
  const requests: string[] = []; page.on("request", request => { if (request.url().includes("/audio/voice-")) requests.push(request.url()); });
  const scenes = [["stall", "Quill"], ["memo", "Mara"], ["act3_kerr_collection_response", "Kerr"], ["act3_lumen_boundary", "Lumen"], ["ending_names", "Sera"], ["ending_quiet", "Sera"], ["ending_witness", "Sera"], ["ending_listed", "Ives"]];
  for (const [index, [scene, speaker]] of scenes.entries()) {
    if (!index) await openRun(page, fixture(scene));
    else { await page.evaluate(run => localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)), fixture(scene)); await page.reload(); await page.getByTestId("continue-run").click(); }
    const before = requests.length; await expect(page.getByRole("button", { name: `Listen to ${speaker}` })).toBeVisible(); expect(requests.length).toBe(before);
    expect((await voiceReview(page)).started).toBe(0);
    await page.getByRole("button", { name: `Listen to ${speaker}` }).click(); await expect.poll(async () => (await voiceReview(page)).started).toBe(1);
    if (await page.getByRole("button", { name: "Stop line" }).count()) await page.getByRole("button", { name: "Stop line" }).click();
    expect(requests.length).toBe(before + 1);
  }
});

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
  expect((await voiceReview(page)).gains).toContain(0.6 * 0.22);
  expect((await voiceReview(page)).gains).toContain(0.5 * 0.44);
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

for (const [sceneId, speaker, voice, choiceId] of [
  ["act2_mara_company", "Mara", "voice-mara-company", "stay-with-mara-wait"],
  ["act2_lumen_quiet", "Lumen", "voice-lumen-staying", "keep-lumen-quiet-answer"],
  ["act3_kerr_personal_question", "Kerr", "voice-kerr-personal", "keep-kerr-personal-answer"],
] as const) test(`${speaker} personal voice reveals explicitly and restores the scene mix after end, Stop and departure`, async ({ page }) => {
  await observeVoices(page);
  const requests: string[] = []; page.on("request", request => { if (request.url().includes("/audio/voice-")) requests.push(request.url()); });
  await openRun(page, fixture(sceneId, { flags: { response_private_consent: true, kerr_contact_open: true } }));
  const saved = () => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
  const before = await saved();
  await expect(page.getByTestId("voice-line")).toHaveCount(0); expect(requests).toEqual([]);
  await page.getByTestId("next-paragraph").click();
  const listen = page.getByRole("button", { name: `Listen to ${speaker}`, exact: true });
  await expect(listen).toBeVisible(); expect(requests).toEqual([]);
  await listen.click(); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
  expect(requests.at(-1)).toContain(`${voice}.wav`);
  const ducked = (await voiceReview(page)).scheduled;
  expect(ducked).toContainEqual({ value: 0.6 * 0.22, settling: 0.04 });
  expect(ducked).toContainEqual({ value: 0.5 * 0.44, settling: 0.04 });
  const atStop = ducked.length;
  await page.getByRole("button", { name: "Stop line", exact: true }).click();
  expect((await voiceReview(page)).scheduled.slice(atStop)).toContainEqual({ value: 0.6, settling: 0.18 });
  expect((await voiceReview(page)).scheduled.slice(atStop)).toContainEqual({ value: 0.5, settling: 0.18 });
  expect(await saved()).toBe(before);
  await listen.click(); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
  const atEnd = (await voiceReview(page)).scheduled.length;
  await expect(listen).toBeVisible({ timeout: 20_000 });
  expect((await voiceReview(page)).scheduled.slice(atEnd)).toContainEqual({ value: 0.6, settling: 0.18 });
  expect((await voiceReview(page)).scheduled.slice(atEnd)).toContainEqual({ value: 0.5, settling: 0.18 });
  expect(requests).toHaveLength(1); expect(await saved()).toBe(before);
  await page.getByTestId("show-rest").click();
  await listen.click(); await expect(page.getByTestId("voice-line")).toContainText("Playing selected dialogue");
  const stopped = (await voiceReview(page)).stopped;
  await page.getByTestId(`choice-${choiceId}`).click();
  await expect.poll(async () => (await voiceReview(page)).stopped).toBeGreaterThan(stopped);
  await expect(page.getByTestId("voice-line")).toHaveCount(0);
  expect(requests).toHaveLength(1);
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
