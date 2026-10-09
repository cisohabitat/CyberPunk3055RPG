# Release gates

## Automated release evidence

The GitHub jobs remain `Test` and `Build`. Test runs rules, story, save, audio, and document tests. Build compiles the production game, then checks player flows on desktop and phone Chromium, Firefox, and WebKit. Browser failures retain screenshots and traces. Production's existing CI gate waits for both jobs; failure or unavailable status skips publication.

Run locally:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
npm run story:report -- story-report.json
```

Inspect the story report for missing destinations, unavailable routes, consumed resources, and ending distribution by origin. A zero missing-edge count and completed simulations are structural checks, not design approval.

## Manual release gates

- Play an uninterrupted run and an interrupted run through every finale.
- Check keyboard and controller input at modal boundaries, large text, high contrast, reduced motion, and a 390px viewport.
- Test NVDA/Firefox and VoiceOver/Safari with a reviewer who uses them. Automated accessibility checks do not replace this review.
- Confirm speaker names, choice labels, source quality, promise status, and aftermath continuity with a narrative editor.
- Confirm performance on named representative phones and networks, with cold cache and audio enabled. Record measured loading and input latency before setting the supported-device promise.
- Validate version 1 and version 2 migration, backup recovery, slot replacement, imports, and failed storage on release candidates. Keep an export from the previous public release as a fixture.
- Confirm all art, fonts, audio, and prospective voice recordings have a documented rights chain. See `CREDITS.md` for unresolved provenance.
- Complete consented external playtests and act on severe confusion or fatigue findings.

These manual gates are pending until their evidence is recorded. This repository does not claim AAA certification or completed external testing.

## Diagnostics and privacy

Settings can export bounded local incident codes, time, game version, and an optional error digest. Names, choices, save contents, and identifiers are excluded. Nothing is uploaded automatically. Ask the player to share the file only when they want help; diagnostics export is separate from run export.

## Rollback and compatibility

Record the last passing commit and deployment before promotion. If a candidate loses progress or fails a supported flow, restore the last passing deployment through the hosting platform. Retain the autosave key and backward-readable save version. Validate an old exported run against the rollback build before claiming that new save fields are compatible. Do not delete browser saves as part of a rollout.

## Localization preparation

Keep stable ids separate from displayed prose. Inventory speaker labels, choice text, source labels, settings, error messages, codas, and dynamic aftermath before extracting strings. Test expansion and plurals. No translated language is advertised until its narrative and UI have been reviewed in that language.

## Production report and candidate evidence

After building, run `npm run production:report`. CI generates the same report and runs `production:verify` against a temporary production server, then retains production evidence for thirty days. It includes source/route coverage, authored mission data, an offline review catalog, asset hashes, and provisional per-file/aggregate gzip envelopes from `qa/production/budgets.json`. Technical violations fail Build. Hashes do not certify rights, and synthetic resource probes do not certify device support.

Commercial candidate review uses `npm run production:report -- --release`, which fails while any of the six independent gates in `qa/production/acceptance.json` remains pending or lacks supporting evidence. The report validates evidence-reference existence. Gate status must come from completed human work. Existing demo hosting retains its established Test/Build deployment gate. See [six-phase execution](PHASE_EXECUTION.md) and the [research protocol](RESEARCH.md).
