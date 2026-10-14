/** Observe browser permission without waiting on a possibly pending resume. */
export function waitForRunningAudio(audio: Pick<AudioContext, "state" | "resume" | "addEventListener" | "removeEventListener">, ready: () => void): () => void {
  let cancelled = false;
  function changed() {
    if (!cancelled && audio.state === "running") {
      cancelled = true; audio.removeEventListener("statechange", changed); ready();
    }
  }
  audio.addEventListener("statechange", changed);
  changed();
  if (!cancelled && audio.state !== "closed") {
    try { void audio.resume().catch(() => {}); } catch { /* A gesture can retry. */ }
  }
  return () => { cancelled = true; audio.removeEventListener("statechange", changed); };
}
