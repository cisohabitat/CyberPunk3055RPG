# Faceted check die

18 October 2026. The player opens an existing check, rolls once, watches the decorative die settle, reads the exact result and commits it with Continue. State and persistence remain entirely client-side; no API or external service is involved.

## Scope

`CheckDie` draws shaded facets, outlined edges and a separate readable numeric face using inline SVG/CSS. The wrapper performs one 700ms tumble during the existing roll interval. Success and miss retain written outcome labels with distinct edge/frame accents. A successful ten uses a restrained amber edge alongside the existing critical Strain explanation. Settled and restored results do not animate.

The rolling stage shows a stable Rolling 1d10 status and target difficulty. Changing decorative faces are hidden from assistive technology; the existing final total, Success/Miss and canonical consequences remain readable and announced. Both saved and system reduced-motion preferences skip the roll animation. Forced colors retains system-colored edges and numerals. Phone sizing, largest text, dialog scroll and sticky Continue remain supported.

No game randomness, tick timing/cues, stage/commit behavior, engine rule, price, source word, speaker, voice binding, art/audio delivery, save key/version or finale changes. Geometry does not generate rolls, use a timer or request artwork. No new scene or accompanying painting is necessary. Existing actor portraits and exact-word voice reactions continue to match their result. Original SVG interface geometry is credited separately from generated paintings.

## Verification

**660 source tests** pass, as do TypeScript, the production build and a dependency audit with zero known vulnerabilities. **50 browser cases** pass across Chromium and phone-sized Chromium using the new dice-presentation checks and the existing reading-flow/check-dialogue suites. They verify one staged face before animation, unchanged state until Continue, exact final scores, blocked Escape after rolling, reload during a tumble, still restored dice, saved/system reduced motion, forced colors, critical bounds, actual result speech and manual/mute/zero-voice behavior. Existing text-only and consequence-scroll assertions remain intact.

Sixteen local screenshot artifacts cover faces 1 and 10 at 1440, 768, 390 and enlarged 320px; inspected representative results show readable faces/scores with no dialog overflow or page errors. The original engine, saves, story, art/audio deliveries, global media provenance and exact dialogue bindings have no changes. React review confirms stateless decorative geometry, wrapper-only animation, no additional random calls/timers/effects or network requests, and a single numeric span.

All 707 production assets pass budgets. Four native first-visit probes show no observed layout shift/overflow and visible gameplay goals; artwork-none makes zero art requests. Maximum encoded HTML/resource transfer is **2,063,280 bytes**, below the unchanged **2,097,152-byte** limit. These are synthetic first visits, not field performance or prior-permission autoplay traffic.

`qa/media/dice-presentation.json` records scope, hashes, source/browser/production evidence, screenshot locations and limits. Raw screenshots/logs stay outside Git. Full existing four-profile hosted CI remains mandatory before publication; local success and a push do not confirm the live deployment.
