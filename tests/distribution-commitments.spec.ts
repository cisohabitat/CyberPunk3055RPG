import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { playDistribution } from "../lib/distribution-overlap";
import { commitChoice, getScene } from "../lib/engine";
import { replayCampaign } from "../lib/story-replay";
import type { GameState } from "../lib/types";
const spec = { origin: "spire", stat: "face", complication: "debt", goal: "witness", income: "no-sale", spending: "care-first", order: "clinic-first", recovery: "late", transport: "trained", distribution: "carrier", interleave: true } as const;
const run = playDistribution(spec, 1);
function before(id: string, sceneId: string, occurrence = 0) {
  const indices = run.steps.flatMap((s, i) => s.choiceId === id ? [i] : []);
  return replayCampaign({ ...run.replay, steps: run.steps.slice(0, indices[occurrence]), expected: { sceneId } }).state;
}
for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) {
  for (const mode of ["paused", "dispatch", "reply", "courier"] as const) test(`distribution ${mode} stays distinct from witness consent at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let state = mode === "paused" || mode === "courier" ? before("help-clinic-notice", "act2_middle", 1) : mode === "dispatch" ? before("stand", "act2_middle") : before("record-private-reply", "act3_notice_visit");
    if (mode === "courier") for (const id of ["help-clinic-notice", "accept-notice", "plan-notice", "courier-notice"]) state = commitChoice(state, getScene(state.sceneId).choices.find(c => c.id === id)!).state;
    const errors: string[] = [], artworkRequests: string[] = [];
    page.on("pageerror", e => errors.push(e.message)); page.on("request", r => { if (r.url().includes("/art/")) artworkRequests.push(r.url()); });
    await page.addInitScript(({ state, artwork }) => {
      if (sessionStorage.getItem("distribution-test")) return;
      localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
      localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork, sound: false, reading: "all", textStep: 2, contrast: "high", motion: "reduce" }));
      sessionStorage.setItem("distribution-test", "true");
    }, { state, artwork });
    const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!) as GameState);
    await page.goto("/"); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("goal")).toBeInViewport();
    const panel = page.getByTestId("objectives"); await panel.locator("details > summary").first().focus(); await page.keyboard.press("Enter");
    expect(await saved()).toEqual(state);
    if (mode === "paused") {
      await expect(panel).toContainText("3 early / 3 later"); await expect(panel).toContainText("Dispatch has not accepted");
      await expect(page.getByTestId("choice-stand")).toContainText("Clinic appointment information");
      await expect(page.getByTestId("choice-stand")).toContainText("Protect Nia Pell");
      const find = page.getByTestId("find-commitment-help-clinic-notice");
      expect((await find.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await find.focus(); await page.keyboard.press("Enter"); await expect(page.getByTestId("choice-help-clinic-notice")).toBeFocused();
      expect(await saved()).toEqual(state);
      // Closing is allowed; it must retain both missing commitments honestly.
      await page.getByTestId("choice-stand").focus(); await page.keyboard.press("Enter");
      await page.getByTestId("choice-back-to-board").focus(); await page.keyboard.press("Enter");
      const closed = await saved(); expect(closed.flags.notice_done).toBeUndefined(); expect(closed.flags.witness_consent).toBeUndefined();
      expect(closed.creds).toBe(state.creds); expect(closed.rolls).toEqual(state.rolls);
      await page.reload(); await page.getByTestId("continue-run").click(); expect(await saved()).toEqual(closed);
    } else if (mode === "dispatch") {
      await expect(panel).toContainText("Ward Nine after the Week");
      await expect(page.getByTestId("choice-stand")).not.toContainText("Check clinic distribution");
      await expect(page.getByTestId("choice-stand")).not.toContainText("campaign promise");
      expect((await saved()).flags.notice_receipt_observed).toBeUndefined();
    } else if (mode === "courier") {
      await expect(panel).toContainText("Private dispatch was accepted.");
      await expect(panel).toContainText("saved allocation remains a separate draft");
      const find = page.getByTestId("find-commitment-record-private-notice");
      await find.focus(); await page.keyboard.press("Enter"); await expect(page.getByTestId("choice-record-private-notice")).toBeFocused(); expect(await saved()).toEqual(state);
      await page.keyboard.press("Enter"); const recorded = await saved(); expect(recorded.creds).toBe(state.creds); expect(recorded.flags.notice_allocation_committed).toBeUndefined(); expect(recorded.flags.notice_done).toBe(true);
    } else {
      await expect(panel.getByRole("heading", { name: "Available here", level: 2 })).toBeVisible();
      const find = page.getByTestId("find-commitment-record-private-reply");
      await find.focus(); await page.keyboard.press("Enter"); await expect(page.getByTestId("choice-record-private-reply")).toBeFocused(); expect(await saved()).toEqual(state);
      await page.keyboard.press("Enter"); const acknowledged = await saved();
      expect(acknowledged.flags.notice_receipt_observed).toBe(true); expect(acknowledged.flags.nia_public_consent).toBeUndefined();
      expect(acknowledged.creds).toBe(state.creds); expect(acknowledged.rolls).toEqual(state.rolls);
      await page.reload(); await page.getByTestId("continue-run").click();
      await page.getByTestId("objectives").locator("details > summary").first().click();
      await expect(page.getByTestId("objectives")).toContainText("Two card receipts were acknowledged");
      await expect(page.getByTestId("objectives")).toContainText("all attendance remain unknown");
      expect(await saved()).toEqual(acknowledged);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]); if (artwork === "none") expect(artworkRequests).toEqual([]);
  });
}
