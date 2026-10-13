import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createCharacter, getScene, sceneText, presentChoices, commitChoice } from "./engine";
import { quotedSpeech, visibleCampaignDialogue, visibleCheckDialogue } from "./campaign-dialogue";
import { DialoguePlayback } from "./dialogue-playback";
import type { ReplaySpec } from "./story-replay";
import type { VoiceStatus } from "./sound";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
import decisions from "../qa/media/campaign-dialogue-audit.json";
import deliveries from "../qa/media/campaign-dialogue-provenance.json";
import old from "../qa/media/voice-provenance.json";
import { SCENES } from "./story";
import { auditSceneArt } from "./scene-art";
import { sceneIllustration } from "./art";

const base = createCharacter({ handle: "Any unique handle", givenName: "Jo", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const lines = (id: string, flags = {}) => visibleCampaignDialogue(id, SCENES[id].speaker, sceneText(SCENES[id], { ...base, sceneId: id, flags }));

describe("campaign character dialogue", () => {
  it("does not confuse apostrophes with quotation boundaries", () => {
    assert.deepEqual(quotedSpeech(`‘We’re here,’ Ren says. ‘It’s loud. It’s still somewhere.’`).map(q => q.text), ["We’re here,", "It’s loud. It’s still somewhere."]);
  });
  it("casts each actual actor while retaining primary portraits", () => {
    assert.deepEqual(lines("act2_shelter_brief").map(l => l.speaker), ["Sera", "Ren"]);
    assert.equal(lines("act2_witness_door")[0].speaker, "Nia Pell");
    assert.equal(lines("act2_witness_safe")[0].speaker, "Nia Pell");
    assert.equal(lines("vault_quiet", { pact_copy: true })[0].speaker, "Sister Lumen");
    assert.equal(lines("act2_origin_spire")[0].speaker, "Edda");
    assert.equal(lines("act2_notice_counter")[0].speaker, "Dispatcher");
    assert.deepEqual(lines("act2_response_invitation").map(l => l.speaker), ["Mara", "Sister Lumen"]);
    assert.equal(lines("act3_records_visit")[0].speaker, "Mechanic");
  });
  it("voices the fixed offer for arbitrary handles and never speaks the custom address", () => {
    for (const handle of ["June", "The long unique runner name", "雨", 'a "quoted" handle']) {
      const text = sceneText(SCENES.stall, { ...base, handle });
      const queue = visibleCampaignDialogue("stall", "Quill", text);
      assert.equal(queue[0].id, "voice-quill-offer");
      assert.ok(queue.some(line => line.text.includes("Fifty now")));
      assert.ok(queue.every(line => !line.text.includes(handle)));
    }
    assert.ok(lines("act2_lumen_door").every(l => !l.text.includes(base.handle)));
    assert.ok(lines("ward_wall").every(l => !l.text.includes(base.givenName)));
  });
  it("requires revealed quotation and secondary attribution, with no narration or written-label voices", () => {
    assert.deepEqual(visibleCampaignDialogue("act2_origin_spire", "Ives", '"They still bill my shifts against it. Get it out clean and take the receiver."'), []);
    assert.deepEqual(visibleCampaignDialogue("opening_city", undefined, SCENES.opening_city.text as string), []);
    assert.deepEqual(lines("ending_sold"), []);
    assert.ok(lines("job_owner").every(l => l.text !== "Who gets it after you?"));
    for (const line of bindings) {
      assert.deepEqual(visibleCampaignDialogue(line.scene, line.sceneSpeaker === "Quill" ? "Mara" : "Quill", line.quote), []);
    }
  });
  it("selects only the conditional answer in the displayed scene", () => {
    const known = lines("act3_witness_visit", { witness_lost: true });
    assert.ok(known.some(l => l.id === "voice-nia-known-room"));
    assert.ok(!known.some(l => l.id === "voice-nia-second-room"));
    assert.ok(lines("act3_witness_visit", { witness_lost: true, witness_relocated: true }).some(l => l.id === "voice-nia-second-room"));
  });
  it("covers every spoken quotation reached by the full authored campaign corpus", () => {
    const covered = new Set<string>(); const scenes = new Set<string>();
    for (const file of readdirSync(new URL("../qa/routes/", import.meta.url)).filter(f => f.endsWith(".json"))) {
      const spec = JSON.parse(readFileSync(new URL(`../qa/routes/${file}`, import.meta.url), "utf8")) as ReplaySpec;
      let state = createCharacter(spec.character);
      const review = () => {
        const scene = getScene(state.sceneId), text = sceneText(scene, state), queue = visibleCampaignDialogue(scene.id, scene.speaker, text);
        scenes.add(scene.id); queue.forEach(l => covered.add(l.key));
        for (const quote of quotedSpeech(text)) {
          // Custom names/handles are readable; fixed dialogue following them is checked.
          if (["ward_wall", "ending_sainted"].includes(scene.id) && quote.text.startsWith(state.givenName)) continue;
          if (scene.id === "act2_lumen_door" && quote.text === `${state.handle},`) continue;
          if (scene.id === "stall" && quote.text.startsWith(`${state.handle}. Mara Voss`)) {
            assert.ok(queue.some(l => l.id === "voice-quill-offer")); continue;
          }
          const decision = decisions.decisions.find(d => d.scene === scene.id && d.text === quote.text);
          assert.ok(decision, `Unaudited quotation ${file}/${scene.id}: ${quote.text}`);
          if (decision.decision === "voice") assert.ok(queue.some(l => l.quote === quote.text), `Unvoiced quotation ${file}/${scene.id}: ${quote.text}`);
        }
      };
      review();
      for (const step of spec.steps) {
        const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === step.choiceId && c.enabled)!;
        assert.ok(choice); state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state; review();
      }
    }
    for (const line of old.lines) if (line.id !== "voice-lumen-counteroffer") assert.ok(bindings.some(b => b.id === line.id && covered.has(b.key)), line.id);
    for (const ending of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) assert.ok(scenes.has(ending));
  });
  it("ships every new dialogue file with measured signal and unchanged prior WAVs", () => {
    assert.equal(deliveries.lines.length, 190);
    const known = new Set([...deliveries.lines, ...old.lines].map(l => l.id));
    for (const binding of bindings) assert.ok(known.has(binding.id), binding.id);
    for (const delivery of [...deliveries.lines, ...old.lines]) {
      const data = readFileSync(new URL(`../${delivery.path}`, import.meta.url));
      assert.equal(createHash("sha256").update(data).digest("hex"), delivery.sha256, delivery.id);
      assert.equal(data.length, delivery.bytes);
      assert.ok(delivery.durationSeconds > .15 && delivery.durationSeconds < 45);
      assert.ok(delivery.peak > .1 && delivery.peak < .95);
      assert.ok(delivery.rms > .005 && delivery.rms < .3);
      assert.ok(data.length < 3_145_728);
    }
  });
  it("voices only Lumen's revealed failed-bluff result, never a successful or unrelated result", () => {
    const flavor = SCENES.lumen_deal.choices.find(c => c.id === "fake-pact")!.resultFail!;
    const queue = visibleCheckDialogue("lumen_deal", "fake-pact", "Sister Lumen", false, flavor);
    assert.equal(queue.length, 1); assert.equal(queue[0].speaker, "Sister Lumen"); assert.equal(queue[0].text, "Kerr,");
    assert.deepEqual(visibleCheckDialogue("lumen_deal", "fake-pact", "Sister Lumen", true, flavor), []);
    assert.deepEqual(visibleCheckDialogue("lumen_deal", "other-choice", "Sister Lumen", false, flavor), []);
    assert.deepEqual(visibleCheckDialogue("lumen_deal", "fake-pact", "Kerr", false, flavor), []);
    assert.deepEqual(visibleCampaignDialogue("lumen_deal", "Sister Lumen", flavor), []);
  });
  it("audits every quoted check-result line in the authored campaign", () => {
    for (const scene of Object.values(SCENES)) for (const choice of scene.choices) for (const success of [true, false]) {
      const flavor = success ? choice.resultSuccess : choice.resultFail;
      if (!flavor) continue;
      for (const quote of quotedSpeech(flavor)) assert.ok(visibleCheckDialogue(scene.id, choice.id, scene.speaker, success, flavor).some(l => l.quote === quote.text), `${scene.id}/${choice.id}: ${quote.text}`);
    }
  });
  it("has fitting explicit art decisions for the entire campaign and preserves chapter cards", () => {
    assert.equal(Object.keys(auditSceneArt(SCENES)).length, 197);
    assert.equal(Object.values(SCENES).filter(s => sceneIllustration(s.id)).length, 195);
    assert.equal(sceneIllustration("card_week"), undefined); assert.equal(sceneIllustration("card_wall"), undefined);
    for (const id of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) assert.ok(sceneIllustration(id)?.src.startsWith("/art/finale-"));
  });
});

function harness() {
  const views: { status: VoiceStatus; key?: string }[] = [];
  const calls: { id: string; cancelled: boolean; report: (status: VoiceStatus) => void; end: (outcome: "ended" | "unavailable") => void }[] = [];
  const playback = new DialoguePlayback(view => views.push(view), (id, report, end) => {
    const call = { id, cancelled: false, report, end: end! }; calls.push(call); report("playing");
    return () => { call.cancelled = true; };
  });
  return { playback, calls, views };
}
const a = { key: "a", id: "actor-a" }, b = { key: "b", id: "actor-b" }, c = { key: "c", id: "actor-c" };
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 5));

