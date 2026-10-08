import { writeFileSync } from "node:fs";

const RATE = 22050;

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

function env(length, attack, release) {
  return (index) => {
    const t = index / length;
    const a = Math.min(1, index / Math.max(1, attack));
    const r = Math.min(1, (length - index) / Math.max(1, release));
    return Math.min(a, r, 1 - Math.abs(t - 0.5) * 0);
  };
}

function tone(seconds, freq, gain = 0.2) {
  const length = Math.floor(RATE * seconds);
  const shape = env(length, RATE * 0.02, RATE * 0.08);
  const samples = new Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * gain * shape(i);
  }
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

function theme() {
  const seconds = 8;
  const length = RATE * seconds;
  const samples = new Array(length).fill(0);
  for (let i = 0; i < length; i += 1) {
    const t = i / RATE;
    const drone = Math.sin(2 * Math.PI * 110 * t) * 0.16 + Math.sin(2 * Math.PI * 164.8 * t) * 0.08;
    const pulse = Math.sin(2 * Math.PI * 220 * t) * (Math.sin(2 * Math.PI * 2 * t) > 0.2 ? 0.05 : 0);
    samples[i] = drone + pulse;
  }
  return samples;
}

function rain() {
  const length = RATE * 4;
  const samples = new Array(length);
  let noise = 0;
  for (let i = 0; i < length; i += 1) {
    noise = noise * 0.94 + (Math.random() * 2 - 1) * 0.06;
    samples[i] = noise * 0.55;
  }
  return samples;
}

function sting(notes) {
  const bits = notes.map((note, index) => {
    const body = tone(0.22, note, 0.28);
    const offset = Math.floor(index * RATE * 0.12);
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
  "sting-ending": sting([130, 164, 196, 262]),
  "dice-tick": tone(0.045, 880, 0.2),
  "sting-success": sting([523, 659, 784]),
  "sting-fail": sting([196, 146]),
};

for (const [name, samples] of Object.entries(files)) {
  writeFileSync(new URL(`../public/audio/${name}.wav`, import.meta.url), wav(samples));
}
