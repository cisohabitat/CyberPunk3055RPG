import assert from "node:assert/strict";
import { describe, it } from "node:test";
import authored from "../content/community.json";
import { compileMission, mergeScenes } from "./authoring";
import { createCharacter, sceneText } from "./engine";
import { SCENES } from "./story";
const copy = () => JSON.parse(JSON.stringify(authored));
const base = createCharacter({ handle: "Writer", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
describe("structured mission authoring", () => {
  it("compiles stable scenes and canonical choices with real graph destinations", () => {
    const scenes = compileMission(authored);
    assert.equal(Object.keys(scenes).length, 6);
    for (const scene of Object.values(scenes)) for (const choice of scene.choices) for (const next of [choice.next, choice.nextSuccess, choice.nextFail]) if (typeof next === "string") assert.ok(SCENES[next], `${scene.id}:${next}`);
    assert.equal(scenes.act2_pump_methods.choices.find((choice) => choice.id === "route-pump")!.check!.stat, "ghost");
  });
  it("renders earned help, betrayal, successful cooling and a future inspection precisely", () => {
    const scenes = compileMission(authored);
    assert.match(sceneText(scenes.act2_pump_methods, { ...base, flags: { pump_kerr: true } }), /props the door/);
    assert.match(sceneText(scenes.act2_pump_methods, { ...base, flags: { kerr_sold_you: true } }), /steps out/);
    const visit = sceneText(scenes.act3_pump_visit, { ...base, flags: { pump_restored: true, pump_inspection_paid: true } });
    assert.match(visit, /gauge remains in range/); assert.match(visit, /has not happened yet/);
    assert.doesNotMatch(sceneText(scenes.act3_pump_visit, { ...base, flags: {} }), /medicines reached/);
  });
  it("rejects duplicate ids, typo fields and unsupported executable effects", () => {
    const duplicate = copy(); duplicate.scenes.push(duplicate.scenes[0]); assert.throws(() => compileMission(duplicate), /duplicate scene/);
    const choices = copy(); choices.scenes[0].choices.push(choices.scenes[0].choices[0]); assert.throws(() => compileMission(choices), /duplicate choice/);
    const typo = copy(); typo.scenes[0].choices[0].requireFlga = "trust"; assert.throws(() => compileMission(typo), /unknown field/);
    const code = copy(); code.scenes[0].choices[0].effects = () => ({creds:100}); assert.throws(() => compileMission(code), /expected an object/);
  });
  it("rejects global scene collisions instead of silently overriding a mission", () => {
    const scenes=compileMission(authored);
    assert.throws(()=>mergeScenes(scenes,scenes),/duplicate or mismatched/);
    assert.throws(()=>mergeScenes({other:scenes.act2_pump_methods}),/duplicate or mismatched/);
  });
  it("rejects broken rule values and conditions before shipping prose", () => {
    for (const mutate of [
      (s: ReturnType<typeof copy>) => s.scenes[1].choices[0].check.stat = "luck",
      (s: ReturnType<typeof copy>) => s.scenes[1].choices[0].check.dc = 0,
      (s: ReturnType<typeof copy>) => s.scenes[1].choices[0].check.itemBonuses = [{item:"missing",amount:2}],
      (s: ReturnType<typeof copy>) => s.scenes[0].choices[0].effects.factions = {unknown:1},
      (s: ReturnType<typeof copy>) => s.scenes[1].text[0].select[0].when = {},
    ]) { const data = copy(); mutate(data); assert.throws(() => compileMission(data)); }
  });
});
