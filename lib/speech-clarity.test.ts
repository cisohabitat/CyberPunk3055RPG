import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { it } from "node:test";
import phase from "../qa/media/speech-clarity.json";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
import deliveries from "../qa/media/campaign-dialogue-provenance.json";
import { portraitArt, sceneIllustration } from "./art";
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

it("retakes only the reviewed orderly line and retains every preceding voice delivery", () => {
  assert.equal(phase.performances.length, 1);
  assert.equal(phase.performances[0].id, "voice-campaign-orderly-196a881f1c95");
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  assert.deepEqual(Object.keys(phase.preservedVoiceSha256).sort(), [...new Set(bindings.map(line => line.id))].sort());
  for (const [id, hash] of Object.entries(phase.preservedVoiceSha256)) {
    const replacement = phase.performances.find(line => line.id === id);
    if (replacement) {
      assert.equal(replacement.previousSha256, hash);
      assert.equal(sha(replacement.previousDeliveryCopy), hash);
      assert.equal(sha(replacement.path), replacement.sha256);
      assert.notEqual(replacement.sha256, hash);
    } else assert.equal(sha(`public/audio/${id}.${id.startsWith("voice-campaign-") ? "mp3" : "wav"}`), hash, id);
  }
});

it("keeps the retake's actual words, actor, transcription, source and portrait aligned", () => {
  for (const performance of phase.performances) {
    const binding = bindings.find(line => line.id === performance.id)!;
    const delivery = deliveries.lines.find(line => line.id === performance.id)!;
    assert.equal(delivery.sha256, performance.sha256);
    assert.equal(delivery.text, binding.text); assert.equal(delivery.speaker, binding.speaker);
    assert.equal(delivery.voice, "am_puck"); assert.equal(performance.voice, delivery.voice);
    assert.equal(performance.segments.map(part => part.text).join(" "), binding.text);
    assert.equal(performance.sourceSha256, delivery.sourceSha256);
    assert.equal(performance.transcription.sha256, performance.sha256);
    assert.deepEqual(words(performance.transcription.text), words(binding.text));
    assert.equal(portraitArt(binding.speaker), phase.art[0].portrait);
    assert.equal(binding.scene, phase.art[0].scene);
    assert.equal(sceneIllustration(binding.scene)?.src, phase.art[0].illustration);
  }
  assert.equal(phase.review.attendantConversation.exactNormalizedWords, true);
});
