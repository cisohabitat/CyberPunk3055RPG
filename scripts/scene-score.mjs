// Original procedural long-form score and district textures; no samples.
// 64 seconds / mono PCM at 22050 Hz: 2,822,444 bytes per delivery.
export const DIRECTED_RATE = 22050;
export const DIRECTED_SECONDS = 64;
export const DIRECTED_AUDIO = {
  "theme-reading": { title: "The Space Around an Answer", kind: "music", direction: "Recorded testimony: sparse glass and low suspended harmony, with long spaces for reading." },
  "theme-quiet": { title: "A Cup Left Warm", kind: "music", direction: "Quiet conversations and the rain finale: warm low tones and an incomplete memory motif." },
  "theme-pressure": { title: "Three Opportunities", kind: "music", direction: "An active local Chapel window: restrained low pulse; no real-time deadline is imposed." },
  "ambience-street": { title: "Beneath the Awning", kind: "ambience", direction: "Sheltered drops, distant wheel resonance and a low ventilation tone." },
  "ambience-chapel": { title: "The Reader Room", kind: "ambience", direction: "Ventilation, intermittent glass resonance and distant pipe drops." },
  "ambience-spire": { title: "Above the Service Counter", kind: "ambience", direction: "A low maintenance motor and occasional soft relay clicks, without success indicators." },
  "ambience-canal": { title: "The Dry Dispatch", kind: "ambience", direction: "A slow pump, hollow metallic drops and restrained water resonance." },
  "ambience-ward": { title: "Under the Memorial Stair", kind: "ambience", direction: "Rain runoff and sheltered concrete drips, with no crowd or invented witness voices." },
};
const TAU = Math.PI * 2;
const raised = x => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

function render(name, brief) {
  const length = DIRECTED_RATE * DIRECTED_SECONDS;
  const samples = new Float32Array(length);
  function event(at, frequency, seconds, gain, glass = false) {
    const start = Math.round(at * DIRECTED_RATE);
    const count = Math.round(seconds * DIRECTED_RATE);
    for (let i = 0; i < count; i++) {
      const t = i / DIRECTED_RATE;
      const shape = raised(t / (glass ? 0.015 : 0.8)) * raised((seconds - t) / (glass ? 0.25 : 1.4));
      const body = glass
        ? (Math.sin(TAU * frequency * t) * Math.exp(-t / 0.9) + 0.16 * Math.sin(TAU * frequency * 2.71 * t) * Math.exp(-t / 0.3))
        : (Math.sin(TAU * frequency * t) + 0.12 * Math.sin(TAU * frequency * 2 * t)) * (0.85 + 0.15 * Math.sin(TAU * t / 7));
      samples[(start + i) % length] += body * shape * gain;
    }
  }
  if (brief.kind === "music") {
    const pressure = name === "theme-pressure";
    const quiet = name === "theme-quiet";
    const chords = quiet ? [[45, 52, 60], [41, 48, 57], [43, 50, 59], [40, 47, 57]] : [[45, 52, 59], [38, 45, 60], [41, 48, 59], [40, 47, 62]];
    chords.forEach((chord, index) => chord.forEach((midi, voice) => event(index * 16 + voice * 0.07, hz(midi), 18.5, voice === 0 ? 0.039 : 0.021)));
    // The second phrase is different; this is not two concatenated short loops.
    const notes = quiet ? [64, 60, 59] : [76, 72, 71, 69];
    notes.forEach((midi, i) => event(7.2 + i * 2.6, hz(midi), 3.4, quiet ? 0.028 : 0.024, true));
    [71, 69, 64].forEach((midi, i) => event(43.5 + i * 4.1, hz(midi - (quiet ? 12 : 0)), 4, 0.022, true));
    if (pressure) [0.6, 2.6, 5.1, 8.3, 12.6, 17.1, 19.6, 24.1, 28.6, 32.1, 36.6, 41.1, 45.6, 49.1, 52.6, 57.1, 60.6].forEach(at => event(at, hz(33), 1.1, 0.055, true));
  } else {
    const district = name.slice("ambience-".length);
    const bases = { street: 48, chapel: 55, spire: 72, canal: 40, ward: 32 };
    const base = bases[district];
    // Integer cycle frequencies/modulation give continuous periodic room tone.
    for (let i = 0; i < length; i++) {
      const t = i / DIRECTED_RATE;
      samples[i] = (Math.sin(TAU * base * t) * 0.009 + Math.sin(TAU * base * 2 * t) * 0.003) * (0.8 + 0.2 * Math.sin(TAU * t / 64));
    }
    const drops = district === "spire" ? [5.3, 19.7, 34.2, 58.1] : [1.7, 4.9, 11.2, 16.6, 23.8, 31.1, 36.7, 42.3, 51.4, 54.8, 62.7];
    drops.forEach((at, index) => event(at, base * (district === "chapel" ? 12 : district === "canal" ? 7 : 9) + index * 17, 0.35 + index % 3 * 0.07, 0.034, true));
    if (district === "street" || district === "canal") [14.2, 47.6].forEach(at => event(at, base * 3, 6.5, 0.016));
    if (district === "chapel") event(44.3, hz(71), 3.7, 0.009, true);
  }
  // Finite room tail wraps through the seam instead of fading to silence.
  const dry = samples.slice();
  const delay = Math.round(DIRECTED_RATE * (brief.kind === "music" ? 0.217 : 0.131));
  for (let i = 0; i < length; i++) samples[i] += dry[(i - delay + length) % length] * 0.12;
  return { rate: DIRECTED_RATE, channels: [samples] };
}

export function renderDirectedAudio() {
  return Object.fromEntries(Object.entries(DIRECTED_AUDIO).map(([name, brief]) => [name, render(name, brief)]));
}
