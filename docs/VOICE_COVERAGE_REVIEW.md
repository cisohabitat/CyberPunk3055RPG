# Missing-speech review

The review found and repaired **two missing speeches**: Quill's explanation of the Chapel's memory business (`chapel`) and Lumen's explanation of the shard's fate (`lumen_deal`). Their complete quotations span paragraphs. The previous playback parser excluded newlines in straight quotes, and the older coverage audit reused that parser, inheriting the blind spot.

The fix recognizes multiline quotations and adds four exact-word audio parts using the established Quill (`am_michael`) and Sister Lumen (`af_heart`) stock voices. Dialogue, actors, rules and outcomes stay unchanged. Both scenes retain their appropriate existing illustrations and portraits; the actual-speaker catalog and explicit art rationales record the review.

## Inventory and verification scope

Reviewed against `bd0f9e22ed97bced012939ffc28767d6b1f824b2`, with the additions in this change.

| Check | Result |
| --- | --- |
| Scene inventory | All 197 scenes examined |
| Source traversal corpus | 148 authored fixtures and 900 seeded traversals produced 858 distinct scene texts |
| Additional conditional samples | 292 further distinct texts; separately labeled synthetic combinations, not completed player campaigns |
| Total inspected distinct texts | 1,150 |
| Missing speeches found | Two, previously skipped by the shared quotation parser |
| New audio parts | Four; one recording per paragraph |
| Current inventory | 301 quoted speeches, 306 bindings, 294 active files across 121 scenes with bound dialogue |
| Preceding file integrity | All 290 formerly active files decode in FFmpeg and Chromium and retain reviewed hashes |
| Preceding live delivery | All 290 URLs returned HTTP 200 and matching bytes on the reviewed production deployment |
| Prior playback sample | 25 checkpoints across all 15 voiced roles, with 39 queued deliveries completed; 22 authored-route and three seeded-route examples |

The preceding live check used `https://cyberpunk3055rpg.vercel.app`, deployment `dpl_Fy8dNgTspTJURidPw7piwr52aeRP`, built from the reviewed commit. This check established that existing assets were present; it did not detect dialogue that had no binding or asset at all. It must not be described as a clean campaign-wide coverage finding.

The new regression uses a separate character-by-character quotation scanner in `qa/production/multiline-speech.ts`, without importing the playback regex. It checks every scene and all authored route texts for unvoiced multiline speech, complete words, actual actors and highlight ranges. Four quotation styles and contractions are covered. The exact preceding 302 bindings remain locked through an additive-cohort check; historical phase expectations were not regenerated.

## Deliberately silent passages

| Scene | Passage | Reason |
| --- | --- | --- |
| `opening_city` | “Ward Four noodle stall. Tonight. I have work.” | Written invitation on the runner's chip |
| `opening_approach` | “Sleep without yesterday.” | Advertising copy; outside current character voice coverage |
| `job_owner` | “Who gets it after you?” | Player's question; there is no recorded player voice |
| `ward_wall` | Sera saying the given name | Custom player names have no prerecorded pronunciation; fixed following dialogue is voiced |
| `act2_lumen_door` | Lumen saying the handle | Custom address; fixed following dialogue is voiced |
| `ending_sainted` | The orderly reading the given name | Custom player name only |
| `act2_public_response` | “issuing key unverified” | Written account label |
| `ending_week_deal` | “resolved.” | Written folio status |
| `ending_sold` | “I will remember for both of us.” | Lumen's written message, rather than an audible conversation |

Narration, choices, journals and interface text are also outside recorded character-dialogue scope. A primary speaker label does not mean every paragraph is spoken. No runtime synthesis of names or imported text was added.

## Playback behavior and audit correction

Saved Sound off, zero Voices volume and manual playback choices remain honored. Whole-scene reading stays the default. In paragraph mode, a complete quotation must be revealed before its audio parts queue, so a speech spanning paragraphs waits for its closing quotation mark. It never speaks hidden text.

Stop, opening a modal/sheet/notebook, leaving a scene and hiding the page interrupt the visible queue. Closing a dialog or resuming sound does not automatically repeat consumed lines. Listen and Play all dialogue offer explicit replay. Navigating before a conversation ends cancels its remaining speech; players are not forced to wait for audio.

