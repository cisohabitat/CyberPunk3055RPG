# Current internal game review — 10 October 2026

**Provisional internal grade: 7.8/10 as a browser narrative RPG**, reviewing `091403c`. This is a qualitative assessment informed by source review, rendered UI inspection and internal automated campaign play; it is not an independent player study or an AAA acceptance grade. The earlier 7.0 assessment is retained below as history.

| Area | Weight | Grade | Evidence and remaining weakness |
| --- | --- | --- | --- |
| Narrative and consequence | 20% | 8.0 | Opening motivations, remembered conduct, current Mara/Lumen goals and character beats across four finales are stronger. Procedural repetition and whole-campaign editorial quality remain concerns. |
| RPG depth and replay | 20% | 7.0 | Investigation, route planning, costs, origins and failure recovery create agency. Similar encounter structures and limited build differentiation constrain replay. |
| Visual presentation | 15% | 7.5 | Coherent interface, matching environmental plates, source illustrations and restrained expression variants. Expressive staging, complete cast model sheets and independent asset review remain needed. |
| Audio production | 10% | 6.8 | Four distinct scores, optional cues and six fixed synthetic dialogue clips with independent controls. Coverage and production scope are limited; independent listening/mix and directed-performance review remain open. |
| Usability and accessibility | 15% | 8.0 | Reading/contrast/motion/audio settings, save recovery and verified narrow text-only play. Physical-device and manual assistive-technology acceptance remain unproven. |
| Engineering and release | 20% | 8.8 | Exact-revision CI, durable saves/dice and verified public media. CI exceeds the initial deployment wait, requiring a safe same-revision retry; long-session and supported-device evidence remain open. |

Weighted total: **7.765**, rounded to **7.8**. Reliability is stronger than the gameplay and presentation. Content counts and passing tests support scope/compatibility, not enjoyment. Five full internal campaigns (four directed, one natural-dice), 276 unit tests and 460 browser checks passed for this revision; public WebKit flows passed at 390, 1440 and largest-text/high-contrast text-only 320 pixels. This does not demonstrate independent comprehension, accessibility, audiovisual craft or physical-device percentile performance.

The [grade-based roadmap](ROADMAP.md) sets six phases and ten delivery cycles, prioritizing encounter variety and builds, narrative editing, expressive art/audio and independent revision. Its weighted target is 9.35 with every category at least 9.0, not an automatic or promised score. All six independent production acceptance gates remain pending.

---

# Historical baseline review — 9 October 2026

**Baseline provisional grade: 7.0/10 as a browser narrative RPG.** This is a code and playable-flow assessment, not an external player study. It is stronger than the original 6.5/10 prototype. It has a coherent setting, consequential choices, save recovery, and a tested campaign. It still needs substantially more authored encounter variety, art direction, performance measurements on supported hardware, and independent player/editorial review to meet its AAA ambition.

| Area | Weight | Grade | Evidence and limitation |
| --- | --- | --- | --- |
| Narrative and consequence | 20% | 7/10 | Four finales, origin reactions, witness/archive follow-ups and personalized aftermath. Evidence continuity needed corrections; no professional narrative edit or fresh-player comprehension study. |
| RPG depth and replay | 20% | 6.5/10 | Three origins, one earned skill, faction favors and consumable tools. Encounter patterns and progression remain small relative to a premium RPG. |
| Visual presentation | 15% | 6/10 | Atmospheric portraits, environmental plates and readable phone layout. Repeated plates, incomplete character model sheets, and unverified asset provenance limit production readiness. |
| Audio production | 10% | 6/10 | Separate mixer channels and distinct procedural score beds. No commissioned performances or independent mix review. |
| Usability and accessibility | 15% | 7.5/10 | Native dialogs, large text, contrast, motion settings and controller navigation. The review found settings/input and phone-reading friction. Manual assistive-technology review remains open. |
| Engineering and release | 20% | 8.5/10 | Save validation/recovery, durable outcomes, unit and browser CI, fail-closed production gate. Device performance and external playtests remain unmeasured. |

The weighted score is 7.025, rounded to 7.0. These grades describe the reviewed baseline; fixing individual findings does not automatically prove a higher overall player-experience score.

## Findings addressed in this revision

- **Evidence continuity:** preserving the archive previously selected the verified aftermath without an authenticated issuing key. It now describes a retained but unverified receipt. The exposed-location witness route previously recorded corroboration without setting the corresponding state; it now does so while keeping the privacy failure explicit. At the wall, Nia is explicitly in a private witness ledger beside the memorial, rather than being presented as one of the dead or exposing her address.
- **Objective continuity:** memory promises could disappear among journal entries, and a safe room could be mistaken for a completed witness account. A compact commitments panel and contextual next step now distinguish transport, recording, corroboration, compromised privacy, and unresolved work. Week-closing choices warn about open memory promises.
- **Phone pacing:** the memory panel repeated three long sealed descriptions before the inspection controls. Inspection now happens inside each fragment row; inspected source details expand on request.
- **Input and reading controls:** the controller previously moved focus through sliders/selects without changing their values. Left/right now adjusts settings and switches sheet tabs. Reduced motion previously forced whole-scene reading despite a paragraph preference; those settings are now independent. Number-key repeats and number keys inside the desktop sheet cannot accidentally advance the story.
- **Audio activation:** audio now unlocks directly from enabling sound or continuing a sound-enabled run, before asynchronous score loading. The browser suite exercises a real score request after the gesture and a deliberately delayed resume promise. Score/cue loading no longer waits on resume, which can remain pending under browser policy or an unavailable audio device.
- **Recovery metadata:** manual slots now reject invalid timestamp metadata instead of displaying an invalid date.

## Priority production work

1. Run fresh-player comprehension and replay tests; tune costs, opportunities, and encounter variety from the results.
2. Complete editorial review of claims, corroboration, witness consent, and every finale's continuity.
3. Establish model sheets, shot lists, asset ownership records, and a commission plan; produce a coherent art set and directed audio performances.
4. Measure loading, responsiveness, layout stability, and sound behavior on named phones and networks before advertising device support.
5. Complete keyboard, controller hardware, NVDA/Firefox and VoiceOver/Safari release review.

See [the six-phase roadmap](ROADMAP.md) and [release gates](RELEASE.md). AAA is a production ambition here, not a certification granted by this review.

## Verification evidence

The reviewed baseline passed 70 unit tests, including 900 seeded campaigns, TypeScript checking, and a production build. Its local browser matrix covered desktop and phone Chromium plus WebKit; GitHub CI additionally checked Firefox. Inspection-source focus and the uninterrupted memory/witness campaign had targeted regression coverage. The subsequent [production slice expansion](PRODUCTION_SLICE.md) adds interpretation, preparation, specialist methods, and consequence visits; the baseline grade remains provisional rather than increasing automatically with those additions.

A production preview at a 390 × 844 browser viewport placed the first memory inspection control at y=624, within the initial screen. Inspection moved focus to the revealed source summary. Desktop and phone preview sessions reported no page errors. This is viewport evidence, not a physical-device performance measurement.
