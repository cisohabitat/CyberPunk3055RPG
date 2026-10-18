// Offline authoring only; builds serve the five checked-in deliveries.
import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DICE_RATE, renderDiceCues } from "./dice-foley.mjs";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const clips = [];
for (const [id, samples] of Object.entries(renderDiceCues())) {
  const wav = Buffer.alloc(44 + samples.length * 2);
  wav.write("RIFF"); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(DICE_RATE, 24); wav.writeUInt32LE(DICE_RATE * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(samples.length * 2, 40);
  let peak = 0, energy = 0, jump = 0, previous = 0;
  for (let i = 0; i < samples.length; i++) {
    if (!Number.isFinite(samples[i]) || Math.abs(samples[i]) > .2) throw new Error("Invalid dice cue");
    wav.writeInt16LE(Math.round(samples[i] * 32767), 44 + i * 2);
    const value = wav.readInt16LE(44 + i * 2) / 32768;
    peak = Math.max(peak, Math.abs(value)); energy += value * value; jump = Math.max(jump, Math.abs(value - previous)); previous = value;
  }
  const path = `public/audio/${id}.wav`; writeFileSync(new URL(`../${path}`, import.meta.url), wav);
  clips.push({ id, path, bytes: wav.length, sha256: sha(wav), sampleRate: DICE_RATE, channels: 1, bits: 16, durationSeconds: samples.length / DICE_RATE, peak, rms: Math.sqrt(energy / samples.length), maxSampleJump: jump });
}
const sources = ["scripts/dice-foley.mjs", "scripts/author-dice-foley.mjs"];
writeFileSync(new URL("../qa/media/dice-foley.json", import.meta.url), JSON.stringify({ version: 1, method: "Original deterministic procedural synthesis: filtered-noise contacts, decelerating surface rattle and quiet resonances; no recordings, samples, trained model or voice generation. Offline only.", sourceSha256: Object.fromEntries(sources.map(p => [p, sha(readFileSync(new URL(`../${p}`, import.meta.url)))])), mix: { level: .38, speechDuck: .35 }, clips, limits: "Signal/source and synthetic-browser verification, not independent perceptual or physical-device listening acceptance." }, null, 2) + "\n");
console.log(JSON.stringify({ clips: clips.length, bytes: clips.reduce((sum, c) => sum + c.bytes, 0) }));
