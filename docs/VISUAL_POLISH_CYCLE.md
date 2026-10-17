# Five-stage visual polish

This program follows the requested order: reading layout, art framing, scene compositions, cast consistency, then chapter transitions. Each completed stage is committed and pushed separately. The final exact commit must pass every existing source, balance and browser gate before production publication.

The baseline is `eb77921b6823fcb55981f06dce286cb80fb00b67`, verified green across Test, all four Browser projects and Build, and READY on production. Before screenshots cover the stall, Mara’s recording and a chapter card at 390px and 1440px. A comparison sheet covers all fifteen default/scene portrait pairs.

## 1. Reading layout

Prose uses a bounded 66-character measure, more paragraph spacing and a 1.85 line height. Dialogue controls share a quiet wrapping row; Listen, Stop and Play all remain visible with 44px minimum targets, and the full transcript remains an explicit disclosure. Playback status, settings, source words, speaker cues and saves are unchanged. A subtle separator and smaller explanatory copy distinguish choices from story text.

Browser checks cover normal and pivotal reading at 390px, 1440px and 320px with enlarged high-contrast text and artwork disabled. They verify full authored prose, visible goals, controls, transcript access, unchanged saves, no overflow and the full accessibility ruleset. Existing voice lifecycle tests remain mandatory.

Stage-one validation: production build, documentation checks and 28 focused Chromium/phone cases pass. Before/after phone and desktop screens were inspected. No art, voice or story bytes changed.

## 2. Artwork framing

All scene paintings retain the complete 3:2 composition; character portraits explicitly contain the full supplied portrait. Paired paintings advertise their actual smaller layout slot to the responsive-image loader. Captions use mixed case and a quieter reading rhythm. A failed scene image retains its aspect ratio with the descriptive fallback, avoiding a jump in the surrounding story. No image or voice file changes.

Stage-two validation: the production build, seven focused documentation/media source checks and 52 Chromium/phone browser cases pass, including full-composition, missing-image, pivotal-scene and reading-layout checks.

## 3. Varied scene compositions

Two referenced generated paintings provide a wide, upward establishing view of the incinerator flue and a close archive-preparation desk detail. They are restricted to `hatch` and `act2_archive_prep`; later outcomes keep their appropriate preceding plates. The hatch and folio remain closed, with no claimed entry, retrieval, authenticated issuer or permission. Four responsive JPEG deliveries add 574,724 bytes to the repository; neither is part of the opening first-visit asset set. Original PNGs remain outside Git. Explicit decisions, source/reference/delivery hashes, credits and the audition are updated together. No voice or canonical prose changes.

Stage-three validation: all 625 preceding source tests passed, the additional composition regression passes, and the production build/report have no budget violations. The final media/documentation checks and 28 focused Chromium/phone cases pass.

## 4. Cast consistency

A contact-sheet comparison covers all fifteen base/scene portrait pairs, with an explicit hash catalog for every thumbnail, neutral portrait and expression. Identities, silhouettes, clothing and characteristic colors are retained; variations in room lighting and Lumen’s magenta optic remain deliberate. No source painting or voice recording is replaced in this stage.

Portraits, character cards and profiles share a neutral matte treatment. Names move below the picture, use readable mixed case and retain stable caption space as the audible actor changes. Amber border/text indicates speaking without an animated glow. Normal header portraits are more compact on desktop, while pivotal scenes keep their closer framing hierarchy. Small frames retain the full accessible name/role while the visual role stays in the main scene header when applicable. Source and browser checks cover all actors, including text-only and missing-art behavior.

Stage-four validation: the production build and six focused source checks pass. Sixty-two desktop/phone reading, actor and held-die checks pass; after the final caption sizing refinement, all 24 all-actor browser cases pass again, including no clipped labels, stable caption heights, focus, missing art and text-only play. The catalog locks 56 image paths across fifteen roles.

## 5. Distinct chapter transitions

The three entrances (`opening_city`, `card_week`, `card_wall`) receive numbered written chapter headings with distinct restrained motifs: amber clock hands, cyan cards and quiet green memorial rows. The two chapter cards remain deliberately text-only, and the opening reuses its existing city painting. These are interface decorations, not a new scene, voiced narrator or factual outcome.

Only the small decorative motif has a brief entrance animation. Both saved reduced motion and system reduced motion disable it. Story text and original choices are immediately available, with no countdown or extra continue button. Actual run-specific retelling, existing goals, canonical transitions and saves remain authoritative. Browser cases cover all three entrances at 390px, 1440px and 320px, including enlarged text, accessibility, image-free play and the exact engine result of the original departure choice.

When a chapter card's location already equals its act name, the location heading/announcement displays that name once, avoiding “The Week · The Week.” Other location/act labels retain both parts.

No provisional grade increase, independent player participation or artistic acceptance is inferred from these internal checks.

## Final verification and delivery

- **629 source tests pass**, preserving all 148 authored route contracts and existing voice/art/save invariants. TypeScript and the production build pass.
- **96 combined Chromium/phone browser cases pass** across reading, complete compositions, all fifteen audible actors, chapter entrances, automatic/mute/manual playback, missing art and held dice. After removing duplicate location/act labels, **46 overlapping final visual/chapter cases pass** again. These counts are separate runs, not 142 distinct tests.
- The production report has **zero asset-budget violations** and retains 197 scenes / 598 choices / 148 authored routes / 306 bindings / 294 active recordings. All voice bytes, canonical story files, the engine and save schema are unchanged across the program.
- Four fresh first-visit samples at 390px/1440px with full/no artwork stay within **2,097,152 bytes**. The final maximum is **2,013,590 bytes**, with visible goals, no horizontal overflow, no artwork requests in text-only mode and zero observed layout shift. These are synthetic samples, not field percentiles.
- Phone and desktop screenshots were inspected for the stall, recorded Mara, all chapter entrances and both new compositions. The cast comparison includes all fifteen default/scene pairs.
- Component review retains unconditional hooks, explicit presentation props, native text semantics, full accessible actor labels, stable image ratios, lazy/responsive art and an own-property-safe chapter lookup. It adds no network service, dependency or runtime media generation.

Committed evidence: `qa/media/visual-polish-validation.json`, the two composition provenance records and `qa/media/cast-visual-review.json`. Raw build/test logs and before/after screenshots are outside Git under `/tmp/visual-*`. The image-generation PNG masters remain under `/workspace/generated_images/`.

| Stage | Commit |
| --- | --- |
| Reading layout | `067a82e` |
| Artwork framing | `ce0388f` |
| Scene compositions | `2ab2a9d` |
| Cast consistency | `4a4e2a1` |
| Chapter presentation and final verification | This change |

Each stage is pushed to `main`. Intermediate runs can be superseded by the repository's existing latest-push concurrency rule; the final exact commit still requires the unchanged full Test, four Browser and Build checks before Vercel publication. No direct deployment bypass is used, and local evidence alone does not establish that the final update is live.
