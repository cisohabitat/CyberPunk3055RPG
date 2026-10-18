/** Mild display exposure compensation, never a hue shift, crop or creative retake. */
const LEGACY_PORTRAITS = new Set([
  "/art/quill.jpg", "/art/quill-waiting.jpg", "/art/lumen.jpg", "/art/lumen-challenging.jpg", "/art/lumen-guarded.jpg",
  "/art/mara.jpg", "/art/mara-boundary.jpg", "/art/mara-questioning.jpg", "/art/kerr.jpg", "/art/kerr-closed.jpg",
  "/art/ives.jpg", "/art/sera.jpg", "/art/sera-listening.jpg", "/art/orderly.jpg",
]);
export function portraitFinish(src: string) {
  return LEGACY_PORTRAITS.has(src) ? "legacy-paint" : "current-paint";
}
