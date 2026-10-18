# Finale district-header CI correction

18 October 2026. The logo and dice commits were pushed successfully. Their publication was blocked by an existing finale layout regression carried forward from the district identity cycle.

## Evidence and correction

The logo commit 421dfc5 passed source tests, security, balance comparisons and compilation, then failed the same 390px finale assertion in Chromium, phone, Firefox and WebKit: first prose at approximately 456.5px, against the unchanged <450px requirement. In the later dice run 50c6358, completed Chromium/phone/Firefox checks reported the same sole blocking failure; WebKit was still running when inspected. A Firefox responsive-image decode failure recovered on the existing retry and is distinct from the persistent layout failure.

A local production reproduction fails at 456.46875px before the fix. The new district frame applies .8rem top padding to every scene header; its 1.8rem emblem also enlarges the location line. Finale presentation previously relied on a deliberately compact header.

The correction removes only the added finale header top padding and reduces its emblem to 1.4rem. The district border, complete location/act/goal, full portrait/nameplate, restore notice, ending heading and canonical prose remain. Regular scene headers are unchanged. The existing test retains its 450px bound and gains an ending/width diagnostic. No test is skipped or weakened and every release gate remains mandatory.

## Verification

The before-fix production reproduction fails at **456.46875px**. After correction, all four default 390px endings start prose at **443.671875px**, below the unchanged **450px** bound. Desktop prose starts at 423.375px. Enlarged 320px text remains scrollable without overflow; its complete goals stay visible. Twelve local screenshot/measurement samples cover all four endings at those three widths. The corrected phone frame was visually inspected.

**660 source tests and 76 focused browser cases pass**, along with TypeScript, production compilation, dependency security (zero known vulnerabilities), and all 707 asset budgets. Browser scope includes finale layout/voices/history, district/choice/document presentation, the new die/held-roll/reduced-motion flows and responsive title branding, across Chromium and phone-sized Chromium. Existing full-art/text-only/paragraph reading, exact actor/quote, unchanged saves and accessibility checks remain intact.

`qa/media/finale-ci-correction.json` records hosted failure coordinates, the local reproduction, source hashes and after measurements. Raw logs/screenshots remain outside Git. No scene, word, voice, media asset, engine, save or deployment-gate behavior changes. The approved title branding and dice presentation remain in the candidate. Hosted full-suite Firefox/WebKit acceptance is not inferred from local Chromium results.

Pushing a correction does not establish that hosted CI has passed or that Vercel has published it. Check the exact new commit separately.
