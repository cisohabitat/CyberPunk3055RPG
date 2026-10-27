# Cinematic art and voice direction: Phase 5

This phase directs four complete sequence groups in the [player-led roadmap](REVOLUTION_ROADMAP.md), using sixteen existing stages. It preserves the actual story, actors, recordings, choices, source knowledge, permissions and campaign outcomes. It adds four optional detail paintings and changes dialogue spacing/background focus rather than adding repetitive scenes or claiming a review score.

| Sequence | Stages | Voice direction | Optional detail |
| --- | --- | --- | --- |
| Recorded confession | memo, mara_why | 420 ms between the same actor's clips; 620 ms across actors | Glass in a copper reader; no authentication or forgiveness implied |
| Confrontation | kerr, kerr_fight, after_kerr | Tighter 180 / 360 ms spacing | Unresolved threshold, only while still in the room |
| Witness decision | act2_witness_brief, act2_witness_plan, act2_witness_support, act2_witness_door, act2_witness_arrival, act2_witness_safe, act2_witness_repair | 380 / 640 ms; let the actual permission limits settle | Closed notebook/off recorder in the private-room stages only |
| Ward Nine return | act3_neighborhood, ward_wall, act3_arrival, act3_district_return | 420 / 680 ms, with a quieter return bed | Pencil, rain and bare stone at the memorial only |

The confrontation's failure checkpoint is derived by committing a legal missed check from a real authored route. It is labeled a directed branch checkpoint, not an additional completed campaign. Original default/earned paintings remain the establishing shots. Existing portraits follow the actual audible actor; the new detail paintings show no people, readable names, agreement, harm or successful outcome. Edda's archive return retains its actual archive art, and earned public/private district staging remains unchanged.

## Player controls and cancellation

Scene / Detail switches only the local artwork view. It neither commits a choice nor changes saved state, paragraph visibility, voice selection, playback or preference storage. A new scene resets to Scene. The existing full artwork viewer and descriptive failure fallback work with both shots. Text-only play requests no painting and shows no shot controls. Whole-scene reading remains default; paragraph reading, silent play, manual voices and reduced motion remain complete. There is no camera animation or automatic text reveal.

The first line starts normally. Pauses occur only after a clip ends naturally, with a loading status that does not mark the next actor as audible. Stop, mute, disabling automatic voices, dialogs and unmount cancel pending starts. Failed decode does not add a dramatic wait. Other scenes retain the existing 120 / 220 ms cadence. The mixer multiplies saved sliders and existing speech ducking; it never changes voice gain, playback speed or words. Existing bed fades and duck release remain.

## Audio comparison and scope

Four offline before/directed comparisons use the actual delivered Mara, Kerr, Nia and Sera clips plus their scene music/ambience. `scripts/cinematic-mix-review.py` reproduces the documented static mono proxy from `qa/media/cinematic-mix-spec.json`. All eight PCM masters remain outside Git. Music/ambience beds measured about 3.1–8.0 dB quieter in these four proxies; voice samples and gain are identical. This is not a browser crossfade simulation, room playback measurement or human preference/intelligibility result. The browser checks independently observe actual buffer starts, inter-line boundaries and music/ambience/voice bus targets.

All eight A/B mix transcripts match normalized source words. Raw ASR output is retained; normalization handles punctuation, case, apostrophes and the written/spoken forms of 9 and 300. No articles, names or negations are removed. `cinematic-mix-review.json` and `cinematic-mix-transcripts.json` record hashes, levels, timing, exact words and limitations. This is technical alignment, not new commissioned acting or independent listening acceptance. Every preceding audio delivery remains byte-identical.

## Validation and release

The independently archived Phase 4 baseline protects all 164 complete route states and 1,871 visits through the directed sequences, including exact prose, visible actor bindings and default/earned art. All preceding tracked audio/art bytes are checked, with the four existing reproducible ignored WAV sources separately hashed. No save extension, die, cap, permission, money or resource balance changes.

Focused browser coverage visits all sixteen stages at 390px, 1440px and 320px enlarged text/text-only, switches and decodes scoped shots, verifies state/reveal isolation and scene reset, runs accessibility checks and observes actual four-sequence voice timing/mix. Existing pivotal-frame, dialogue, source/security/balance/performance and full hosted Chromium/phone/Firefox/WebKit checks remain required. `qa/editorial/player-led-phase5.json` holds the pre-publication snapshot. Exact-commit CI, Vercel readiness and live gameplay/media checks are recorded separately after publication.

Next is Phase 6: campaign integration and payoff, connecting earned cases, plans, builds and relationships while trimming repetitive steps and preserving the four original finales.

Continuity review removed a closed folio from the new memorial detail before publication and made the recorder/pencil captions independent of prior use. Both generated memorial originals are retained in provenance. The initial focused regression run passed 53 checks and exposed the old explicit confession mix expectation; its exact new targets were updated to 0.38 music / 0.55 ambience, retaining word/actor/voice-level, stop, settings and normal-departure assertions. This is an intentional mix change, not a relaxed threshold. Final follow-up evidence is recorded in the phase snapshot.

Local results: 753 source tests, TypeScript and production build passed; all existing security/balance gates passed with no known dependency vulnerabilities or media-budget violations. Fifty-four focused browser checks were verified across the initial/follow-up runs; the final nine-check follow-up passes. Seven clip audits passed natural playback, replay, Stop and cleanup. Complete keyboard campaigns covered 142 visits and 44 reloads; the sound-enabled witness campaign completed 33 voices and two page-interruption/resume checks. Campaigns preceded the final caption/art continuity corrections; final focused checks and captures cover those corrections. All eight raw A/B transcripts match the documented normalized words. Six final viewport captures include 320px enlarged text/text-only. Largest measured initial transfer: 1,637,757 bytes against the unchanged 2 MiB limit. Hosted CI and exact-commit public verification remain required before publication.
