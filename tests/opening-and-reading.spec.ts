import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { exportRun } from "../lib/vault";
import { fixture, openRun } from "./fixtures/game";

test("text-only mode avoids artwork requests through reload and a rolled result", async ({ page }) => {
  const art: string[]=[]; page.on("request",request=>{if(request.url().includes("/art/")) art.push(request.url());});
  await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({artwork:"none",motion:"reduce"})));
  await openRun(page,fixture("pay"));
  await expect(page.locator("img.portrait")).toHaveCount(0); await expect(page.getByTestId("goal")).toBeInViewport();
  await page.getByTestId("choice-haggle").click(); await page.getByTestId("roll-button").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.locator("img.portrait")).toHaveCount(0); await page.getByTestId("continue-check").click();
  expect(art).toEqual([]); expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.getByRole("button",{name:"Settings",exact:true}).click();
  await expect(page.getByLabel("Artwork",{exact:true})).toHaveValue("none");
  await page.getByLabel("Artwork",{exact:true}).selectOption("full"); await page.getByRole("button",{name:"Done",exact:true}).click();
  await expect(page.locator("img.portrait")).toBeVisible();
});

test("district cards omit images in text-only mode and Week audio loads on demand", async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem("saint-shard-preferences",JSON.stringify({artwork:"none",sound:false})));
  await openRun(page,fixture("districts")); await expect(page.locator("img.card-art")).toHaveCount(0);
  await page.getByRole("button",{name:"Settings",exact:true}).click();
  const response=page.waitForResponse(r=>r.url().endsWith("/audio/theme-week.flac")&&r.status()===200);
  await page.getByLabel("Sound enabled",{exact:true}).check(); await response;
  await page.getByLabel("Sound enabled",{exact:true}).uncheck(); await page.getByRole("button",{name:"Done",exact:true}).click();
  await page.getByTestId("choice-to-kerr").click(); await expect(page.getByTestId("choice-hear-kerr")).toBeVisible();
});

