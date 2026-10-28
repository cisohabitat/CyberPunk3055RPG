import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openRun, freightFixture, inspectFreight, shelterFixture } from "./fixtures/game";

for (const [stat, prep, method] of [["ghost", "scout", "ghost-gap"], ["chrome", "reader", "chrome-stock"], ["face", "escort", "face-escort"], ["nerve", "brace", "nerve-ramp"]] as const) test(`freight ${stat} specialization observes custody before a one-use reward`, async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.75; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", textStep: 2, contrast: "high", artwork: "none" })); });
  await page.setViewportSize({ width: 320, height: 844 });
  await openRun(page, freightFixture(stat)); await inspectFreight(page);
  await page.getByTestId(`choice-prep-freight-${prep}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  await page.getByTestId(`choice-freight-${method}`).click();
  if (stat === "nerve") { await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("roll-button")).toHaveCount(0); await page.getByTestId("continue-check").click(); }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).items)).not.toContain("burner-route");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByTestId("choice-acknowledge-freight-receipt").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.freight_delivered).toBe(true); expect(run.items).toContain("burner-route");
  expect(run.flags.order_verified).toBeUndefined(); expect(run.flags.nia_public_consent).toBeUndefined();
  await expect(page.getByTestId("scene-text")).toContainText("delivery, not patient treatment");
  await page.getByTestId("choice-return-freight-board").click();
  await expect(page.getByTestId("choice-origin-contract")).toHaveCount(0);
});

test("freight critical failure restores once and offers a free recorded recovery", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.05; });
  await openRun(page, freightFixture("face", 0)); await inspectFreight(page);
  await page.getByTestId("choice-freight-without-prep").click(); await page.getByTestId("choice-freight-service-run").click();
  await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("roll-button")).toHaveCount(0); await page.getByTestId("continue-check").click();
  await expect(page.getByTestId("choice-freight-recovery-courier")).toBeDisabled();
  await page.getByTestId("choice-freight-recovery-desk").click(); await page.getByTestId("choice-acknowledge-freight-receipt").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(0); expect(run.strain).toBe(2); expect(run.flags.freight_exposed).toBe(true); expect(run.items).not.toContain("burner-route"); expect(run.rolls).toHaveLength(1);
});

test("a late freight reply confirms stock without retroactive reward", async ({ page }) => {
  await openRun(page, { ...freightFixture(), sceneId: "ward_wall", flags: { freight_started: true, freight_done: true, freight_unconfirmed: true, opening_exit: true } });
  for (const id of ["visit-asa", "query-freight-receipt", "record-freight-reply"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-query-freight-receipt")).toHaveCount(0);
  for (const id of ["reflect-freight-motive", "finish-freight-reflection"]) await page.getByTestId(`choice-${id}`).click();
  await expect(page.getByTestId("choice-visit-asa")).toHaveCount(0);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.freight_late_received).toBe(true); expect(run.items).not.toContain("burner-route"); expect(run.flags.order_verified).toBeUndefined(); expect(run.sceneId).toBe("ward_wall");
});

for (const [stat, prep, method] of [["nerve", "brace", "turn-valve"], ["chrome", "controller", "local-control"], ["face", "crew", "crew-repair"], ["ghost", "ramp", "ghost-ramp"]] as const) test(`shelter ${stat} method separates resident care from referral capacity`, async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.75; localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", textStep: 2, contrast: "high", artwork: "none" })); });
  await page.setViewportSize({ width: 320, height: 844 }); await openRun(page, shelterFixture(stat));
  for (const id of ["plan-shelter", "accept-shelter", `shelter-prep-${prep}`, `shelter-${method}`]) await page.getByTestId(`choice-${id}`).click();
  if (stat === "nerve") { await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click(); await expect(page.getByTestId("roll-button")).toHaveCount(0); await page.getByTestId("continue-check").click(); }
  else { await page.reload(); await page.getByTestId("continue-run").click(); }
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).items)).not.toContain("witness-token");
  await page.getByTestId(stat === "ghost" ? "choice-shelter-confirm-hall" : "choice-shelter-carry-annex").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.shelter_done).toBe(true); expect(run.flags.witness_safe).toBeUndefined(); expect(run.flags.order_verified).toBeUndefined();
  if (stat === "ghost") { expect(run.flags.shelter_restored).toBeUndefined(); expect(run.items).not.toContain("witness-token"); }
  else expect(run.items).toContain("witness-token");
  await page.getByTestId("choice-shelter-return-board").click(); await expect(page.getByTestId("choice-origin-contract")).toHaveCount(0);
});

test("shelter failed repair restores its die and offers evacuation at zero funds", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.05; }); await openRun(page, shelterFixture("face", 0));
  for (const id of ["plan-shelter", "accept-shelter", "shelter-no-prep", "shelter-turn-valve"]) await page.getByTestId(`choice-${id}`).click();
  await page.getByTestId("roll-button").click(); await page.reload(); await page.getByTestId("continue-run").click(); await page.getByTestId("continue-check").click();
  for (const id of ["shelter-guide-hall", "shelter-confirm-hall"]) await page.getByTestId(`choice-${id}`).click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(0); expect(run.strain).toBe(3); expect(run.rolls).toHaveLength(1); expect(run.flags.shelter_hall).toBe(true); expect(run.items).not.toContain("witness-token");
});

test("shelter later help preserves uncertainty and returns to its entry hub", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all" })); });
  await openRun(page, { ...shelterFixture(), sceneId: "ward_wall", flags: { shelter_started: true, shelter_done: true, shelter_unobserved: true } });
  await page.getByTestId("choice-visit-shelter-neighbors").click(); await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText("no arrival count"); await page.getByTestId("choice-shelter-fund-laundry").click();
  await expect(page.getByTestId("choice-visit-shelter-neighbors")).toHaveCount(0);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.sceneId).toBe("ward_wall"); expect(run.creds).toBe(80); expect(run.flags.shelter_hall).toBeUndefined(); expect(run.items).not.toContain("witness-token");
});
