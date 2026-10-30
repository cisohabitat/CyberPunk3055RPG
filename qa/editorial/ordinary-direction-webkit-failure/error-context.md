# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ordinary-direction.spec.ts >> ordinary view selection retains reading anchor and Settings at 1440px; zoom restores focus; close removes selected image
- Location: tests/ordinary-direction.spec.ts:44:38

# Error details

```
Error: Control not reached after 240 Tabs: <button class="ghost" type="button">Settings</button>
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - link "Skip to choices" [ref=e4]:
      - /url: "#choices"
    - banner [ref=e5]:
      - generic [ref=e12]:
        - text: Saint Shard
        - generic [ref=e13]: Kite City 3055
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Strain
          - meter "Strain 0 of 5" [ref=e19]
        - generic [ref=e25]: 165 cr
      - generic [ref=e28]:
        - button "Settings" [ref=e29] [cursor=pointer]
        - button "Saves" [ref=e30] [cursor=pointer]
        - button "Abandon" [ref=e31] [cursor=pointer]
    - generic [ref=e32]:
      - main [ref=e33]:
        - article [ref=e34]:
          - generic [ref=e35]:
            - figure [ref=e36]:
              - generic "Kerr · Her shadow" [ref=e37]:
                - generic [ref=e38]: Kerr
                - generic [ref=e39]: Her shadow
            - generic [ref=e40]:
              - paragraph [ref=e41]:
                - text: Ward Four stall
                - generic [ref=e45]: · The Week
              - heading "Ward Four stall · The Week" [level=1] [ref=e46]
              - paragraph [ref=e47]: The week wants a buyer or a witness.
              - paragraph [ref=e48]: Ward Four stall · The Week. The week wants a buyer or a witness.
          - status [ref=e49]: Loaded Autosave — The Week · Ward Four stall
          - generic [ref=e50]:
            - paragraph [ref=e51]: “A depot reference points to a desk. It doesn't tell me what you kept in your coat. What are you asking me to carry?”
            - paragraph [ref=e52]: The posted depot procedure is public. Your case notes are not. If you show Kerr the summary, use the same source scope you gave Edda and include any docket showing a breach of his private collection terms. No witness material will be shared. You can keep the case closed.
          - complementary "Kerr selected dialogue" [ref=e53]:
            - button "Listen to Kerr" [disabled] [ref=e54] [cursor=pointer]
            - status [ref=e55]: Enable Sound and voice volume in Settings to listen.
            - group [ref=e58]:
              - generic "Voice transcript" [ref=e59] [cursor=pointer]
          - region "Current commitments" [ref=e61]:
            - group [ref=e62]:
              - generic "Campaign commitments · 1/2 complete · 1 compromised" [ref=e63] [cursor=pointer]
          - group [ref=e64]:
            - generic "Depot response · people and consequences" [ref=e65] [cursor=pointer]
          - region [ref=e66]:
            - generic [ref=e67]:
              - heading "Your next move" [level=2] [ref=e68]
              - paragraph [ref=e69]: Selecting an option commits it. For a check, review the odds and costs first; Back leaves it unrolled.
            - button "Show the bounded source summary and any broken private-collection docket." [ref=e70] [cursor=pointer]:
              - generic [ref=e71]: "1"
            - button "Keep the case private; ask only about the posted depot opportunity." [ref=e76] [cursor=pointer]:
              - generic [ref=e77]: "2"
          - group [ref=e82]:
            - generic "Look closer · Kerr's counter · before you share" [ref=e83] [cursor=pointer]
            - 'figure "The counter · a quiet corner View artwork: The counter · a quiet corner" [ref=e84]':
              - img "A chipped cup, its pale ring and a folded blank paper occupy a worn wooden tabletop corner. The floor and case location remain outside the frame; no delivery, recipient entry, payment or treatment is depicted." [ref=e87]
              - generic [ref=e88]:
                - generic [ref=e89]: The counter · a quiet corner
                - 'button "View artwork: The counter · a quiet corner" [ref=e90] [cursor=pointer]': View artwork
            - group "Artwork view" [ref=e91]:
              - button "Scene" [ref=e92] [cursor=pointer]
              - button "Person" [ref=e93] [cursor=pointer]
              - button "Detail" [active] [pressed] [ref=e94] [cursor=pointer]
      - complementary "Character sheet" [ref=e95]:
        - generic [ref=e102]:
          - heading "Replay" [level=2] [ref=e103]
          - paragraph [ref=e104]: Dustline · Ada
        - button "City map" [ref=e105] [cursor=pointer]
        - group [ref=e108]:
          - generic "Origin & complication" [ref=e109] [cursor=pointer]
        - group [ref=e110]:
          - generic "People · 8 met" [ref=e111] [cursor=pointer]
        - tablist "Character details" [ref=e112]:
          - tab "stats" [selected] [ref=e113] [cursor=pointer]
          - tab "gear" [ref=e114] [cursor=pointer]
          - tab "journal" [ref=e115] [cursor=pointer]
        - tabpanel "stats" [ref=e116]:
          - paragraph [ref=e117]:
            - strong [ref=e118]: Signal discipline
            - text: · Chrome checks +1. Isolate an archive key locally; scanner preparation unlocks a clinic-only transfer at a strain cost.
          - generic [ref=e119]:
            - generic [ref=e120]: Chrome
            - generic [ref=e123]: "2"
          - generic [ref=e126]:
            - generic [ref=e127]: Nerve
            - generic [ref=e130]: "2"
          - generic [ref=e133]:
            - generic [ref=e134]: Face
            - generic [ref=e137]: "1"
          - generic [ref=e140]:
            - generic [ref=e141]: Ghost
            - generic [ref=e144]: "5"
          - group [ref=e147]:
            - generic "How stats work" [ref=e148] [cursor=pointer]
          - heading "Factions" [level=3] [ref=e149]
          - generic [ref=e150]:
            - generic [ref=e151]: Quill
            - generic [ref=e154]: "4"
          - generic [ref=e157]:
            - generic [ref=e158]: Lumen
            - generic [ref=e161]: "2"
          - generic [ref=e164]:
            - generic [ref=e165]: Helion
            - generic [ref=e168]: "5"
          - generic [ref=e171]:
            - generic [ref=e172]: The wards
            - generic [ref=e175]: "2"
          - group [ref=e178]:
            - generic "How factions affect checks" [ref=e179] [cursor=pointer]
          - group [ref=e180]:
            - generic "What you did · 6 recent" [ref=e181] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, type Locator, type Page } from "@playwright/test";
  2  | 
  3  | /** QA navigation through actual Tab/Shift+Tab order. No programmatic focus,
  4  |  * pointer clicks, input fills or number shortcuts are used by these helpers. */
  5  | export async function tabTo(page: Page, target: Locator, limit = 240) {
  6  |   await expect(target).toBeVisible();
  7  |   for (let tabs = 0; tabs <= limit; tabs++) {
  8  |     const direction = await target.evaluate(element => {
  9  |       const active = document.activeElement;
  10 |       if (element === active) return "reached";
  11 |       // Go backwards to earlier controls instead of wrapping through browser
  12 |       // chrome, where page-directed synthetic keys cannot reliably return.
  13 |       return active && active !== document.body && Boolean(element.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING) ? "Shift+Tab" : "Tab";
  14 |     });
  15 |     if (direction === "reached") return tabs;
  16 |     if (tabs < limit) await page.keyboard.press(direction);
  17 |   }
> 18 |   throw new Error(`Control not reached after ${limit} Tabs: ${await target.evaluate(element => element.outerHTML.slice(0, 300))}`);
     |         ^ Error: Control not reached after 240 Tabs: <button class="ghost" type="button">Settings</button>
  19 | }
  20 | 
  21 | export async function keyboardActivate(page: Page, target: Locator) {
  22 |   await expect(target).toBeEnabled();
  23 |   const tabs = await tabTo(page, target);
  24 |   const checkbox = await target.evaluate(element => element instanceof HTMLInputElement && element.type === "checkbox");
  25 |   await page.keyboard.press(checkbox ? "Space" : "Enter");
  26 |   return tabs;
  27 | }
  28 | 
  29 | export async function keyboardSelect(page: Page, target: Locator, value: string) {
  30 |   const tabs = await tabTo(page, target);
  31 |   const index = await target.evaluate((element, wanted) => Array.from((element as HTMLSelectElement).options).findIndex(option => option.value === wanted), value);
  32 |   if (index < 0) throw new Error(`Missing select option ${value}`);
  33 |   await page.keyboard.press("Home");
  34 |   for (let i = 0; i < index; i++) await page.keyboard.press("ArrowDown");
  35 |   await page.keyboard.press("Enter");
  36 |   await expect(target).toHaveValue(value);
  37 |   return tabs;
  38 | }
  39 | 
```