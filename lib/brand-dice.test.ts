import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { BRAND_MARK } from "./brand-mark";
import { diceLandingCue, DICE_CUE_MIX } from "./dice-cues";
import { commitChoice, createCharacter, getScene, presentChoices } from "./engine";
import media from "../qa/media/dice-foley.json";
import { renderDiceCues } from "../scripts/dice-foley.mjs";
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

it("keeps the favicon and small shared emblem on the approved halo/shard geometry", () => {
  const icon = readFileSync("app/icon.svg", "utf8");
  for (const path of Object.values(BRAND_MARK)) assert.ok(icon.includes(`d="${path}"`));
  assert.match(icon, /viewBox="0 0 64 64"/);
  assert.ok(!icon.includes("<circle"));
});

it("uses actual resolved critical rules when choosing landing accents", () => {
  const state = { ...createCharacter({ handle: "Cue review", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } }), sceneId: "lumen_deal", strain: 3 };
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === "fake-pact")!;
  for (let face = 1; face <= 10; face++) {
    const result = commitChoice(state, choice, { roll: face }).check!;
    assert.equal(diceLandingCue(result), result.crit === "success" ? "dice-land-ten" : result.crit === "fail" ? "dice-land-one" : result.success ? "dice-land-success" : "dice-land-miss");
  }
  assert.equal(diceLandingCue({ success: false, crit: null }), "dice-land-miss");
  assert.equal(diceLandingCue({ success: true, crit: null }), "dice-land-success");
});

it("ships reproducible quiet dice cues with exact provenance and click-free endpoints", () => {
  assert.deepEqual(media.mix, DICE_CUE_MIX);
  const rendered = renderDiceCues();
  assert.deepEqual(media.clips.map(c => c.id).sort(), Object.keys(rendered).sort());
  for (const [path, hash] of Object.entries(media.sourceSha256)) assert.equal(sha(path), hash);
  for (const clip of media.clips) {
    const bytes = readFileSync(clip.path), samples = rendered[clip.id as keyof typeof rendered];
    assert.equal(sha(clip.path), clip.sha256); assert.equal(bytes.length, clip.bytes);
    assert.equal(bytes.readUInt32LE(24), 22050); assert.equal(bytes.readUInt16LE(22), 1);
    assert.equal(bytes.readInt16LE(44), 0); assert.equal(bytes.readInt16LE(bytes.length - 2), 0);
    assert.ok(clip.durationSeconds <= .64 && clip.peak < .2 && clip.rms > .001);
    assert.equal(bytes.length, 44 + samples.length * 2);
    for (let i = 0; i < samples.length; i++) assert.equal(bytes.readInt16LE(44 + i * 2), Math.round(samples[i] * 32767) || 0);
  }
});
