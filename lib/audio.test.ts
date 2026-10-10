import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import voices from "../qa/media/voice-provenance.json";
import lines from "../qa/media/voice-lines.json";
import { createCharacter, sceneText } from "./engine";
import { SCENES } from "./story";
import { visibleDialogue } from "./memory-media";
import directed from "../qa/media/audio-provenance.json";
import { sceneSoundPlan } from "./sound";

function readWav(name: string) {
  const buf = readFileSync(fileURLToPath(new URL(`../public/audio/${name}.wav`, import.meta.url)));
  assert.equal(buf.toString("ascii", 0, 4), "RIFF");
  assert.equal(buf.toString("ascii", 8, 12), "WAVE");
  const rate = buf.readUInt32LE(24);
  const channels = buf.readUInt16LE(22);
  const bits = buf.readUInt16LE(34);
  assert.ok(channels === 1 || channels === 2);
  assert.equal(bits, 16);
  const tracks: number[][] = Array.from({ length: channels }, () => []);
  for (let i = 44; i + channels * 2 <= buf.length; i += channels * 2) {
    for (let c = 0; c < channels; c++) tracks[c].push(buf.readInt16LE(i + c * 2) / 32767);
  }
  return { rate, channels, tracks, samples: tracks[0] };
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
  it("ships longer district and directed beds with measured seams, headroom and delivery hashes", () => {
    const hashes = new Set<string>();
    for (const record of [...directed.scores.filter(score => score.durationSeconds === 64), ...directed.soundscapes]) {
      const bytes = readFileSync(new URL(`../${record.path}`, import.meta.url));
      const name = record.path.split("/").at(-1)!.replace(".wav", "");
      assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256);
      assert.equal(bytes.length, record.bytes); assert.ok(bytes.length < 3_145_728);
      const wav = readWav(name); assert.equal(wav.samples.length / wav.rate, 64); assert.equal(wav.channels, 1); assert.equal(wav.rate, 22050);
      let peak = 0; for (const sample of wav.samples) peak = Math.max(peak, Math.abs(sample));
      assert.ok(peak > 0.02 && peak < 0.22, `${name}: ${peak}`);
      assert.ok(seam(wav.samples) < 0.002, `${name}: seam ${seam(wav.samples)}`);
      // A long texture must not simply repeat the first half.
      const halfway = wav.samples.length / 2; let difference = 0;
      for (let i = 0; i < halfway; i += 101) difference += Math.abs(wav.samples[i] - wav.samples[i + halfway]);
      assert.ok(difference > 1, name); hashes.add(record.sha256);
    }
    assert.equal(hashes.size, 8);
  });
  it("keeps bench interaction sounds short, distinct and below score-sting peaks", () => {
    const hashes = new Set<string>();
    for (const name of ["memory-place", "memory-reset", "memory-mismatch", "memory-correction", "memory-align"]) {
      const { samples, rate } = readWav(name);
      let peak = 0; for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
      assert.ok(peak > 0.02 && peak < 0.13, `${name}: ${peak}`);
      assert.ok(samples.length / rate <= 0.45); assert.equal(samples[0], 0); assert.equal(samples.at(-1), 0);
      hashes.add(createHash("sha256").update(readFileSync(new URL(`../public/audio/${name}.wav`, import.meta.url))).digest("hex"));
    }
    assert.equal(hashes.size, 5);
  });
  it("ships fixed synthetic quotes with matching text, bounded headroom and disclosure", () => {
    const base = createCharacter({ handle: "VoiceReview", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
    for (const line of lines) {
      const state = { ...base, sceneId: line.scene, flags: { memory_slot_1_signature: true, memory_slot_2_order: true, memory_slot_3_roster: true } };
      const scene = SCENES[line.scene]; const text = sceneText(scene, state);
      assert.equal(scene.speaker, line.speaker); assert.ok(text.includes(line.text), line.id);
      assert.equal(visibleDialogue(scene.id, scene.speaker, text)?.id, line.id);
      assert.equal(visibleDialogue(scene.id, line.speaker === "Quill" ? "Mara" : "Quill", text), undefined);
      const record = voices.lines.find((entry) => entry.id === line.id)!;
      assert.equal(record.text, line.text);
      const bytes = readFileSync(new URL(`../${record.path}`, import.meta.url));
      assert.equal(bytes.length, record.bytes); assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256);
      const wav = readWav(line.id); let peak = 0;
      for (const sample of wav.samples) peak = Math.max(peak, Math.abs(sample));
      assert.equal(wav.channels, 1); assert.equal(wav.rate, 24000); assert.ok(peak >= 0.7 && peak < 0.73);
      assert.ok(wav.samples.length / wav.rate > 2 && wav.samples.length / wav.rate < 20);
      assert.ok(wav.samples.slice(0, 1800).every((sample) => sample === 0));
      assert.ok(wav.samples.slice(-1800).every((sample) => sample === 0));
    }
    const wrong = { ...base, flags: {} };
    assert.equal(visibleDialogue("memory_sequence_result", "Mara", sceneText(SCENES.memory_sequence_result, wrong)), undefined);
    const publication = sceneText(SCENES.memory_publication, base);
    assert.equal(visibleDialogue("memory_publication", "Sister Lumen", publication.split("\n\n")[0]), undefined);
  });
  it("renders stereo chapter arrangements with headroom and continuous seams on both channels", () => {
    for (const name of ["theme", "theme-chapel", "theme-week", "theme-ward"]) {
      const score = readWav(name);
      assert.equal(score.channels, 2); assert.equal(score.rate, 22050);
      assert.equal(score.samples.length / score.rate, 32);
      let squared = 0, peak = 0, stereoDifference = 0;
      for (let i = 0; i < score.samples.length; i++) {
        const l = score.tracks[0][i], r = score.tracks[1][i];
        squared += l * l + r * r; peak = Math.max(peak, Math.abs(l), Math.abs(r));
        stereoDifference += Math.abs(l - r);
      }
      assert.ok(peak <= 0.43 && peak > 0.1, `${name}: peak ${peak}`);
      const rms = Math.sqrt(squared / (score.samples.length * 2));
      assert.ok(rms > 0.015 && rms < 0.16, `${name}: RMS ${rms}`);
      assert.ok(stereoDifference / score.samples.length > 0.005, `${name}: stereo separation`);
      for (const channel of score.tracks) {
        assert.ok(seam(channel) < 0.004, `${name}: seam ${seam(channel)}`);
        assert.ok(maxJump(channel) < 0.05, `${name}: jump ${maxJump(channel)}`);
      }
    }
  });
  it("gives the chapel and wards distinct, seamless extended scores", () => {
    const chapel = readWav("theme-chapel"); const ward = readWav("theme-ward"); const week = readWav("theme-week");
    for (const score of [chapel, ward, week]) {
      assert.ok(score.samples.length / score.rate >= 23);
      assert.ok(seam(score.samples) < 0.004);
      assert.ok(maxJump(score.samples) < 0.05);
    }
    assert.notDeepEqual(chapel.samples.slice(0, 2000), ward.samples.slice(0, 2000));
    assert.notDeepEqual(week.samples.slice(0, 2000), ward.samples.slice(0, 2000));
    assert.notDeepEqual(week.samples.slice(0, 2000), chapel.samples.slice(0, 2000));
  });
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

  it("keeps the week and ward stings as short tones", () => {
    for (const name of ["sting-week", "sting-ward", "sting-memory"]) {
      const { samples } = readWav(name);
      assert.ok(samples.length < 44100 * 2, name);
      assert.ok(Math.abs(samples[0]) < 0.02, name);
      assert.ok(Math.abs(samples[samples.length - 1]) < 0.02, name);
      let peak = 0;
      for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
      assert.ok(peak > 0.05, `${name} peak ${peak}`);
      const loud = samples.filter((sample) => Math.abs(sample) > 0.2).length / samples.length;
      assert.ok(loud < 0.35, `${name} loud ${loud}`);
    }
  });
});
