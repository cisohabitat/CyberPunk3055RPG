import { expect, test, type Page } from "@playwright/test";
import { commitChoice, createCharacter, getScene, presentChoices } from "../lib/engine";
import type { GameState, StatId } from "../lib/types";

const base = (stat: StatId, creds = 100): GameState => ({ ...createCharacter({ handle: "Depot UI", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 0, ghost: 0, [stat]: 2 } }), sceneId: "act2_route_crossing", creds, strain: 0, flags: { met_kerr: true, kerr_route_promised: true, kerr_route_started: true, kerr_route_private: true, [`perk_${stat}`]: true, [`kerr_exit_${stat === "chrome" ? "ramp" : stat === "nerve" ? "walk" : "gap"}`]: true } });
const saved = (page: Page): Promise<GameState> => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
async function open(page: Page, run: GameState, artwork = "full") {
  await page.addInitScript(({ run, artwork }) => {
    if (!localStorage.getItem("saint-shard-3055-v1")) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", textStep: 2, contrast: "high", motion: "reduce", artwork, sound: false }));
  }, { run, artwork });
  await page.goto("/"); await page.getByTestId("continue-run").click();
}
async function choose(page: Page, id: string) {
  const before = await saved(page);
  const c = presentChoices(before, getScene(before.sceneId)).find(c => c.id === id && c.enabled)!;
  expect(c).toBeTruthy(); expect(c.check).toBeUndefined();
  const expected = commitChoice(before, c).state;
  await page.getByTestId(`choice-${id}`).click();
  await expect.poll(() => saved(page)).toEqual(expected);
}
async function reload(page: Page) {
  const before = await saved(page); await page.reload(); await page.getByTestId("continue-run").click();
  expect(await saved(page)).toEqual(before);
}
const methods: Record<StatId, string[]> = {
  chrome: ["depot-fit-buffer", "pause-depot-task", "answer-kerr-collection", "depot-preserve-return"],
  ghost: ["depot-watch-cart", "pause-depot-task", "answer-kerr-collection", "depot-wait-return", "pause-depot-task", "answer-kerr-collection", "depot-cross-return"],
  nerve: ["depot-rent-cradle", "pause-depot-task", "answer-kerr-collection", "depot-carry-low"],
  face: ["depot-offer-own-liability", "pause-depot-task", "answer-kerr-collection", "depot-promise-return-shift"],
};
for (const stat of ["chrome", "ghost", "nerve", "face"] as const) test(`trained depot ${stat} preserves its task, costs and later receipt`, async ({ page }) => {
  await open(page, base(stat));
  for (const id of ["compare-trained-depot-methods", `begin-depot-${stat}`, ...methods[stat]]) { await choose(page, id); await reload(page); }
  const collected = await saved(page); expect(collected.flags.kerr_route_collected).toBe(true); expect(collected.flags.kerr_route_delivered).toBeUndefined();
  await choose(page, "record-kerr-receipt");
  expect((await saved(page)).flags.kerr_route_delivered).toBe(true);
  if (stat === "face") {
    expect((await saved(page)).flags.depot_shift_kept).toBeUndefined();
    await choose(page, "work-depot-return-shift"); await reload(page);
    expect((await saved(page)).strain).toBe(1); await expect(page.getByTestId("choice-work-depot-return-shift")).toHaveCount(0);
  }
  expect((await saved(page)).rolls).toHaveLength(0);
});

for (const [stat, actions] of [
  ["chrome", ["depot-disconnect-recipient", "depot-clear-return"]],
  ["ghost", ["depot-watch-cart", "depot-follow-cart"]],
  ["nerve", ["depot-carry-direct", "depot-lift-high"]],
] as const) test(`trained depot ${stat} failure at zero funds remains held after reload`, async ({ page }) => {
  await open(page, base(stat, 0));
  for (const id of ["compare-trained-depot-methods", `begin-depot-${stat}`, ...actions]) await choose(page, id);
  await reload(page); await expect(page.getByTestId("choice-fund-kerr-courier")).toBeDisabled();
  expect((await saved(page)).flags.kerr_route_collected).toBeUndefined();
  await choose(page, "leave-kerr-case-held");
  const s = await saved(page); expect(s.flags.depot_failed).toBe(true); expect(s.flags.kerr_route_delivered).toBeUndefined();
});

test("trained depot registered contract preserves a broken private promise", async ({ page }) => {
  await open(page, base("face", 0));
  for (const id of ["compare-trained-depot-methods", "begin-depot-face", "depot-sign-recipient", "record-kerr-receipt"]) await choose(page, id);
  await reload(page); const s = await saved(page);
  expect(s.flags.kerr_route_private).toBe(true); expect(s.flags.kerr_route_trace).toBe(true); expect(s.flags.depot_shift_owed).toBeUndefined();
  for (const flag of ["witness_safe", "witness_consent", "nia_public_consent", "archive_key_authenticated"]) expect(s.flags[flag]).toBeUndefined();
});

// All ten new scenes, including persisted intermediate steps, are checked in
// both art modes and at the smallest supported large-text viewport.
for (const [width, artwork] of [[320, "none"], [390, "full"], [1440, "full"]] as const) test(`trained depot scenes keep goals and accompanying art at ${width}px`, async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const states = new Map<string, GameState>();
  for (const stat of ["chrome", "ghost", "nerve", "face"] as const) {
    let s = base(stat);
    for (const id of ["compare-trained-depot-methods", `begin-depot-${stat}`, ...methods[stat]]) {
      const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled)!; s = commitChoice(s, c).state;
      if (s.sceneId.startsWith("act2_depot_")) states.set(s.sceneId, s);
    }
  }
  expect(states.size).toBe(10);
  for (const s of states.values()) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: "reduce" });
    const page = await context.newPage(); const requests: string[] = [];
    page.on("request", r => { if (/\/(art|audio)\//.test(r.url())) requests.push(r.url()); });
    await open(page, s, artwork);
    const goal = await page.getByTestId("goal").boundingBox(); expect(goal!.y).toBeGreaterThanOrEqual(0); expect(goal!.y + goal!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (artwork === "none") expect(requests).toHaveLength(0);
    else {
      const img = page.locator('img[src*="canal-dispatch"]'); await expect(img).toHaveCount(1);
      await expect.poll(() => img.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    await context.close();
  }
});
