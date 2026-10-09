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

Before accepting a change:

1. Run `npm test` and `npx tsc --noEmit`. Add meaningful tests for new legal/illegal paths and evidence continuity.
2. Add or revise a `qa/routes/` fixture from character creation, including explicit dice, reload checkpoints, and expected resources and permissions. Run `npm run story:replay`.
3. Build with `npm run build`, then run `npm run production:report`. Open the generated `qa/production/reports/review.html` and inspect the source catalog and missing replay coverage. Search works offline; the review file contains story spoilers and is not the player interface.
4. Play changed choices at phone and desktop sizes. Test current/old saves and pending checks. Avoid changing an existing check’s rules under an in-flight save; gate a revised route behind new preparation when necessary.
5. Update README and AGENTS together, then the production slice record. Keep the source, tests, and record in one reviewable commit.

The report records observed prose variants and unplayed scenes/choices. It also exports the complete declarative pump source, including its alternative text. An unplayed branch is a coverage gap, not a passing editor review. New conditions need targeted fixtures or continuity tests; structural validation cannot judge the prose’s truth or emotional value. Independent writer and narrative-editor acceptance remains pending in `qa/production/acceptance.json`.

The second structured encounter lives in `content/notice.json`, compiled by `lib/story/notice.ts`. It demonstrates repeatable source inspection, static source requirements, distinct methods, failed-attempt recovery and conditional receipts without executable JSON. Production catalog exports both source files. This is internally authored pipeline evidence, not independent writer acceptance.
