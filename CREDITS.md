# Credits and asset provenance

The three origin-setting portrait deliveries added on 20 October 2026 encode the existing stall, Spire and canal paintings as WebP, with unchanged 1280 × 720 dimensions and composition. Original JPEGs remain byte-identical. `qa/media/origin-deliveries.json` records source/delivery hashes and encoding settings; global provenance and the offline audition include this delivery cohort. No new generated painting or voice is introduced.

Saint Shard is original fiction supplied in `cisohabitat/CyberPunk3055RPG`, with the evidence and campaign expansion in this revision. The game is not affiliated with an existing cyberpunk franchise.

- **Original supplied art:** the twelve pre-existing environment and portrait files in `public/art/` retain their supplied provenance status. Artist names, source records, and commercial licensing terms remain undocumented for those files.
- **Generated art, 2026-10-10:** eighteen generated fictional images generated using OpenAI’s image generation tool: Kite City opening, memory bench, shelter, freight dispatch, Nia Pell, Edda, Asa, Helion service counter, Spire maintenance terminal, Ward Nine payroll table symbolic title key art, three illustrative source close-ups, Mara/Lumen expression variants and a neutral canal dispatch alcove and a voluntary clinic conversation room. The variants use supplied portraits as visual references and retain those sources’ undocumented provenance caveat. `qa/media/art-provenance.json` records the generation tool, prompt summaries, original PNG references, delivery sizes and SHA-256 hashes. JPEG processing only resizes and encodes the generated masters. These are AI-generated images, not commissioned illustrations; independent visual and rights acceptance remains pending.
- **Audio:** original synthesized compositions and cues produced by `scripts/generate-audio.mjs`, `scripts/score.mjs` and `scripts/scene-score.mjs`. Four retained chapter arrangements are 32-second stereo loops at 60 BPM, with an E–C–B–A memory motif. Phase 4 adds three sparse 64-second mono music beds and five 64-second district textures, synthesized without third-party samples, a music service or actor recordings. Source and retained PCM masters, hashes, peak/RMS and loop seams are in `qa/media/audio-provenance.json`; the mixed audition is documented in `qa/media/phase4-audition.json`. Independent listening and expressive acceptance remain pending.
- **Selected dialogue:** 101 fixed quotations generated offline with hexgrad’s Kokoro-82M v1.0 (Apache-2.0 model/code license), using stock `af_sarah`, `af_heart`, `af_bella`, `am_michael`, `am_adam`, `am_eric`, `af_nova`, `af_kore` and `af_alloy` styles through `kokoro-onnx` 0.6.1 (MIT). The latest cycle adds twelve quotations for Asa, Nia and Ives; all previous sixty-three deliveries remain unchanged. Earlier cycles cover the opening, recorded hour, investigation, district work, witness terms and all four finales. No actor recording or individual voice clone was commissioned. `qa/media/voice-provenance.json` records model/style-vector URLs and hashes, locked quotations, voice styles, speed and PCM delivery hashes; `qa/media/voice-sources/` retains the model card and license texts. No trained voice model or service runs in the game. Independent listening, rights and directed performance acceptance remain pending.
- **Typefaces:** Rajdhani and Literata via Google Fonts and Next.js. Preserve their applicable license notices in any redistributed font bundle.
- **Runtime and verification libraries:** Next.js, React, TypeScript, tsx, Playwright, and axe-core. Their versions and dependency licenses are identified through `package.json` and `package-lock.json`.

External player research, professional voice recording, and a rights audit have not been completed by this implementation. Complete those entries with contributor names and supporting records when production work is performed.

Phase 4 adds five cast-continuity expression variants and seven deliberately staged scene plates generated with `image_gen.imagegen`. They use the existing fictional cast and memorial images as references, retaining the supplied references' undocumented provenance caveat. Generated PNG masters are retained; delivered JPEGs undergo resizing and encoding only. Exact references, source/delivery hashes and prompt summaries are in `qa/media/art-provenance.json`. The cast, composition and pronunciation briefs are in `docs/ART_AUDIO_DIRECTION.md`. Internal review does not provide independent artistic approval or establish distribution rights.

The generated production asset manifest records byte sizes and SHA-256 hashes for supplied art, audio, and static build files. This identifies the reviewed versions and supplies no missing artist attribution, license, or commercial rights. The new Week bed uses the same procedural source pipeline and no third-party samples or actor recordings.