describe("ordered dialogue lifecycle", () => {
  it("appends newly revealed dialogue without restarting or overlapping the playing line", async () => {
    const h = harness(); h.playback.update([a], true, true); await tick();
    h.playback.update([a, b], true, true); assert.deepEqual(h.calls.map(c => c.id), [a.id]);
    h.calls[0].end("ended"); await tick(); assert.deepEqual(h.calls.map(c => c.id), [a.id, b.id]);
    h.calls[1].end("ended"); await tick(); h.playback.update([a, b], true, true); await tick(); assert.equal(h.calls.length, 2); h.playback.dispose();
  });
  it("Stop cancels the current and visible queued lines, permitting only a future reveal", async () => {
    const h = harness(); h.playback.update([a, b], true, true); await tick(); h.playback.stop();
    h.calls[0].report("playing"); h.calls[0].end("ended"); await tick(); assert.equal(h.calls.length, 1); assert.ok(h.calls[0].cancelled);
    h.playback.update([a, b, c], true, true); await tick(); assert.equal(h.calls[1].id, c.id); h.playback.dispose();
  });
  it("mute, dialogs and page resume do not restart interrupted visible dialogue", async () => {
    const h = harness(); h.playback.update([a, b], true, true); await tick(); h.playback.update([a, b], false, true);
    h.playback.update([a, b], true, true); h.calls[0].end("ended"); await tick(); assert.equal(h.calls.length, 1); h.playback.dispose();
  });
  it("an unavailable clip leaves later actors playable", async () => {
    const h = harness(); h.playback.update([a, b], true, true); await tick(); h.calls[0].end("unavailable"); await tick(); assert.equal(h.calls[1].id, b.id); h.playback.dispose();
  });
  it("manual mode plays only the selected line and supports an explicit full replay", async () => {
    const h = harness(); h.playback.update([a, b], true, false); await tick(); assert.equal(h.calls.length, 0);
    h.playback.listen(b.key); h.calls[0].end("ended"); await tick(); assert.equal(h.calls.length, 1);
    h.playback.playAll(); await tick(); assert.equal(h.calls[1].id, a.id); h.calls[1].end("ended"); await tick(); assert.equal(h.calls[2].id, b.id); h.playback.dispose();
  });
  it("departure cancels a pending start and ignores late completion", async () => {
    const h = harness(); h.playback.update([a, b], true, true); h.playback.dispose(); await tick(); assert.equal(h.calls.length, 0);
    h.playback.update([a, b], true, true); await tick(); h.playback.dispose(); const before = h.views.length;
    h.calls[0].end("ended"); h.calls[0].report("playing"); await tick(); assert.equal(h.views.length, before); assert.equal(h.calls.length, 1);
  });
});
