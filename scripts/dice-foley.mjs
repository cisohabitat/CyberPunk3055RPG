// Optional offline synthesis only. No recording, sample library or model.
export const DICE_RATE = 22050;
function random(seed) {
  let a = seed >>> 0;
  return () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
}
function contact(samples, at, gain, seed, pitch = 760) {
  const rand = random(seed), start = Math.round(at * DICE_RATE);
  let low = 0;
  for (let i = 0; i < DICE_RATE * .065 && start + i < samples.length; i++) {
    const t = i / DICE_RATE, noise = rand() * 2 - 1;
    low += .3 * (noise - low);
    const attack = Math.min(1, t / .0025), decay = Math.exp(-t / .011);
    samples[start + i] += gain * attack * decay * (.7 * low + .21 * Math.sin(2 * Math.PI * pitch * t) + .09 * Math.sin(2 * Math.PI * 173 * t));
  }
}
function ring(samples, at, pitch, gain) {
  const start = Math.round(at * DICE_RATE);
  for (let i = 0; start + i < samples.length; i++) {
    const t = i / DICE_RATE;
    samples[start + i] += gain * Math.min(1, t / .008) * Math.exp(-t / .085) * Math.sin(2 * Math.PI * pitch * t);
  }
}
function finish(samples) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    samples[i] *= Math.min(1, i / (DICE_RATE * .003), (samples.length - 1 - i) / (DICE_RATE * .025));
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  if (peak > .19) for (let i = 0; i < samples.length; i++) samples[i] *= .19 / peak;
  samples[0] = 0; samples[samples.length - 1] = 0;
  return samples;
}
export function renderDiceCues() {
  const tumble = new Array(Math.round(DICE_RATE * .64)).fill(0);
  [.012, .052, .111, .192, .301, .433, .56].forEach((at, i) => contact(tumble, at, .55 - i * .055, 3055 + i, 980 - i * 70));
  const clips = { "dice-tumble": finish(tumble) };
  for (const [name, seconds, pitch, critical] of [
    ["dice-land-success", .26, 329.63, false],
    ["dice-land-miss", .26, 220, false],
    ["dice-land-ten", .42, 329.63, true],
    ["dice-land-one", .38, 164.81, true],
  ]) {
    const samples = new Array(Math.round(DICE_RATE * seconds)).fill(0);
    contact(samples, .006, .48, 4011, 520);
    ring(samples, .025, pitch, .035);
    if (critical) { contact(samples, .105, .13, 4201, 420); ring(samples, .11, pitch * (name.endsWith("ten") ? 1.5 : .75), .028); }
    clips[name] = finish(samples);
  }
  return clips;
}
