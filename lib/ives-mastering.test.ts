import { reviewedDeliveryHash } from "../qa/production/delivery-history";
import consequence from "../qa/media/consequence-media.json";
import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import phase from "../qa/media/ives-mastering.json";
import mastering from "../qa/media/voice-mastering.json";
import levels from "../qa/media/voice-levels.json";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
import authoring from "../qa/media/campaign-dialogue-lines.json";
import provenance from "../qa/media/campaign-dialogue-provenance.json";
import legacy from "../qa/media/voice-provenance.json";
import { portraitArt, sceneIllustration } from "./art";
import { voiceLevel } from "./voice-level";
const sha = (file: string) => createHash("sha256").update(readFileSync(new URL(`../${file}`, import.meta.url))).digest("hex");
const words = (text: string) => text.toLowerCase().replace(/['’]/g, "").replace(/\bhellion\b/g, "helion").replace(/\bforty\b/g, "40").match(/[a-z0-9]+/g) ?? [];

it("masters every active delivery with measured headroom and retains separate user volume", () => {
  const ids = [...new Set(bindings.map(line => line.id))].sort();
  assert.equal(ids.length, 290);
  assert.deepEqual(Object.keys(levels).sort(), ids);
  assert.deepEqual(mastering.clips.map(clip => clip.id), ids);
  assert.equal(sha("qa/media/voice-levels.json"), mastering.runtimeMapSha256);
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), mastering.bindingSha256);
  for (const clip of mastering.clips) {
    assert.equal(sha(clip.path), clip.sha256);
    assert.equal(voiceLevel(clip.id), clip.gain);
    assert.ok(Math.abs(clip.playback.integratedLufs - mastering.targetLufs) <= .25, clip.id);
    assert.ok(clip.playback.truePeakDbtp <= mastering.truePeakCeilingDbtp, clip.id);
    assert.ok(Math.abs(20 * Math.log10(clip.gain) - clip.trimDb) < .001);
    assert.ok(Math.abs(clip.source.truePeakDbtp + clip.trimDb - clip.playback.truePeakDbtp) <= .02);
  }
  assert.equal(voiceLevel("unreviewed-future-id"), 1);
});

it("replaces exactly thirteen Ives performances while preserving all quotation keys, actors and words", () => {
  assert.equal(phase.performances.length, 13);
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  assert.deepEqual(bindings, phase.precedingBindings.map(line => ({ ...line, id: phase.legacyReplacements[line.id as keyof typeof phase.legacyReplacements] ?? line.id })));
  for (const entry of phase.performances) {
    const line = authoring.find(line => line.id === entry.id)!;
    const delivery = provenance.lines.find(line => line.id === entry.id)!;
    assert.equal(line.speaker, "Ives"); assert.equal(delivery.voice, "am_eric");
    assert.equal(line.text, entry.text); assert.equal(delivery.text, entry.text);
    assert.equal(line.segments!.map(part => part.text).join(" "), entry.text);
    assert.equal(sha(delivery.path), entry.sha256);
    assert.notEqual(entry.sha256, entry.previousSha256);
    assert.equal(entry.transcription.sha256, entry.sha256);
    assert.deepEqual(words(entry.transcription.text), words(entry.text));
  }
  const revised = new Set(phase.performances.map(entry => entry.previousId));
  for (const [id, hash] of Object.entries(phase.precedingVoiceSha256)) if (!revised.has(id)) {
    const later = consequence.performances.find(entry => entry.id === id);
    if (later) assert.equal(later.previousSha256, hash);
    else assert.equal(reviewedDeliveryHash(`public/audio/${id}.${id.startsWith("voice-campaign-") ? "mp3" : "wav"}`, hash), hash);
  }
  for (const clip of legacy.lines) assert.equal(sha(clip.path), clip.sha256);
});

it("keeps Ives expressions and closer hearing art within their explicit actor and scene limits", () => {
  for (const portrait of phase.portraits) for (const scene of portrait.scenes) {
    assert.equal(portraitArt("Ives", scene), portrait.asset);
    assert.equal(portraitArt("Ives", scene, { archive_key_authenticated: true, testimony_published: true }), portrait.asset);
    assert.notEqual(portraitArt("Edda", scene), portrait.asset);
    assert.notEqual(portraitArt("Sera", scene), portrait.asset);
  }
  assert.equal(portraitArt("Ives", "ending_listed"), "/art/ives.jpg");
  assert.equal(portraitArt("Ives", "act2_archive_custody"), "/art/ives.jpg");
  assert.equal(sceneIllustration("act3_testimony_hearing")?.src, "/art/ives-hearing.jpg");
  for (const scene of ["act3_testimony_review", "act3_testimony_correction", "act3_testimony_record"]) assert.equal(sceneIllustration(scene)?.src, "/art/sera-hearing.jpg");
});
