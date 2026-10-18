# Shared branding, dice foley and menu feedback

18 October 2026. Implements all three approved follow-ups after verifying the previous exact-commit release.

## Release baseline

Hosted CI for 68e94301a5acbd1f5872e9400b77cf2cacf72c47 passed all required projects. Vercel confirmed that same commit READY on cyberpunk3055rpg.vercel.app before this work. The new candidate requires its own checks/publication; the previous release does not establish new acceptance.

## Shared identity

Mark and the browser icon use simplified silver-halo/cyan-shard paths. The existing character origin colors accent the outline while the core shard stays cyan. The game header, character-creation origin cards and loading screen share the mark. Loading has a static emblem and existing Jacking in status, no spinner or decorative delay. The large approved title wordmark/backgrounds stay untouched. SVG interface geometry needs no image request or new painting; text-only play remains free of art fetches.

## Sound follows the saved roll

One 640ms decelerating rattle replaces the repeated tick sound during a fresh ordinary 700ms roll. One short success/miss landing follows its actual result; successful tens and missed ones have restrained separate accents. The original ticks/stings remain unchanged for history and other uses. New cues are original deterministic offline synthesis, with no recording/model or runtime authoring. Five mono PCM16 deliveries total 86,656 bytes. Source/delivery hashes and measured peak/RMS/endpoints live in dice-foley.json.

The check owns the cancellable audio lifecycle. A separate effects source/ticket invalidates delayed starts and disposes nodes/buffers. Sound off, zero Effects, pagehide and leaving a check cancel playback. Speech ducks the cue. Reduced-motion rolls skip the rattle and play only a landing. Restoring a held result stays silent, and unmuting does not replay a consumed phase. Sound changes cannot restart the visual timer. Randomness, ten visual ticks, recorded face, costs and Continue-only commitment remain unchanged.

Existing actual-actor portraits, canonical quotations, voice bindings and performances stay byte-identical. UI branding and dice sounds introduce no spoken line or new scene.

## Menu feedback

Existing title buttons/links/music controls gain a subtle edge highlight, silver/cyan pointer treatment, clear three-pixel keyboard outline and small pressed offset. Hover is limited to hover-capable pointers. All targets remain at least 44px; original labels, actions, confirmation and music status remain. Saved or OS reduced motion removes transitions/offsets; forced colors uses system highlight. Disabled music controls do not receive active feedback. CSS decoration performs no navigation, audio activation or state write.

## Verification

**663 source tests pass**, as do TypeScript and production compilation. The dependency audit reports zero known vulnerabilities. **The full unfiltered Chromium suite passes all 667 cases** in 10.1 minutes. An additional **72 unique phone-profile cases** cover this cycle and relevant title/music, guide, check speech, reading and finale flows. The corrected new feature file passes all 28 desktop/phone cases. Overlapping reruns are not counted twice: **739 unique local browser cases** are verified.

The initial focused run had four failures from two new fixture assumptions repeated across projects: Sound off intentionally leaves explicit Play available, and this Dustline Face check needs an eight rather than seven for ordinary success. Those fixture expectations were corrected; runtime code was not changed in response. The full Chromium run uses the corrected file.

Verification includes all five cue identities/natural endings, one rattle plus landing, silent restored results, actual critical rules, mute/zero Effects, pagehide disposal, late-download cancellation, missing-audio playability, unchanged held saves/Continue-only commitment, actual voice/actor/text cues, menu keyboard focus, reduced-motion presses, and the previous finale <450px regression. Visual inspection covers real title/header/loading renders and icons at 16/32/64/128px. The loading preview deliberately disables JavaScript to retain the SSR state; it is not an endurance or startup-speed measurement.

All **712 production assets** pass budgets. Four native first-visit samples retain visible goals, zero observed layout shift/overflow and zero artwork requests in artwork-none. Maximum encoded HTML/resource transfer is **2,065,005 bytes**, within the unchanged **2,097,152-byte** limit. These samples do not describe prior-permission title-music downloads or field percentiles.

`qa/media/brand-menu-cycle.json` records the baseline release observation, source hashes, commands/scopes, corrections, measurements and limits. `dice-foley.json` records all audio sources/deliveries; credits and offline audition include them. Earlier art/audio files and all voice bindings remain byte-identical. Raw screenshots/logs remain outside Git. Keep every existing full four-profile/balance/security/exact-commit release gate mandatory. AI/synthetic checks are development evidence, not independent physical-device or perceptual acceptance; the new commit still needs hosted CI/publication.