The playback tool also had a false failure: it expected only one request even after replay. The 24 MiB decoded cache can legitimately evict an early clip in a long queue. Quill's offer, Asa's terms and the owner conversation reproduced this. `scripts/voice-validation.ts` now requires one initial fetch, permits at most one extra fetch after explicit replay, and records that distinction. It observes an actual first voice start rather than a transient source count. Exact order, natural endings, gain/transcript alignment, Stop, save preservation and disposal remain required.

## Final validation

- **623 source tests pass**, including the independent multiline regression, previous binding/media locks, save compatibility and all authored campaign contracts.
- The Next.js production build passes. The production report retains 197 scenes, 598 choices and 148 authored route fixtures, with zero asset-budget violations; existing independent commercial acceptance gates remain pending.
- **48 focused browser checks pass** on Chromium and WebKit. Both restored speeches play fully at 390px and 1440px, wait for complete quotation reveal in paragraph mode, highlight the correct paragraph/actor and leave saves unchanged. Existing automatic voice, mute/manual preferences, interruption, narrow presentation and missing-art behavior remain covered.
- A separate automatic playback run checks each of the **four new files** through complete two-part queues, actual playback trims, explicit replay, Stop and source disposal. All four pass without page/audio-request failures.
- Independent unprompted Whisper small.en transcription matches all four deliveries after punctuation, case and written-number normalization. Quill's first paragraph received a natural clause-pacing clarity pass before the final transcript matched “facts.” This is automated cross-checking, not human listening acceptance.
- All **294 active voices** have measured playback levels within 0.25 LU of the existing -23.5 LUFS target and the -1.5 dBTP ceiling. Existing level entries remain unchanged; the four additions add about **605 KiB** and **51.3 seconds** of spoken dialogue.
- The four first-visit performance samples pass. Maximum encoded HTML/resource transfer is **2,012,267 bytes**, below 2,097,152 bytes; all sampled goals are visible, with no overflow or observed layout shift. These are synthetic samples rather than field percentiles.
- The repeated source audit finds no further unbound quotation in its 1,150 inspected texts, and every quoted check-result line remains bound. This is a scoped result, not exhaustive proof of every branch.

Final artifacts include `/tmp/saint-shard-multiline-playback.json`, `/tmp/saint-shard-multiline-browser-results/`, `/tmp/saint-shard-multiline-transcripts.json` and ignored production reports. Remote CI and publication must pass for the new commit; local verification does not mean the four additions are already live.

## Evidence and limits

### Check-dialogue CI correction

The first remote CI run for the restoration, [38912232920](https://github.com/cisohabitat/CyberPunk3055RPG/actions/runs/38912232920), passed Test but failed five check-dialogue tests in each of the four Browser projects. Those tests assumed `lumen_deal` had no scene speech or voice control before a die result. The restored multiline speech invalidated that assumption; production correctly stayed on the preceding security release.

The correction scopes the pre-roll quotation assertion to the check dialog, verifies the separate result recording has not started, and requires the background scene control to be disabled with any started scene voices disposed. Existing preference, explicit replay, held-roll and late-loading departure assertions remain. Desktop Chromium and phone Chromium pass all ten focused cases locally. Local Firefox and WebKit launch were blocked by workspace browser setup; full remote browser checks remain mandatory. This correction changes tests and documentation only, with no new story, art, voice or runtime behavior.

The four new performances, source/delivery hashes, retained original media hashes, phrase direction and matching art decisions are recorded in `qa/media/multiline-dialogue.json`, campaign dialogue provenance, the audition index and credits. Original PCM masters remain outside Git under `/workspace/saint-shard-validation/multiline-dialogue/masters`.

Raw local audit and browser artifacts remain outside Git under `/tmp/saint-shard-*`. There are no live player saves or automatic uploads. Conditional sampling is not exhaustive proof of every reachable state. Audio transcription is an automated cross-check, not human listening acceptance. The synthetic browser examples verify playback from source checkpoints, not independent participants or complete UI playthroughs. A specific reported line should still be investigated if observed behavior differs.
