# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game.spec.ts >> a recorded roll survives reload and cannot be rerolled
- Location: tests/game.spec.ts:68:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "/127.0.0.1:3101/audio/theme-title.flac due to access control checks.",
+ ]
```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - alert [ref=f2e2]
  - generic [ref=f2e3]:
    - link "Skip to choices" [ref=f2e4]:
      - /url: "#choices"
    - banner [ref=f2e5]:
      - generic [ref=f2e12]:
        - text: Saint Shard
        - generic [ref=f2e13]: Kite City 3055
      - generic [ref=f2e14]:
        - generic [ref=f2e15]:
          - generic [ref=f2e16]: Strain
          - meter "Strain 1 of 5" [ref=f2e19]
        - generic [ref=f2e25]: 100 cr
      - generic [ref=f2e28]:
        - button "Settings" [ref=f2e29] [cursor=pointer]
        - button "Saves" [ref=f2e30] [cursor=pointer]
        - button "Abandon" [ref=f2e31] [cursor=pointer]
    - generic [ref=f2e32]:
      - main [ref=f2e33]:
        - article [active] [ref=f2e34]:
          - generic [ref=f2e35]:
            - figure [ref=f2e36]:
              - generic "Quill · The broker" [ref=f2e37]:
                - generic [ref=f2e38]: Quill
                - generic [ref=f2e39]: The broker
                - generic [ref=f2e40]: Speaking
            - generic [ref=f2e41]:
              - paragraph [ref=f2e42]:
                - text: Noodle stall, Ward Four
                - generic [ref=f2e46]: · The Hour
              - heading "Noodle stall, Ward Four · The Hour" [level=1] [ref=f2e47]
              - paragraph [ref=f2e48]: Hear Quill's terms. Decide whether to take Mara Voss's hour from Glass Chapel.
              - paragraph [ref=f2e49]: Noodle stall, Ward Four · The Hour. Hear Quill's terms. Decide whether to take Mara Voss's hour from Glass Chapel.
          - 'figure "Kite City · the sheltered counter View artwork: Kite City · the sheltered counter" [ref=f2e50]':
            - img "Steam rises from an unattended copper noodle pot beneath a patched market awning, beside a damp menu and two empty counter seats." [ref=f2e53]
            - generic [ref=f2e54]:
              - generic [ref=f2e55]: Kite City · the sheltered counter
              - 'button "View artwork: Kite City · the sheltered counter" [ref=f2e56] [cursor=pointer]': View artwork
          - paragraph [ref=f2e58]:
            - text: "\""
            - mark [ref=f2e59]: Cute. Fifty. Count it if you want. The count will not change, and neither will my face.
            - text: "\""
          - complementary "Quill selected dialogue" [ref=f2e60]:
            - button "Stop line" [ref=f2e61] [cursor=pointer]
            - status [ref=f2e62]: Playing selected dialogue · Quill · Line 1 of 1 · synthetic voice
            - group [ref=f2e65]:
              - generic "Voice transcript" [ref=f2e66] [cursor=pointer]
          - region [ref=f2e67]:
            - generic [ref=f2e68]:
              - heading "Your next move" [level=2] [ref=f2e69]
              - paragraph [ref=f2e70]: Selecting an option commits it. For a check, review the odds and costs first; Back leaves it unrolled.
            - button "Sit with it." [ref=f2e71] [cursor=pointer]:
              - generic [ref=f2e72]: "1"
      - complementary "Character sheet" [ref=f2e77]:
        - generic [ref=f2e84]:
          - heading "Rex" [level=2] [ref=f2e85]
          - paragraph [ref=f2e86]: Spire Exile · Ada
        - button "City map" [ref=f2e87] [cursor=pointer]
        - group [ref=f2e90]:
          - generic "Origin & complication" [ref=f2e91] [cursor=pointer]
        - group [ref=f2e92]:
          - generic "People · 1 met" [ref=f2e93] [cursor=pointer]
        - tablist "Character details" [ref=f2e94]:
          - tab "stats" [selected] [ref=f2e95] [cursor=pointer]
          - tab "gear" [ref=f2e96] [cursor=pointer]
          - tab "journal" [ref=f2e97] [cursor=pointer]
        - tabpanel "stats" [ref=f2e98]:
          - generic [ref=f2e99]:
            - generic [ref=f2e100]: Chrome
            - generic [ref=f2e103]: "3"
          - generic [ref=f2e106]:
            - generic [ref=f2e107]: Nerve
            - generic [ref=f2e110]: "2"
          - generic [ref=f2e113]:
            - generic [ref=f2e114]: Face
            - generic [ref=f2e117]: "4"
          - generic [ref=f2e120]:
            - generic [ref=f2e121]: Ghost
            - generic [ref=f2e124]: "1"
          - group [ref=f2e127]:
            - generic "How stats work" [ref=f2e128] [cursor=pointer]
          - heading "Factions" [level=3] [ref=f2e129]
          - generic [ref=f2e130]:
            - generic [ref=f2e131]: Quill
            - generic [ref=f2e134]: "0"
          - generic [ref=f2e137]:
            - generic [ref=f2e138]: Lumen
            - generic [ref=f2e141]: "1"
          - generic [ref=f2e144]:
            - generic [ref=f2e145]: Helion
            - generic [ref=f2e148]: "1"
          - generic [ref=f2e151]:
            - generic [ref=f2e152]: The wards
            - generic [ref=f2e155]: "0"
          - group [ref=f2e158]:
            - generic "How factions affect checks" [ref=f2e159] [cursor=pointer]
          - group [ref=f2e160]:
            - generic "What you did · 1 recent" [ref=f2e161] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | import { commitChoice, getScene, presentChoices } from "../lib/engine";
  4   | import { exportRun } from "../lib/vault";
  5   | import { fixture, openRun } from "./fixtures/game";
  6   | 
  7   | for (const [width, saved, large] of [[390, false, false], [1440, true, false], [320, true, true]] as const) test(`title key art and keyboard start controls at ${width}px`, async ({ page }) => {
  8   |   await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
  9   |   await page.addInitScript(({ run, large }) => {
  10  |     localStorage.setItem("saint-shard-preferences", JSON.stringify({ textStep: large ? 2 : 0, contrast: large ? "high" : "standard", motion: "reduce" }));
  11  |     if (run) localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run));
  12  |   }, { run: saved ? fixture() : null, large });
  13  |   await page.goto("/");
  14  |   await expect(page.getByRole("heading", { name: "Saint Shard", level: 1 })).toBeVisible();
  15  |   const image = page.getByTestId("title-art").locator("img");
  16  |   await expect(image).toHaveAttribute("src", "/art/title.jpg");
  17  |   await expect(image).toHaveAttribute("alt", /Symbolic title art: a lone runner/);
  18  |   expect(await image.evaluate((img: HTMLImageElement) => img.decode().then(() => img.naturalWidth))).toBeGreaterThan(0);
  19  |   for (const id of saved ? ["continue-run", "new-run"] : ["new-run"]) {
  20  |     const bounds = await page.getByTestId(id).boundingBox();
  21  |     expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(width < 700 ? 844 : 900);
  22  |   }
  23  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  24  |   expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  25  |   if (saved) {
  26  |     await page.getByTestId("continue-run").focus(); await page.keyboard.press("Tab");
  27  |     await expect(page.getByTestId("new-run")).toBeFocused(); await page.keyboard.press("Enter");
  28  |     await expect(page.getByRole("dialog", { name: "Start over?" })).toBeVisible();
  29  |     await page.getByRole("button", { name: "Keep it", exact: true }).click();
  30  |     await expect(page.getByTestId("new-run")).toBeFocused();
  31  |     await page.getByTestId("continue-run").focus(); await page.keyboard.press("Enter");
  32  |     await expect(page.getByTestId("scene")).toBeVisible();
  33  |     const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  34  |     expect(state.sceneId).toBe("stall"); expect(state.handle).toBe("Rex");
  35  |   } else {
  36  |     await page.getByTestId("new-run").focus(); await page.keyboard.press("Enter");
  37  |     await expect(page.getByTestId("handle-input")).toBeVisible();
  38  |   }
  39  | });
  40  | 
  41  | test("unavailable title artwork leaves start and settings usable", async ({ page }) => {
  42  |   await page.route("**/art/title*.jpg", (route) => route.abort());
  43  |   await page.goto("/");
  44  |   await expect(page.getByTestId("title-art")).toBeVisible();
  45  |   await expect.poll(() => page.getByTestId("title-art").locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 0)).toBe(true);
  46  |   await page.getByRole("button", { name: "Settings", exact: true }).click();
  47  |   await page.getByLabel("Artwork", { exact: true }).selectOption("none");
  48  |   await page.getByRole("button", { name: "Done", exact: true }).click();
  49  |   await expect(page.getByTestId("title-art")).toHaveCount(0);
  50  |   await page.getByTestId("new-run").click(); await expect(page.getByTestId("handle-input")).toBeVisible();
  51  | });
  52  | 
  53  | test("new runner, settings, reading width and saved preferences", async ({ page }) => {
  54  |   await page.goto("/"); await page.getByTestId("new-run").click();
  55  |   await page.getByTestId("handle-input").fill("Rex"); await page.getByTestId("complication-debt").click();
  56  |   await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click(); await page.getByTestId("start-run").click();
  57  |   await expect(page.getByTestId("goal")).toBeInViewport();
  58  |   const scene = await page.getByTestId("scene").boundingBox(); const prose = await page.getByTestId("scene-text").boundingBox();
  59  |   expect(prose!.width).toBeGreaterThan(scene!.width * 0.8);
  60  |   await page.getByRole("button", { name: "Settings", exact: true }).click();
  61  |   await page.getByLabel("Reading pace").selectOption("all"); await page.getByLabel("Contrast", { exact: true }).selectOption("high");
  62  |   await page.getByLabel("Text size").selectOption("1"); await page.getByRole("button", { name: "Done", exact: true }).click();
  63  |   await page.reload(); await page.getByTestId("continue-run").click();
  64  |   await expect(page.locator("html")).toHaveAttribute("data-text", "1"); await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  65  |   await expect(page.getByTestId("show-rest")).toHaveCount(0);
  66  | });
  67  | 
  68  | test("a recorded roll survives reload and cannot be rerolled", async ({ page }) => {
  69  |   const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  70  |   await page.goto("/"); await page.evaluate((run) => localStorage.setItem("saint-shard-3055-v1", JSON.stringify(run)), fixture("pay"));
  71  |   await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("continue-run").click(); await page.getByTestId("choice-haggle").click(); await page.getByTestId("roll-button").click();
  72  |   const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  73  |   expect(stored.pendingCheck.roll).toBeGreaterThanOrEqual(1);
  74  |   let releaseFonts!: () => void; const fonts = new Promise<void>(resolve => { releaseFonts = resolve; });
  75  |   // Restore must be usable while optional font requests remain outstanding.
  76  |   // Waiting for window.load would couple saved dice to those media requests.
  77  |   await page.route("**/fonts/*.woff2", async route => { await fonts; await route.continue(); });
  78  |   try {
  79  |     await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("continue-run").click();
  80  |     await expect(page.getByTestId("roll-button")).toHaveCount(0); await expect(page.getByTestId("continue-check")).toBeVisible();
  81  |     await expect(page.locator(".total")).toContainText(String(stored.pendingCheck.roll));
  82  |     await page.getByTestId("continue-check").click();
  83  |     const committed = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
> 84  |     expect(committed.pendingCheck).toBeUndefined(); expect(committed.rolls).toHaveLength(1); expect(errors).toEqual([]);
      |                                                                                                             ^ Error: expect(received).toEqual(expected) // deep equality
  85  |     expect(committed.rolls[0].roll).toBe(stored.pendingCheck.roll);
  86  |   } finally { releaseFonts(); }
  87  | });
  88  | 
  89  | test("modal controls stay isolated and return focus", async ({ page }) => {
  90  |   await openRun(page);
  91  |   const settings = page.getByRole("button", { name: "Settings", exact: true }); await settings.click();
  92  |   await page.keyboard.press("1"); await page.keyboard.press("Escape"); await expect(settings).toBeFocused();
  93  |   await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  94  |   if (page.viewportSize()!.width <= 1100) {
  95  |     const toggle = page.getByTestId("sheet-toggle"); await toggle.click();
  96  |     await page.keyboard.press("1"); await expect(page.getByTestId("choice-ask-pay")).toBeAttached();
  97  |     await page.getByRole("tab", { name: "stats", exact: true }).focus();
  98  |     await page.keyboard.press("ArrowRight"); await expect(page.getByRole("tab", { name: "gear", exact: true })).toBeFocused();
  99  |     await page.keyboard.press("End"); await expect(page.getByRole("tab", { name: "journal", exact: true })).toBeFocused();
  100 |     await page.keyboard.press("Escape"); await expect(toggle).toBeFocused();
  101 |   }
  102 | });
  103 | 
  104 | test("slots, corrupted import, backup and export", async ({ page }) => {
  105 |   await openRun(page); await page.getByRole("button", { name: "Saves", exact: true }).click();
  106 |   await page.getByRole("button", { name: "Save to slot 1", exact: true }).click(); await expect(page.getByRole("dialog").getByRole("status")).toContainText("Slot 1 saved");
  107 |   const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Export run", exact: true }).click(); expect((await download).suggestedFilename()).toBe("saint-shard-run.json");
  108 |   await page.getByLabel("Import a saved run").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from('{"version":2,"stats":[]}') });
  109 |   await expect(page.getByRole("dialog").getByRole("status")).toContainText("supported");
  110 |   await page.getByRole("button", { name: "Close saves", exact: true }).click(); await page.getByTestId("choice-ask-pay").click();
  111 |   await page.getByRole("button", { name: "Saves", exact: true }).click(); await page.getByRole("button", { name: "Load slot 1", exact: true }).click(); await page.getByRole("button", { name: "Confirm load", exact: true }).click();
  112 |   await expect(page.getByTestId("choice-ask-pay")).toBeVisible();
  113 | });
  114 | 
  115 | test("imports preserve pending outcomes", async ({ page }) => {
  116 |   const state = fixture("pay", { pendingCheck: { sceneId: "pay", choiceId: "haggle", roll: 1 } });
  117 |   await page.goto("/"); await page.getByRole("button", { name: "Saves", exact: true }).click();
  118 |   await page.getByLabel("Import a saved run").setInputFiles({ name: "run.json", mimeType: "application/json", buffer: Buffer.from(exportRun(state)) });
  119 |   await expect(page.getByTestId("continue-check")).toBeVisible(); await expect(page.getByTestId("roll-button")).toHaveCount(0);
  120 | });
  121 | 
  122 | for (const mode of ["blocked", "quota"] as const) test(`plays with ${mode} storage`, async ({ page }) => {
  123 |   await page.addInitScript((kind) => {
  124 |     if (kind === "blocked") Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
  125 |     else Storage.prototype.setItem = function () { throw new DOMException("Full", "QuotaExceededError"); };
  126 |   }, mode);
  127 |   await page.goto("/"); await page.getByTestId("new-run").click(); await page.getByTestId("handle-input").fill("Rex"); await page.getByTestId("complication-debt").click(); await page.getByTestId("plus-chrome").click(); await page.getByTestId("plus-nerve").click(); await page.getByTestId("start-run").click();
  128 |   await expect(page.getByRole("status").filter({ hasText: "could not be saved" })).toContainText("could not be saved"); await page.getByTestId("choice-skip-opening").click(); await page.getByTestId("choice-ask-pay").click(); await expect(page.getByTestId("choice-haggle")).toBeVisible();
  129 | });
  130 | 
  131 | test("memory inspection, disposition and consequence entry", async ({ page }) => {
  132 |   await openRun(page, fixture("mara_why", { items: ["shard"], flags: { heard_memo: true }, journal: [{ id: "ward-nine", text: "The original memo." }] }));
  133 |   await page.getByTestId("choice-inspect-hour").click(); await expect(page.getByTestId("choice-seal-full")).toHaveCount(0);
  134 |   for (const id of ["signature", "order", "roster"]) await page.getByTestId(`choice-inspect-${id}`).click();
  135 |   expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  136 |   await expect(page.getByTestId("memory-plate")).toContainText("3 / 3 inspected");
  137 |   await expect(page.getByTestId("choice-seal-witness")).toHaveCount(0);
  138 |   for (const id of ["reconstruct", "separate-decisions", "label-unverified", "seal-witness"]) await page.getByTestId(`choice-${id}`).click();
  139 |   const state = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!)); expect(state.flags.memory_witness).toBe(true);
  140 | });
  141 | 
  142 | for (const finale of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) test(`finale ${finale} and its aftermath are readable`, async ({ page }) => {
  143 |   await openRun(page, fixture(finale, { flags: { witness_safe: true, memory_witness: true, order_verified: true } }));
  144 |   await expect(page.getByTestId("ending-title")).toBeVisible(); await expect(page.getByRole("heading", { name: "What remains", exact: true })).toBeVisible();
  145 |   await page.getByRole("button", { name: "Title", exact: true }).click(); await expect(page.getByTestId("codex")).toContainText(/Said Aloud|Left to the Rain|Already Loose|On the Folio/);
  146 | });
  147 | 
  148 | test("automated accessibility checks for scene and settings", async ({ page }) => {
  149 |   await openRun(page); expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  150 |   await page.getByRole("button", { name: "Settings", exact: true }).click(); expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  151 | });
  152 | 
  153 | test("plays an uninterrupted campaign through evidence, practice, a contract and witness safety", async ({ page }) => {
  154 |   test.setTimeout(120_000);
  155 |   const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  156 |   await page.addInitScript(() => { Math.random = () => 0.75; });
  157 |   await openRun(page);
  158 |   let expected = fixture();
  159 |   const route = ["ask-pay", "haggle", "pocket", "accept", "side", "spoof-door", "go", "honest", "pact-copy", "copy", "heard", "inspect-hour", "inspect-signature", "inspect-order", "inspect-roster", "reconstruct", "separate-decisions", "label-unverified", "seal-witness", "talk-leave", "both", "week-after", "into-week", "practice", "learn-ghost", "read-board", "origin-contract", "clear-key", "return-board", "to-lumen", "hear-lumen", "walk-with-her", "protect-witness", "agree-terms", "use-existing-plan", "pay-room", "review-account", "file-account", "stand", "back-to-board", "to-the-wall", "to-ward-nine", "visit-nia", "acknowledge-nia", "face-sera", "read-names"];
  160 |   for (const id of route) {
  161 |     const choice = presentChoices(expected, getScene(expected.sceneId)).find(choice => choice.id === id && choice.enabled)!;
  162 |     expect(choice, `${expected.sceneId}/${id}`).toBeDefined();
  163 |     expected = commitChoice(expected, choice, choice.check ? { roll: 8 } : undefined).state;
  164 |     await page.getByTestId(`choice-${id}`).click({ timeout: 10_000 });
  165 |     if (choice.check) {
  166 |       await page.getByTestId("roll-button").click({ timeout: 10_000 }); await page.getByTestId("continue-check").click({ timeout: 10_000 });
  167 |     }
  168 |     // Verify every persisted outcome, not just the final flags. Each action and
  169 |     // state assertion remains bounded independently of the campaign watchdog.
  170 |     await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!))).toEqual(expected);
  171 |   }
  172 |   await expect(page.getByTestId("ending-title")).toBeVisible();
  173 |   await expect(page.locator(".aftermath")).toContainText("Nia");
  174 |   const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("saint-shard-3055-v1")!));
  175 |   expect(saved.flags.witness_safe).toBe(true); expect(saved.flags.order_verified).toBe(true);
  176 |   expect(saved.flags.perk_ghost).toBe(true); expect(saved.items).toContain("signal-baffle");
  177 |   expect(saved.sceneId).toBe("ending_names"); expect(errors).toEqual([]);
  178 | });
  179 | 
  180 | test("controller input navigates title and closes only the active dialog", async ({ page }) => {
  181 |   await page.addInitScript(() => {
  182 |     const pressed = Array(16).fill(false);
  183 |     Object.defineProperty(window, "testPad", { value: pressed });
  184 |     Object.defineProperty(navigator, "getGamepads", { value: () => [{ index: 0, mapping: "standard", buttons: pressed.map((value) => ({ pressed: value })) }] });
```