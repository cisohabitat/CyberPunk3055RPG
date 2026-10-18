import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { BRAND_MARK } from "../lib/brand-mark";
import { createCharacter, commitChoice, presentChoices, getScene } from "../lib/engine";
import { installAudioReview, type AudioReview } from "../qa/production/audio-review";
const run = { ...createCharacter({ handle: "Brand cue", givenName: "Jo", origin: "dustline", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "lumen_deal", strain: 3 };
const audio = (page: Page): Promise<AudioReview> => page.evaluate(() => (window as unknown as { audioReview: AudioReview }).audioReview);
const dice = (names: string[]) => names.filter(n => n.startsWith("dice-"));
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, preferences = {}) {
  await page.addInitScript(installAudioReview, {});
  await page.addInitScript(({ run, preferences }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true, music: 0, ambience: 0, effects: 70, voices: 0, autoVoices: false, artwork: "none", motion: "reduce", ...preferences }));
  }, { run, preferences });
  await page.goto("/"); await page.getByTestId("continue-run").click(); await page.getByTestId("choice-fake-pact").click();
}

test("loading markup, favicon and actual game header share the simplified approved emblem", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain('class="boot"'); expect(html).toContain('data-brand="halo-shard"');
  await open(page, { sound: false }); await page.getByRole("button", { name: "Back", exact: true }).click();
  const mark = page.locator('.topbar [data-brand="halo-shard"]');
  await expect(mark).toHaveAttribute("aria-hidden", "true");
  for (const path of Object.values(BRAND_MARK)) await expect(mark.locator(`path[d="${path}"]`)).toHaveCount(1);
  const iconPath = await page.locator('link[rel="icon"]').first().getAttribute("href");
  const icon = await (await request.get(iconPath!)).text();
  for (const path of Object.values(BRAND_MARK)) expect(icon).toContain(`d="${path}"`);
  expect(await page.getByTestId("scene").locator("img").count()).toBe(0);
});

test("title pointer, keyboard and pressed feedback preserve actions and a disabled music control", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, music: 0, artwork: "none", motion: "system" })));
  await page.goto("/"); const button = page.getByTestId("new-run"), before = (await button.boundingBox())!;
  await button.hover();
  // Touch profiles need not expose hover; keyboard feedback is always available.
  await button.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
  await expect(button).toBeFocused(); await expect(button).toHaveCSS("outline-width", "3px");
  await expect.poll(() => button.evaluate(el => getComputedStyle(el, "::before").opacity)).toBe("1");
  const after = (await button.boundingBox())!; expect(after.width).toBe(before.width); expect(after.height).toBe(before.height);
  await expect(page.getByRole("button", { name: "Play menu music", exact: true })).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Enter"); await expect(page.getByTestId("handle-input")).toBeVisible();
});

for (const [motion, os] of [["reduce", "no-preference"], ["system", "reduce"]] as const) test(`menu feedback honors ${motion}/${os}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: os });
  await page.addInitScript(motion => localStorage.setItem("saint-shard-preferences", JSON.stringify({ motion, sound: false })), motion);
  await page.goto("/"); const button = page.getByTestId("new-run"); await button.focus();
  await expect(button).toHaveCSS("transition-duration", "0s");
  expect(await button.evaluate(el => getComputedStyle(el, "::before").transitionDuration)).toBe("0s");
  await page.keyboard.down("Space"); await expect(button).toHaveCSS("transform", "none");
  await page.keyboard.up("Space"); await expect(page.getByTestId("handle-input")).toBeVisible();
});

test("one rattle and one landing accompany a fresh roll without changing its staged result", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" }); await open(page, { motion: "system" });
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 100));
  await page.evaluate(() => { Math.random = () => .91; }); await page.getByTestId("roll-button").click();
  await expect.poll(async () => dice((await audio(page)).started)).toEqual(["dice-tumble.wav"]);
  const staged = JSON.parse((await saved(page))!); expect(staged.pendingCheck.roll).toBe(10);
  await page.clock.runFor(701);
  await expect.poll(async () => dice((await audio(page)).started)).toEqual(["dice-tumble.wav", "dice-land-ten.wav"]);
  expect(JSON.parse((await saved(page))!)).toEqual(staged);
  const choice = presentChoices(staged, getScene(staged.sceneId)).find(c => c.id === "fake-pact")!;
  await page.getByTestId("continue-check").click(); expect(JSON.parse((await saved(page))!)).toEqual(commitChoice(staged, choice, { roll: 10 }).state);
  expect((await audio(page)).started).not.toContain("dice-tick.wav");
});

for (const [face, landing] of [[1, "one"], [6, "miss"], [8, "success"], [10, "ten"]] as const) test(`reduced-motion face ${face} plays its correct landing once and restored dice stay silent`, async ({ page }) => {
  await open(page); await page.evaluate(face => { Math.random = () => (face - .5) / 10; }, face);
  await page.getByTestId("roll-button").click();
  await expect.poll(async () => dice((await audio(page)).started)).toEqual([`dice-land-${landing}.wav`]);
  await expect.poll(async () => (await audio(page)).disposed).toContain(`dice-land-${landing}.wav`);
  const before = await saved(page); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("check-die")).toHaveText(String(face)); expect(await saved(page)).toBe(before);
  expect(dice((await audio(page)).started)).toEqual([]);
});

for (const preference of [{ sound: false }, { effects: 0 }]) test(`dice audio honors saved ${JSON.stringify(preference)}`, async ({ page }) => {
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/audio/dice-")) requests.push(r.url()); });
  await open(page, preference); await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("continue-check")).toBeVisible(); expect(requests).toEqual([]); expect(dice((await audio(page)).started)).toEqual([]);
});

test("a delayed landing cannot play after Continue", async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/audio/dice-land-ten.wav", async route => { const response = await route.fetch(); await gate; await route.fulfill({ response }); });
  const requested = page.waitForRequest("**/audio/dice-land-ten.wav");
  await open(page); await page.evaluate(() => { Math.random = () => .91; }); await page.getByTestId("roll-button").click();
  await requested; await page.getByTestId("continue-check").click(); release();
  await expect.poll(async () => (await audio(page)).decoded).toContain("dice-land-ten.wav");
  expect(dice((await audio(page)).started)).toEqual([]);
});

test("pagehide cancels the rattle and its pending landing without changing the held face", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" }); await open(page, { motion: "system" });
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 100));
  await page.evaluate(() => { Math.random = () => .91; }); await page.getByTestId("roll-button").click();
  await expect.poll(async () => dice((await audio(page)).started)).toEqual(["dice-tumble.wav"]);
  const before = await saved(page); await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect.poll(async () => (await audio(page)).disposed).toContain("dice-tumble.wav");
  await page.clock.runFor(701); await expect(page.getByTestId("continue-check")).toBeVisible();
  expect(dice((await audio(page)).started)).toEqual(["dice-tumble.wav"]); expect(await saved(page)).toBe(before);
});

test("unavailable dice audio leaves the exact result and Continue usable", async ({ page }) => {
  await page.route("**/audio/dice-*.wav", r => r.fulfill({ status: 404, body: "Unavailable" }));
  await open(page); await page.evaluate(() => { Math.random = () => .91; }); await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("continue-check")).toBeVisible(); await expect(page.getByTestId("check-die")).toHaveText("10");
  await page.getByTestId("continue-check").click(); await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(JSON.parse((await saved(page))!).pendingCheck).toBeUndefined();
});
