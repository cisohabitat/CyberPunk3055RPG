# Phase 4 — character staging and directed audio

This phase implements cycles 6 and 7 of the ten-cycle roadmap. It supplies internally reviewed candidates, runtime integration and reproducible evidence. It does not establish independent artistic acceptance, commercial distribution rights or a 9+ grade.

## Cycle 6 shot and continuity brief

Retain the supplied cast as continuity references: Mara's dark tied-back hair and cyan memory halo; Lumen's bald head, magenta left optic and white collar; Kerr's short dark hair, broad silhouette and repaired black coat; Quill's grey hair, amber eyes and noodle-stall steam; Sera's dark hair, verdigris hood and pencil. Preserve age, clothing, face proportions and identifying hardware across expressions. Neutral portraits remain the fallback for unresolved or imported states. No franchise or living artist imitation is requested.

Use petroleum blue and charcoal for the city, practical amber for work and trade, cyan for the recorded hour, verdigris for the memorial, and restrained magenta only for Lumen's optic. Faces and hands carry the action; screens and abstract papers must not contain readable identities, addresses or invented authentication. Keep foreground silhouettes legible at phone scale. Framed plates use 1200 × 800 / 600 × 400 delivery pairs; portraits use 440 × 587. Retain generated PNG masters and record hashes, prompts, processing and provenance.

| Shot | Treatment and meaning | Selection |
| --- | --- | --- |
| Quill's offer | Bowl, steam, waiting counter; no advance changing hands | `stall`, `pay`, `job_owner` |
| Recorded revelation | Mara's restrained face with the memory apparatus; no present-day permission implied | `memo`, `mara_why` |
| Chapel access | Empty maintenance reader, latch and stair; no successful entry implied | method review and window exit |
| Mara's current boundary | Firm, attentive expression, separate from the recorded testimony | Actual public-release refusal during current-response conversations |
| Lumen's response | Guarded attention; no forgiveness | Recorded betrayal or sponsorship refusal during later conversations |
| Kerr's response | Closed expression; no gratitude for delivery | Recorded breach of private terms or denial during collection conversations |
| Quill's later terms | Patient but unsmiling | Recorded postponed tab during his later visit |
| Sera's witness attention | Listening at the wall with capped pencil | Confirmed leak at the wall; no witness quotation permission implied |
| Said Aloud | Sera writing beside the rain-worn wall | Only `ending_names` |
| Left to the Rain | Pencil still, empty stair and rain | Only `ending_quiet` |
| Already Loose | Sera listening, worn wall and an ordinary relay | Only `ending_witness`; no crowds, acquittal or public witness identities |
| On the Folio | Ives closing a folio, Sera retaining her pencil | Only `ending_listed`; no payment, absolution or repaired neighborhood |

State-specific expression selection uses recorded conduct, never faction score. Priority belongs to preserved refusal/breach, even after useful help. A portrait is emotional staging, not evidence. Enumerate every scene's baseline art decision and the conditional variants in the audit catalog. Keep the goal before art, semantic captions, high contrast, reduced motion, silent/text-only play and missing-image tolerance.

## Cycle 7 audio and performance brief

Keep explicit Sound activation and explicit Listen/Stop for authored lines. Preserve complete readable dialogue and separate music, ambience, effects and voice buses. Scene transitions, dialogs, Sound off and zero voice volume cancel pending voice starts. Media failures never alter a save, recorded die, cost, consent or route.

Extend identity with sparse reading, Chapel pressure and district soundscapes selected by actual scene/state. Prefer longer, quieter textures and intentional spaces to a loud short loop. Preserve the memory motif and clean cyclic tails; crossfade on meaningful transitions rather than replaying arrival cues on every question. No sampled recordings or external music service are needed for the synthesized score.

Prepare selective stock synthetic dialogue candidates for Quill's opening offer, Mara's revelation, relationship responses and the four finales. Retain the six earlier candidates. Pronunciations: Quill /kwɪl/, Mara /ˈmɑːrə/, Lumen /ˈluːmən/, Kerr /kɜːr/, Sera /ˈsɛrə/, Helion /ˈhiːliən/, Ives /aɪvz/. Quill: conversational, economical, no sales patter. Mara: attributed responsibility, no absolution or theatrical sobbing. Lumen: controlled boundaries, practical warmth without forgiveness. Kerr: blunt, bodily effort, no menace for its own sake. Sera: patient, names matter more than victory. Ives: administrative certainty, no villain monologue. Synthetic stock styles are candidates, not directed actor performances; actor casting and permissions remain external work.

Record source quotations, styles, speeds, model/license hashes, master/delivery files and signal measurements. Audition every candidate in the offline review. Technical limits: each artwork under 1 MiB, each audio file under 3 MiB, illustrated initial transfer under 2 MiB. Measure peak, RMS, duration and loop seams; signal measurements cannot certify intelligibility, fatigue or expressive quality.

## Acceptance and release evidence

For each cycle: unit/state tests, production build, focused phone/desktop/text-only and missing-media browser checks, complete campaigns through all four finales, transfer probe, exact-SHA GitHub CI, push to main and production verification. Keep generated evidence under `qa/production/reports/`, which is excluded from source control.

