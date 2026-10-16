# Security review

Reviewed 16 October 2026 against `a6a958ac8b5182bbdc10761c7bb4ed897303b65c`, with the fixes in this change. This is a source, dependency and local production-browser review, not a security certification or a guarantee against unknown vulnerabilities.

## Application and trust boundaries

Saint Shard is a Next.js App Router application with client-side gameplay. The application has no accounts, database, payments, multiplayer, custom API routes or Server Actions. Saves and preferences live in the player's browser. Importing a file is the principal explicit untrusted-input boundary; local storage is also untrusted. Framework endpoints still exist even when application logic is client-side.

The review traced all application JSON readers, save imports/exports and recovery, journal/codex/item lookups, React rendering, artwork and audio URLs, navigation, diagnostics, framework configuration, package lock integrity, GitHub Actions and the Vercel production gate. Automated searches found no runtime HTML injection APIs, dynamic code execution, external network destinations or browser-exposed secrets in the reviewed source. Audio fetches use locally authored asset identifiers. Diagnostics remain explicit bounded downloads without automatic uploads or save contents.

## Findings and changes

| Finding | Assessment | Resolution |
| --- | --- | --- |
| Bundled PostCSS 8.4.31 | The npm audit reported high-severity file disclosure and moderate-severity CSS stringify/source-map advisories. These require attacker-influenced CSS processing; this game has no player CSS submission path. The dependency still needed patching. | Override PostCSS to 8.5.30. The updated lock has zero known vulnerabilities in the audit at review time. |
| Next.js 15.5.27 superseded by a security patch | The upstream 15.5.28 release identifies image-optimizer RCE and Server Action DoS fixes. An exploit against this game was not demonstrated; it uses native images and no authored Server Actions. | Upgrade to 15.5.28 and disable the unused framework image optimizer. Verify its endpoint returns 404. |
| Imported journal id resolves an inherited object | Confirmed local availability bug: a valid-looking imported entry with `id: "__proto__"` made `journalTitle` return an object, causing React to throw. It needs a player import or modified browser storage; no cross-user remote compromise was demonstrated. | Use own-property checks for journal title and legacy-note dictionaries. Reserved and unknown journal ids render as escaped text. Reproduce with a React rendering regression and real file-import browser tests. |
| Inherited item keys and retained metadata | Codex keepsakes incorrectly accepted `constructor`/`__proto__` as items. Several validated nested save objects retained unrecognized properties. There was no demonstrated global prototype pollution. | Check actual item/scene ownership, copy accepted stats/factions/journal/roll/snapshot fields, and discard reserved flag names. Preserve legitimate serialized property order and historical campaign hashes. |
| Inconsistent stored-JSON size checks | Saves/imports were bounded, but manual slots parsed before checking size, and codex/preferences had no size check. This is local resource-exhaustion hardening. | Check before parsing: 1,048,576 characters for saves/codex/slots and 16,384 for preferences. The file picker separately retains its existing 1 MiB byte limit before reading. Malformed snapshot envelopes produce a controlled integrity error. |
| Missing browser containment headers | Defense-in-depth gap, not proof of an existing XSS exploit. | Add CSP, `nosniff`, frame denial, no-referrer and permissions restrictions; remove `X-Powered-By`. Apply them to routes and assets without breaking compressed FLAC headers. |
| Mutable action references and persisted checkout credentials | Supply-chain hardening; no compromised action was observed. | Pin checkout, setup-node and upload-artifact to verified official v4 commit SHAs. Set every checkout's `persist-credentials: false`; retain `contents: read`. |
| Check names alone identify production CI | A third-party integration with check-writing permission could otherwise publish matching display names. This is an additional gate restriction, not a demonstrated compromise. | Only GitHub Actions checks reach the existing exact-commit/latest-cohort decision. Test ignored foreign successes and failures. All existing required jobs remain mandatory. |
| No recurring vulnerability check | A clean audit can become stale as advisories change. | Require `npm run security:audit` before source tests in CI. It includes development dependencies and fails on moderate/high/critical advisories or audit-service errors. Add ignore rules for common future credential files. |

## Browser policy and compatibility

Production CSP restricts default resources, scripts, fonts, media and connections to this origin, permits required data images and blob media, and blocks object embeds, frames, document base changes and foreign form submissions. Camera, microphone, geolocation, payments and USB permissions are disabled. Game sound and voices use Web Audio output and do not need microphone permission.

