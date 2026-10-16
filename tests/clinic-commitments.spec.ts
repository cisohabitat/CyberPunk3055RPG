import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { playClinicOverlap } from "../lib/clinic-overlap";
import { replayCampaign } from "../lib/story-replay";
import type { GameState } from "../lib/types";

const spec = { origin: "spire", stat: "face", complication: "debt", goal: "witness", income: "no-sale", spending: "care-first", order: "witness-first", recovery: "late", transport: "volunteer" } as const;
function before(id: string, clinicFirst = false) {
  const run = playClinicOverlap({ ...spec, origin: clinicFirst ? "dustline" : "spire", order: clinicFirst ? "clinic-first" : "witness-first" }, 1);
  const index = run.steps.findIndex(s => s.choiceId === id);
  if (index < 0) throw new Error(`Sample missing ${id}`);
  return replayCampaign({ ...run.replay, steps: run.steps.slice(0, index), expected: { sceneId: "act2_middle" } }).state;
}
for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  for (const mode of ["deferred", "budget"] as const) test(`clinic commitments ${mode}: free keyboard directions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = mode === "deferred" ? before("work-witness-shift") : before("help-clinic-pump", true);
    const errors: string[] = [], artRequests: string[] = [];
    page.on("pageerror", e => errors.push(e.message)); page.on("request", r => { if (r.url().includes("/art/")) artRequests.push(r.url()); });
    await page.addInitScript(({ state, artwork }) => {
      if (sessionStorage.getItem("clinic-commitment-test")) return;
      localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
      localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork, sound: false, reading: "all", textStep: 2, contrast: "high", motion: "reduce" }));
      sessionStorage.setItem("clinic-commitment-test", "true");
    }, { state, artwork });
    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!) as GameState);
    await page.goto("/"); await page.getByTestId("continue-run").click();
    await expect(page.getByTestId("goal")).toBeInViewport();
    const panel = page.getByTestId("objectives"), disclosure = panel.locator("details").first();
    await expect(disclosure).not.toHaveAttribute("open", "");
    await disclosure.locator("summary").focus(); await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("open", "");
    expect(await saved()).toEqual(state);
    if (mode === "budget") {
      await expect(page.getByTestId("care-budget")).toContainText("cannot cover both paid fallbacks");
      await expect(page.getByTestId("care-budget")).toContainText("90");
      await expect(page.getByTestId("care-budget")).toContainText("35");
      const find = page.getByTestId("find-commitment-protect-witness");
      await find.focus(); await page.keyboard.press("Enter");
      await expect(page.getByTestId("choice-protect-witness")).toBeFocused(); expect(await saved()).toEqual(state);
    } else {
      await expect(panel).toContainText("Nia has a safe room");
      await expect(page.getByTestId("find-commitment-work-witness-shift")).toBeVisible();
      const find = page.getByTestId("find-commitment-return-witness");
      expect((await find.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await find.focus(); await page.keyboard.press("Enter");
      const target = page.getByTestId("choice-return-witness"); await expect(target).toBeFocused();
      expect(await saved()).toEqual(state);
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("choice-review-account")).toBeVisible();
      const returned = await saved(); expect(returned.flags.witness_consent).toBeUndefined(); expect(returned.creds).toBe(state.creds); expect(returned.rolls).toEqual(state.rolls);
      await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved()).toEqual(returned);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]); if (artwork === "none") expect(artRequests).toEqual([]);
  });
}
