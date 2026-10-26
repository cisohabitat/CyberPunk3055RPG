import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { commitChoice, getScene, presentChoices, sceneText } from "./engine";
import { districtActorKnowledge, districtRemaining, districtStatus, kerrKnowsDistrictBreach } from "./district-response";
import { importRun, exportRun } from "./vault";
import { sceneIllustration, portraitArt } from "./art";
import { sceneSoundPlan } from "./sound";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { visibleCampaignDialogue, quotedSpeech, spokenDialogueRange } from "./campaign-dialogue";
import { voiceLevel } from "./voice-level";
import phase from "../qa/media/district-response.json";
import recordings from "../qa/media/district-dialogue-provenance.json";
import authoring from "../qa/media/district-dialogue-lines.json";
import bindings from "../qa/media/district-dialogue-bindings.json";
import transcripts from "../qa/media/district-dialogue-transcripts.json";
import { DISTRICT_QUOTES } from "./district-dialogue";
import type { GameState } from "./types";
const hash = (name: string) => createHash("sha256").update(readFileSync(name)).digest("hex");
const base = routeCheckpoint("district-private-rest", "act2_middle", "open-district-response");
function take(s: GameState, id: string) {
  const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled); assert.ok(c, `${s.sceneId}/${id}`);
  const next = commitChoice(s, c).state; assert.deepEqual(importRun(exportRun(next)), next); return next;
}
function start(publicReview = true, extra: GameState["flags"] = {}) {
  let s = { ...base, sceneId: "act2_middle", flags: { ...base.flags, ...extra } };
  s = take(s, "open-district-response"); s = take(s, "district-edda-receipt"); return take(s, publicReview ? "district-public-review" : "district-private-query");
}
function introduce(s: GameState, tell = false) {
  s = take(s, "district-speak-kerr"); s = take(s, tell ? "district-tell-kerr" : "district-withhold-kerr");
  if (kerrKnowsDistrictBreach(s)) s = take(s, "district-kerr-acknowledge");
  return take(s, "district-kerr-introduce");
}
it("requires acquired source custody, opens without spending and keeps legacy state extensions intact", () => {
  const empty = { ...base, flags: { ...base.flags, archive_custody: false } };
  assert.ok(!presentChoices(empty, getScene(empty.sceneId)).some(c => c.id === "open-district-response"));
  const opened = take(base, "open-district-response");
  assert.deepEqual({ ...opened, sceneId: base.sceneId, log: base.log }, base);
  assert.equal(districtRemaining(opened), 0);
});
it("discloses receipt scope explicitly, never grants corroboration or witness permission, and retains actor memory when revising a packet", () => {
  let s = take(base, "open-district-response"); s = take(s, "district-edda-corroboration");
  s = take(s, "district-revise-packet"); s = take(s, "district-edda-receipt");
  assert.match(districtActorKnowledge(s)[0].told, /corroborating ledger/);
  assert.match(sceneText(getScene(s.sceneId), s), /This packet has the cancellation receipt/);
  for (const f of ["order_verified", "archive_key_authenticated", "nia_public_consent", "edda_public_consent"]) assert.equal(s.flags[f], base.flags[f]);
  assert.deepEqual(s.journal, base.journal);
});
it("changes actual depot staging once without granting a review finding, wage or restored access", () => {
  const s = start(); assert.equal(districtRemaining(s), 2);
  assert.equal(s.factions.helion, Math.min(5, base.factions.helion + 1)); assert.equal(s.creds, base.creds);
  assert.equal(sceneIllustration(s.sceneId, s.flags)!.src, "/art/depot-review.jpg");
  const privateRun = start(false); assert.equal(sceneIllustration(privateRun.sceneId, privateRun.flags)!.src, "/art/canal-dispatch.jpg");
  assert.equal(sceneSoundPlan(s, getScene(s.sceneId).location).mood, "pressure");
  assert.throws(() => take(s, "district-public-review"));
});
it("spends no allowance on reading, conversation, pausing or reload, and cannot restart the window", () => {
  let s = start(); s = take(s, "district-read-notice"); assert.equal(districtRemaining(s), 2);
  assert.equal(sceneSoundPlan(s, getScene(s.sceneId).location).mood, "quiet");
  s = take(s, "district-return-notice"); s = introduce(s); s = take(s, "district-pause"); s = take(s, "open-district-response");
  assert.equal(districtRemaining(s), 2); assert.throws(() => take(s, "district-private-query"));
});
it("keeps a private docket unknown to Kerr until disclosure or an observed handover, without forgetting disclosed facts", () => {
  let s = start(true, { kerr_route_private: true, kerr_route_trace: true, kerr_route_delivered: false, kerr_route_visit: false });
  s = take(s, "district-speak-kerr"); s = take(s, "district-withhold-kerr");
  assert.equal(kerrKnowsDistrictBreach(s), false); assert.ok(presentChoices(s, getScene(s.sceneId)).some(c => c.id === "district-kerr-introduce"));
  assert.notEqual(portraitArt("Kerr", s.sceneId, s.flags), "/art/kerr-closed.jpg");
  s = take(s, "district-leave-kerr"); s = take(s, "district-speak-kerr"); s = take(s, "district-tell-kerr");
  assert.equal(kerrKnowsDistrictBreach(s), true); assert.ok(!presentChoices(s, getScene(s.sceneId)).some(c => c.id === "district-kerr-introduce"));
  assert.equal(portraitArt("Kerr", s.sceneId, s.flags), "/art/kerr-closed.jpg");
  s = take(s, "district-leave-kerr"); s = take(s, "district-speak-kerr"); s = take(s, "district-withhold-kerr");
  assert.equal(kerrKnowsDistrictBreach(s), true); assert.match(districtActorKnowledge(s)[1].told, /disclosed the broken/);
});
it("acknowledgement permits only this introduction; denial closes it and preserves the original breach and contact limits", () => {
  let s = start(true, { kerr_route_private: true, kerr_route_trace: true, kerr_route_delivered: true });
  s = take(s, "district-speak-kerr"); s = take(s, "district-withhold-kerr"); const before = s;
  const acknowledged = take(s, "district-kerr-acknowledge");
  assert.equal(acknowledged.flags.kerr_contact_open, before.flags.kerr_contact_open); assert.equal(acknowledged.flags.kerr_route_trace, true);
  assert.ok(presentChoices(acknowledged, getScene(acknowledged.sceneId)).some(c => c.id === "district-kerr-introduce"));
  const denied = take(s, "district-kerr-deny"); assert.ok(!presentChoices(denied, getScene(denied.sceneId)).some(c => c.id === "district-kerr-introduce"));
  assert.equal(denied.flags.kerr_route_private, true); assert.equal(denied.flags.kerr_route_trace, true);
});
it("pays once after both actions and preserves a half-completed registered task across pause and reload", () => {
  let s = introduce(start()); const creds = s.creds;
  s = take(s, "district-register-work"); assert.equal(districtRemaining(s), 1); assert.equal(s.creds, creds);
  s = take(s, "district-leave-work"); s = take(s, "district-pause"); s = take(s, "open-district-response"); s = take(s, "district-resume-work");
  s = take(s, "district-finish-work"); assert.equal(s.creds, creds + 20); assert.equal(districtRemaining(s), 0);
  s = take(s, "district-return-result"); assert.ok(!presentChoices(s, getScene(s.sceneId)).some(c => c.id === "district-register-work"));
  assert.throws(() => take(s, "district-finish-work"));
});
it("allows zero-fund private rest with actual recovery and no public filing, wage, treatment or source", () => {
  let s = introduce({ ...start(false), creds: 0, strain: 3 }); const journal = s.journal;
  s = take(s, "district-book-rest"); assert.equal(s.strain, 3); s = take(s, "district-finish-rest");
  assert.equal(s.strain, 2); assert.equal(s.creds, 0); assert.equal(districtRemaining(s), 0); assert.equal(s.flags.district_public_review, undefined);
  assert.equal(s.journal.length, journal.length + 1); assert.equal(s.flags.archive_key_authenticated, base.flags.archive_key_authenticated);
});
it("uses the smaller conflicting allowance, blocks effort at the strain cap and keeps an honest free exit", () => {
  let s = introduce({ ...start(), strain: 5, creds: 0 });
  assert.equal(presentChoices(s, getScene(s.sceneId)).find(c => c.id === "district-register-work")!.enabled, false);
  assert.equal(presentChoices(s, getScene(s.sceneId)).find(c => c.id === "district-carry-correction")!.enabled, false);
  s = { ...s, flags: { ...s.flags, district_window_0: true } }; assert.equal(districtRemaining(s), 0);
  assert.ok(!presentChoices(s, getScene(s.sceneId)).some(c => c.id === "district-register-work")); s = take(s, "district-close"); assert.equal(s.sceneId, "act2_middle");
  assert.equal(s.flags.district_work_paid, undefined);
});
it("makes a competing delivery consume one action and closes unfinished opportunities at the week boundary", () => {
  let s = introduce(start()); s = take(s, "district-carry-correction"); assert.equal(districtRemaining(s), 1);
  s = take(s, "district-return-result"); assert.ok(!presentChoices(s, getScene(s.sceneId)).some(c => c.id === "district-register-work"));
  assert.match(districtStatus({ ...s, flags: { ...s.flags, act2_done: true } }), /unfinished/);
  assert.equal(districtRemaining({ ...s, flags: { ...s.flags, act2_done: true } }), 0);
});
it("retains every earlier catalog byte and validates the entire additive voice/art cohort", () => {
  for (const [name, sha] of Object.entries(phase.precedingFiles)) assert.equal(hash(name), sha, name);
  assert.equal(bindings.length, 12); assert.equal(recordings.lines.length, 12); assert.equal(authoring.length, 12);
  assert.equal(transcripts.lines.length, 12);
  assert.deepEqual(bindings.map(b => b.id).sort(), phase.voiceIds);
  for (const b of bindings) {
    const q = Object.values(DISTRICT_QUOTES).find(q => q.text === b.text)!; assert.equal(q.speaker, b.speaker);
    const line = authoring.find(l => l.id === b.id)!; const delivery = recordings.lines.find(l => l.id === b.id)!;
    assert.equal(line.text, b.text); assert.equal(delivery.text, b.text); assert.equal(delivery.voice, line.voice);
    const transcript = transcripts.lines.find(t => t.id === b.id)!;
    const words = (t: string) => t.toLowerCase().replace(/\b20\b/g, "twenty").replace(/['’]/g, "").match(/[a-z0-9]+/g);
    assert.equal(transcript.sha256, delivery.sha256); assert.equal(transcript.authoredText, b.text);
    assert.deepEqual(words(transcript.transcription), words(b.text));
    if ("segments" in line) assert.equal(line.segments!.map(p => p.text).join(" "), line.text);
    assert.equal(hash(delivery.path), delivery.sha256); assert.ok(delivery.peak < .95 && delivery.rms > .005);
    assert.ok(Math.abs(delivery.integratedLufs + 20) <= .6); assert.ok(delivery.truePeakDbtp <= -1.5); assert.equal(voiceLevel(b.id), 1);
  }
  for (const asset of phase.artAssets) for (const file of asset.files) assert.equal(hash(file.path), file.sha256);
});
it("replays every new campaign from creation with save checkpoints and covers all twelve visible actor quotations", () => {
  const seen = new Set<string>();
  for (const file of phase.routes) {
    const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
    const result = replayCampaign(spec); assert.equal(result.state.sceneId, "ending_quiet");
    for (const row of result.transcript.filter(r => r.from.includes("_district_"))) assert.equal(row.restored, true);
    for (const sceneId of new Set(result.transcript.map(r => r.from).filter(s => s.includes("_district_")))) {
      const s = routeCheckpoint(spec.name, sceneId), scene = getScene(sceneId), text = sceneText(scene, s);
      for (const b of visibleCampaignDialogue(sceneId, scene.speaker, text)) { seen.add(b.id); assert.ok(spokenDialogueRange(text, b)); }
      for (const q of quotedSpeech(text)) assert.ok(visibleCampaignDialogue(sceneId, scene.speaker, text).some(b => b.quote === q.text));
    }
  }
  // Later replies in the same campaign include acknowledgement/refusal after the first visit.
  for (const flags of [{ district_breach_acknowledged: true }, { district_kerr_refused: true }]) {
    const s = { ...base, sceneId: "act2_district_kerr_reply", flags: { ...base.flags, kerr_route_private: true, kerr_route_trace: true, kerr_route_delivered: true, ...flags } };
    for (const b of visibleCampaignDialogue(s.sceneId, "Kerr", sceneText(getScene(s.sceneId), s))) seen.add(b.id);
  }
  assert.deepEqual([...seen].sort(), phase.voiceIds);
});