test("a coolant follow-up spends trust once and describes a future appointment",async({page})=>{
  await openRun(page,fixture("act3_pump_visit",{flags:{pump_restored:true,pump_done:true},factions:{quill:0,lumen:0,helion:0,wards:2}}));
  for(const id of ["book-pump-inspection","wards-pump-inspection"]) await page.getByTestId(`choice-${id}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("choice-book-pump-inspection")).toHaveCount(0);
  await page.getByRole("button",{name:"Settings",exact:true}).click(); await page.getByLabel("Reading pace").selectOption("all"); await page.getByRole("button",{name:"Done",exact:true}).click();
  await expect(page.getByTestId("scene-text")).toContainText("inspection itself is still due");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(saved.factions.wards).toBe(1); expect(saved.flags.order_verified).toBeUndefined();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

for (const reading of ["paragraph", "all"] as const) test(`fresh memory choices precede optional evidence in ${reading} mode`, async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 605 });
  await page.addInitScript((pace) => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: pace })), reading);
  await openRun(page, fixture("memory_publication", { flags: { memory_prepared: true } }));
  const review = page.getByTestId("memory-review");
  await expect(review).not.toHaveAttribute("open", "");
  expect(await page.locator("#choices").evaluate((choices) => Boolean(choices.compareDocumentPosition(document.querySelector('[data-testid="memory-review"]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  const skip = page.getByRole("link", { name: "Skip to choices" });
  await skip.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#choices")).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.locator("#choices button").first()).toBeFocused();
  await review.locator(":scope > summary").click();
  await expect(page.getByTestId("memory-plate")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("settings fit classic scrollbars at desktop and narrow widths in every text size", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({ content: ".dialog.wide { scrollbar-gutter: stable; }" });
  for (const width of [1180, 400, 320]) {
    await page.setViewportSize({ width, height: 756 });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    for (const size of ["0", "1", "2"]) {
      await page.getByLabel("Text size").selectOption(size);
      expect(await page.locator(".settings-grid").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.getByRole("dialog").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }
});

test("same-scene slot restores announce their source without gameplay deltas", async ({ page }) => {
  await openRun(page, fixture("after_kerr", { creds: 120, strain: 4 }));
  const other = fixture("after_kerr", { creds: 20, strain: 1 });
  await page.evaluate((snapshot) => localStorage.setItem("saint-shard-slot-1", snapshot), exportRun(other));
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).creds)).toBe(120);
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("restore-notice")).toContainText("Loaded Slot 1 — The Hour");
  await expect(page.getByTestId("run-delta")).toHaveCount(0);
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(20); expect(run.strain).toBe(1);
  const nextChapter = fixture("act2_lumen_door", { creds: 300, strain: 3 });
  await page.evaluate((snapshot) => localStorage.setItem("saint-shard-slot-2", snapshot), exportRun(nextChapter));
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Load slot 2", exact: true }).click();
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("restore-notice")).toContainText("Loaded Slot 2 — The Week");
  await expect(page.getByTestId("run-delta")).toHaveCount(0);
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Load slot 1", exact: true }).click();
  await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  await expect(page.getByTestId("restore-notice")).toContainText("Loaded Slot 1 — The Hour");
  await expect(page.getByTestId("run-delta")).toHaveCount(0);
});

test("ending discovery shows chapter counts and opt-in spoiler-light replay hints", async ({ page }) => {
  await page.goto("/");
  for (const title of ["The Hour · 0/8 discovered", "The Week · 0/3 discovered", "The Wall · 0/4 discovered"]) await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.locator(".codex .unseen")).toHaveCount(15);
  await expect(page.getByText("The sources you carry and the account you choose affect what can be said.")).toHaveCount(0);
  await page.getByRole("button", { name: "Show replay hints" }).click();
  await expect(page.getByText("The sources you carry and the account you choose affect what can be said.")).toBeVisible();
  await page.getByRole("button", { name: "Hide replay hints" }).click();
  await expect(page.locator(".codex .seen")).toHaveCount(0);
});

test("Lumen offers a marker without a handover through hearing and reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "paragraph" })));
  await openRun(page, fixture("act2_lumen_door", { items: [], flags: { act1_sold: true } }));
  await page.getByTestId("next-paragraph").click();
  await expect(page.getByTestId("scene-text")).toContainText("offers a clinic marker");
  await page.getByTestId("choice-hear-lumen").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Reading pace").selectOption("all");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByTestId("scene-text")).toContainText("still on her palm");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).items)).toEqual([]);
});

test("Fight Kerr displays costs before a saved critical result and commits once", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.95; });
  await openRun(page, fixture("kerr", { strain: 0 }));
  await expect(page.getByTestId("choice-fight")).toContainText("Success: Strain +1");
  await expect(page.getByTestId("choice-fight")).toContainText("Miss: Strain +2");
  await page.getByTestId("choice-fight").click();
  await expect(page.getByTestId("check-costs")).toContainText("successful 10 eases Strain by one");
  await page.getByTestId("roll-button").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("roll-button")).toHaveCount(0);
  await page.getByTestId("continue-check").click();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.strain).toBe(0); expect(run.rolls).toHaveLength(1); expect(run.rolls[0].roll).toBe(10);
});

for (const [origin, complication, motive, root, reason] of [
  ["gutterwire", "debt", "opening-survival", "grew up below these pipes", "keep tomorrow yours"],
  ["spire", "optic", "opening-identity", "clearance stopped working", "claim on your name"],
  ["dustline", "on-file", "opening-exit", "carried parcels across the flats", "way beyond the next closed door"],
] as const) test(`new ${origin} runner enters through a personal prologue and resumes before the job`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/"); await page.getByTestId("new-run").click();
  await page.getByTestId("handle-input").fill("Rex");
  await page.getByTestId(`origin-${origin}`).click(); await page.getByTestId(`complication-${complication}`).click();
  await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click();
  await page.getByTestId("start-run").click();
  await expect(page.getByTestId("goal")).toBeInViewport();
  await expect(page.getByTestId("goal")).toContainText("Find Quill");
  await expect(page.getByTestId("choice-ask-pay")).toHaveCount(0);
  await expect(page.getByTestId("show-rest")).toHaveCount(0);
  await expect(page.getByTestId("scene-text")).toContainText("People call you a runner");
  await expect(page.getByTestId("scene-text")).toContainText("sliver of glass called a shard");
  await expect(page.getByTestId("scene-text")).not.toContainText("Mara Voss");
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  await page.getByTestId("choice-begin-opening").click(); await expect(page.getByTestId("show-rest")).toHaveCount(0);
  await expect(page.getByTestId("scene-text")).toContainText(root);
  await page.getByTestId(`choice-${motive}`).click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("scene-text")).toContainText(reason);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Reading pace").selectOption("all");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByTestId("choice-hear-stallholder").click();
  await expect(page.getByTestId("scene-text")).toContainText("to make the rent");
  await expect(page.getByTestId("scene-text")).toContainText("Remembered getting paid. Didn't remember what he needed to apologize for.");
  await expect(page.getByTestId("goal")).toBeInViewport();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByTestId("choice-take-the-stool").click();
  await expect(page.getByTestId("scene-text")).toContainText(reason);
  await expect(page.getByTestId("scene-text")).toContainText("stallholder’s story stays with you");
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  for (const key of ["creds", "strain", "items", "stats", "factions", "rolls"]) expect(after[key]).toEqual(before[key]);
  await expect(page.getByTestId("goal")).toContainText("Hear Quill's terms");
  await page.getByTestId("choice-accept").click();
  await expect(page.getByTestId("goal")).toContainText("Lift Mara Voss");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!).flags.hired)).toBe(true);
});

for (const [width, textOnly] of [[390, false], [1440, true], [320, true]] as const) test(`Quill's offer stays unaccepted through questions and reload at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  if (textOnly) await page.addInitScript(() => localStorage.setItem("saint-shard-preferences", JSON.stringify({ artwork: "none", textStep: 2, contrast: "high" })));
  await page.goto("/"); await page.getByTestId("new-run").click();
  await page.getByTestId("handle-input").fill("Rex");
  await page.getByTestId("complication-debt").click();
  await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click();
  await page.getByTestId("start-run").click();
  for (const id of ["begin-opening", "opening-survival", "hear-stallholder", "take-the-stool"]) await page.getByTestId(`choice-${id}`).click();
  // Whole-scene defaults expose the complete offer before any reveal click.
  for (const term of ["Mara Voss", "Glass Chapel", "dawn", "Fifty now", "two hundred", "Kerr"]) await expect(page.getByTestId("scene-text")).toContainText(term);
  await expect(page.getByTestId("goal")).toContainText("Hear Quill's terms");
  await expect(page.getByTestId("goal")).toBeInViewport();
  await page.getByTestId("choice-ask-owner").click();
  await page.reload(); await page.getByTestId("continue-run").click();
  await expect(page.getByTestId("goal")).toContainText("Hear Quill's terms");
  await expect(page.getByTestId("show-rest")).toHaveCount(0);
  await expect(page.getByTestId("scene-text")).toContainText("buyer is still a blank");
  let run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(20); expect(run.flags.hired).toBeUndefined(); expect(run.journal).toEqual([]);
  await page.getByTestId("choice-back-to-offer").click();
  await expect(page.getByTestId("choice-ask-owner")).toHaveCount(0);
  await expect(page.getByTestId("scene-text")).toContainText("Fifty now");
  await expect(page.getByTestId("scene-text")).not.toContainText("grew up below");
  await page.getByTestId("choice-accept").focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("goal")).toContainText("Lift Mara Voss");
  await expect(page.getByTestId("scene-text")).toContainText("tomorrow paid for");
  await expect(page.getByTestId("goal")).toBeInViewport();
  run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.creds).toBe(70); expect(run.flags.hired).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  if (textOnly) await expect(page.locator("img.portrait")).toHaveCount(0);
});

test("returning runners can skip the prologue while old saves continue at the job", async ({ page }) => {
  await openRun(page, fixture("stall"));
  await expect(page.getByTestId("choice-begin-opening")).toHaveCount(0);
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  await page.getByRole("button", { name: "Saves", exact: true }).click();
  await page.getByRole("button", { name: "Return to title", exact: true }).click();
  await page.getByTestId("new-run").click(); await page.getByRole("button", { name: "Start a new run", exact: true }).click();
  await page.getByTestId("handle-input").fill("Rex"); await page.getByTestId("complication-debt").click();
  await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click();
  await page.getByTestId("start-run").click(); await page.getByTestId("choice-skip-opening").click();
  await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  expect(run.flags.opening_skipped).toBe(true); expect(run.flags.opening_survival).toBeUndefined(); expect(run.creds).toBe(20);
});