The 11 October 2026 visual staging cycle replaces Quill’s offer composition and adds Mara in the present, Nia’s arrival and Kerr’s closed-case handover. Four generated PNG masters use the earlier fictional cast references; eight responsive JPEG deliveries use resize/encoding only. Exact prompts, reference revisions, superseded Quill source/delivery hashes and current hashes are retained in `qa/media/art-provenance.json`. The images are AI-generated candidates; inherited reference provenance and independent art/rights review remain unresolved.

The 11 October audio craft cycle adds three original synthesized room textures through `scripts/room-textures.mjs`, without third-party samples. New PCM masters, hashes, signal metrics, phrase segments and superseded voice hashes are recorded in the media provenance files. `qa/media/audio-cycle-audition.json` records a 15-interval before/after and default-mix audition; it is a comparison artifact, not perceptual listening acceptance. No performer commission, individual voice clone or missing rights approval is claimed.

The 12 October character-presence cycle adds one AI-generated clinic-window illustration, with responsive JPEGs and a retained original PNG. It references the existing generated Mara clinic image for continuity and retains that source’s inherited undocumented portrait-provenance caveat. Generation details, delivery hashes and an offline audition are in `qa/media/`. Existing quiet score and clinic ambience accompany the scene; no new fixed quotation or performer commission is claimed.

The 12 October personal-performance cycle adds two fixed stock synthetic quotations for Mara and Kerr and phrases Lumen’s existing answer using their established Kokoro v1.0 stock voices. Exact text, phrase direction, retained masters, model/style hashes, delivery metrics and the superseded Lumen hash are in `qa/media/voice-provenance.json`. `scripts/voice-performance-audition.py` produces a twelve-interval comparison that separates phrase, mix and room changes; the existing audition remains historical. No real-person voice clone, actor commission or perceptual listening acceptance is claimed. Existing scene illustrations and procedural room sources are retained.


The starting-page track “Under the Awning” was supplied by the project owner on 12 October 2026. The attachment did not identify its composer, generator or license terms; no additional attribution or commercial-rights claim is made. Its unchanged MP3 master is retained in `qa/media/title-music-source/`. `scripts/prepare-title-music.py` prepares the separate quieter, seam-overlapped title delivery; hashes and processing are in `qa/media/title-music.json`. This supplied track is separate from the original procedural chapter scores and stock synthetic dialogue.

The automatic-dialogue expansion adds 23 fixed authored quotations using the established Kokoro v1.0 stock voice identities, for 45 total deliveries. All 22 preceding deliveries remain byte-identical. Source masters, model/style hashes, exact text and delivery signal metrics are in `qa/media/voice-provenance.json`; the complete indexed audition is `qa/media/voice-expansion-audition.json` and `voice-expansion-preview.mp3`. No actor commission or individual voice clone was performed.

The background-bed delivery pass derives lossless FLAC and gzip transport from the 15 existing original synthesized WAV masters. Every decoded PCM sample is unchanged; no new musical source or sample is introduced. Hashes, encoder options and PCM verification are recorded in `qa/media/bed-delivery.json`; authoring uses FFmpeg offline. Voice WAVs and the supplied title theme are unchanged.

Rajdhani and Literata are distributed under the SIL Open Font License 1.1. Their unchanged WOFF2 subsets are checked into `public/fonts/` so builds do not depend on Google Fonts downloads. Original CSS weights, styles, Unicode ranges and fallback metrics are retained. License copies are included beside the fonts and in `qa/media/font-sources/`; `qa/media/font-provenance.json` records file hashes and source context.

Edda’s service-desk quotation uses the Kokoro stock `af_kore` voice and its explicit written attribution; Ives remains the scene’s primary portrait. A misassigned Ives candidate was discarded before release and is recorded in the provenance history.

The 13 October reaction cycle adds eighteen exact authored quotations using the same eight stock synthetic cast styles, bringing the inventory to 63. All preceding 45 deliveries remain byte-identical. Phrase settings, retained masters, source/delivery hashes and signal measurements are recorded in `qa/media/voice-provenance.json`; `voice-reactions.json` and `voice-reactions-audition.json` document direction, preservation and the indexed audition. Existing scene art is retained. No actor recording, individual voice clone or independent listening acceptance is claimed.

