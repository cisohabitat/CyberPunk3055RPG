# Saint Shard — artwork anatomy correction

The player identified faulty arm anatomy in Edda’s service-counter painting. The preceding composition audit incorrectly accepted it: it counted two hands without tracing the complete arm paths. The book-holding hand and counter hand appear to share a sleeve beside another folded forearm. This report supersedes that acceptance; the historical audit and original hashes remain unchanged.

## Review and correction

- Reopened all 146 primary, portrait and cast deliveries across 33 native-pixel inspection sheets.
- Traced visible hands through wrists, forearms, elbows and shoulders, including occlusion by clothing and props.
- Made an additional native-pixel torso/hand inspection of 22 character paintings, including both shared scenes, four finales and the important counter, clinic and witness conversations.
- Reviewed all 165 phone/loading derivatives for matching composition; verified 299 global-provenance delivery hashes and compared derivative pixels against their current primary source.
- Confirmed one faulty composition: `edda-service-review`. No further creative defect was confirmed in this pass.

The accepted retake removes the upright book and chest hand. Both hands rest separately on the counter, each connected to its own wrist, sleeve and shoulder. Edda’s face, glasses, hair, coat and service-counter setting remain recognizable. Her hand covers the billing slip’s account corner; the service card and closed receiver sleeve remain separate. No query, handover, approval or completed closure is introduced.

The corrected 1536 × 1024 generated master supplies the 1200 × 800 main JPEG, 600 × 400 phone JPEG and 96 × 64 loading preview. Each delivered version was reopened and inspected. Post-generation processing only resizes and encodes. The three public replacements total 349,662 bytes; the main/phone assets are smaller than their preceding deliveries.

## Evidence and safeguards

`qa/media/anatomy-art-review.json` contains the current per-file findings and hashes. `qa/media/anatomy-retakes.json` contains original/current provenance, the anatomy finding, accepted retake observations and three precise replacements. Previous JPEGs live in `qa/media/anatomy-baseline/`, outside publicly served assets. The media audition, credits, scene rationale and image description use the new pose.

Historical phase expectations reconcile only the explicitly reviewed path/old-hash/new-hash triples and validate the retained preceding bytes. New source checks reject unknown replacement hashes, mismatched previews and missing review coverage. These checks preserve the reviewed files; they cannot detect extra hands or certify artistic quality.

## Validation

- All **655 source tests** pass. A final **14-test source subset** also passes after clarifying which image was supplied to the generator and which portrait was inspected for identity continuity.
- Production build and TypeScript check pass; the dependency audit reports **zero vulnerabilities**.
- The production audit retains **197 scenes, 598 choices, 148 replay routes and 703 assets**, with no budget violations.
- **80 local Chromium/phone browser cases** pass across `complete-art` and `composition-finish`: corrected scene assets, slow/missing images, previews, viewers, actual dialogue/speakers, voice interruption, text-only zero art requests, enlarged text, keyboard/focus, saves and accessibility.
- Reopened actual game/viewer screenshots at **390px and 1440px**. Both show the corrected painting; the viewer loads the complete 1200 × 800 delivery, saves remain unchanged, and neither capture reports a page error.
- Four native first-visit probes remain under the 2 MiB transfer budget, with a maximum **2,028,214 encoded resource + HTML bytes**, no overflow, zero measured layout shift, and zero art requests in text-only mode. These title/prologue samples do not measure the Edda encounter’s full journey or field performance.

`qa/media/anatomy-validation.json` records local results and probe limits. These results cover the precommit worktree based on `7c86f6f`; they do not claim publication. All existing full Chromium/phone/Firefox/WebKit, security/balance and exact-commit publication gates remain mandatory on the pushed revision.

## Limits

This is AI visual inspection, the user’s available participation proxy. The previous miss demonstrates its limits. Tiny distant figures, occluded fingers and painterly detail do not permit anatomical certainty. No independent artist or player acceptance is claimed. Story words, voice performances and bindings, choices, dice, four finales and saves remain unchanged.
