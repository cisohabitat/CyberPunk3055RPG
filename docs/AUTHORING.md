# Structured mission authoring

`content/community.json` is the first writer-editable mission source. Its six scenes compile through `lib/authoring.ts` into the existing engine. This is a supported structured workflow, not a visual editor. The file format is version 1; player saves remain version 2.

Edit prose, labels, conditions, costs, and destinations in JSON. Keep scene and choice ids stable once published. Every scene requires an id, location, text, and choices. A choice requires its id, label, and destination; checks require both success and failure destinations. Static effects support money, strain, flags, items, factions, and categorized journal entries. Existing origin, faction, inventory, strain, and evidence gates keep their engine meaning. Unknown fields, duplicate ids, invalid rule values, and unsupported executable values fail validation. Global scene merging rejects collisions instead of silently overriding an existing chapter.

Text can be one string, or a list of paragraphs. A conditional paragraph uses `select` with ordered `when` rules and a required `fallback`. The first matching rule wins. Conditions support `all`, `any`, and `not` flag lists; every supplied condition must match. Write literal prose, not JavaScript or interpolated code. Example:

```json
{
  "select": [
    { "when": { "all": ["pump_inspection_paid"] }, "text": "The inspection is booked. It has not happened yet." }
  ],
  "fallback": "The next inspection remains due."
}
```

The engine continues to enforce legal choices and saved dice. Conditional prose must describe facts present in the state. A submitted form is not a restored wage; an appointment is not a completed inspection; an archived receipt is not its own authentication. Include explicit alternatives for unresolved and compromised outcomes. Declare all new items in the inventory before referencing them.

For new authored files, import and compile them in a story module and add that module to the `mergeScenes` call in `lib/story/index.ts`. Existing complex TypeScript scenes remain supported. Do not migrate an entire campaign at once. The pump mission demonstrates the pipeline with four stat methods, earned help, failure triage, resource costs, conditional consequences, and follow-up maintenance.

## Scene art is part of authoring

For every new scene, decide whether its place, character or visual moment needs accompanying art. Ship that art in the same change when needed. Reuse an appropriate existing illustration, portrait or backdrop; create an original asset when existing art cannot establish the moment. A connective step or reflection may stay in text with a stated reason. Review this decision again if the location, speaker or visual meaning changes.

Add every scene id explicitly to `qa/media/scene-art.json`, either in a suitable existing group or a new decision. Each decision needs `treatment` (`illustration`, `portrait`, `background` or `text`), a meaningful `reason`, and `asset` for the three visual treatments. A `text` decision has no asset. Grouped reuse is allowed only when the rationale fits every listed scene. Do not use prefixes, wildcards or a default that silently covers future scenes.

Register framed illustrations in `lib/art.ts`; use 1200 × 800 and 600 × 400 JPEGs, readable captions and descriptive alt text. Keep each encoded file below the current artwork budget and inspect both phone and desktop presentation. Add generated-source details and delivery hashes to `qa/media/art-provenance.json`, the illustration to `qa/media/review.html`, and provenance to `CREDITS.md`. Supplied assets need their own source records. Preserve the player’s text-only preference and put the goal before the illustration.

Art must communicate only what the player can know in that scene. Do not reuse an evacuation, payment, receipt or witness-safety image in a state where that outcome remains unknown. Neutral setting art can be reused through source inspection and unresolved recovery; outcome-specific art requires matching state conditions. `npm test` and `npm run production:report` reject missing scene decisions, unknown or duplicate ids, absent rationales, art mismatches and missing files. The production catalog shows each decision for review. Coverage does not replace visual judgment or the independent production acceptance gate.

Before accepting a change:

1. Run `npm test` and `npx tsc --noEmit`. Add meaningful tests for new legal/illegal paths and evidence continuity.
2. Add or revise a `qa/routes/` fixture from character creation, including explicit dice, reload checkpoints, and expected resources and permissions. Run `npm run story:replay`.
3. Build with `npm run build`, then run `npm run production:report`. Open the generated `qa/production/reports/review.html` and inspect the source catalog and missing replay coverage. Search works offline; the review file contains story spoilers and is not the player interface.
4. Play changed choices at phone and desktop sizes. Test current/old saves and pending checks. Avoid changing an existing check’s rules under an in-flight save; gate a revised route behind new preparation when necessary.
5. Update README and AGENTS together, then the production slice record. Keep the source, tests, and record in one reviewable commit.

The report records observed prose variants and unplayed scenes/choices. It also exports the complete declarative pump source, including its alternative text. An unplayed branch is a coverage gap, not a passing editor review. New conditions need targeted fixtures or continuity tests; structural validation cannot judge the prose’s truth or emotional value. Independent writer and narrative-editor acceptance remains pending in `qa/production/acceptance.json`.

The second structured encounter lives in `content/notice.json`, compiled by `lib/story/notice.ts`. It demonstrates repeatable source inspection, static source requirements, distinct methods, failed-attempt recovery and conditional receipts without executable JSON. Production catalog exports both source files. This is internally authored pipeline evidence, not independent writer acceptance.


## Phase 4 audio authoring

`sceneSoundPlan` stages music and district ambience from scene/recorded state, without mutating saves or imposing a real-time deadline. `scripts/scene-score.mjs` synthesizes longer mono textures; `generate-audio.mjs` reproduces them offline before dev/test/build while retaining the four older stereo arrangements and cues. Keep each delivered file under 3 MiB, finite cyclic tails, source/master hashes and measured signal records. Add only fixed authored voice quotations whose exact text is visible in the matching scene/speaker; never synthesize player text or download a voice model in the game/build. Retain the optional pinned offline voice generator, licenses, explicit activation, complete written dialogue and separate mixer controls. Use the [Phase 4 shot, voice and pronunciation brief](ART_AUDIO_DIRECTION.md) and update the audition/credits when media changes. Technical playback and measurements do not close independent listening or rights acceptance.
