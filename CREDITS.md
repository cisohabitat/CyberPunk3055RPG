# Credits and asset provenance

Saint Shard is original fiction supplied in `cisohabitat/CyberPunk3055RPG`, with the evidence and campaign expansion in this revision. The game is not affiliated with an existing cyberpunk franchise.

- **Original supplied art:** the twelve pre-existing environment and portrait files in `public/art/` retain their supplied provenance status. Artist names, source records, and commercial licensing terms remain undocumented for those files.
- **Generated art, 2026-10-10:** eleven new original fictional images generated using OpenAI’s image generation tool: Kite City opening, memory bench, shelter, freight dispatch, Nia Pell, Edda, Asa, Helion service counter, Spire maintenance terminal, Ward Nine payroll table and symbolic title key art. `qa/media/art-provenance.json` records the generation tool, prompt summaries, original PNG references, delivery sizes and SHA-256 hashes. JPEG processing only resizes and encodes the generated masters. These are AI-generated images, not commissioned illustrations; independent visual and rights acceptance remains pending.
- **Audio:** original synthesized compositions and cues produced by `scripts/generate-audio.mjs` and `scripts/score.mjs`. The revised four chapter arrangements are 32-second stereo loops at 60 BPM, with an E–C–B–A memory motif, layered synthetic felt keys, struck glass, bowed tones and plucked bass. Scene cues use related synthesized chimes. No third-party samples or actor recordings were added by this expansion.
- **Typefaces:** Rajdhani and Literata via Google Fonts and Next.js. Preserve their applicable license notices in any redistributed font bundle.
- **Runtime and verification libraries:** Next.js, React, TypeScript, tsx, Playwright, and axe-core. Their versions and dependency licenses are identified through `package.json` and `package-lock.json`.

External player research, professional voice recording, and a rights audit have not been completed by this implementation. Complete those entries with contributor names and supporting records when production work is performed.

The generated production asset manifest records byte sizes and SHA-256 hashes for supplied art, audio, and static build files. This identifies the reviewed versions and supplies no missing artist attribution, license, or commercial rights. The new Week bed uses the same procedural source pipeline and no third-party samples or actor recordings.
