import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createCharacter } from "../lib/engine";
import { importRun, exportRun } from "../lib/vault";

const base = { ...createCharacter({ handle: "Planner", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "act2_archive_compare", creds: 100, flags: { archive_briefed: true, memory_intact: true }, journal: [{ id: "memory-order", text: "The acquired cancellation receipt.", kind: "fact" as const }] };
for (const width of [390, 1440, 320]) for (const scenario of ["reader-staffed-fail", "reader-withdraw-fail", "carbon-staffed-success", "carbon-withdraw-fail"]) test(`${scenario} plan survives reload and resolves at ${width}px`, async ({ page }) => {
  const [approach, contingency, outcome] = scenario.split("-");
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0, reading: "all", motion: "reduce" }));
  }, { state: base, width });
  await page.goto("/"); await page.getByTestId("continue-run").click();
  const planner = page.getByTestId("archive-planner"); await planner.locator(":scope > summary").click();
  await page.getByLabel("Archive objective").selectOption("authenticate"); await page.getByLabel("Archive approach").selectOption("carbon");
  await expect(page.getByRole("button", { name: "Save archive plan", exact: true })).toBeDisabled();
  await page.getByLabel("Archive objective").selectOption(approach === "reader" ? "authenticate" : "corroborate");
  await page.getByLabel("Archive approach").selectOption(approach); await page.getByLabel("If retrieval fails").selectOption(contingency);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  await page.getByRole("button", { name: "Save archive plan", exact: true }).click();
  const planned = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  const { archivePlan, ...unchanged } = planned; expect(unchanged).toEqual(before); expect(archivePlan.stage).toBe("planned");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByTestId("choice-separate-source-tests").click();
  await page.getByTestId(approach === "reader" ? "choice-archive-plan-priority" : "choice-archive-plan-window").click();
  const method = page.getByTestId(approach === "reader" ? "choice-trace-receipt" : "choice-lift-carbon");
  await expect(method).toBeFocused();
  await expect(page.getByTestId("archive-plan-status")).toContainText("Setup committed");
  await expect(page.getByTestId("choice-archive-plan-priority")).toHaveCount(0);
  await method.click();
  const face = outcome === "success" ? 10 : 1;
  await page.evaluate(face => { Math.random = () => (face - .5) / 10; }, face);
  await page.getByTestId("roll-button").click(); await expect(page.getByTestId("continue-check")).toBeVisible();
  const held = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(held.pendingCheck.roll).toBe(face); expect(importRun(exportRun(held))).toEqual(held);
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.locator(".die.plate")).toHaveText(String(face));
  await page.getByTestId("continue-check").click();
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  if (outcome === "success") {
    expect(saved.sceneId).toBe("act2_archive_custody"); expect(saved.archivePlan.stage).toBe("retrieved");
    expect(saved.flags.order_verified).toBe(true); expect(saved.flags.archive_key_authenticated).toBeUndefined();
    expect(saved.flags.perk_ghost).toBeUndefined();
  } else if (contingency === "withdraw") {
    expect(saved.sceneId).toBe("act2_middle"); expect(saved.archivePlan.stage).toBe("withdrawn");
    expect(saved.flags.archive_unresolved).toBe(true); expect(saved.flags.order_verified).toBeUndefined();
  } else {
    expect(saved.sceneId).toBe("act2_archive_gap"); expect(saved.archivePlan.stage).toBe("failed");
    expect(saved.creds).toBe(100); await page.getByTestId("choice-buy-ledger").click();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
    expect(saved.creds).toBe(75); expect(saved.archivePlan.stage).toBe("retrieved");
    expect(saved.flags.archive_key_authenticated).toBeUndefined(); expect(saved.journal.some((e: { id: string }) => e.id === "verified-order")).toBe(true);
  }
  expect(importRun(exportRun(saved))).toEqual(saved);
});

test("full strain and empty funds leave a free plan exit without granting carbon training", async ({ page }) => {
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "none", reading: "all" }));
  }, { ...base, sceneId: "act2_archive_door", strain: 5, creds: 0 });
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await page.getByTestId("archive-planner").locator(":scope > summary").click();
  await page.getByLabel("Archive approach").selectOption("carbon"); await page.getByRole("button", { name: "Save archive plan", exact: true }).click();
  await expect(page.getByTestId("choice-archive-plan-window")).toBeDisabled(); await expect(page.getByTestId("choice-archive-plan-registered")).toBeDisabled();
  await page.getByTestId("choice-archive-plan-abandon").click();
  await expect(page.getByTestId("choice-trace-receipt")).toBeEnabled(); await expect(page.getByTestId("choice-lift-carbon")).toHaveCount(0);
});
