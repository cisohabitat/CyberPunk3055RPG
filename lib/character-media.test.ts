import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import ives from "../qa/media/ives-mastering.json";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
import phase from "../qa/media/character-media.json";
import staging from "../qa/media/dialogue-staging.json";
import decisions from "../qa/media/scene-art.json";
import authoring from "../qa/media/campaign-dialogue-lines.json";
import provenance from "../qa/media/campaign-dialogue-provenance.json";
import { DialoguePlayback } from "./dialogue-playback";
import { portraitArt, sceneIllustration } from "./art";
const hash = (file: string) => createHash("sha256").update(readFileSync(new URL(`../${file}`, import.meta.url))).digest("hex");
const transcriptWords = (text: string) => text.toLowerCase().replace(/['’]/g, "")
  .replace(/counter\s+signature/g, "countersignature").replace(/\bforty\b/g, "40").match(/[a-z0-9]+/g) ?? [];

it("locks exact actors, words, loudness and unchanged campaign bindings for the sixteen reviewed deliveries", () => {
  assert.equal(phase.performances.length, 16);
  assert.equal(ives.precedingBindingSha256, phase.bindingSha256);
  assert.deepEqual(bindings, ives.precedingBindings.map(line => ({ ...line, id: ives.legacyReplacements[line.id as keyof typeof ives.legacyReplacements] ?? line.id })));
  const changed = new Set(phase.performances.map(entry => entry.id));
  for (const entry of phase.performances) {
    const line = authoring.find(line => line.id === entry.id)!;
    const delivery = provenance.lines.find(line => line.id === entry.id)!;
    assert.equal(line.text, entry.text); assert.equal(delivery.text, entry.text);
    assert.equal(line.speaker, entry.speaker); assert.equal(delivery.voice, entry.voice);
    assert.equal(line.segments!.map(part => part.text).join(" "), entry.text);
    assert.equal(hash(delivery.path), entry.sha256);
    assert.notEqual(delivery.sha256, entry.previousSha256);
    assert.ok(Math.abs(delivery.integratedLufs! + 20) <= .6);
    assert.ok(delivery.truePeakDbtp! <= -1.5);
    assert.equal(entry.transcription.sha256, delivery.sha256);
    assert.deepEqual(transcriptWords(entry.transcription.text), transcriptWords(entry.text));
  }
  for (const [id, sha] of Object.entries(phase.precedingVoiceSha256)) if (!changed.has(id)) {
    const revision = ives.performances.find(entry => entry.previousId === id);
    if (revision) assert.equal(revision.previousSha256, sha);
    else assert.equal(hash(`public/audio/${id}.${id.startsWith("voice-campaign-") ? "mp3" : "wav"}`), sha);
  }
});

it("selects expressions for the actual actor and earns Edda's assignment without erasing the inquiry", () => {
  assert.deepEqual(decisions.expressionPortraits, [...staging.portraits, ...phase.portraits, ...ives.portraits]);
  for (const entry of phase.portraits) for (const scene of entry.scenes) {
    assert.equal(portraitArt(entry.speaker, scene), entry.asset);
    assert.notEqual(portraitArt("Dispatcher", scene), entry.asset);
  }
  assert.equal(portraitArt("Kerr", "act2_route_receipt", { kerr_route_private: true, kerr_route_trace: true }), "/art/kerr-closed.jpg");
  assert.equal(portraitArt("Quill", "act3_quill_introduction", { quill_refused: true, quill_repaid_late: true }), "/art/quill-waiting.jpg");
  assert.equal(portraitArt("Edda", "act3_edda_reply", { edda_shift_pending: true }), "/art/edda.jpg");
  assert.equal(portraitArt("Edda", "act3_edda_reply", { edda_representation: true }), "/art/edda.jpg");
  assert.equal(portraitArt("Edda", "act3_edda_reply", { edda_shift_paid: true }), "/art/edda-assignment.jpg");
  assert.equal(portraitArt("Edda", "act3_edda_methods", { edda_shift_paid: true }), "/art/edda.jpg");
  assert.notEqual(portraitArt("Ives", "act3_edda_reply", { edda_shift_paid: true }), "/art/edda-assignment.jpg");
  assert.equal(sceneIllustration("act2_freight_brief")?.src, "/art/asa-dispatch.jpg");
  assert.notEqual(sceneIllustration("act2_freight_result")?.src, "/art/asa-dispatch.jpg");
});

it("spaces natural dialogue by actor while allowing immediate manual selection and unavailable recovery", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls: { id: string; end: (outcome: "ended" | "unavailable") => void }[] = [];
  const playback = new DialoguePlayback(() => {}, (id, report, end) => {
    calls.push({ id, end: end! }); report("playing"); return () => {};
  });
  const a = { key: "a", id: "a", speaker: "Mara" }, b = { key: "b", id: "b", speaker: "Mara" }, c = { key: "c", id: "c", speaker: "Lumen" };
  playback.update([a, b, c], true, true); t.mock.timers.tick(0); assert.equal(calls.length, 1);
  calls[0].end("ended"); t.mock.timers.tick(119); assert.equal(calls.length, 1);
  t.mock.timers.tick(1); assert.equal(calls[1].id, "b");
  calls[1].end("ended"); t.mock.timers.tick(219); assert.equal(calls.length, 2);
  t.mock.timers.tick(1); assert.equal(calls[2].id, "c");
  playback.listen(a.key); assert.equal(calls[3].id, "a");
  playback.playAll(); t.mock.timers.tick(0); assert.equal(calls[4].id, "a");
  calls[4].end("unavailable"); t.mock.timers.tick(0); assert.equal(calls[5].id, "b");
  playback.dispose();
});

it("Stop, disabling and departure cancel an inter-speaker pause without replaying the queued actor", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  for (const action of ["stop", "disable", "dispose"] as const) {
    const calls: { end: () => void }[] = [];
    const playback = new DialoguePlayback(() => {}, (_id, report, end) => {
      calls.push({ end: () => end!("ended") }); report("playing"); return () => {};
    });
    const lines = [{ key: "a", id: "a", speaker: "Sera" }, { key: "b", id: "b", speaker: "Ren" }];
    playback.update(lines, true, true); t.mock.timers.tick(0); calls[0].end(); t.mock.timers.tick(100);
    if (action === "disable") { playback.update(lines, false, true); playback.update(lines, true, true); }
    else playback[action]();
    t.mock.timers.tick(1000); assert.equal(calls.length, 1, action); playback.dispose();
  }
});

it("a changed visible quotation cancels its pending speaker before it can become audible", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls: { id: string; end: () => void }[] = [];
  const playback = new DialoguePlayback(() => {}, (id, report, end) => {
    calls.push({ id, end: () => end!("ended") }); report("playing"); return () => {};
  });
  const a = { key: "a", id: "a", speaker: "Mara" }, b = { key: "b", id: "b", speaker: "Lumen" };
  playback.update([a, b], true, true); t.mock.timers.tick(0); calls[0].end(); t.mock.timers.tick(100);
  playback.update([a], true, true); t.mock.timers.tick(1000);
  assert.deepEqual(calls.map(call => call.id), ["a"]); playback.dispose();
});
