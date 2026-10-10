import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { importRun } from "../lib/vault";
import { commitChoice, getScene, presentChoices } from "../lib/engine";

const key = "saint-shard-3055-v1";
test("previous public pending die survives backup and slot recovery without duplicate cost", async ({ page }) => {
  const raw = readFileSync("qa/release/cycle9/pending-window.json", "utf8"), expected = importRun(raw);
  const choice = presentChoices(expected, getScene(expected.sceneId)).find(choice => choice.id === expected.pendingCheck!.choiceId)!;
  const committed = commitChoice(expected, choice, { roll: 8 }).state;
  await page.addInitScript(({ key, raw }) => {
    if (!localStorage.getItem(`${key}-backup`)) {
      localStorage.setItem(`${key}-backup`, JSON.stringify(JSON.parse(raw).state));
      localStorage.setItem(key, "corrupted primary");
    }
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", artwork: "none", sound: false, motion: "reduce" }));
  }, { key, raw });
  await page.goto("/"); await expect(page.getByRole("status")).toContainText("automatic backup is ready");
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Save to slot 1", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("Slot 1 saved");
  await page.getByRole("button", { name: "Close saves", exact: true }).click();
  await page.getByTestId("continue-run").click(); await expect(page.getByTestId("roll-button")).toHaveCount(0);
  await expect(page.locator(".total")).toContainText("8 +");
  await page.getByTestId("continue-check").click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(committed);
  await page.reload(); await page.getByTestId("continue-run").click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(committed);
  await expect(page.getByTestId("goal")).toContainText("1 opportunity");
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(expected);
  await page.getByTestId("continue-check").click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(committed);
});

test("native exports from the previous public release retain every finale after import and reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", sound: false, motion: "reduce" })));
  await page.goto("/");
  for (const [i, id] of ["names", "quiet", "witness", "listed"].entries()) {
    const raw = readFileSync(`qa/release/cycle9/ending-${id}.json`, "utf8"), expected = importRun(raw);
    await page.getByRole("button", { name: "Saves", exact: true }).click();
    await page.getByLabel("Import a saved run").setInputFiles({ name: "previous-release.json", mimeType: "application/json", buffer: Buffer.from(raw) });
    if (i > 0) await page.getByRole("button", { name: "Confirm load", exact: true }).click();
    await expect(page.getByTestId("scene-text")).toBeVisible();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(expected);
    await page.getByTestId("aftermath-details").locator("summary").click();
    await expect(page.getByTestId("aftermath-details")).toHaveAttribute("open", "");
    await page.reload(); await page.getByTestId("continue-run").click();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(expected);
  }
});
