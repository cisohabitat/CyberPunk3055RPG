import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacter, getScene, presentChoices } from "./engine";
import { MAP_DISTRICTS, districtForScene } from "./city-map";
import { SCENES } from "./story";
import { choicePresentation, DISTRICT_PRESENTATIONS, sceneDistrict } from "./visual-presentation";
import { portraitFinish } from "./art-finish";

const base = createCharacter({ handle: "VisualReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
it("uses only established location knowledge for district presentation, including all four wall finales", () => {
  assert.deepEqual(Object.keys(DISTRICT_PRESENTATIONS).sort(), MAP_DISTRICTS.map(d => d.id).sort());
  for (const scene of Object.values(SCENES)) assert.equal(sceneDistrict(scene.id), districtForScene(scene.id) ?? "city");
  for (const id of ["ending_names", "ending_listed", "ending_witness", "ending_quiet"]) assert.equal(sceneDistrict(id), "ward-nine");
  assert.equal(sceneDistrict("act2_spire_sources"), "spire");
});
it("decorates checks and static departures without evaluating dynamic destinations or mutating choices", () => {
  let evaluated = false;
  const dynamic = { id: "dynamic", label: "Return", enabled: true, next: () => { evaluated = true; return "route"; } };
  assert.equal(choicePresentation("stall", dynamic).kind, "action"); assert.equal(evaluated, false);
  for (const sceneId of ["stall", "route", "lumen_deal", "act2_spire_sources", "act3_arrival"]) {
    const choices = presentChoices({ ...base, sceneId }, getScene(sceneId));
    const before = JSON.stringify(choices);
    for (const choice of choices) {
      const { kind } = choicePresentation(sceneId, choice);
      if (choice.check) assert.equal(kind, "check");
      if (kind === "travel") {
        assert.equal(typeof choice.next, "string");
        const next = getScene(choice.next as string);
        assert.notEqual(next.location, getScene(sceneId).location); assert.ok(!next.ending && !next.finale);
      }
    }
    assert.equal(JSON.stringify(choices), before);
  }
});
it("limits older-portrait exposure compensation to explicit exports while leaving newer performances intact", () => {
  assert.equal(portraitFinish("/art/mara.jpg"), "legacy-paint");
  assert.equal(portraitFinish("/art/lumen-guarded.jpg"), "legacy-paint");
  for (const src of ["/art/edda.jpg", "/art/mara-remorse.jpg", "/art/lumen-considering.jpg", "/art/edda-service-review.jpg", "/art/unknown.jpg"]) assert.equal(portraitFinish(src), "current-paint");
});