The illustrated courier cycle adds four original AI-generated neutral setting plates for the hearing, archive, courier and laundry conversations. Original PNGs are retained; JPEG delivery only resizes and encodes them. Full prompts, source/delivery hashes and dimensions are in `qa/media/art-provenance.json`. Twelve fixed stock synthetic quotations add Asa’s `af_alloy` identity alongside the established Nia and Ives styles; all preceding 63 WAVs remain unchanged. Voice sources and signal measurements are in `voice-provenance.json` and `courier-art-voice.json`; the indexed preview is `courier-voice-audition.json`. No actor session, real-person clone, commissioned illustration or independent perceptual acceptance is claimed.


### Neighborhood art and voice additions

Four generated neutral setting plates depict the clinic dispatch desk, repair bench, unresolved shelter pump and witness checkpoint. Original PNGs remain retained; deliveries only resize and JPEG encode them. Prompts and hashes are in `qa/media/art-provenance.json`. Fourteen offline stock synthetic quotations retain the five established speakers’ styles and all preceding 75 clips. `neighborhood-art-voice.json`, `voice-provenance.json` and `neighborhood-voice-audition.json` record authored words, directions, retained hashes and deliveries. These assets are generated candidates; no actor session or commissioned illustration is claimed.


### Private terms and memorial additions

Four generated plates depict Nia before transfer, an ordinary rest seat, private correspondence and the memorial stair. Nia’s new composition uses her two existing generated fictional images as continuity references; reference hashes, full prompts and retained PNG/delivery hashes are in `qa/media/art-provenance.json`. Twelve offline stock synthetic quotations preserve the established Nia, Kerr, Mara and Sera voices and all preceding 89 deliveries. Source words, direction, settings, signal metrics and preview indexing are recorded in `threshold-art-voice.json`, `voice-provenance.json` and `threshold-voice-audition.json`. No actor session, real-person clone or commissioned illustration is claimed.

### Complete campaign media (13 October 2026)

Ten additional original setting illustrations were generated with `image_gen.imagegen`: market counter, Chapel entry and service passage, screened memory apparatus, clinic coolant/relay corners, district board, freight passage and shelter landing/hall. Original PNGs, prompts, delivery sizes and hashes are retained in [art provenance](qa/media/art-provenance.json); JPEG processing only resizes and encodes. These are generated illustrations, not commissioned paintings.

190 additional fixed character-dialogue clips use offline Kokoro-82M v1.0 through pinned `kokoro-onnx` 0.6.1. The established nine stock character identities remain. New stock roles are Stallholder (`af_sky`), Ren (`af_jessica`, recast during the whole-scene review), Orderly (`am_puck`), Dispatcher (`af_river`), Mechanic (`am_fenrir`) and Masked attendant (`am_onyx`). These are stock synthetic performances; no individual voice clone or actor session was commissioned. Apache-2.0 model and MIT driver license copies remain in `qa/media/voice-sources/`. [Campaign voice provenance](qa/media/campaign-dialogue-provenance.json) records exact words, styles, measured signal, retained PCM masters and MP3 hashes. The 101 earlier WAVs remain unchanged; one incorrectly cast dispatcher clip is archived and replaced in the active sequence. Narration and player-text synthesis are not included.

### Whole-scene review (13 October 2026)

Two additional generated character illustrations show the stallholder at her counter and Ren Calder at the canal. Generated PNGs remain outside Git; responsive JPEG deliveries use resize/encode only. Ren’s eight fixed lines now use the stock `af_jessica` style, matching her authored identity; all earlier WAVs remain unchanged. Source/delivery hashes and prior recast hashes are in `qa/media/art-provenance.json`, `qa/media/campaign-dialogue-provenance.json` and `qa/media/whole-scene-review.json`. These are generated candidates, with no commissioned actor or independent listening acceptance.

### Actual speaker portraits (13 October 2026)

Five original generated portraits accompany Ren Calder, the stallholder, the clinic dispatcher, the Ward Nine mechanic and the masked maintenance attendant. Ren and the stallholder use their existing generated scene art as continuity references; the other three use the existing orderly portrait for painted style only and depict distinct fictional people. PNG masters are retained outside Git; 600×800 JPEG deliveries resize/encode only. `qa/media/art-provenance.json` records sources, references and hashes. `qa/media/speaker-presentation.json` explicitly maps all fifteen actors to reviewed art and locks every existing voice delivery; no new audio or individual voice clone is introduced. Generated candidates remain subject to independent visual/rights acceptance.

