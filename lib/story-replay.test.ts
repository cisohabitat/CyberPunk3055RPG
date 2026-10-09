import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { replayCampaign, type ReplaySpec } from "./story-replay";

const load = (name: string): ReplaySpec => JSON.parse(readFileSync(`qa/routes/${name}.json`, "utf8"));
describe("deterministic campaign replay", () => {
  for (const name of ["authenticated", "witness-permission", "bounded-correction", "kit-archive", "kit-harness", "kit-guide", "kit-shroud", "pump-local", "pump-rebate", "pump-transfer", "pump-brace", "shift-key", "shift-negotiation", "shift-pending", "shift-representative", "pump-inspection", "gutterwire-harness", "finale-witness", "finale-listed"]) it(`replays ${name} through saved checkpoints to an original finale`, () => {
    const spec = load(name); const result = replayCampaign(spec);
    assert.deepEqual(result, replayCampaign(spec));
    assert.ok(result.transcript.some((step) => step.restored && step.roll));
    assert.ok(result.transcript.some((step) => step.restored && !step.roll));
  });
  it("retains a deterministic full campaign to each original finale", () => {
    const endings=["authenticated","witness-permission","finale-witness","finale-listed"].map(name=>replayCampaign(load(name)).state.sceneId);
    assert.deepEqual(new Set(endings),new Set(["ending_quiet","ending_names","ending_witness","ending_listed"]));
  });
  it("reports illegal choices and omitted die faces with the exact route step", () => {
    const spec = load("authenticated");
    assert.throws(() => replayCampaign({ ...spec, steps: [{ choiceId: "accept-public-permission" }] }), /step 1, stall: Choice accept-public-permission is unavailable/);
    assert.throws(() => replayCampaign({ ...spec, steps: [{ choiceId: "ask-pay" }, { choiceId: "haggle" }] }), /step 2, pay: A check requires/);
    assert.throws(() => replayCampaign({ ...spec, steps: [{ choiceId: "ask-pay", roll: 8 }] }), /non-check choice cannot carry/);
  });
  it("rejects a route whose asserted evidence state is false", () => {
    const spec = load("bounded-correction");
    assert.throws(() => replayCampaign({ ...spec, expected: { ...spec.expected, flags: { archive_key_authenticated: true } } }), /flag archive_key_authenticated/);
    assert.throws(() => replayCampaign({ ...spec, expected: { ...spec.expected, creds: 0 } }), /creds expected 0/);
    assert.throws(() => replayCampaign({ ...spec, expected: { ...spec.expected, items: ["archive-probe"] } }), /missing equipment archive-probe/);
  });
});