Static App Router hydration includes inline bootstrap scripts, and the UI uses inline styles. The policy therefore permits `'unsafe-inline'` scripts/styles. **It does not stop arbitrary inline JavaScript if a future HTML-injection bug is introduced.** React text escaping and avoidance of HTML sinks remain essential. A nonce-based policy would require a separately evaluated rendering/deployment change; this review does not silently switch static routes to dynamic rendering. Development omits CSP for compiler compatibility. Vercel's HTTPS/HSTS settings are managed by the hosting platform and were not changed here.

The checksum on a save is accidental-corruption detection, not a signature. Local saves are editable, unencrypted and available to scripts on the same origin and anyone with access to the browser profile. This is appropriate for an offline solo game without server-authoritative scores. Do not put credentials or sensitive personal information in saves. Adding accounts, uploads or a backend would require a fresh review of authorization, sessions, request validation and server-side storage.

## Verification record

- Before fixing, reproduced the imported-journal React exception and inherited keepsake acceptance using harmless local test data.
- After dependency updates, `npm run security:audit` reports **zero known vulnerabilities** across production and development dependencies. All 93 locked packages have registry.npmjs.org URLs and integrity values. This verifies lock metadata, not the absence of malicious or unknown package behavior.
- The tracked-file scan covered 1,176 files for common private-key, GitHub, AWS and provider-token patterns and sensitive credential filenames. It found no matches. It did not inspect Git history, untracked credentials, hosting secrets or account permissions, and pattern scanning cannot prove no secret exists.
- Focused source regressions cover crafted journal ids, escaped markup, nested-field stripping, reserved flags, size limits, malformed envelopes, slot behavior, legacy migration, held dice, pinned action references and check-provider spoofing.
- Full source/build, production audits and browser results are recorded below after execution. Existing media provenance, exact-word voices, historical campaign contracts, four finales and save compatibility remain required checks.

### Final local results

- `npm test`: **620 passed**, zero failed. All historical route/media contracts and previous native export fixtures remain unchanged.
- TypeScript validation and the Next.js 15.5.28 production build pass; the routes remain statically prerendered.
- Production report: 197 scenes, 598 choices, 148 authored replay fixtures and zero asset-budget violations. Six existing independent commercial acceptance gates remain pending.
- All five balance comparisons pass: 19,200 broad campaigns, 384 matched scenarios with 13,821 terminal branches, 43,200 economy campaigns, 14,400 clinic/witness campaigns and 25,920 distribution/witness campaigns. No historical baseline was regenerated.
- Nine focused security browser checks pass across Chromium, phone-sized Chromium and WebKit. They exercise actual malicious file imports, journal rendering, reload/export, invalid/oversized rejection without overwriting an active run or manual slot, headers on documents/media, local asset loading, gzip decoding and the disabled optimizer endpoint.
- Four production performance samples pass. Maximum first-visit encoded HTML/resource transfer is **2,011,798 bytes** against the existing 2,097,152-byte budget. All sample goals are visible, with zero overflow or observed layout shift. These are synthetic measurements, not field percentiles.
- Full Chromium regression: **476 passed**, zero failed, in 7.6 minutes. This includes campaign branches, exact voices, audio mixing/stop behavior, art, narrow layouts, all four finales and both native menu-autoplay policies. Firefox and the complete phone/WebKit projects remain required in remote CI; no remote pass or deployment is claimed by this local record.

Raw browser/save test artifacts and detailed local logs stay outside Git under `/tmp/saint-shard-security-*`. Existing aggregate production/balance reports use the ignored `qa/production/reports/` directory. No live player saves were used. The live GitHub check metadata for the prior successful main commit was read with `gh` and confirms `github-actions` as provider; the direct Node network probe in this managed environment timed out and correctly blocked deployment. Gate provider selection is independently covered through mocked responses, not claimed as a completed hosting deployment.

## Maintenance and limits

Review fresh advisories regularly through CI; do not remove the PostCSS override until the upstream framework supplies a safe version and the audit/build pass without it. Update action pins from verified upstream commits. An audit-service outage blocks publication through the Test gate; it is not silently treated as clean. CI and local results do not establish Vercel team security, domain control, dependency author trust or independent penetration-test acceptance. No credentials were rotated and no account security configuration was changed.

If a report involves credentials or a working exploit, use an available private repository reporting channel rather than posting secret material publicly. This document does not assert that GitHub private vulnerability reporting has been enabled.

## Primary references

- [Next.js 15.5.28 security release](https://github.com/vercel/next.js/releases/tag/v15.5.28)
- [PostCSS stringify advisory](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)
- [PostCSS source-map file-read advisory](https://github.com/advisories/GHSA-6g55-p6wh-862q)
- [PostCSS incomplete file-read fix](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp)
- [PostCSS path traversal advisory](https://github.com/advisories/GHSA-r28c-9q8g-f849)
- [GitHub guidance on immutable action revisions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#using-third-party-actions)
