import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText } from "./engine";
import { SCENES } from "./story";
import { campaignReturnBeat, RETURN_BEATS } from "./story/campaign-beats";
import { parseSave } from "./storage";
import type { ReplaySpec } from "./story-replay";
import type { GameState } from "./types";

const base = (sceneId: string): GameState => ({ ...createCharacter({ handle: "Pacing", givenName: "Ada", origin: "spire", bonus: { face: 2, chrome: 0, ghost: 0, nerve: 0 } }), sceneId });

describe("campaign return beats", () => {
  it("keeps every selector tied to an authored return and rejects an unearned log label", () => {
    for (const [sceneId, beats] of Object.entries(RETURN_BEATS)) for (const beat of beats) {
      assert.ok(Object.values(SCENES).some(scene => scene.choices.some(choice => choice.label === beat.label && choice.next === sceneId)), beat.label);
      assert.equal(campaignReturnBeat({ ...base(sceneId), log: [beat.label] }), null, beat.label);
    }
  });
  it("reads the last action, not an earlier job, and keeps legacy logs neutral", () => {
    const s = { ...base("act2_middle"), flags: { week_recovered: true, kerr_route_delivered: true }, log: ["Record the observed handover and its actual terms.", "Return to the unfinished work."] };
    assert.match(campaignReturnBeat(s)!, /The rest helped you/);
    for (const log of [[], ["Unrecognized legacy label"]]) assert.equal(campaignReturnBeat({ ...s, log }), null);
    assert.equal(campaignReturnBeat({ ...s, sceneId: "stall" }), null);
  });
  it("distinguishes private delivery, a broken promise and agreed registration", () => {
    const s = { ...base("act2_middle"), log: ["Record the observed handover and its actual terms."], flags: { kerr_route_delivered: true } };
    assert.match(campaignReturnBeat(s)!, /no recipient entry/);
    assert.match(campaignReturnBeat({ ...s, flags: { ...s.flags, kerr_route_trace: true, kerr_route_private: true } })!, /promise you cannot call kept/);
    assert.match(campaignReturnBeat({ ...s, flags: { ...s.flags, kerr_route_trace: true, kerr_route_registered: true } })!, /register he agreed to/);
    assert.doesNotMatch(campaignReturnBeat({ ...s, flags: { ...s.flags, kerr_route_trace: true } })!, /agreed to/);
  });
  it("requires actual account custody and does not turn deferral into permission", () => {
    const s = { ...base("act2_middle"), flags: { witness_done: true }, log: ["Attach Nia's account to the evidence."] };
    assert.equal(campaignReturnBeat(s), null);
    const attached = { ...s, journal: [{ id: "nia-account", text: "Approved account" }] };
    assert.match(campaignReturnBeat(attached)!, /Her room stays out/);
    assert.doesNotMatch(campaignReturnBeat(attached)!, /public permission|quote her/);
    assert.match(campaignReturnBeat({ ...s, flags: { witness_deferred: true }, log: ["Give her time. Leave the recorder off."] })!, /no recording/);
    assert.equal(campaignReturnBeat({ ...attached, flags: { witness_deferred: true }, log: ["Give her time. Leave the recorder off."] }), null);
  });
  it("separates corroboration from digital authentication and a filed account from the names", () => {
    const s = { ...base("act2_middle"), flags: { archive_done: true, order_verified: true }, log: ["Keep both decisions attached."] };
    assert.match(campaignReturnBeat(s)!, /without supplying a digital-key match/);
    assert.match(campaignReturnBeat({ ...s, flags: { ...s.flags, archive_key_authenticated: true } })!, /reader-authenticated key match/);
    const filed = { ...base("act3_arrival"), flags: { testimony_done: true, testimony_published: true }, log: ["File the public account with its sources and limits."] };
    assert.match(sceneText(getScene(filed.sceneId), filed), /names are still waiting for a voice/);
    assert.equal(filed.flags.spoke_names, undefined);
  });
  it("keeps Mara's queued response, pending dispatch and Lumen's limited contact distinct", () => {
    const s = { ...base("act3_arrival"), flags: { response_visit: true }, log: ["Leave her answer and its limits in her own name."] };
    assert.match(campaignReturnBeat(s)!, /no desk reply/);
    assert.match(campaignReturnBeat({ ...s, flags: { ...s.flags, response_received: true } })!, /unanswered queue/);
    const limited = { ...s, flags: { lumen_boundary_visit: true, lumen_contact_limited: true }, log: ["Keep the contact limit without adding her name to the statement."] };
    assert.match(campaignReturnBeat(limited)!, /not a partnership/);
    assert.doesNotMatch(campaignReturnBeat(limited)!, /forgave|endorsed|will answer/);
  });
  it("retains return emphasis across native restore without mutating any campaign", () => {
    const covered = new Set<string>();
    let matchingVisits = 0;
    for (const file of readdirSync("qa/routes").filter(name => name.endsWith(".json"))) {
      const spec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
      let s = createCharacter(spec.character);
      for (let index = 0; index <= spec.steps.length; index++) {
        const before = JSON.stringify(s), beat = campaignReturnBeat(s);
        if (beat) {
          matchingVisits++;
          covered.add(`${s.sceneId}:${s.log.at(-1)}`);
          const restored = parseSave(before)!;
          assert.deepEqual(restored, s);
          assert.equal(campaignReturnBeat(restored), beat);
          assert.ok(sceneText(getScene(s.sceneId), s).includes(beat));
        }
        assert.equal(JSON.stringify(s), before);
        if (index === spec.steps.length) break;
        const entry = spec.steps[index], choice = presentChoices(s, getScene(s.sceneId)).find(c => c.id === entry.choiceId && c.enabled)!;
        s = commitChoice(s, choice, choice.check ? { roll: entry.roll! } : undefined).state;
      }
    }
    assert.ok(matchingVisits >= 350, `Only ${matchingVisits} authored visits select a return beat`);
    assert.ok(covered.size >= 20, `Only ${covered.size} selectors exercised`);
  });
  it("keeps Edda's posted shifts separate from an observed suspension and its remedies", () => {
    const unexposed = { ...base("act3_edda_visit"), flags: { archive_custody: true, edda_name_withheld: true } };
    const before = JSON.stringify(unexposed);
    const text = sceneText(getScene(unexposed.sceneId), unexposed);
    assert.match(text, /shifts are still posted/);
    assert.doesNotMatch(text, /lost shift|suspended|dismissal|bridge/);
    assert.ok(!presentChoices(unexposed, getScene(unexposed.sceneId)).some(c => ["bridge-edda-shift", "review-edda-shift"].includes(c.id) && c.enabled));
    assert.equal(JSON.stringify(unexposed), before);
    for (const exposure of ["edda_exposed", "archive_method_face", "archive_method_nerve"]) {
      const state = { ...unexposed, flags: { ...unexposed.flags, [exposure]: true } };
      assert.match(sceneText(getScene(state.sceneId), state), /suspended pending a records review/);
      assert.doesNotMatch(sceneText(getScene(state.sceneId), state), /shifts are still posted/);
      assert.ok(presentChoices(state, getScene(state.sceneId)).some(c => c.id === "review-edda-shift" && c.enabled));
      assert.equal(state.flags.edda_name_withheld, true);
    }
  });
  it("requires the actual neighborhood reply and preserves unavailable recordings and paused contact", () => {
    const relay = { ...base("act3_neighborhood"), flags: { visited_nia: true, nia_contact_relay: true }, log: ["Accept a clinic relay; Nia decides whether to answer."] };
    const before = JSON.stringify(relay);
    assert.match(campaignReturnBeat(relay)!, /without a new recording or new permission/);
    assert.equal(campaignReturnBeat({ ...relay, flags: { ...relay.flags, nia_contact_paused: true } }), null);
    const pause = { ...relay, flags: { visited_nia: true, nia_contact_paused: true }, log: ["Offer no further questions. Let her pause contact."] };
    assert.match(campaignReturnBeat(pause)!, /recorder stays off/);
    assert.doesNotMatch(campaignReturnBeat(pause)!, /Her account keeps/);
    assert.match(campaignReturnBeat({ ...pause, journal: [{ id: "nia-account", text: "Approved private account" }] })!, /existing terms/);
    assert.equal(JSON.stringify(relay), before);
    assert.match(campaignReturnBeat({ ...base("act3_neighborhood"), flags: { visited_edda: true }, log: ["Record her limits and leave the employment review unresolved."] })!, /shifts are still posted/);
    assert.match(campaignReturnBeat({ ...base("act3_neighborhood"), flags: { visited_edda: true, archive_method_nerve: true }, log: ["Record her limits and keep the source available."] })!, /remains suspended/);
    assert.equal(campaignReturnBeat({ ...base("act3_neighborhood"), log: ["Record her limits and leave the employment review unresolved."] }), null);
    assert.equal(campaignReturnBeat({ ...base("act3_neighborhood"), flags: { visited_edda: true, edda_supported: true }, log: ["Contribute forty creds to the suspended shift."] }), null);
  });
});
