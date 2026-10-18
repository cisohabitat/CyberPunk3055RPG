# Artwork, equipment and earned moments

This cycle implements all four requested visual improvements. Painted conversations use a compact actor strip when an explicit art-to-actor mapping confirms that the scene painting already contains the context character. The currently audible actor, role and speaking cue remain visible; neutral settings and text-only play retain the full portrait treatment. Finales retain their existing first-viewport layout.

Gear now illustrates all fourteen defined inventory items. Only owned items render, and the equipment atlas is requested only after opening Gear with artwork enabled. The damaged shard selects a separate cracked cell. Text remains authoritative for costs, uses and damage. An unchanged generated 4×4 atlas is viewed through CSS cells; no neighbouring item is shown in the item viewer. Unknown identifiers cannot resolve a prototype property or image URL.

Two additional conditional paintings record earned outcomes: Mara's chipped cup after choosing to stay, and the separately held archive original at Edda's Ward Nine return after custody is agreed. Courier and deferred dispatch remain distinct in prose. Named and unnamed source copies retain their actual employer risks. These images establish no new authentication, treatment, receipt, consent or acquittal. Existing repair, freight-receipt and public-filing rules remain intact.

Scene art, guide art and owned equipment open a native modal viewer. Zoom buttons and +/− adjust from 100% to 300%; 0 or Fit resets it. The focused viewport supports native arrow-key scrolling. Escape closes the viewer and restores focus. A nested equipment viewer returns to the still-open mobile sheet. Missing art retains descriptive text and a working close control. Text-only mode mounts no artwork controls or image requests.

Opening a viewer interrupts and consumes the current automatic dialogue queue, including an in-flight load. Closing it does not replay the line. Original story words, actor identities, audio files, dice, pending checks and saves remain unchanged. The guide keeps its existing user-controlled music.

## Art review

Three `image_gen.imagegen` PNG masters remain outside Git. Six responsive JPEGs only resize and encode those masters; CSS supplies the equipment cells. `qa/media/visual-library.json`, `art-provenance.json`, `scene-art.json`, `review.html` and `CREDITS.md` record the additions, references and delivery hashes. The preceding three-rule consequence-media snapshot remains preserved; its test explicitly compares the retained prefix while the new cycle tests the complete five-rule registry. This is an additive review, not a rewrite of old evidence.

## Validation

The final working tree passes 637 source tests, the production build, the media report (581 assets; zero budget violations), and 58 Chromium/phone browser checks covering the viewer, all fifteen audible actors and all four finales. An earlier 106-check visual regression batch also passed; these batches overlap and are not a unique-test total. Visual inspection caught width-only fitting, and the added keyboard assertion caught Tab leaving the controls. Both are corrected; the final browser batch covers fitting in both dimensions and explicit focus wrapping.

Four native Chromium first-visit samples at 390px and 1440px, with full and no artwork, remain below the 2 MiB transfer budget. The largest is 2,018,270 bytes; all have zero measured layout shift, no horizontal overflow and a visible goal. Text-only samples make zero artwork requests. These are synthetic first-visit samples with native document-activation policy, not field percentiles or measurements of a previously permitted autoplay visit.

The six new JPEGs total 922,348 bytes. Story sources, engine, storage, dialogue bindings/provenance and all tracked audio files are unchanged. `qa/media/visual-library-validation.json` records final source hashes, checks and limits. README, AGENTS and credits are updated in the same change. Hosted CI retains its complete Chromium, phone, Firefox and WebKit matrix and production gate; this local evidence does not substitute for those exact-commit results. Local Firefox profile startup and WebKit host libraries prevent claiming local coverage of those engines.

Browser checks are an AI-assisted development proxy, not independent player or artistic acceptance. The existing 8.2 provisional grade is unchanged.
