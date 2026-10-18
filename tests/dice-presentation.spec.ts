import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter, commitChoice, getScene, presentChoices } from "../lib/engine";

const run = { ...createCharacter({ handle: "Die review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "lumen_deal", strain: 3 };
const saved = (page: Page) => page.evaluate(() => localStorage.getItem("saint-shard-3055-v1"));
async function open(page: Page, motion = "system") {
  await page.addInitScript(({ run, motion }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, autoVoices: false, artwork: "none", motion }));
  }, { run, motion });
  await page.goto("/"); await page.getByTestId("continue-run").click(); await page.getByTestId("choice-fake-pact").click();
}

test("animated die stages exactly one face, hides interim numbers from speech and commits only on Continue", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" }); await open(page);
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 100));
  await page.evaluate(() => { Math.random = () => .91; });
  await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("dice-roll-stage")).toBeVisible();
  const die = page.getByTestId("check-die");
  await expect(die).toHaveCount(1); await expect(die).toHaveAttribute("aria-hidden", "true");
  await expect(die.locator(".die-form")).toHaveCSS("animation-name", "die-tumble");
  const staged = JSON.parse((await saved(page))!);
  expect(staged.pendingCheck.roll).toBe(10); expect(staged.rolls).toHaveLength(run.rolls.length); expect(staged.strain).toBe(run.strain);
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByTestId("continue-check")).toHaveCount(0);
  await page.clock.runFor(701);
  await expect(page.getByTestId("dice-roll-stage")).toHaveCount(0);
  await expect(die).toHaveAttribute("data-phase", "settled"); await expect(die).toHaveText("10");
  await expect(die.locator(".die-form")).toHaveCSS("animation-name", "none");
  const choice = presentChoices(staged, getScene(staged.sceneId)).find(c => c.id === "fake-pact")!;
  const expected = commitChoice(staged, choice, { roll: 10 });
  await expect(page.locator(".total")).toContainText(`10 + ${expected.check!.bonus} = ${expected.check!.total}`);
  expect(JSON.parse((await saved(page))!)).toEqual(staged);
  await page.getByTestId("continue-check").click(); expect(JSON.parse((await saved(page))!)).toEqual(expected.state);
});

for (const [motion, os] of [["reduce", "no-preference"], ["system", "reduce"]] as const) {
  test(`die honors ${motion} setting with ${os} system motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: os }); await open(page, motion);
    await page.evaluate(() => { Math.random = () => .01; }); await page.getByTestId("roll-button").click();
    await expect(page.getByTestId("continue-check")).toBeFocused();
    await expect(page.getByTestId("dice-roll-stage")).toHaveCount(0);
    await expect(page.getByTestId("check-die")).toHaveText("1");
    await expect(page.getByTestId("check-die").locator(".die-form")).toHaveCSS("animation-name", "none");
    expect(JSON.parse((await saved(page))!).pendingCheck.roll).toBe(1);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("reload during a tumble reveals the saved face without another animation or roll", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" }); await open(page);
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 100));
  await page.evaluate(() => { Math.random = () => .31; }); await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("dice-roll-stage")).toBeVisible(); const before = await saved(page);
  expect(JSON.parse(before!).pendingCheck.roll).toBe(4);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("check-die")).toHaveText("4");
  await expect(page.getByTestId("check-die")).toHaveAttribute("data-phase", "settled");
  await expect(page.getByTestId("check-die").locator(".die-form")).toHaveCSS("animation-name", "none");
  await expect(page.getByTestId("roll-button")).toHaveCount(0); expect(await saved(page)).toBe(before);
});

test("forced colors retains the face, outcome text and keyboard Continue", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" }); await open(page, "reduce");
  await page.evaluate(() => { Math.random = () => .91; }); await page.getByTestId("roll-button").click();
  await expect(page.getByTestId("check-die")).toHaveText("10");
  await expect(page.locator(".check-outcome")).toHaveText("Success");
  await expect(page.getByTestId("continue-check")).toBeFocused();
  expect(await page.getByTestId("check-die").locator(".die-edges").evaluate(el => getComputedStyle(el).stroke)).not.toBe("none");
  await page.keyboard.press("Enter"); await expect(page.getByRole("dialog")).toHaveCount(0);
});