## Pivotal performance and expression cycle

Four generated expression portraits preserve the established identities of Mara, Nia, Ren and Sera. Original PNGs, reference JPEGs, delivery hashes and scene rationales are recorded in `qa/media/art-provenance.json` and `qa/media/dialogue-staging.json`. Resizing and JPEG encoding are the only delivery transformations. Existing Lumen staging remains.

Fourteen revised fixed character deliveries retain the established licensed Kokoro stock styles and authored wording. Five new MP3s replace active legacy WAV performances while retaining all 101 preceding WAV files. Nine MP3 performances receive revised phrase timing; preceding copies and hashes are retained for comparison. No actor commission, runtime synthesis, player-text speech or voice cloning is introduced. Models, driver and licensing remain recorded in the voice provenance files.
### Kerr, Edda, Quill and Asa performance cycle

Sixteen revised fixed quotations use the same pinned offline Kokoro stock identities, faithful phrase pacing and measured MP3 loudness matching. They are synthetic dialogue, with no actor session or individual voice clone. [Reviewed words, preceding/current hashes and transcripts](qa/media/character-media.json) and [campaign delivery provenance](qa/media/campaign-dialogue-provenance.json) retain source and processing evidence. Three expression portraits and Asa’s dispatch scene were generated with `image_gen.imagegen` from the established fictional character/setting references; JPEGs only resize and encode retained PNGs. [Art provenance](qa/media/art-provenance.json) records masters, reference hashes and deliveries. No commissioned illustration or independent artistic acceptance is claimed.

### Campaign voice balance and Ives (14 October 2026)

Thirteen Ives performances use the same licensed offline Kokoro stock `am_eric` voice and exact authored dialogue, with phrase pacing and one constrained clear-/t/ pronunciation for “writing.” Four new MP3 deliveries retain their preceding WAV sources; all 101 previous WAVs are unchanged. Current/preceding hashes and unprompted transcripts are in `qa/media/ives-mastering.json`. No commissioned actor or voice clone is introduced. All 290 active clips use constant-gain playback matching from offline EBU-R128 measurements in `qa/media/voice-mastering.json`; no audio analysis or model runs in the browser.

Ives’s assessing/questioning portraits and closer hearing illustration were generated with `image_gen.imagegen`, using the existing Ives portrait and records-table room as identity/setting references. JPEG delivery only resizes and encodes retained PNGs; source/reference/delivery hashes are in `qa/media/art-provenance.json`. These are generated paintings and stock synthetic performances, with source-familiar simulated play as the available review proxy.

### Action-specific mechanical sounds

Four original authored procedural effects depict viewer contacts, an archive reader motor, the closed courier case and running hearing recorder. Seeded filtered noise, soft contact transients and short low motors use no recordings, third-party samples, music service or trained model. `scripts/scene-foley.mjs` and its optional authoring script retain the recipe; `qa/media/scene-foley.json` records source/delivery hashes, PCM16 signal metrics, neutral meanings and art review. No voice or painting is replaced by this cycle. Source-familiar simulated play remains the available development proxy.


### Consequence media cycle

Five additional AI-generated paintings use established Saint Shard settings/identities: repaired shelter valve, anonymous courier stock receipt, filed bounded public account, Lumen considering and Nia speaking. Image generation used the preceding local paintings as references; original PNGs remain retained, with resize/JPEG delivery only. Provenance and source/delivery hashes are in `qa/media/art-provenance.json`. No readable witness address or signature is depicted.

Nine exact-word synthetic performance revisions retain the established Kokoro stock `af_heart` (Sister Lumen), `af_sarah` (Mara) and `af_nova` (Nia Pell) casting and existing model/style licenses. Optional offline phrase direction/mastering serves checked-in MP3s only. All earlier WAVs remain untouched; previous MP3 copies and source PCM are retained locally. See `qa/media/consequence-media.json`, campaign dialogue provenance, current voice-mastering map and media audition. These are generated development candidates, not commissioned actor performances.


### Runner’s field guide

The `/guide` page reuses the existing AI-generated `opening.jpg` / `opening-small.jpg` city painting, with its original provenance and delivery hashes. The shared menu soundtrack remains the project owner’s Under the Awning delivery. All artwork, music and character voice files remain unchanged. Written guide prose is original game guidance; it introduces no synthetic narrator, character quotation or additional media license. See `qa/media/guide.json` for the explicit art/audio decision and preservation inventory.


