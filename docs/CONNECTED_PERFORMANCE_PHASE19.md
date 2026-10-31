# Phase19: connected performance and mix coherence

Five reviewed same-word stock-cast performances improve Quill’s opening request, Mara’s owned response and private market wish, Sera’s wish to leave her records table briefly, and Kerr’s depot source summary. They supplement the retained original files through explicit versioned delivery paths. Existing and new saves receive these audio preferences. No scene, quoted word, actor, artwork, action, resource, source permission, save field or finale changes.

## Direction and selection

Eight quotations were auditioned in eleven retained candidates. Four first-pass candidates match exact unprompted transcripts; Sera’s second pass supplies the fifth selected delivery. Her first transcript appended words absent from the script; its raw result remains retained. Mara’s confession candidates introduce tense/name transcription disagreements, so both established recordings stay preferred. Edda’s first two candidates lose a final consonant in transcription; the third matches but retains the original’s segmented cadence without a clear improvement, so the existing recording stays selected. No name, number or tense substitution, supplied-word ASR prompt or generic omission rule is used to approve candidates.

Quill’s request keeps practical need separate from bravado. Mara’s thanks stays inside a difficult conversation and grants no forgiveness; the market remains a conditional hope. Sera contrasts a personal wish with her table’s practical limits. Kerr keeps witness exclusion and the source summary routine and specific. Existing Quill, Mara, Sera and Kerr art remains suitable, including the Phase18 private-question frame. No new artwork is needed because no location, person, event or visible outcome is added.

Exact direction, scripts, voice identities, phrase timing, source/model/license hashes and deliveries are in `qa/media/connected-scenes-{lines,provenance,transcripts}.json`. All eleven candidate MP3s, raw transcripts, actual driver versions and provenance are retained in `qa/editorial/connected-scenes-candidates/`; full PCM masters remain outside Git. Stock casting stays `am_michael`/`af_sarah`/`af_bella`/`am_adam`; Edda’s retained `af_kore` identity is unchanged. No commissioned actor session, voice clone or runtime synthesis is introduced.

## Delivery and fallback policy

Preferred files under `public/audio/connected-scenes-v2/` target −23.5LUFS with measured true-peak headroom, at source gain1. Failed download or decode tries the exact retained original once. The depot summary’s original is approximately−20LUFS; its fallback alone receives the measured0.66834392 source trim, yielding−23.5LUFS/−5.43dBTP. Other fallback trims retain their preceding values.

The effective level belongs to the actual decoded AudioBuffer through a weak map, so a cached fallback keeps its correct level on replay without retaining evicted buffers. This does not change the player’s volume buses, speech ducking, focus, fades, queue pauses, logical cache key,24MiB budget, cancellation or unavailable-file behavior. Original media and mastering manifests remain byte-identical.

## Complete-sequence comparisons

`qa/editorial/connected-scenes-context.json` records37 legal spoken stages/54 lines across opening/confession, archive, private account/return, Wall account and depot conversations, retaining repeated visits and actual scene/actor pauses. `qa/media/connected-scenes-mix.json` indexes before/current versions at actual settled runtime gains and separately at per-clip matched−23.5LUFS. Delivered music/ambience, normal default Voice70/Music60/Ambience50, actual focus and speech-duck factors are used.

The compact review is `qa/editorial/connected-scenes-audition.mp3`; full WAV masters and five complete sequence previews for each comparison mode remain outside Git at the indexed paths. The deterministic offline driver and retained input bytes reconstruct them. Offline renders omit browser fades, network timing and hardware. Broadband speech-to-bed RMS and ASR do not establish intelligibility, human comprehension or acting quality; the accepted internal proxy and its limits remain explicit.

## Preservation and release gates

The pre-edit baseline preserves281 routes/20,278 exact state/prose/action/actor/art visits,869 art/audio files and all preceding media manifests. Additive exceptions enumerate only the five preferred files and five new manifests; unknown/future names are rejected. Save version2, `saint-shard-3055-v1`,1d10/caps and all four finales remain intact.

Repeat all66 preceding keyboard-driven campaigns with their actual prior-save/current-creation setups; no new setup action is needed. Compare exact words, choices, geometry, saves, costs, permissions and media workloads, allowing only explicit preferred-path substitutions and the reviewed fallback level. Browser coverage must verify complete queues, exact actor/text/art, natural completion, download/decode fallback, cached levels, Stop during preferred/original loading, missing both, paragraph/manual/text-only/mute/zero-volume and source cleanup. Retain original deadlines, four workers, one hosted retry and six native-policy skips. Full source/security/five balance/build/catalog/loading-budget and exact-commit CI/READY/public checks remain mandatory.

Phase18’s exact live proof and15 clean public campaign reports are preserved with this substantive phase. The provisional grade remains8.9 (weighted8.910); target9.090 is unearned. Phase20 follows verified publication.

## Evidence notes

Open `qa/editorial/connected-scenes-review.html` beside its compact MP3 for labeled actual/matched before/current playback. Compact interval offsets index that MP3; nested version offsets retain the full-sequence clock. The review computes compact seek time as interval offset plus version offset minus the first version offset, preserving both clocks.

A detached archive of published `d7edcff` compares all416 canonical voice ids: exactly five preferred paths change, and every original mastering value stays exact. See `qa/editorial/connected-scenes-reference.json`. The four loading samples remain below2MiB, with no overflow/layout shift and zero art requests in text-only mode.

The first WebKit run passes61of62 cases; its one failure compares a decimal trim against AudioParam’s Float32 value. The corrected cache assertion uses the exact native Float32 representation and requires both replays to match bit for bit. Production code, timeouts and retries are unchanged. Preserve that original diagnostic and the separately labeled intermediate/final runs.

The first strict media-set comparison identifies `watch-private` requesting the existing title theme after the initial snapshot, at reload/Continue boundaries; both initial snapshots include that same theme. The path is separately categorized only for sound-enabled runs with both initial observations, while all speech/art/other gameplay media retain exact path-set checks after the five explicit substitutions. Raw sets and hashes are retained in `qa/editorial/connected-scenes-menu-theme-observation.json`; set membership is not a request-count claim. Theme code, bytes, native activation policy and volume remain unchanged.

## Complete candidate result

All66 fresh complete candidate campaigns retain exact preceding totals:5,114 visits/4,768reloads/42,497Tabs/462dialogue-playback completions/51selected art views/18ordinary art views/24interruptions, with189continuous UI scene ids and zero extra actions/setup operations. Source-bound comparison preserves every word, choice, layout, save, cost, permission and outcome, admitting only the five explicit preferred speech-path substitutions. Existing title-theme request-set differences at reload/Continue are separately disclosed; raw data is retained and no request-count equality is claimed. Source coverage separately281routes/20,278visits/252of264scenes, with the same12 omissions. All1000 source tests, security, five original balance audits, build/catalog/budgets and four loading samples pass. Chromium125 passes; WebKit61 initial passes plus its exact Float32 cache correction pass, with all intermediate evidence retained. Full hosted inventory7272/1818per project retains6native-policy skips. Exact-commit CI/READY/public checks remain separate. See [the candidate review](qa/editorial/connected-scenes-review.json). Grade stays8.9 provisional.

Raw candidate reports retain their actuald7edcff/dirty metadata. Final clean public proof remains separate and will be preserved with the next substantive phase.
