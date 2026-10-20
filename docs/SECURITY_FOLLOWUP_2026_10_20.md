# Security follow-up — 20 October 2026

Reviewed baseline `3bee603e528c3fe73dc4fbf467b7a81aafdd6a1c` and the corrections in this change. The [16 October review](SECURITY_REVIEW.md) remains a historical record. This follow-up covers application input/rendering, dependencies, current tracked files, deployment gating and observed production headers. It is an automated/source review, not an independent penetration test.

## Findings

| Finding | Evidence and impact | Correction |
| --- | --- | --- |
| Stale import confirmation | Selecting a valid file, then an invalid file, left Confirm load pointing at the first file. Reproduced in a production Chromium browser. Local save-selection/data-integrity issue; no remote compromise demonstrated. | Clear prior confirmations on every new selection, including oversized/rejected files. |
| Out-of-order or dismissed file reads | Delaying the first file read let it replace the latest selected file; a read completing after closing Saves could start a run from the title screen. Both reproduced against the baseline. | A request token invalidates older reads on new selections, slot operations, closure, title return and unmount. Stale successes and failures have no effect. |
| Required jobs could be mixed across workflows | A source regression supplied successful same-named Actions checks with different workflow suite ids; the previous decision accepted them. This requires check-producing workflow access and is release-control hardening, not a demonstrated external exploit. | Only the Test job's workflow suite may complete its required cohort. Existing provider, exact-commit and latest-rerun rules remain. |
| Incomplete check response accepted | A mocked API response declared 101 checks but supplied only successful required jobs. The previous reader permitted a build despite omitted check information. | Require an exact count match and positive numeric job/suite identities. Pagination/incomplete or malformed responses fail closed. |

All six production jobs for the baseline were observed in one GitHub Actions suite, confirming the metadata used by the strengthened check. No workflow names, matrix jobs, audit thresholds or release gates were removed or made optional.

## Review results

- `npm audit --include=dev --json`: zero known vulnerabilities across production and development dependencies at review time. No dependency change was necessary.
- All 93 locked package entries retain registry.npmjs.org source URLs and integrity metadata.
- Common private-key/GitHub/AWS/provider-token pattern scan: 1,449 current tracked files, no matches. Credential filenames were also checked. This does not inspect Git history, untracked files, hosting secrets or account permissions.
- No runtime HTML-injection sinks, dynamic code execution, custom API routes or authored Server Actions found. Imported strings remain React text. Save JSON retains size/schema checks, own-property dictionary validation and controlled metadata copies. Audio/art paths use authored local identifiers.
- The live production root returned HTTP 200 with CSP, nosniff, frame denial, no-referrer, restricted browser permissions and HSTS. CSP still permits inline Next.js hydration/styles; this is not strict inline-script XSS prevention.
- No player data, credential contents or hosting secret values were read. Saves remain local, editable, unencrypted solo-game data; their checksum detects accidental corruption, not authenticity.

## Verification

Before correction, both new source gate reproductions failed (17 existing checks passed) and all three initial production-browser import reproductions failed for the intended reason. No account compromise or remote exploit was observed.

Final local results:

- `npm test`: 671 passed, zero failed; existing campaign/media compatibility tests remain intact.
- `npx tsc --noEmit` and `npm run build`: passed; production routes remain statically prerendered.
- 30 production-browser cases passed across Chromium desktop and 390px phone profiles: all seven security cases per profile, five save/preferences/recovery cases and three story-scrolling cases. Coverage includes HTML/reserved-id imports, invalid/oversized files, stale confirmations, ordered reads, dismissal, slot selection, held dice, reload/export, compressed audio delivery and browser policy.
- Replayed observed public baseline GitHub check metadata through the strengthened reader: all six jobs in the same suite correctly permit a build. This tests actual response shape; it is not a live Node-network probe or a new production deployment.
- `git diff --check` passed. Engine, save parsers/formats, story and public media bytes remain unchanged.

Full four-profile hosted CI remains mandatory for publication. This local run used Chromium desktop/phone profiles; it does not claim a physical-device test or a local Firefox/WebKit pass. Local logs and synthetic save/browser artifacts remain under `/tmp/security-*`; they contain no real player saves and are not committed.

Art, canonical dialogue, voice delivery, game rules, held-die semantics, four finales and save version/key are unchanged. No new scene/media decision is required.