### Full-cast portrait delivery

Eight AI-generated expression paintings reference unchanged local character portraits: Asa, Edda, Ren, Orderly, Stallholder, Dispatcher, Mechanic and Masked attendant. Exact prompts, source/reference hashes and resize/JPEG delivery records are in `qa/media/cast-portraits.json` and `qa/media/art-provenance.json`. Original generated PNGs are retained locally. Fifteen small roster portraits are resize/JPEG deliveries of the existing base art, without new generative edits. Existing lead identities, scene paintings and all audio remain unchanged. These are internally reviewed generated game assets; no new actor performance or commissioned-art claim is made.

Archive/hearing direction (October 2026): two additional generated scene paintings preserve the established Edda/Sera identities and neutral source/draft states. Original PNGs and responsive JPEG hashes are recorded in `qa/media/art-provenance.json`. Four exact-word Edda/Nia stock synthetic performances retain `af_kore`/`af_nova`; preceding deliveries, source PCM, independent transcription and current delivery hashes are recorded in `qa/media/archive-hearing.json`. Three original seeded procedural paper, chair-brake and folio textures are authored in `scripts/investigation-foley.mjs`, delivered offline and indexed in the media audition. No third-party samples or speech generation run in gameplay/build. Existing rights and independent artistic acceptance records remain as documented.


### Restored multiline dialogue (16 October 2026)

Four fixed exact-word MP3 performances restore the two-paragraph Quill and Sister Lumen speeches skipped by the former quotation parser. Offline Kokoro v1.0 generation retains the established licensed stock `am_michael` and `af_heart` identities; no voice clone, actor commission, narrator, runtime model or player-text synthesis is introduced. Original PCM masters remain outside Git. Source/delivery hashes, phrase direction, signal metrics and transcripts are recorded with `qa/media/multiline-dialogue.json` and campaign voice provenance. Existing setting art and portraits remain appropriate; no new painting is claimed.


### Speech progress and orderly clarity (17 October 2026)

One exact-word orderly performance uses the existing licensed offline Kokoro `am_puck` voice, with a short phrase pause separating “Pass” from “still scans.” Source PCM, preceding/current delivery hashes, retained preceding MP3, independent unprompted transcript and existing portrait/art decision are recorded in [speech-clarity.json](qa/media/speech-clarity.json). All other 293 active performances remain unchanged. There is no runtime synthesis, voice clone or commissioned actor session.


### Visual compositions (17 October 2026)

Two generated paintings provide a wide incinerator-flue view and a close archive-preparation detail. `image_gen.imagegen` used the existing service passage and archive desk as setting references. Original PNGs are retained; JPEG delivery only resizes and encodes. Provenance records source, reference and delivery hashes. These neutral preparations depict no completed crossing, retrieved source or permission. All voice recordings and actors remain unchanged.

### Chapter backdrops (17 October 2026)

Two original generated paintings by `image_gen.imagegen`, using the existing opening and memorial paintings as references. A dawn street and rain-worn wall remain neutral across every entry route. Original PNG masters retained; responsive delivery uses resize/JPEG encoding only. Source, reference and delivery hashes are recorded in `qa/media/story-first-art.json`.

### Confrontation and held case (17 October 2026)

Two `image_gen.imagegen` paintings use the existing attendant portrait/service corridor and canal dispatch painting as references. The attendant retains the established identity; the closed case depicts only an unresolved collection. Original PNGs retained, delivery resized/encoded only, source/reference/delivery hashes in `qa/media/story-first-art.json`. Exact actor dialogue and every audio file remain unchanged.

### Equipment and earned moments (18 October 2026)

Three original paintings by `image_gen.imagegen`: a consistent equipment atlas for fourteen items plus a damaged-shard variant; Mara's chipped cup after a shared hour; and a separately held archive original after custody is agreed. Existing signature-material, Mara-window and archive-desk paintings supplied references. Original generated PNG masters are retained outside Git. Six delivery JPEGs only resize and encode; CSS clips equipment cells without editing the generated atlas. Provenance and source/reference/delivery hashes are in `qa/media/visual-library.json` and `art-provenance.json`. No new actor, voice performance, permission or evidence is implied.

