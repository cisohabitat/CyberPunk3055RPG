// Original Saint Shard score. No samples, models, or recorded performances.
// 60 BPM, eight four-beat bars; E-C-B-A is the recurring memory motif.
// Event tails and room reflections wrap around the buffer, preserving the loop.
export const SCORE_RATE = 22050;
const SECONDS = 32;
const TAU = 2 * Math.PI;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const raised = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));

export const ARRANGEMENTS = {
  theme: { title: "Under the Awnings", mode: "street", seed: 3055 },
  "theme-chapel": { title: "An Hour in Glass", mode: "chapel", seed: 213 },
  "theme-week": { title: "The Work Between", mode: "week", seed: 219 },
  "theme-ward": { title: "Names in the Rain", mode: "ward", seed: 300 },
};
const HARMONY = [
  [45, 52, 59, 60], [41, 48, 55, 57], [48, 55, 59, 64], [43, 50, 57, 62],
  [38, 45, 53, 64], [43, 52, 57, 60], [41, 48, 55, 64], [40, 47, 57, 62],
];

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function render({ mode, seed }) {
  const length = SCORE_RATE * SECONDS;
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const rand = random(seed);

  function note(at, midi, duration, gain, instrument, pan = 0, phase = 0) {
    const frequency = hz(midi);
    const start = Math.round(at * SCORE_RATE);
    const count = Math.round(duration * SCORE_RATE);
    const l = Math.cos((pan + 1) * Math.PI / 4);
    const r = Math.sin((pan + 1) * Math.PI / 4);
    for (let i = 0; i < count; i++) {
      const t = i / SCORE_RATE;
      const p = TAU * frequency * t;
      const end = raised((duration - t) / (instrument === "pad" ? 1.3 : 0.25));
      let value;
      if (instrument === "pad") {
        const envelope = raised(t / 1.1) * end;
        const shimmer = 0.88 + 0.12 * Math.sin(TAU * 0.125 * t + phase);
        value = (Math.sin(p + phase) * 0.72 + Math.sin(p * 1.0015 + phase) * 0.18 + Math.sin(2 * p + phase) * 0.1) * envelope * shimmer;
      } else if (instrument === "glass") {
        value = (Math.sin(p) * Math.exp(-t / 1.1) + 0.24 * Math.sin(2.76 * p) * Math.exp(-t / 0.4) + 0.06 * Math.sin(4.1 * p) * Math.exp(-t / 0.18)) * raised(t / 0.009) * end;
      } else if (instrument === "pluck") {
        value = (Math.sin(p) + 0.3 * Math.sin(2 * p) + 0.08 * Math.sin(3 * p)) * raised(t / 0.012) * Math.exp(-t / 0.45) * end;
      } else if (instrument === "cello") {
        value = (Math.sin(p + 0.007 * Math.sin(TAU * 4.2 * t)) + 0.23 * Math.sin(2 * p) + 0.09 * Math.sin(3 * p)) * raised(t / 0.55) * end;
      } else {
        // Felt keys: a softened harmonic strike, long fundamental, short overtones.
        value = (Math.sin(p) * Math.exp(-t / 1.3) + 0.25 * Math.sin(2 * p) * Math.exp(-t / 0.45) + 0.055 * Math.sin(4 * p) * Math.exp(-t / 0.13)) * raised(t / 0.018) * end;
      }
      const index = (start + i) % length;
      left[index] += value * gain * l;
      right[index] += value * gain * r;
    }
  }

  HARMONY.forEach((chord, bar) => {
    const at = bar * 4;
    // Separate voicings and stereo placement, rather than one stacked sine chord.
    chord.forEach((midi, voice) => {
      const offset = mode === "ward" && voice > 0 ? 12 : 0;
      note(at + voice * 0.035, midi + offset, 5.8, voice === 0 ? 0.047 : 0.023, "pad", (voice - 1.5) * 0.22, rand() * TAU);
    });
    if (mode === "ward") {
      note(at + 0.5, chord[0] + 12, 3.3, 0.033, "cello", -0.2);
      note(at + 2.5, chord[2] + 12, 2.6, 0.036, "felt", 0.25);
    } else if (mode === "chapel") {
      // Space between struck glass leaves room for reading and the memory cue.
      note(at + 1.25, chord[2] + 24, 2.4, 0.022, "glass", bar % 2 ? -0.35 : 0.35);
    } else {
      const offsets = mode === "week" ? [0.5, 1.5, 2.5, 3.5] : [0.5, 2.5];
      offsets.forEach((offset, index) => note(at + offset, chord[index % 3] + 12, 1.6, mode === "week" ? 0.029 : 0.024, "pluck", index % 2 ? 0.25 : -0.25));
      note(at + 0.125, chord[0] - 12, 2.9, 0.042, "felt", 0);
    }
  });

  const motif = [76, 72, 71, 69];
  const rhythm = [0.35, 1.75, 2.5, 3.25];
  for (const bar of mode === "chapel" ? [2, 6] : [0, 4]) {
    motif.forEach((midi, index) => {
      const shift = mode === "chapel" ? 0 : mode === "ward" ? -12 : bar === 4 ? -12 : 0;
      note(bar * 4 + rhythm[index], midi + shift, 2.7, mode === "chapel" ? 0.039 : 0.06, mode === "chapel" ? "glass" : "felt", (index - 1.5) * 0.1);
    });
  }
  if (mode === "ward") [72, 74, 76, 71].forEach((midi, i) => note(24.5 + i * 1.5, midi - 12, 2.5, 0.044, "felt", 0.2));
  if (mode === "week") [64, 67, 62, 64].forEach((midi, i) => note(12.5 + i * 0.75, midi, 1.7, 0.034, "pluck", -0.2));

  // Finite, cyclic room reflections: no reset or fade-to-silence at the seam.
  const dryLeft = left.slice();
  const dryRight = right.slice();
  const taps = mode === "chapel" ? [[0.137, 0.16], [0.311, 0.1], [0.593, 0.07]] : [[0.089, 0.12], [0.223, 0.08], [0.419, 0.045]];
  for (const [seconds, level] of taps) {
    const delay = Math.round(seconds * SCORE_RATE);
    for (let i = 0; i < length; i++) {
      const index = (i - delay + length) % length;
      left[i] += dryRight[index] * level;
      right[i] += dryLeft[index] * level;
    }
  }
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const master = Math.min(1.5, 0.42 / Math.max(peak, 0.001));
  for (let i = 0; i < length; i++) { left[i] *= master; right[i] *= master; }
  return { rate: SCORE_RATE, channels: [left, right] };
}

export function renderScores() {
  return Object.fromEntries(Object.entries(ARRANGEMENTS).map(([name, arrangement]) => [name, render(arrangement)]));
}
