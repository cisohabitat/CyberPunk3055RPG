# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-staging.spec.ts >> complete compositions preserve boundaries and saves at 390px, batch 1
- Location: tests/visual-staging.spec.ts:38:146

# Error details

```
Error: locator.evaluate: Invalid image request.
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - link "Skip to choices" [ref=e4] [cursor=pointer]:
      - /url: "#choices"
    - banner [ref=e5]:
      - generic [ref=e12]:
        - text: Saint Shard
        - generic [ref=e13]: Kite City 3055
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Strain
          - meter "Strain 0 of 5" [ref=e19]
        - generic [ref=e25]: 100 cr
      - generic [ref=e28]:
        - button "Settings" [ref=e29] [cursor=pointer]
        - button "Saves" [ref=e30] [cursor=pointer]
        - button "Sheet" [ref=e31] [cursor=pointer]
        - button "Abandon" [ref=e32] [cursor=pointer]
    - main [ref=e34]:
      - article [active] [ref=e35]:
        - generic [ref=e36]:
          - figure [ref=e37]:
            - generic "Nia Pell · The living witness" [ref=e38]:
              - generic [ref=e39]: Nia Pell
              - generic [ref=e40]: The living witness
          - generic [ref=e41]:
            - paragraph [ref=e42]:
              - text: Witness room, Glass Chapel
              - generic [ref=e46]: · The Week
            - heading "Witness room, Glass Chapel · The Week" [level=1] [ref=e47]
            - paragraph [ref=e48]: The week wants a buyer or a witness.
            - paragraph [ref=e49]: Witness room, Glass Chapel · The Week. The week wants a buyer or a witness.
        - status [ref=e50]: Loaded Autosave — The Week · Witness room, Glass Chapel
        - region "The work of moving · Nia" [ref=e51]:
          - generic [ref=e52]:
            - paragraph [ref=e53]: The work of moving · Nia
            - generic [ref=e54]:
              - paragraph [ref=e55]: Nia holds the chair brake herself. 'Tell me whose work you're offering.'
              - paragraph [ref=e56]: An arranged volunteer will accept your return shift instead of spending clinic standing. A successfully braced chair plus a carrying harness permits a slow stair transfer; Nia chooses the stops. Practiced Steady hands balances the load without adding strain; an untrained carrier takes two strain. A scanner protocol plus Edda's earned signal baffle permits a clinic-only form without the usual strain. These methods need their stated preparation or equipment. The existing funded room, earned clearances and checkpoint route remain available without them.
          - generic [ref=e57]:
            - 'figure "Glass Chapel · Nia sets her own terms View artwork: Glass Chapel · Nia sets her own terms" [ref=e58]':
              - img "Nia sits upright beside her clinic bed in her ordinary wheelchair, wearing shoes and resting one hand on its brake; an untouched photograph frame stays on the bedside shelf." [ref=e61]
              - generic [ref=e62]:
                - generic [ref=e63]: Glass Chapel · Nia sets her own terms
                - 'button "View artwork: Glass Chapel · Nia sets her own terms" [ref=e64] [cursor=pointer]': View artwork
            - group "Artwork view" [ref=e65]:
              - button "Scene" [pressed] [ref=e66] [cursor=pointer]
              - button "Detail" [ref=e67] [cursor=pointer]
        - complementary "Nia Pell selected dialogue" [ref=e68]:
          - button "Listen to Nia Pell" [disabled] [ref=e69] [cursor=pointer]
          - status [ref=e70]: Enable Sound and voice volume in Settings to listen.
          - group [ref=e73]:
            - generic "Voice transcript" [ref=e74] [cursor=pointer]
        - region "Current commitments" [ref=e76]:
          - paragraph [ref=e77]:
            - strong [ref=e78]: Next step
            - text: Match preparation to a transport commitment. Recording permission remains separate.
        - region [ref=e81]:
          - generic [ref=e82]:
            - heading "Your next move" [level=2] [ref=e83]
            - paragraph [ref=e84]: Selecting an option commits it. For a check, review the odds and costs first; Back leaves it unrolled.
          - button "Choose an existing transfer or leave the move open." [ref=e85] [cursor=pointer]:
            - generic [ref=e86]: "1"
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | import { createCharacter } from "../lib/engine";
  3  | import type { GameState } from "../lib/types";
  4  | 
  5  | const scenarios = [
  6  |   { sceneId: "act2_witness_support", art: "nia-transfer", flags: { witness_briefed: true } },
  7  |   { sceneId: "act2_recovery", art: "ordinary-rest", flags: {} },
  8  |   { sceneId: "act2_response_dispatch", art: "private-reply", flags: { response_private_consent: true } },
  9  |   { sceneId: "ward_wall", art: "memorial-stair", flags: {} },
  10 |   { sceneId: "act2_notice_privacy_refusal", art: "notice-desk", flags: { notice_home_refused: true } },
  11 |   { sceneId: "act2_workshop", art: "repair-bench", flags: {} },
  12 |   { sceneId: "act2_shelter_methods", art: "shelter-pump", flags: { shelter_started: true } },
  13 |   { sceneId: "act2_witness_checkpoint", art: "witness-checkpoint", flags: { witness_briefed: true } },
  14 |   { sceneId: "stall", art: "quill-offer", flags: {} },
  15 |   { sceneId: "act2_response_invitation", art: "mara-present", flags: { heard_memo: true } },
  16 |   { sceneId: "act2_response_agenda", art: "mara-present", flags: { response_started: true, response_public_refused: true, response_private_consent: true }, portrait: "mara-boundary" },
  17 |   { sceneId: "act3_response_visit", art: "mara-present", flags: { response_started: true, response_pending: true } },
  18 |   { sceneId: "act3_response_visit", art: "mara-present", flags: { response_started: true, response_sent: true, response_public_refused: true }, portrait: "mara-boundary" },
  19 |   { sceneId: "act2_witness_arrival", art: "nia-arrival", flags: { witness_briefed: true, witness_safe: true, witness_done: true } },
  20 |   { sceneId: "act2_route_receipt", art: "kerr-handover", flags: { kerr_route_collected: true, kerr_route_private: true } },
  21 |   { sceneId: "act2_route_receipt", art: "kerr-handover", flags: { kerr_route_collected: true, kerr_route_private: true, kerr_route_trace: true, kerr_route_acknowledged: true }, portrait: "kerr-closed" },
  22 |   { sceneId: "act3_testimony_review", art: "sera-hearing", flags: { memory_sequence_checked: true } },
  23 |   { sceneId: "act2_archive_brief", art: "edda-archive", flags: { archive_exported: true } },
  24 |   { sceneId: "act3_freight_visit", art: "courier-table", flags: { freight_unconfirmed: true } },
  25 |   { sceneId: "act3_shelter_visit", art: "laundry-cart", flags: { shelter_declined: true } },
  26 | ] as const;
  27 | const base = createCharacter({ handle: "Visual QA", givenName: "Ada", origin: "spire", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } });
  28 | async function open(page: Page, run: GameState, artwork: string) {
  29 |   await page.addInitScript(({ run, artwork }) => {
  30 |     localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
  31 |     localStorage.setItem("saint-shard-preferences", JSON.stringify({ reading: "all", artwork, sound: false, textStep: 2, contrast: "high", motion: "reduce" }));
  32 |   }, { run, artwork });
  33 |   await page.goto("/"); await page.getByTestId("continue-run").click();
  34 | }
  35 | // Keep each test bounded as the art catalog grows; every scenario still receives
  36 | // all three layouts and every save, responsive-source and missing-art assertion.
  37 | const batches = Array.from({ length: Math.ceil(scenarios.length / 5) }, (_, index) => scenarios.slice(index * 5, index * 5 + 5));
  38 | for (const [width, artwork] of [[390, "full"], [1440, "full"], [320, "none"]] as const) for (const [batchIndex, batch] of batches.entries()) test(`complete compositions preserve boundaries and saves at ${width}px, batch ${batchIndex + 1}`, async ({ browser, baseURL }) => {
  39 |   test.setTimeout(90_000);
  40 |   for (const scenario of batch) {
  41 |     const context = await browser.newContext({ baseURL, viewport: { width, height: width > 700 ? 900 : 844 }, reducedMotion: "reduce" });
  42 |     const page = await context.newPage(); const media: string[] = [];
  43 |     page.on("request", r => { if (/\/(art|audio)\//.test(r.url())) media.push(r.url()); });
  44 |     const run = { ...base, sceneId: scenario.sceneId, flags: { ...scenario.flags } };
  45 |     await open(page, run, artwork);
  46 |     const goal = await page.getByTestId("goal").boundingBox();
  47 |     expect(goal!.y).toBeGreaterThanOrEqual(0); expect(goal!.y + goal!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  48 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  49 |     if (artwork === "none") { await expect(page.getByTestId("scene-illustration")).toHaveCount(0); expect(media).toEqual([]); }
  50 |     else {
  51 |       const img = page.getByTestId("scene-illustration").locator("img");
  52 |       await expect(img).toHaveAttribute("src", `/art/${scenario.art}.jpg`);
  53 |       await img.scrollIntoViewIfNeeded();
> 54 |       const decoded = await img.evaluate(async (el: HTMLImageElement) => { await el.decode(); const box = el.getBoundingClientRect(); return { width: el.naturalWidth, ratio: box.width / box.height, fit: getComputedStyle(el).objectFit, source: el.currentSrc }; });
     |                                 ^ Error: locator.evaluate: Invalid image request.
  55 |       expect(decoded.width).toBeGreaterThan(0); expect(decoded.ratio).toBeCloseTo(1.5, 2); expect(decoded.fit).toBe("contain");
  56 |       await expect(img).toHaveAttribute("srcset", `/art/${scenario.art}-small.jpg 600w, /art/${scenario.art}.jpg 1200w`);
  57 |       // Browsers may retain/prefer the larger candidate; both are valid deliveries.
  58 |       expect(decoded.source).toMatch(new RegExp(`/art/${scenario.art}(-small)?[.]jpg$`));
  59 |       if ("portrait" in scenario) await expect(page.locator(".scene-row .portrait")).toHaveAttribute("src", `/art/${scenario.portrait}.jpg`);
  60 |     }
  61 |     expect(await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(run);
  62 |     await context.close();
  63 |   }
  64 | });
  65 | 
  66 | test("missing new scene plates retain their descriptions and actionable choices", async ({ browser, baseURL }) => {
  67 |   test.setTimeout(90_000);
  68 |   for (const scenario of scenarios.filter(s => ["act2_witness_support", "act2_recovery", "act2_response_dispatch", "ward_wall", "act2_notice_privacy_refusal", "act2_workshop", "act2_shelter_methods", "act2_witness_checkpoint", "act2_response_invitation", "act2_witness_arrival", "act2_route_receipt", "act3_testimony_review", "act2_archive_brief", "act3_freight_visit", "act3_shelter_visit"].includes(s.sceneId))) {
  69 |     const context = await browser.newContext({ baseURL }); const page = await context.newPage();
  70 |     await page.route("**/art/**", r => r.abort());
  71 |     await open(page, { ...base, sceneId: scenario.sceneId, flags: { ...scenario.flags } }, "full");
  72 |     const figure = page.getByTestId("scene-illustration"); await figure.scrollIntoViewIfNeeded();
  73 |     await expect(figure.locator(".art-unavailable")).not.toBeEmpty();
  74 |     await expect(page.getByTestId("goal")).toBeVisible();
  75 |     await expect(page.locator('[data-testid^="choice-"]:enabled').first()).toBeVisible();
  76 |     await context.close();
  77 |   }
  78 | });
  79 | 
```