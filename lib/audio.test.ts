import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import beds from "../qa/media/bed-delivery.json";
import voices from "../qa/media/voice-provenance.json";
import lines from "../qa/media/voice-lines.json";
import reactionCycle from "../qa/media/voice-reactions.json";
import thresholdCycle from "../qa/media/threshold-art-voice.json";
import neighborhoodCycle from "../qa/media/neighborhood-art-voice.json";
import courierCycle from "../qa/media/courier-art-voice.json";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText } from "./engine";
import type { GameState } from "./types";
import type { ReplaySpec } from "./story-replay";
import { SCENES } from "./story";
import { visibleDialogue } from "./memory-media";
import directed from "../qa/media/audio-provenance.json";
import { sceneSoundPlan } from "./sound";
import titleMusic from "../qa/media/title-music.json";
import { TITLE_MUSIC } from "./title-music";

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

describe("lossless background delivery", () => {
  it("ships compressed beds with unchanged source PCM and checked gzip transport", () => {
    assert.equal(beds.beds.length, 15);
    for (const bed of beds.beds) {
      const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url));
      const master = read(bed.source), delivery = read(bed.delivery), transport = read(bed.transport);
      const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
      assert.equal(sha(master), bed.sourceSha256, bed.name);
      assert.equal(sha(delivery), bed.sha256, bed.name);
      assert.equal(sha(transport), bed.transportSha256, bed.name);
      assert.deepEqual(gunzipSync(transport), delivery);
      assert.equal(delivery.toString("ascii", 0, 4), "fLaC");
      assert.equal(sha(master.subarray(44)), bed.pcmSha256);
      assert.equal(createHash("md5").update(master.subarray(44)).digest("hex"), delivery.subarray(26, 42).toString("hex"));
      const info = delivery.readBigUInt64BE(18);
      assert.equal(Number(info >> 44n), bed.sampleRate);
      assert.equal(Number((info >> 41n) & 7n) + 1, bed.channels);
      assert.equal(Number((info >> 36n) & 31n) + 1, 16);
      assert.equal(Number(info & ((1n << 36n) - 1n)) * bed.channels * 2, bed.pcmBytes);
      assert.equal(transport.length, bed.transportBytes);
      assert.ok(transport.length < master.length);
    }
  });
});

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
  it("retains the supplied title master and ships its separate bounded loop delivery", () => {
    for (const record of [titleMusic.source, titleMusic.delivery]) {
      const bytes = readFileSync(new URL(`../${record.path}`, import.meta.url));
      assert.equal(bytes.length, record.bytes);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256);
    }
    assert.equal(titleMusic.delivery.path, `public/audio/${TITLE_MUSIC.name}.${TITLE_MUSIC.extension}`);
    assert.equal(titleMusic.delivery.loopStartSeconds, TITLE_MUSIC.loopStartSeconds);
    assert.ok(titleMusic.delivery.bytes < 3_145_728);
    assert.ok(titleMusic.delivery.decodedDurationSeconds > 60 && titleMusic.delivery.decodedDurationSeconds < 65);
    assert.equal(titleMusic.delivery.channels, 2);
    assert.ok(titleMusic.delivery.peak > .1 && titleMusic.delivery.peak < .3);
    assert.ok(titleMusic.delivery.rms > .02 && titleMusic.delivery.rms < .08);
    assert.ok(titleMusic.delivery.loopSeamJump.every(jump => jump < .004));
    assert.notEqual(titleMusic.source.sha256, titleMusic.delivery.sha256);
  });
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
    assert.equal(hashes.size, 11);
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
    // Use actual authored routes for conditional dialogue, rather than inventing flags.
    const reachable = new Map<string, GameState>();
    for (const file of readdirSync(new URL("../qa/routes/", import.meta.url)).filter(file => file.endsWith(".json"))) {
      const spec = JSON.parse(readFileSync(new URL(`../qa/routes/${file}`, import.meta.url), "utf8")) as ReplaySpec;
      let state = createCharacter(spec.character);
      const record = () => {
        const scene = getScene(state.sceneId), line = visibleDialogue(scene.id, scene.speaker, sceneText(scene, state));
        if (line && !reachable.has(line.id)) reachable.set(line.id, state);
      };
      record();
      for (const step of spec.steps) {
        const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled);
        assert.ok(choice, `${file}/${step.choiceId}`);
        state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
        record();
      }
    }
    for (const line of lines) {
      const state = reachable.get(line.id);
      assert.ok(state, `No authored reachable example: ${line.id}`);
      const scene = SCENES[line.scene]; const text = sceneText(scene, state);
      assert.equal(scene.speaker, line.sceneSpeaker ?? line.speaker); assert.ok(text.includes(line.text), line.id);
      if (line.attribution) { assert.ok(text.includes(line.attribution), line.id); assert.ok(line.attribution.includes(line.speaker), line.id); }
      if (scene.speaker !== line.speaker) assert.ok(line.attribution, line.id);
      assert.equal(visibleDialogue(scene.id, scene.speaker, text)?.id, line.id);
      assert.equal(visibleDialogue(scene.id, scene.speaker, text.slice(0, text.indexOf(line.text))), undefined, line.id);
      assert.equal(visibleDialogue(scene.id, line.speaker === "Quill" ? "Mara" : "Quill", text), undefined);
      const record = voices.lines.find((entry) => entry.id === line.id)!;
      assert.equal(record.text, line.text);
      assert.equal(record.voice, line.voice); assert.equal(record.speaker, line.speaker);
      assert.equal(record.scene, line.scene); assert.equal(record.speed, line.speed);
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
  it("preserves the previous voice deliveries during the reaction expansion", () => {
    for (const [id, expected] of Object.entries(reactionCycle.preservedDeliverySha256)) {
      const bytes = readFileSync(new URL(`../public/audio/${id}.wav`, import.meta.url));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, id);
    }
  });
  it("preserves all preceding voice deliveries while adding Asa's stock cast voice", () => {
    for (const [id, expected] of Object.entries(courierCycle.preservedDeliverySha256)) {
      assert.equal(createHash("sha256").update(readFileSync(new URL(`../public/audio/${id}.wav`, import.meta.url))).digest("hex"), expected, id);
    }
    for (const line of courierCycle.voiceAdditions.filter(line => line.speaker === "Asa")) {
      assert.equal(line.voice, "af_alloy");
      assert.ok(!lines.some(existing => existing.speaker !== "Asa" && existing.voice === line.voice));
    }
  });
  it("preserves previous deliveries and established styles in neighborhood voices", () => {
    for (const [id, expected] of Object.entries(neighborhoodCycle.preservedDeliverySha256)) {
      assert.equal(createHash("sha256").update(readFileSync(new URL(`../public/audio/${id}.wav`, import.meta.url))).digest("hex"), expected, id);
    }
    for (const added of neighborhoodCycle.voiceAdditions) {
      const prior = lines.filter(line => line.speaker === added.speaker && line.id in neighborhoodCycle.preservedDeliverySha256);
      assert.ok(prior.length > 0);
      assert.ok(prior.every(line => line.voice === added.voice));
    }
  });
  it("preserves previous deliveries and cast identities in private-terms voices", () => {
    for (const [id, expected] of Object.entries(thresholdCycle.preservedDeliverySha256)) {
      assert.equal(createHash("sha256").update(readFileSync(new URL(`../public/audio/${id}.wav`, import.meta.url))).digest("hex"), expected, id);
    }
    for (const added of thresholdCycle.voiceAdditions) {
      const prior = lines.filter(line => line.speaker === added.speaker && line.id in thresholdCycle.preservedDeliverySha256);
      assert.ok(prior.length > 0);
      assert.ok(prior.every(line => line.voice === added.voice));
    }
  });
  it("keeps refusal and handover voices behind their exact visible quotations", () => {
    const base = createCharacter({ handle: "Branches", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
    for (const [flags, expected] of [[{}, "voice-kerr-handover-private"], [{ kerr_route_private: true, kerr_route_trace: true }, "voice-kerr-handover-breached"], [{ kerr_route_registered: true, kerr_route_trace: true }, "voice-kerr-handover-registered"]] as const) {
      const state = { ...base, sceneId: "act2_route_receipt", flags };
      const scene = SCENES[state.sceneId], text = sceneText(scene, state), before = JSON.stringify(state);
      assert.equal(visibleDialogue(scene.id, scene.speaker, text)?.id, expected);
      assert.equal(visibleDialogue(scene.id, scene.speaker, text.split("\n\n")[0]), undefined);
      assert.equal(JSON.stringify(state), before);
    }
    const scene = SCENES.act2_response_refusal;
    assert.equal(visibleDialogue(scene.id, scene.speaker, sceneText(scene, { ...base, flags: { response_clinic_refused: true } })), undefined);
    for (const line of lines) if ("segments" in line && line.segments) {
      assert.equal(line.segments.map(part => part.text).join(" "), line.text);
      for (const part of line.segments) { assert.ok(part.pauseAfter >= 0 && part.pauseAfter <= .8); assert.ok(part.speed >= .75 && part.speed <= 1.15); }
    }
  });
  it("voices Edda's attributed line without assigning it to the scene's primary portrait", () => {
    const state = createCharacter({ handle: "Attribution", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
    const scene = SCENES.act2_origin_spire, text = sceneText(scene, state), line = lines.find(line => line.id === "voice-edda-service-key")!;
    assert.equal(scene.speaker, "Ives"); assert.equal(line.speaker, "Edda");
    assert.equal(visibleDialogue(scene.id, scene.speaker, text)?.id, line.id);
    assert.equal(visibleDialogue(scene.id, scene.speaker, line.text), undefined);
    assert.equal(visibleDialogue(scene.id, "Edda", text), undefined);
    assert.equal(visibleDialogue(scene.id, scene.speaker, text.replace(line.attribution!, "Ives says.")), undefined);
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
