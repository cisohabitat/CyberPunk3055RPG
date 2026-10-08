import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function readWav(name: string) {
  const buf = readFileSync(fileURLToPath(new URL(`../public/audio/${name}.wav`, import.meta.url)));
  assert.equal(buf.toString("ascii", 0, 4), "RIFF");
  assert.equal(buf.toString("ascii", 8, 12), "WAVE");
  const rate = buf.readUInt32LE(24);
  const channels = buf.readUInt16LE(22);
  const bits = buf.readUInt16LE(34);
  assert.equal(channels, 1);
  assert.equal(bits, 16);
  const samples: number[] = [];
  for (let i = 44; i + 1 < buf.length; i += 2) samples.push(buf.readInt16LE(i) / 32767);
  return { rate, samples };
}

function seam(samples: number[]) {
  return Math.abs(samples[0] - samples[samples.length - 1]);
}

function maxJump(samples: number[]) {
  let jump = seam(samples);
  for (let i = 1; i < samples.length; i += 1) jump = Math.max(jump, Math.abs(samples[i] - samples[i - 1]));
  return jump;
}

function medianAbs(samples: number[]) {
  const values = samples.map((sample) => Math.abs(sample)).sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)] ?? 0;
}

describe("beds", () => {
  it("loops the theme without a click on the chord change", () => {
    const { samples } = readWav("theme");
    assert.ok(samples.length > 44100 * 7);
    assert.ok(seam(samples) < 0.004, `seam ${seam(samples)}`);
    assert.ok(maxJump(samples) < 0.05, `jump ${maxJump(samples)}`);
  });

  it("keeps the rain as drips instead of a static bed", () => {
    const { samples } = readWav("rain");
    const loud = samples.filter((sample) => Math.abs(sample) > 0.04).length / samples.length;
    assert.ok(seam(samples) < 0.004, `seam ${seam(samples)}`);
    assert.ok(medianAbs(samples) < 0.012, `median ${medianAbs(samples)}`);
    assert.ok(loud < 0.2, `loud fraction ${loud}`);
    let peak = 0;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    assert.ok(peak > 0.05);
  });
});
