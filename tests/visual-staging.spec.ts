import { expect, test, type Page } from "@playwright/test";
import { createCharacter } from "../lib/engine";
import type { GameState } from "../lib/types";

const scenarios = [
  { sceneId: "act2_witness_support", art: "nia-transfer", flags: { witness_briefed: true } },
  { sceneId: "act2_recovery", art: "ordinary-rest", flags: {} },
  { sceneId: "act2_response_dispatch", art: "private-reply", flags: { response_private_consent: true } },
  { sceneId: "ward_wall", art: "memorial-stair", flags: {} },
  { sceneId: "act2_notice_privacy_refusal", art: "notice-desk", flags: { notice_home_refused: true } },
  { sceneId: "act2_workshop", art: "repair-bench", flags: {} },
  { sceneId: "act2_shelter_methods", art: "shelter-pump", flags: { shelter_started: true } },
  { sceneId: "act2_witness_checkpoint", art: "witness-checkpoint", flags: { witness_briefed: true } },
  { sceneId: "stall", art: "quill-offer", flags: {} },
  { sceneId: "act2_response_invitation", art: "mara-present", flags: { heard_memo: true } },
  { sceneId: "act2_response_agenda", art: "mara-present", flags: { response_started: true, response_public_refused: true, response_private_consent: true }, portrait: "mara-boundary" },
  { sceneId: "act3_response_visit", art: "mara-present", flags: { response_started: true, response_pending: true } },
  { sceneId: "act3_response_visit", art: "mara-present", flags: { response_started: true, response_sent: true, response_public_refused: true }, portrait: "mara-boundary" },
  { sceneId: "act2_witness_arrival", art: "nia-arrival", flags: { witness_briefed: true, witness_safe: true, witness_done: true } },
  { sceneId: "act2_route_receipt", art: "kerr-handover", flags: { kerr_route_collected: true, kerr_route_private: true } },
  { sceneId: "act2_route_receipt", art: "kerr-handover", flags: { kerr_route_collected: true, kerr_route_private: true, kerr_route_trace: true, kerr_route_acknowledged: true }, portrait: "kerr-closed" },
  { sceneId: "act3_testimony_review", art: "hearing-table", flags: { memory_sequence_checked: true } },
  { sceneId: "act2_archive_brief", art: "archive-desk", flags: { archive_exported: true } },
  { sceneId: "act3_freight_visit", art: "courier-table", flags: { freight_unconfirmed: true } },
  { sceneId: "act3_shelter_visit", art: "laundry-cart", flags: { shelter_declined: true } },
] as const;
const base = createCharacter({ handle: "Visual QA", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } });
async function open(page: Page, run: GameState, artwork: string) {
  await page.addInitScript(({ run, artwork }) => {
    localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", artwork, sound: false, textStep: 2, contrast: "high", motion: "reduce" }));
  }, { run, artwork });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
// Keep each test bounded as the art catalog grows; every scenario still receives
// all three layouts and every save, responsive-source and missing-art assertion.
const batches = Array.from({ length: Math.ceil(scenarios.length / 5) }, (_, index) => scenarios.slice(index * 5, index * 5 + 5));
for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) for (const [batchIndex, batch] of batches.entries()) test(`complete compositions preserve boundaries and saves at ${width}px, batch ${batchIndex + 1}`, async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  for (const scenario of batch) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: width > 700 ? 900 : 844 }, reducedMotion: "reduce" });
    const page = await context.newPage(); const media: string[] = [];
    page.on("request", r => { if (/\/(art|audio)\//.test(r.url())) media.push(r.url()); });
    const run = { ...base, sceneId: scenario.sceneId, flags: { ...scenario.flags } };
    await open(page, run, artwork);
    const goal = await page.getByTestId("goal").boundingBox();
    expect(goal!.y).toBeGreaterThanOrEqual(0); expect(goal!.y + goal!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (artwork === "none") { await expect(page.getByTestId("scene-illustration")).toHaveCount(0); expect(media).toEqual([]); }
    else {
      const img = page.getByTestId("scene-illustration").locator("img");
      await expect(img).toHaveAttribute("src", `/art/${scenario.art}.jpg`);
      await img.scrollIntoViewIfNeeded();
      const decoded = await img.evaluate(async (el: HTMLImageElement) => { await el.decode(); const box = el.getBoundingClientRect(); return { width: el.naturalWidth, ratio: box.width / box.height, fit: getComputedStyle(el).objectFit, source: el.currentSrc }; });
      expect(decoded.width).toBeGreaterThan(0); expect(decoded.ratio).toBeCloseTo(1.5, 2); expect(decoded.fit).toBe("contain");
      await expect(img).toHaveAttribute("srcset", `/art/${scenario.art}-small.jpg 600w, /art/${scenario.art}.jpg 1200w`);
      // Browsers may retain/prefer the larger candidate; both are valid deliveries.
      expect(decoded.source).toMatch(new RegExp(`/art/${scenario.art}(-small)?[.]jpg$`));
      if ("portrait" in scenario) await expect(page.locator(".scene-row .portrait")).toHaveAttribute("src", `/art/${scenario.portrait}.jpg`);
    }
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(run);
    await context.close();
  }
});

test("missing new scene plates retain their descriptions and actionable choices", async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  for (const scenario of scenarios.filter(s => ["act2_witness_support", "act2_recovery", "act2_response_dispatch", "ward_wall", "act2_notice_privacy_refusal", "act2_workshop", "act2_shelter_methods", "act2_witness_checkpoint", "act2_response_invitation", "act2_witness_arrival", "act2_route_receipt", "act3_testimony_review", "act2_archive_brief", "act3_freight_visit", "act3_shelter_visit"].includes(s.sceneId))) {
    const context = await browser.newContext({ baseURL }); const page = await context.newPage();
    await page.route("**/art/**", r => r.abort());
    await open(page, { ...base, sceneId: scenario.sceneId, flags: { ...scenario.flags } }, "full");
    const figure = page.getByTestId("scene-illustration"); await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator(".art-unavailable")).not.toBeEmpty();
    await expect(page.getByTestId("goal")).toBeVisible();
    await expect(page.locator('[data-testid^="choice-"]:enabled').first()).toBeVisible();
    await context.close();
  }
});