### Player screens and schematic (18 October 2026)

One original `image_gen.imagegen` painting provides anonymous copper-ink blocks and channels on dark paper behind the discovered-location map. The existing opening painting supplied material/color reference only. It supplies no precise geography, labeled future landmark, private address, completed route or evidence. The original PNG is retained outside Git; two JPEG deliveries only resize and encode it. Source/reference/delivery hashes are in `qa/media/player-screens.json` and `art-provenance.json`; the media audition includes the schematic. Save previews and campaign recaps reuse credited existing art. The decorative interface symbols are original inline SVG code. No new voice performance or campaign dialogue is introduced.

### Object close-ups and shared scenes (18 October 2026)

Six original `image_gen.imagegen` paintings: intact shard, damaged shard, archive probe, shelter token, the shared chapel moment, and Sera with Ives at the memorial. Existing equipment and cast/venue paintings are explicit references; the intact sliver received a generated edit removing scratch-like branching lines. All generated masters, including the first intact study, are retained outside Git. Twelve JPEG deliveries resize/encode only. Source/reference/delivery hashes, state guards and scope are in `qa/media/visual-refinement.json` and `art-provenance.json`; all six appear in the audition. Eight map landmarks reuse existing credited neutral venue paintings. No new dialogue, actor or audio performance is introduced.

### Complete equipment inspections and conversation plates (18 October 2026)

Fourteen original `image_gen.imagegen` paintings complete eleven equipment close-ups and add Sera/Ren at the leaking shelter, Edda’s service-document review, and Lumen’s ordinary cup gesture. The existing equipment atlas, actor portraits and corresponding venue paintings provide explicit design references. Native generated masters remain outside Git; JPEG delivery uses resize/encoding only. `qa/media/complete-art.json` records source/reference/delivery hashes and scene meaning. Tiny progressive derivatives reuse credited paintings without creative editing; `qa/media/art-previews.json` records their source and delivery hashes. No new words, actor or voice recording is introduced.

Edda’s service-document painting received a referenced-image `image_gen.imagegen` anatomy retake on 18 October 2026. The corrected pose has two connected arms and both hands on the counter; the earlier chest grip/book is removed. Face, costume, venue and unresolved three-document review remain aligned. `qa/media/anatomy-retakes.json` records both generations, source/reference/delivery hashes and preserved preceding bytes. Only resizing and JPEG encoding follow generation; the corrected native PNG stays outside Git. `qa/media/anatomy-art-review.json` documents the full reinspection and corrects the preceding audit’s missed defect. No voice delivery changes.

The subsequent visual direction cycle adds original interface SVG paths and CSS framing/document treatments. Its fourteen older-portrait display profiles use brightness/contrast only; delivered art and voice bytes remain unchanged. The media audition includes original/display/context comparisons, and `qa/media/visual-direction.json` records the presentation scope. This is display harmonization, not a generated-art retake or new source authentication.

### Approved title branding (18 October 2026)

Two `image_gen.imagegen` masters implement the approved broken-halo/cyan-shard concept: a transparent silver SAINT SHARD wordmark and a portrait recomposition of the existing symbolic title painting. The original title and approved desktop concept are explicit references. Four local WebP/JPEG deliveries use resizing/encoding only; native PNG masters remain outside Git. `qa/media/title-branding.json` records generation, reference/delivery hashes, anatomical review and limits; global art provenance and the offline audition include both assets. Branding implies no starting inventory or gameplay outcome. Existing dialogue, voices and music remain unchanged.

The check die uses original local SVG facet geometry and CSS shading/tumble, authored as interface code. It introduces no external texture, generated painting or new audio; existing dice ticks and outcome cues retain their credited sources.

### Shared branding and dice foley (18 October 2026)

The small header/loading/browser emblem uses original local SVG paths simplifying the approved silver halo and cyan memory shard; it retains the existing title wordmark painting and all scene images. Five original short dice cues are procedurally synthesized offline from seeded filtered noise, soft contacts and quiet sine resonances. They use no recording, sample library, trained model or synthetic voice. `scripts/dice-foley.mjs` and `scripts/author-dice-foley.mjs` provide reproducible source; `qa/media/dice-foley.json` records PCM16 delivery hashes and measured signals. Earlier ticks/stings and all dialogue deliveries remain unchanged. The media audition includes all five cues.
