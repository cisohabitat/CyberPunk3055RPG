import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { commitChoice, getScene, presentChoices } from "../lib/engine";
import { exportRun } from "../lib/vault";
import { fixture, openRun } from "./fixtures/game";

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
  await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("continue-run").click(); await page.getByTestId("choice-haggle").click(); await page.getByTestId("roll-button").click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(stored.pendingCheck.roll).toBeGreaterThanOrEqual(1);
  let releaseFonts!: () => void; const fonts = new Promise<void>(resolve => { releaseFonts = resolve; });
  // Restore must be usable while optional font requests remain outstanding.
  // Waiting for window.load would couple saved dice to those media requests.
  await page.route("**/fonts/*.woff2", async route => { await fonts; await route.continue(); });
  try {
    await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("continue-run").click();
    await expect(page.getByTestId("roll-button")).toHaveCount(0); await expect(page.getByTestId("continue-check")).toBeVisible();
    await expect(page.locator(".total")).toContainText(String(stored.pendingCheck.roll));
    await page.getByTestId("continue-check").click();
    const committed = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
    expect(committed.pendingCheck).toBeUndefined(); expect(committed.rolls).toHaveLength(1); expect(errors).toEqual([]);
    expect(committed.rolls[0].roll).toBe(stored.pendingCheck.roll);
  } finally { releaseFonts(); }
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
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0.75; });
  await openRun(page);
  let expected = fixture();
  const route = ["ask-pay", "haggle", "pocket", "accept", "side", "spoof-door", "go", "honest", "pact-copy", "copy", "heard", "inspect-hour", "inspect-signature", "inspect-order", "inspect-roster", "reconstruct", "separate-decisions", "label-unverified", "seal-witness", "talk-leave", "both", "week-after", "into-week", "practice", "learn-ghost", "read-board", "origin-contract", "clear-key", "return-board", "to-lumen", "hear-lumen", "walk-with-her", "protect-witness", "agree-terms", "use-existing-plan", "pay-room", "review-account", "file-account", "stand", "back-to-board", "to-the-wall", "to-ward-nine", "visit-nia", "acknowledge-nia", "face-sera", "read-names"];
  for (const id of route) {
    const choice = presentChoices(expected, getScene(expected.sceneId)).find(choice => choice.id === id && choice.enabled)!;
    expect(choice, `${expected.sceneId}/${id}`).toBeDefined();
    expected = commitChoice(expected, choice, choice.check ? { roll: 8 } : undefined).state;
    await page.getByTestId(`choice-${id}`).click({ timeout: 10_000 });
    if (choice.check) {
      await page.getByTestId("roll-button").click({ timeout: 10_000 }); await page.getByTestId("continue-check").click({ timeout: 10_000 });
    }
    // Verify every persisted outcome, not just the final flags. Each action and
    // state assertion remains bounded independently of the campaign watchdog.
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(expected);
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
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "paragraph" })));
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
  await page.addInitScript(() => localStorage.setItem("saint-shard-sound", "off"));
  await openRun(page, fixture("memory_table", { items: ["shard"], flags: { heard_memo: true } }));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const score = page.waitForResponse((response) => response.url().endsWith("/audio/theme-chapel.flac") && response.status() === 200);
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
