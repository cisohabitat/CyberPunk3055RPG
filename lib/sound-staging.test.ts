import assert from "node:assert/strict";
import { it } from "node:test";
import { createCharacter } from "./engine";
import { sceneSoundPlan } from "./sound";

it("local pressure follows the saved allowance, while quiet and ending identities remain distinct", () => {
  const base = createCharacter({ handle: "SoundReview", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
  const state = { ...base, sceneId: "chapel_window_plan", flags: { chapel_window_started: true, chapel_window_2: true, chapel_window_scouted: true }, pendingCheck: { sceneId: "chapel_window_plan", choiceId: "window-use-gap", roll: 8 } };
  const before = JSON.stringify(state);
  assert.deepEqual(sceneSoundPlan(state, "Glass Chapel maintenance stair"), { mood: "pressure", district: "chapel" });
  assert.equal(JSON.stringify(state), before);
  for (const flags of [{ chapel_window_started: true, chapel_window_0: true }, { chapel_window_started: true, chapel_window_3: true, chapel_window_done: true }, { chapel_window_started: true, chapel_window_0: true, chapel_window_3: true }, {}]) {
    assert.equal(sceneSoundPlan({ ...state, flags }, "Glass Chapel maintenance stair").mood, "chapel");
  }
  assert.deepEqual(sceneSoundPlan({ ...base, sceneId: "act3_kerr_personal_question" }, "Ward Nine stall"), { mood: "quiet", district: "ward" });
  assert.deepEqual(sceneSoundPlan({ ...base, sceneId: "memo" }, "The chair room"), { mood: "reading", district: "chapel" });
  assert.deepEqual(sceneSoundPlan({ ...base, sceneId: "ending_quiet" }, "Ending"), { mood: "quiet", district: "ward" });
  assert.deepEqual(sceneSoundPlan({ ...base, sceneId: "ending_listed" }, "Ending"), { mood: "ward", district: "ward" });
  assert.deepEqual(sceneSoundPlan({ ...base, sceneId: "act2_route_map" }, "Canal depot", "The Week"), { mood: "week", district: "canal" });
  assert.deepEqual(sceneSoundPlan({ ...base, sceneId: "act2_spire_prep" }, "Helion service alcove", "The Week"), { mood: "week", district: "spire" });
});
