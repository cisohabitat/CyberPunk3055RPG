import { writeFileSync } from "node:fs";

const RATE = 44100;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE((clamped * 32767) | 0, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function env(length, attack, release) {
  return (index) => {
    const a = Math.min(1, index / Math.max(1, attack));
    const r = Math.min(1, (length - 1 - index) / Math.max(1, release));
    const raised = (value) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, value)));
    return Math.min(raised(a), raised(r));
  };
}

function tone(seconds, freq, gain = 0.2) {
  const length = Math.floor(RATE * seconds);
  const shape = env(length, RATE * 0.012, RATE * 0.04);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * gain * shape(i);
  }
  samples[0] = 0;
  samples[length - 1] = 0;
  return samples;
}

function mix(tracks) {
  const length = Math.max(...tracks.map((track) => track.length));
  const samples = new Array(length).fill(0);
  for (const track of tracks) {
    for (let i = 0; i < track.length; i += 1) samples[i] += track[i];
  }
  return samples;
}

function voice(t, freq) {
  return Math.sin(2 * Math.PI * freq * t) * 0.86 + Math.sin(2 * Math.PI * freq * 1.004 * t) * 0.14;
}

function loopCrossfade(samples, fadeSeconds) {
  const n = Math.max(2, Math.floor(RATE * fadeSeconds));
  const out = samples.slice(0, samples.length - n);
  for (let i = 0; i < n; i += 1) {
    const w = i / (n - 1);
    const fadeIn = Math.sin((w * Math.PI) / 2);
    const fadeOut = Math.cos((w * Math.PI) / 2);
    out[i] = out[i] * fadeIn + samples[samples.length - n + i] * fadeOut;
  }
  return out;
}

function theme() {
  const chords = [
    [110, 164.81, 220],
    [98, 146.83, 196],
    [87.31, 130.81, 174.61],
    [98, 155.56, 196],
  ];
  const bar = 2;
  const fade = 0.45;
  const loopSeconds = bar * chords.length;
  const length = Math.floor(RATE * (loopSeconds + fade));
  const samples = new Array(length).fill(0);
  for (let c = 0; c < chords.length; c += 1) {
    const start = c * bar;
    const end = start + bar + fade;
    const chord = chords[c];
    const from = Math.floor(RATE * start);
    const to = Math.min(length, Math.floor(RATE * end));
    for (let i = from; i < to; i += 1) {
      const t = i / RATE;
      const local = (t - start) / fade;
      const remain = (end - t) / fade;
      const edge = Math.min(1, local, remain);
      const g = Math.sin((Math.min(1, Math.max(0, edge)) * Math.PI) / 2);
      const body = voice(t, chord[0]) * 0.11 + voice(t, chord[1]) * 0.055 + voice(t, chord[2]) * 0.028;
      const trem = 0.78 + 0.22 * Math.sin(2 * Math.PI * 0.25 * t);
      samples[i] += body * g * trem;
    }
  }
  return loopCrossfade(samples, fade);
}

function drip(samples, at, freq, gain, decay) {
  const dur = Math.floor(RATE * Math.min(0.22, decay * 4));
  for (let i = 0; i < dur && at + i < samples.length; i += 1) {
    const t = i / RATE;
    const attack = Math.min(1, i / Math.max(1, RATE * 0.004));
    const shaped = attack * attack * Math.exp(-t / decay);
    const ping = Math.sin(2 * Math.PI * freq * t);
    const wet = Math.sin(2 * Math.PI * freq * 1.5 * t) * Math.exp(-t / (decay * 0.5));
    samples[at + i] += (ping * 0.84 + wet * 0.16) * gain * shaped;
  }
}

function rain() {
  const seconds = 8;
  const length = Math.floor(RATE * seconds);
  const samples = new Array(length).fill(0);
  const rand = mulberry32(3055);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const wobble = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.125 * t);
    samples[i] = Math.sin(2 * Math.PI * 48 * t) * 0.012 * wobble;
  }
  let cursor = 0.45;
  while (cursor < seconds - 0.55) {
    cursor += 0.16 + rand() * 0.22;
    if (cursor >= seconds - 0.55) break;
    const at = Math.floor(RATE * cursor);
    const bright = rand() > 0.72;
    drip(
      samples,
      at,
      bright ? 1400 + rand() * 900 : 420 + rand() * 680,
      bright ? 0.08 + rand() * 0.06 : 0.12 + rand() * 0.1,
      bright ? 0.03 + rand() * 0.02 : 0.045 + rand() * 0.03,
    );
  }
  return loopCrossfade(samples, 0.3);
}

function sting(notes) {
  const bits = notes.map((note, index) => {
    const body = tone(0.28, note, 0.22);
    const offset = Math.floor(index * RATE * 0.11);
    const placed = new Array(offset + body.length).fill(0);
    for (let i = 0; i < body.length; i += 1) placed[offset + i] = body[i];
    return placed;
  });
  return mix(bits);
}

const files = {
  theme: theme(),
  rain: rain(),
  "sting-stall": sting([220, 277, 330]),
  "sting-chapel": sting([196, 247, 392]),
  "sting-alley": sting([146, 174, 220]),
  "sting-week": sting([174, 220, 262]),
  "sting-ward": sting([130, 196, 247]),
  "sting-ending": sting([130, 164, 196, 262]),
  "dice-tick": tone(0.05, 740, 0.16),
  "sting-success": sting([523, 659, 784]),
  "sting-fail": sting([196, 146]),
};

for (const [name, samples] of Object.entries(files)) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0.95) {
    const gain = 0.95 / peak;
    for (let i = 0; i < samples.length; i += 1) samples[i] *= gain;
  }
  writeFileSync(new URL(`../public/audio/${name}.wav`, import.meta.url), wav(samples));
}
