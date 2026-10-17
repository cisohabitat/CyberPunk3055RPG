# Story-first visual improvements

Five stages: compact sidebar; authored choice groups; distinct chapter backdrops; consequential scene artwork; restrained environmental motion.

## 1. Compact sidebar

Stats and standings remain visible. Native disclosures retain origin and complication text, stat meanings, faction/check explanations and recent actions. The existing people roster, tabs and dialog behavior remain. These toggles do not change or save game state.

The previous release CI exposed an obsolete historical painting sample and finale prose displaced by larger nameplates. Samples now choose remaining scenes with the corresponding historical painting; new overrides retain dedicated checks. Finale spacing is reduced without shrinking names or weakening the existing viewport assertion.

Validation: TypeScript and production build pass; three focused source tests pass. All 24 historical painting checks and eight finale playback/fallback checks passed on Chromium/phone; after the final spacing correction, 12 sidebar/finale layout checks pass at 320, 390 and 1440px. Full CI remains required. No authored prose, voice, binding, rule or save schema changes. The internal grade remains provisional 8.2.

## 2. Choice sections

Seven explicit scene lists cover the opening negotiation, Chapel entry, Kerr confrontation, witness crossing, archive source test, memorial approach and neighborhood return. Headings describe intent. Actions remain expanded, in canonical order with original shortcut numbers, odds, costs and outcomes. Existing chapter-closing groups and jump links remain. No engine/story/voice change.

Validation: two focused source tests, TypeScript and production build pass. Twelve Chromium/phone checks cover compact sheets plus all seven choice lists at 320/390/1440px, checking original action order, labels, gates, shortcut numbers, detail text, untouched saves and canonical keyboard departure.

## 3. Chapter backdrops

The Week uses a dawn street; The Wall uses close memorial texture. Explicit background decisions replace the former text-only art decisions while framed-illustration counts remain unchanged. Reading panels remain opaque, chapter prose and choices immediate, and artwork-none makes no image requests. No outcome, identity or permission is illustrated. Generated originals and references are retained with hashes, responsive deliveries, credits and offline audition.

Validation: focused media/chapter/docs source checks and generated-asset hash checks pass, as do TypeScript and production build. Twenty-four Chromium/phone chapter checks cover distinct backgrounds, art-none, enlarged text, reduced motion, canonical prose, untouched saves and exact engine departure.

## 4. Consequential compositions

Only hatch_caught and act2_route_recovery gain new framed art. The masked attendant retains established identity, respirator and work clothing; a low wrench and visible collar mic match the actual speech. The closed case stays held before any courier or handover. Both registration/trace states keep their own prose with the same neutral painting. The prior hatch preparation and completed delivery imagery remain separate. All dialogue, casting, voice bytes and bindings stay unchanged.

Validation: focused art/media/docs checks, TypeScript and production build pass. Thirty-six Chromium/phone checks cover the entire new presentation suite plus conditional voice/text/actual-actor cases. New paintings are decoded at phone/desktop, have complete 3:2 framing, preserve canonical prose and both trace variants, and remain absent in art-none.

## 5. Restrained environmental motion

Only the opening street, canal dispatch, incinerator preparation and held case receive decorative rain/reflection/lamp layers. Each lasts 3.8 seconds once and fades back to zero; no continuous motion or flashing, camera pan, zoom, crop, text movement or delay. Captions remain outside the image layer. Missing images remove the layer. Both saved and operating-system reduced motion disable animation. No new media request or playback sound is introduced.

Final validation: 633 source tests, TypeScript, production build and production media audit pass. A combined 184 Chromium/phone checks pass across the new suite, prior reading/artwork tests, all-actor presentation, automatic/check dialogue, pivotal scenes, historical paintings and all four finales. Six overlapping chapter cases pass again after the final restore-label change. Four final first-visit performance samples remain below the 2 MiB limit (maximum 2,015,369 bytes including HTML), with zero measured layout shift/overflow and zero art requests in text-only mode. These are synthetic host samples, not field percentiles. Source hashes and raw sample metrics are retained in [the validation record](../qa/media/story-first-validation.json). These are internal checks and generated art review, not independent artistic acceptance or a new grade.

Screen review also found duplicated chapter names in restore notices. Display labels now show the name once when chapter and location match; precise location/finale labels and save bytes are retained.

## Delivery record

| Stage | Commit |
| --- | --- |
| Compact sidebar and preceding CI corrections | `591b6fa` |
| Authored choice sections | `6dc3fcf` |
| Neutral chapter backdrops | `0a57a6d` |
| Confrontation and setback paintings | `c1fe270` |
| Settling atmosphere and final review | This change |

Each stage updates README and AGENTS and is pushed to main. The final exact-commit CI remains mandatory for production; intermediate runs can be cancelled by the existing latest-push concurrency rule. No release gate is skipped.

Four new paintings deliver eight JPEGs, with no old media rewritten. Inventory stays 197 scenes / 598 choices / 148 complete authored routes / 306 voice bindings / 294 active voice files. Campaign prose, all voice bytes and bindings, rules and save schema match the preceding baseline. The internal grade remains provisional 8.2.
