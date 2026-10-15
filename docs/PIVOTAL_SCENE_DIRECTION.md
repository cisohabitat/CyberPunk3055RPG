# Mara and Nia: pivotal scene direction

Mara’s recorded admission and explanation, then Nia’s terms, transfer preparation and arrival now put the canonical narrative before mission panels. At desktop widths, the complete painting sits beside the words; phones show the words before the painting. Compact speaker portraits leave the location and goal at the top. Recorded testimony and present-day conversation have distinct labels. Existing quotations receive a subtle paragraph rule; the actual audible part retains its precise actor highlight.

## Scope and media decisions

The explicit scope is `memo`, `mara_why`, `act2_witness_brief`, `act2_witness_support` and `act2_witness_arrival`. Existing Mara revelation, Nia transfer and Nia arrival paintings already represent these moments. Reuse preserves identity and chronology, with no invented treatment, address, recording permission, absolution or grateful response. No art or audio bytes change. Every performance retains its exact words, actor, binding key and order. See `qa/media/pivotal-scenes.json` for canonical text hashes, dialogue bindings and individual art decisions; `qa/media/scene-art.json` records each scene’s framing rationale. The preceding full media inventory remains locked by the character-profile tests.

Nia’s two pre-transfer scenes now use the quiet score and Glass Chapel clinic ambience. Arrival retains private witness-room ambience. The five frames multiply the existing Music slider by 55% and Ambience by 75%, alongside ordinary speech ducking. Voice gain and Effects stay independent. Leaving restores the next scene’s normal mix; changing or restarting a mixer bus preserves the current scene’s direction. Saved mute, zero channels and manual dialogue remain authoritative.

## Player control and preservation

Whole-scene reading remains the default. Saved paragraph pacing reveals only its current text and bound dialogue; framing never reveals later prose or creates a second quotation panel. No delay, camera movement, automatic scroll, focus jump or forced advance is introduced. Text-only omits paintings; failed images retain their descriptions and playable choices. The prose precedes artwork in the document order at every size.

This changes presentation only: 197 scenes, 587 choices, 143 complete replay fixtures, 302 dialogue bindings, 290 active deliveries, 1d10/stat/Strain caps, costs, recorded dice, evidence/consent, four finales, save version 2 and `saint-shard-3055-v1` remain. The provisional internal grade remains 8.2; this phase alone does not establish AAA production quality.

## Validation

Source-familiar authored-route checkpoints compare the preceding production bundle with this build at 390px and 1440px, default text and whole-scene reading. All five key dialogue paragraphs begin above 700px after the change, without horizontal overflow or a save mutation. Desktop Mara’s admission moves from approximately 1,054px to 417px; Nia’s terms from approximately 1,200px to 417px. Screenshots accompany the private release evidence. This is directed proxy validation, not independent human testing.

`lib/pivotal-scenes.test.ts` checks reviewed canonical text, actors, bindings, paintings and explicit scope. `lib/sound-staging.test.ts` checks the actual pre-transfer and arrival rooms. `tests/pivotal-scenes.spec.ts` exercises all five frames on phone/desktop and 320px largest-text, high-contrast text-only; full paintings, first-screen goals, exact single-copy prose, accessibility, saved paragraph revelation, missing-art play, native voice highlights and bus gain restoration. Existing speaker, automatic-dialogue, visual, campaign and full required release regressions remain mandatory. Full voiced keyboard campaign play and the production/performance gate supplement these targeted cases.

Encounter variety is the next separate phase after this scene-direction release is verified.

Local candidate evidence: 560 source tests, TypeScript and 114 targeted browser regressions across Chromium, phone Chromium and WebKit pass. Both complete keyboard campaigns reach `ending_names` with identical costs and saved dice: 76 visits and 37 naturally completed voice plays each, including every pivotal performance; no browser errors, missing media or remaining live audio sources. The production report retains 197/587/143 and no budget violations. Four native first-visit performance samples stay below the unchanged 2 MiB transfer gate, with visible goals and no overflow. These measurements describe the automation host and directed runs, not field percentiles or independent listener ratings.
