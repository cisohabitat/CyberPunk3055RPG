# Saint Shard — five-stage visual direction

This cycle implements the five recommendations following the Edda anatomy correction, based on `dbf24d6`. The player-facing flow is existing scene state → known-place and legal-choice presentation → browser rendering and existing media. The notebook renders acquired records directly; there is no new server API or external data dependency.

## 1. Scene composition

Regular tablet/desktop scenes place the compact speaker identity beside the location and goal. A thin frame groups the introduction. Paintings keep their full 3:2 composition; the caption and viewer button sit close together beside the image, without an empty bordered caption panel. Phone headers remain stacked. Pivotal, investigation, chapter and finale arrangements stay intact. Missing-image descriptions, full artwork inspection and reading preferences remain available.

## 2. District identity

The existing eight-district registry supplies exact location identity. Market copper, Chapel lilac, canal blue-green, Helion pale blue, shelter green, clinic cream, service blue and Ward Nine parchment distinguish the frame. Different symbols and emblem shapes accompany readable location names. Map cards use the same place language. Prose, source authority and faction standing retain their own meanings; a color never reveals a place or implies allegiance.

## 3. Choice feedback

Choices have action, check and move-on glyphs with plain, double and dashed leading borders. A mixed-choice legend explains the markers. Check previews still supply actual stat/DC/odds; requirements and costs keep their existing text. Hover, three-pixel keyboard focus, pressed and unavailable states are distinct. Reduced-motion and forced-color preferences remain supported.

Only static next-scene destinations with a different authored location are marked as moves; dynamic destination functions are never evaluated for decoration. No marker assigns morality, safety, success or a time cost. Canonical labels, numbers, order, legal gates, check staging and committed outcomes are unchanged.

## 4. Source documents

The investigation notebook distinguishes recorded memory, archive records, witness accounts and interpretations through restrained document layouts. Real source text remains selectable and readable. Existing timestamps/provenance use a separate annotation row; recorded fact/claim/promise status uses an explicit stamp. The styling supplies no invented official signature, verification, permission or receipt. Filters, acquired order, correction separation and current source limits remain authoritative. No art request is needed for these documents.

## 5. Artwork finish

Portraits, scene windows and cast views use the same matte/frame language. Fourteen explicitly listed older portrait exports receive mild CSS `brightness(1.07) contrast(.95)` compensation to reduce their exposure difference beside newer paintings. Their corresponding cast thumbnails/profiles use the same profile. High-contrast mode bypasses the filter; full-size artwork inspection shows original delivery pixels.

This is a restrained display adjustment, not a redraw or an anatomy repair. It cannot make different generations stylistically identical. No hue shift, crop, face/pose change or new generated asset is introduced. All 311 delivered art files retain their reviewed hashes, including Edda’s corrected counter scene; all story and voice deliveries remain unchanged. Original/display/context comparisons appear in the offline media audition. Every future creative change still needs its own anatomy, identity and scene-meaning review.

## Validation

- **658 source tests pass**, including district identity and a guard proving presentation does not invoke dynamic destination functions or mutate choices.
- Production build and final TypeScript check pass. The dependency audit reports **zero vulnerabilities**. The production audit retains **197 scenes, 598 choices, 148 routes and 703 assets**, with no budget violations.
- **304 unique local Chromium/phone browser cases are verified**: 234 existing reading, source, speaker, viewer and composition regressions; 32 final feature cases; and 38 cast/biography cases. These cover all fifteen voiced identities, exact quotation highlights, saved dice/state, missing/slow images, text-only zero requests, keyboard/focus, enlarged/high-contrast text and accessibility.
- The initial 262-case run passed 258 cases. Four new test-fixture assertions incorrectly expected Mara’s older portrait in `memo`, which intentionally uses the newer remorse portrait. The feature checks now locate an actual older portrait through the canonical art registry; all final 32 feature cases pass without changing the game to satisfy that mistaken expectation.
- Captured six scene compositions at **320px enlarged text, 390px and 1440px**, plus document, map, display-finish and cast views. Representative images were reopened for visual review. Edda’s first paragraph begins at about **559px on desktop**, compared with 611px before; at 390px it begins at about **651px** after adding the district emblem, compared with 622px before. Enlarged 320px text can require scrolling; no first-screen prose guarantee is made there.
- Verified older portrait exposure at 390/1440px in standard/high contrast, including Lumen’s large cast profile. The full artwork viewer remains unfiltered. A separate native forced-colors check retains the three-pixel focus outline, dashed unavailable state and unchanged save.
- Four native first-visit probes stay within the 2 MiB transfer budget, with a maximum **2,030,546 encoded resource + HTML bytes**, zero measured layout shift, no overflow, visible goals, and zero artwork requests in text-only mode. These are synthetic title/prologue samples, not encounter journeys or field data.
- Verified all **311 art delivery hashes** against the preceding anatomy review and retained the exact campaign dialogue binding hash. No source image, audio, story, engine or storage file changes.

`qa/media/visual-direction-validation.json` records commands, results, local screenshot references and review limits. `qa/media/visual-direction.json` records the five-stage scope and display profiles. React review found no new effect/state lifecycle, data fetch, dependency or dynamic destination execution; decorative glyphs retain neighbouring text, canonical action names and existing focus/dialog behavior.

Local validation covers the precommit worktree based on `dbf24d6`, not a published release. The standing full Chromium/phone/Firefox/WebKit, security/balance and exact-commit release gates remain mandatory on the pushed revision.

## Review limits

Visual review and automated play use the user’s available AI participation proxy. They do not certify independent artist/player acceptance or an AAA grade. Synthetic timing is not field performance, and hash checks prove delivery identity rather than artistic quality. Save key `saint-shard-3055-v1`, save version 2, 1d10/caps, 197 scenes, 598 choices and all four finales remain stable.
