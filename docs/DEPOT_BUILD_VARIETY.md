# Depot build variety — 11 October 2026

This cycle compares Chrome, Ghost, Nerve and Face across Chapel entry, Nia's transfer and Kerr's collection, then improves the weakest decision structure: the depot. The provisional internal grade remains **8.2/10**. This is one craft increment toward the [production roadmap](ROADMAP.md), not a completed AAA campaign or a new player rating.

## Selection evidence

`npx tsx scripts/encounter-comparison.ts` reproduces [24 matched engine scenarios](../qa/editorial/build-variety-baseline.json): four two-point builds, three encounters and directed dice eight/one. They use explicitly synthetic eligible preparations and reload saved states before and after decisions. Deterministic methods are unaffected by the directed die; those rows do not represent forced failures. These isolate decision structure and costs, rather than measuring player enjoyment.

Chapel already shares a saved three-action allowance between preparation, entry and exit; its service bargain creates a different watched work commitment. Nia already distinguishes preparation, transport equipment, clinic standing, voluntary stopping and separate recording permission. The depot's original four stat approaches each resolve **one DC 8 check**, followed by collection or recovery. Its route board, rig deposit and sorting shift remain useful, but the physical approaches converge most closely.

## What players can do

Train the relevant method through Practice in the Week. At the depot, compare trained methods before committing to a roll or handling bargain. Chrome, Ghost and Nerve require the matching ramp, gap or stair exit; Face works with any planned exit. Creation points alone do not unlock these methods.

| Build | New interaction | Decisions and cost | Later consequence |
| --- | --- | --- | --- |
| Chrome | Repair the release circuit; distinguish recipient isolation from the depot return circuit. | Spend ten creds for a disposable buffer, or one strain for a disconnect that leaves a service fault. Preserve the return address to release the case. Clearing both circuits holds it and adds one strain. | Kerr notices the preserved return mark. The ending records the actual buffer fee or service fault. |
| Ghost | Observe the outer pass, cart inspection and patrol return. | Save or pause at every beat. The first gap and cart cover are caught by the inspection. Waiting for the return adds one strain; crossing then needs no new roll. | Kerr remembers that you let the cart go. Failure stays recorded even if a registered courier later recovers the case. |
| Nerve | Balance a sealed load and choose how to rest on the stair. | Rent a landing cradle for five creds and one additional strain, or carry directly for two strain. Keep the case low. A high lift catches the rail, holds the case and adds one strain. | Kerr notices the lower strap. The ending records rental versus direct effort. Journey costs remain separate and already paid. |
| Face | Negotiate who carries liability, separating your work docket from Kerr's recipient register. | Promise your own later shift, pay fifteen creds for the steward's liability, or explicitly accept recipient registration. Work costs one strain only when actually completed. | Kerr distinguishes your obligation from his case. Unpaid work stays open at the ending; completed work is recorded once. Registration still breaks any private promise. |

These are readable, saved decisions. There is no reaction timer, extra die system or hidden passage of time while reading. Failures and voluntary abandonment lead to the existing registered-courier or unresolved-case recovery. The existing rolls, rig and immediate sorting shift remain available before a trained attempt begins.

## Continuity and presentation

- Starting a method commits one attempt. Canal returns resume its exact saved stage. Paid buffers, cradle rentals, patrol waiting and work cannot be farmed by pausing or reloading.
- Collection does not grant delivery. The observed handover remains a separate choice, and only that choice refunds a previously borrowed rig where applicable.
- Anonymous release never clears entry-gate registration. Failed tasks, previous betrayal, original promises and subsequent courier recovery remain recorded.
- A trained Face contract does not falsely credit Quill's unused introduction. It never offers Kerr's work without his permission.
- No method grants witness safety, recording permission, public quotation permission, source authentication or treatment.
- All ten new scenes reuse the responsive depot alcove illustration, explicitly registered in `qa/media/scene-art.json`. The case remains closed; the neutral art depicts no chosen tactic, timed patrol beat or completed release. Existing canal ambience accompanies the scenes when sound is enabled. Fixed voiced quotations are unchanged.
- Save version 2, `saint-shard-3055-v1`, recorded dice, 1d10, stat/strain bounds and all original finales remain compatible.

## Repeatable validation

Four new source-familiar authored campaigns start at character creation, assign two points to their named build, earn its trained method, enter Chapel, transfer Nia under her terms, collect Kerr's case and reach the Wall. The Face service-entry campaign follows its actual watched-door consequences rather than inventing a quiet copy. All four end at Said Aloud; the broader existing suite retains the other finales.

| Campaign | Committed choices | Final creds | Final strain | Important ending state |
| --- | ---: | ---: | ---: | --- |
| Chrome | 75 | 370 | 1 | Buffer paid; no new recipient entry. |
| Ghost | 79 | 380 | 2 | Return pass observed; no new recipient entry. |
| Nerve | 75 | 375 | 2 | Cradle paid; no new recipient entry. |
| Face | 74 | 365 | 0 | Own return shift still owed; no new recipient entry. |

Their final totals include earlier campaign choices, so they are not an isolated depot balance comparison. Matched engine scenarios and unit checks isolate those costs.

Commands:

```sh
npm test
npx tsc --noEmit
npm run build
npm run production:report
npm run story:replay -- qa/routes/depot-build-chrome.json qa/routes/depot-build-ghost.json qa/routes/depot-build-nerve.json qa/routes/depot-build-face.json
npm run test:browser -- tests/depot.spec.ts
npm run production:experience -- http://127.0.0.1:3311 --route qa/routes/depot-build-chrome.json --width 320 --artwork none --reading paragraph --out /tmp/depot-chrome.json
```

Internal checks cover 413 unit/replay tests, 107 campaign routes, TypeScript, production build and media budgets. The new browser tests cover each method through reload/receipt, three zero-funds failures, registered-contract continuity and all ten scenes at 320/390/1440 pixels, including largest text, high contrast and text-only delivery. The production catalog contains 195 scenes, 578 choices and 143 assets, with no budget violations. The four complete UI campaigns use actual keyboard input and directed dice ten, with 307 scene visits, 115 reloads and 271 paragraph reveals. This is authored simulation, not blind natural-dice play or human participation.

Four corresponding failed/abandoned-task campaigns also reach the finale through the registered courier, preserving the failed attempt and acknowledged privacy breach. Their final creds/strain are Chrome 350/2, Ghost 360/2, Nerve 355/3 and Face 345/0; Face has no accepted shift debt after abandoning the offer. All eight full keyboard UI campaigns total 613 visits, 229 reloads and 547 paragraph reveals, with no page errors or failed media.

Exact-revision CI across Chromium, phone Chromium, Firefox and WebKit, followed by public deployment verification, is required before release. Keep raw browser reports and saves outside Git. Simulated evidence is the primary development proxy while participants are unavailable; the separate six production acceptance gates remain pending.

## Next phase

Improve visual staging and expressive audio for stable dramatic scenes. Prioritize the opening contract, Mara's voluntary present-day response, Nia's arrival and Kerr's handover. Create a shot/asset list with explicit art decisions, use state-appropriate compositions and preserve text-only parity. Audition existing dialogue before replacing clips; update transcript, provenance, credits, preload/cache budgets and natural-completion checks together. Play complete campaigns again to judge whether the staging makes characters and consequences clearer, then reassess the affected grade categories from evidence.