Independent whole-chapter art review, headphones/speakers/phone listening, directed performance acceptance, physical-device testing and a distribution-rights audit remain pending. Record actual reviewer names and findings when that work occurs; do not replace them with automation or generated assets.


## Cycle 6 internal findings

Twelve generated masters retain the existing cast, with five expressions and seven scene plates delivered as nineteen JPEGs. Source/composition inspection found no readable private identities, payment, rescue, acquittal or erased conduct. The Chapel plate keeps reader status ambiguous. Existing neutral conversation and commitment art is deliberately retained. Missing images show their description or speaker caption.

All 347 unit/replay cases, TypeScript and the production build passed. Thirty focused Chromium/phone/WebKit checks cover conduct selection, all four finale plates, title navigation, current-response refusals, text-only omission and missing-art recovery. Six primary full UI campaigns contain 474 scene visits, cover all three origins and the four original finales, and include two natural-dice runs. Images decode and gameplay resources/history remain intact. Four synthetic initial-load probes remain within 2 MiB with visible goals, no overflow and no layout shift; these are automation-host samples, not physical-device or percentile evidence.

Exact-SHA CI and public production verification follow the push. Independent artistic/rights review remains pending, including the inherited reference-provenance caveat; no regrade is claimed.


Cycle 6 release: `28b31a7f24d72876a014ac19f26ea29d310cd98d`, GitHub run `38065465146` passed 347 unit/replay and 572 browser checks. Production `dpl_AmAyBnaF9ADVwFxx4RkA1tUeey1y` is READY and the public alias resolves to that commit. Twelve public WebKit finale checks preserve resources/history across 390px, 1440px and 320px text-only/high-contrast profiles. The first deployment timed out waiting for CI; the same SHA was recreated after success, without bypassing the gate.


## Cycle 7 implementation and mix evidence

`theme-reading`, `theme-quiet` and `theme-pressure` are sparse 64-second mono compositions. Street, Chapel/clinic, Spire, canal and Ward Nine have distinct 64-second room textures. All eight files are 22050 Hz / PCM16, 2,822,444 bytes each; maximum measured seam jump is 0.001435 of full scale. Their second halves differ from the first. Original four 32-second stereo arrangements, cues and six earlier voice files remain unchanged. Music and ambience crossfade separately, late loads follow the latest scene plan, and a 24 MiB LRU decoded cache limits retained buffers. Active sources and in-flight decodes are additional memory; physical-device acceptance remains open.

Eight new 24 kHz stock synthetic clips use `am_michael` for Quill, `af_sarah` for Mara, `am_adam` for Kerr, `af_heart` for Lumen, `af_bella` for Sera and `am_eric` for Ives. Each reads a fixed visible quotation. The four finales gain one short in-character response, preserving their original identity/actions and all costs/history. This is candidate coverage, not a casting or performer acceptance decision.

Default gain staging: music bus 60% × bed gain 0.5, ambience bus 50% × bed gain 0.35, voice bus 70%. During a selected line, music and ambience duck to 40% of their chosen bus levels. A conservative RMS comparison against the quietest delivered voice gives approximately 19.4 dB separation from the loudest combined bed levels. This is an internal measurement, not an intelligibility guarantee or a reviewer-approved loudness target. `qa/media/phase4-audio-preview.mp3` presents eight seconds of each new score, then all eight new quotations at the default ducked mix; its exact sequence/gains are in `phase4-audition.json`. Individual full loops and clips remain available in the offline audition.

Required independent listening: pronunciation and emotional intent; headphones/speaker/phone intelligibility and masking; long reading fatigue over two or more loop repetitions; crossfades and Sound/dialog/voice interruption; one whole chapter and finale. Record actual reviewer findings and revised mix targets before declaring audiovisual acceptance. Stock-style licensing records and supplied-art provenance still require a distribution-rights audit.


## Cycle 7 internal verification and handoff

All 349 unit/replay checks, TypeScript and the final production build pass. Thirty-six focused Chromium/phone/WebKit checks exercise selected quotations, bus ducking, separate volume, dialog/off/scene cancellation, saved-window/die persistence, missing music/voice recovery, and two rapid-navigation loading races. Nine final-build full UI campaigns contain 710 visits, including the four finales, Mara’s revised public refusal, Kerr’s acknowledged private-term breach, two natural-dice origins and a silent run. The silent run exactly matches the corresponding sounding run’s final save and makes zero audio requests. These are internal directed/adaptive automation, not fresh human playtests or proof of every possible route.

The offline audition and updated media pack retain 30 PNG masters and 22 PCM masters, 62 delivered JPEGs, 42 delivered WAVs, synthesis sources, voice license copies, provenance and direction briefs. Check initial-load probes, exact-SHA CI and public deployment evidence before handback. Six independent commercial-production gates remain pending.

Next phase: Phase 5 fresh-player observation, accessibility and named physical-device revisions. Use the prepared character playtest sessions and capture real findings; do not substitute these automated campaigns for recruited/consented sessions. Art direction, full-loop fatigue/intelligibility, performer acceptance and distribution-rights reviews still require named independent reviewers. No participants were contacted, no paid commissions were placed and no approval or 9+ regrade is claimed.
