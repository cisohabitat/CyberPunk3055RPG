# Starting-page music — Under the Awning

The project owner supplied `under_the_awning.mp3` on 12 October 2026 for the starting page. It is a 63.92-second stereo track. Its composer, generator, tempo and license terms were not identified in the attachment; the implementation does not invent those facts. The unchanged source remains in `qa/media/title-music-source/`, separate from the delivered asset.

## Delivery and loop

`scripts/prepare-title-music.py` is an optional offline authoring command requiring ffmpeg and Python/numpy. It lowers the source by 12 dB and overlaps its final four seconds with the opening four seconds. The original introduction plays on first activation; subsequent loops resume at four seconds, retaining the whole arrangement around the prepared seam. The repeated period is approximately 59.92 seconds. No score or voice is regenerated from a model or service.

The initial MP3 delivery passed signal checks and Chromium playback, but WebKit decoded a discontinuity at the loop boundary. The local matrix passed 47 checks and failed that seam check; that candidate was not published. The corrected asset is a 22,050 Hz, 16-bit stereo FLAC, using the game's established music sample rate and avoiding MP3 encoder-padding ambiguity. Its 2,628,326-byte size stays below the 3 MiB audio limit. The delivered peak is approximately 0.251, RMS 0.049 and channel seam jumps below 0.003. These are signal observations, not independent listening acceptance.

`qa/media/title-music.json` records the original/delivery hashes, exact sizes, format, processing command/version and measured loop. `qa/media/review.html` auditions both versions. Builds use the checked-in FLAC and never run the optional authoring script. The existing street score remains separate.

## Player behavior

- Menu music is enabled by default. A fresh title page attempts browser-authorized playback automatically and offers **Play menu music** as a fallback. When autoplay is suspended, a normal pointer or Enter/Space interaction on the title unlocks sound; the track is not fetched before the audio context can run. Saved Sound off and zero Music volume remain respected. Enabling Sound in title Settings also activates the theme. Direct New run/Continue navigation hands off without requesting a menu-only track in a browser that requires activation.
- **Stop menu music** cancels playback or loading immediately. Retry remains available when the file is unavailable; New run, Continue, Saves and Settings still work.
- The Music slider and Sound toggle use the existing mixer. Zero Music volume omits playback and directs the player to Settings. Raising that slider resumes the requested theme without activating another channel.
- A hidden page or pagehide stops sources and requires **Resume menu music** on return. It does not replay a voice or alter a saved roll.
- Character creation stops the menu track. Continuing a run hands off to the existing scene score/ambience. The title track has no additional ambience overlay and supplies no gameplay cue or state change.

The track uses the bounded Web Audio cache and source disposal already used by the game. Late decode completions cannot start an obsolete menu track after departure. Existing title art remains suitable; no story scene, illustration, voice quotation, rule or save schema changes. The current forty-five selected voices remain. Save version 2 and `saint-shard-3055-v1` are preserved.

## Verification and scope

Current browser regressions cover default playback through a full loop, pointer/keyboard activation, saved mute choices, Stop remaining stopped, mute/resume and voiced gameplay handoff, unavailable-file retry and late-loading cancellation. They also exercise native keyboard controls, a 320px text-only title, automated accessibility and save parity. Existing title artwork and selected-voice/mix checks remain required. The original integration passed 484 unit/replay checks, TypeScript, the production build and media budgets, and 57 focused Chromium/phone/WebKit checks. Three complete keyboard campaigns cover 170 visits, 78 reloads and 17 voice plays with no page/media errors: prepared refusal/witness work, zero-credit failures and a silent minimal route. Raw state-bearing results remain outside Git; the reviewed aggregate is `qa/editorial/title-music.json`. Full exact-commit CI and public title/voice/campaign verification are required before claiming publication.

The internal grade remains 8.2. This integrates supplied music; it does not claim a composer commission, subjective listening result, commercial-rights clearance or physical-device acceptance. Source-familiar simulated play remains the development proxy. The next roadmap phase remains origin/stat build balance and opportunity costs.


The first full CI run passed 959 checks, required one retry for an existing long WebKit campaign, and failed the backup-recovery check in all four profiles because the new static soundtrack caption was incorrectly marked as a live status. The caption now receives that role only for loading, unavailable, muted or paused feedback; the recovery announcement retains its original role. No assertion is weakened, and the music/voice code and supplied delivery are unchanged. Nine additional local recovery/campaign/mixer checks pass after the correction. Full exact-commit CI is rerun.

The default-on update passes 487 unit/replay checks, TypeScript, the production build and all four opening-transfer probes. Default pointer/keyboard activation and full-loop playback pass on desktop Chromium, phone Chromium and WebKit; saved mutes, Stop, pause/resume, unavailable/retry, pending-load cancellation and automatic voice handoff are retained. A separate Chromium session with autoplay permitted starts the theme with zero delivered pointer, key or click events. The initial manual-start mixer fixtures were updated after phone/WebKit correctly started the theme before their obsolete Play-button assertion; the nine corrected mixer/retry/cancellation checks pass. Media delivery bytes remain unchanged. Exact-commit CI and public deployment verification follow the push.

The first full default-on CI run passed 1,005 browser checks, failed the same legacy gameplay-score check on Chromium/phone, and retried it on WebKit. That check selected the first stereo decode, which could now be the 63.92-second title theme. Its recorder now binds each native decode to the actual response filename and selects `theme-week.flac` for the District board fixture. The original stereo, exact 32-second duration (one resampled-frame tolerance), Sound-off and unchanged-save assertions remain. Runtime playback and media bytes are unchanged.
