import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { finaleConsequenceEcho, showDistrictLedger } from "./campaign-presentation";
import { campaignThread } from "./campaign-thread";
import { districtActorKnowledge } from "./district-response";
import { importRun, exportRun } from "./vault";
const finish = (name: string) => replayCampaign(JSON.parse(readFileSync(`qa/routes/${name}.json`, "utf8")) as ReplaySpec).state;
it("keeps the full acquired depot knowledge in the consolidated campaign record", () => {
  const s = finish("technique-face-cosign-process"), before = JSON.stringify(s);
  assert.equal(showDistrictLedger(s), false);
  assert.deepEqual(campaignThread(s).find(row => row.id === "district")!.people, districtActorKnowledge(s));
  assert.equal(JSON.stringify(s), before); assert.deepEqual(importRun(exportRun(s)), s);
  assert.equal(showDistrictLedger(routeCheckpoint("technique-face-cosign-process", "act2_district_canal")), true);
  assert.equal(showDistrictLedger(routeCheckpoint("technique-face-cosign-process", "act2_technique_face_scope")), true);
  for (const sceneId of ["act2_middle", "act3_neighborhood", "act3_arrival", "act3_testimony_review", "unknown", "__proto__"]) assert.equal(showDistrictLedger({ ...s, sceneId }), false);
});
for (const [route, id] of [["technique-face-cosign-process", "wage"], ["witness-known-room", "room"], ["scarce-archive-open", "question"]]) it(`reflects the actual cost of ${route} without changing the campaign`, () => {
  const s = finish(route), before = JSON.stringify(s), echo = finaleConsequenceEcho(s)!;
  assert.equal(echo.id, id); assert.ok(echo.text.length > 30); assert.equal(JSON.stringify(s), before);
  assert.equal(finaleConsequenceEcho({ ...s, sceneId: "act3_arrival" }), undefined);
  const withoutRecord = { ...s, journal: s.journal.filter(row => !["technique-review", "nia-account", "archive-gap"].includes(row.id)) };
  assert.equal(finaleConsequenceEcho(withoutRecord), undefined);
});
it("does not turn intake, relocation, an uncompleted task or a paused source into closure", () => {
  const wage = finish("technique-face-cosign-process");
  assert.match(finaleConsequenceEcho(wage)!.text, /what the depot decides remains/);
  assert.equal(finaleConsequenceEcho({ ...wage, flags: { ...wage.flags, technique_review_reference: false } }), undefined);
  const room = finish("witness-known-room");
  assert.match(finaleConsequenceEcho({ ...room, flags: { ...room.flags, witness_relocated: true } })!.text, /earlier address private again/);
  const question = finish("scarce-archive-open");
  assert.equal(finaleConsequenceEcho({ ...question, flags: { ...question.flags, order_verified: true } }), undefined);
});
