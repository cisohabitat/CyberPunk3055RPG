import assert from "node:assert/strict";
import { it } from "node:test";
import missions from "../qa/production/mission-audit.json";
import { auditMissions } from "./mission-audit";
import { SCENES } from "./story";

it("keeps audit findings linked to real missions and delayed reactions", () => {
  const report = auditMissions(SCENES, missions, new Set(["memory_table:reconstruct"]));
  assert.equal(report.length, 5);
  assert.ok(!report[0].unplayedChoices.includes("memory_table:reconstruct"));
  assert.ok(report[0].unplayedChoices.includes("memory_table:seal-full"));
});
it("rejects missing consequence scenes and duplicate mission ownership", () => {
  assert.throws(() => auditMissions(SCENES, [{ ...missions[0], laterScenes: ["missing"] }]), /missing scene/);
  assert.throws(() => auditMissions(SCENES, [missions[0], { ...missions[0], id: "other" }]), /duplicate mission ownership/);
});
