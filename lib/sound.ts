let ctx: AudioContext | null = null;

export function blip(success: boolean) {
  try {
    const AudioCtx = window.AudioContext;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = success ? 740 : 146;
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // A blocked audio context should never stop the roll.
  }
}
