import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { importRun, exportRun } from "../lib/vault";
import { caseSources } from "../lib/case-file";

for (const width of [390, 1440, 320]) test(`case correction persists and opens a real archive lead at ${width}px`, async ({ page }) => {
  const state = routeCheckpoint("catalog-paid", "act2_archive_compare");
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ state, width }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: width === 320 ? "none" : "full", textStep: width === 320 ? 2 : 0, reading: "all", motion: "reduce" }));
  }, { state, width });
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await page.getByTestId("consult-sources").focus(); await page.keyboard.press("Enter");
  await page.getByTestId("case-board").locator(":scope > summary").focus(); await page.keyboard.press("Enter");
  await page.getByLabel("Claim to investigate").selectOption("issuer");
  const selects = page.getByTestId("case-board").locator(".case-sources select");
  // Stable source ids stay private to the state; select the acquired receipt by its label.
  const source = await selects.evaluateAll(nodes => nodes.map(n => ({ label: n.getAttribute("aria-label"), text: n.closest("li")!.textContent })));
  const index = source.findIndex(s => /counter-order|command receipt|cancellation|receipt/i.test(s.text!));
  expect(index).toBeGreaterThanOrEqual(0);
  await selects.nth(index).selectOption("supports");
  await page.getByRole("button", { name: "Test assembled case", exact: true }).click();
  await expect(page.getByTestId("case-feedback")).toContainText("challenged:");
  await selects.nth(index).selectOption("limits");
  await page.getByRole("button", { name: "Test assembled case", exact: true }).click();
  await expect(page.getByTestId("case-feedback")).toContainText("bounded:");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  const { caseFile, ...unchanged } = saved; expect(unchanged).toEqual(state);
  expect(caseFile.history.map((r: { verdict: string }) => r.verdict)).toEqual(["challenged", "bounded"]);
  expect(importRun(exportRun(saved))).toEqual(saved);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.keyboard.press("Escape"); await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByTestId("choice-case-pursue-archive").click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).sceneId)).toBe("act2_archive_door");
});

for (const strength of ["bounded", "supported", "witness"]) test(`tested case enters and completes the hearing as ${strength}`, async ({ page }) => {
  const state = routeCheckpoint(strength === "witness" ? "integration-names" : "catalog-paid", "act3_testimony_review");
  await page.setViewportSize({ width: strength === "bounded" ? 390 : 1440, height: 900 });
  await page.addInitScript(state => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(state));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: false, artwork: "none", reading: "all" }));
  }, state);
  await page.goto("/"); await page.getByTestId("continue-run").click();
  await page.getByTestId("consult-sources").click(); await page.getByTestId("case-board").locator(":scope > summary").click();
  for (const id of strength === "supported" ? ["memory-order", "verified-order"] : strength === "witness" ? ["memory-order", "nia-account"] : ["memory-order"]) {
    const source = caseSources(state).find(s => s.id === id)!;
    await page.getByLabel(`Connection for ${source.title}`, { exact: true }).selectOption("supports");
  }
  await page.getByRole("button", { name: "Test assembled case", exact: true }).click();
  await expect(page.getByTestId("case-feedback")).toContainText(`${strength === "witness" ? "supported" : strength}:`);
  await page.getByTestId("close-notebook").click(); await page.getByTestId("choice-case-bring-account").click();
  await page.getByTestId("choice-keep-recording-private").click();
  await page.getByTestId(strength !== "bounded" ? "choice-answer-corroboration" : "choice-answer-open-question").click();
  await page.getByTestId("choice-file-public-account").click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(saved.sceneId).toBe("act3_arrival"); expect(saved.flags.testimony_published).toBe(true);
  expect(Boolean(saved.flags.testimony_source)).toBe(strength !== "bounded");
  expect(saved.flags.archive_key_authenticated).toBe(state.flags.archive_key_authenticated);
  expect(saved.flags.nia_public_consent).toBe(state.flags.nia_public_consent);
});
