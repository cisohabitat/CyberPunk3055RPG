import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { cityMap, districtForScene } from "./city-map";
import { campaignRecap, checkpointArt, CITY_SCHEMATIC } from "./presentation-art";
import { createCharacter, getScene, presentChoices } from "./engine";
import { SCENES } from "./story";
import { ILLUSTRATION_STAGING } from "./art";
import { nightRetell } from "./story/retell";
import phase from "../qa/media/player-screens.json";
const base = createCharacter({ handle: "MapReview", givenName: "Jo", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
it("hides places before introduction, then distinguishes known places from the current location", () => {
  assert.deepEqual(cityMap({ ...base, sceneId: "opening_city" }).map(d => [d.id, d.current]), [["market", true]]);
  const hired = cityMap({ ...base, sceneId: "stall", flags: { hired: true } });
  assert.deepEqual(hired.map(d => d.id), ["market", "chapel"]); assert.equal(hired.find(d => d.id === "chapel")!.current, false);
  assert.equal(districtForScene("act3_response_visit"), "clinic");
  assert.equal(districtForScene("act2_pump_triage"), "clinic-service");
  assert.equal(districtForScene("ending_names"), "ward-nine");
  assert.ok(cityMap({ ...base, sceneId: "stall", flags: { response_started: true, response_declined: true } }).some(d => d.id === "clinic"));
  assert.ok(!cityMap({ ...base, sceneId: "stall", flags: { met_sera: true } }).some(d => d.id === "ward-nine"));
});
it("maps every precise authored location and only locates currently legal choices without changing progress", () => {
  for (const scene of Object.values(SCENES)) {
    if (!scene.ending && !["card_week", "card_wall"].includes(scene.id)) assert.ok(districtForScene(scene.id), scene.id);
    for (const flags of [{}, { memory_prepared: true, memory_intact: true, memory_redacted: true, witness_deferred: true, archive_paused: true, hired: true }] as Record<string, boolean>[]) {
      const state = { ...base, sceneId: scene.id, flags }, before = JSON.stringify(state), rows = cityMap(state);
      assert.equal(JSON.stringify(state), before); assert.ok(rows.filter(d => d.current).length <= 1);
      for (const row of rows) for (const action of row.choices) {
        const choice = presentChoices(state, scene).find(c => c.id === action.id)!;
        assert.equal(choice.enabled, true); assert.equal(choice.check, undefined); assert.equal(choice.label, action.label);
        const next = typeof choice.next === "function" ? choice.next(state) : choice.next!;
        assert.equal(row.id, districtForScene(next)); assert.equal(Boolean(getScene(next).ending), false);
      }
    }
  }
  assert.ok(cityMap({ ...base, sceneId: "act2_middle", flags: { memory_intact: true } }).flatMap(d => d.choices).some(c => c.id === "trace-order"));
});
it("resolves every conditional save thumbnail from that snapshot rather than other slots or the active run", () => {
  for (const rule of ILLUSTRATION_STAGING) for (const sceneId of rule.scenes) {
    const flags = Object.fromEntries([...rule.allFlags, ...rule.anyFlags].map(f => [f, true]));
    const snapshot = { ...base, sceneId, flags }, before = JSON.stringify(snapshot);
    assert.equal(checkpointArt(snapshot)?.src, rule.illustration.src);
    assert.notEqual(checkpointArt({ ...snapshot, flags: {} })?.src, rule.illustration.src);
    assert.equal(JSON.stringify(snapshot), before);
  }
  assert.equal(checkpointArt({ ...base, sceneId: "card_wall" })?.src, "/art/chapter-wall.jpg");
});
it("recaps exact recorded moments without granting consent, authentication or a falsely completed outcome", () => {
  const state = { ...base, sceneId: "ending_names", flags: { spoke_names: true, archive_custody: true }, journal: [{ id: "archive-custody", text: "Recorded custody; employer review remains unresolved.", kind: "fact" as const }] };
  const before = JSON.stringify(state), cards = campaignRecap(state);
  assert.equal(cards.length, 3); assert.equal(cards[0].text, nightRetell(state)[0]); assert.equal(cards[1].text, state.journal[0].text); assert.equal(cards[2].text, nightRetell(state)[2]);
  assert.equal(cards[1].art?.src, "/art/archive-held-original.jpg"); assert.equal(cards[2].art?.src, "/art/finale-names.jpg");
  assert.equal(JSON.stringify(state), before);
  const partial = campaignRecap({ ...base, sceneId: "ending_names" });
  assert.match(partial[0].text, /undecided/); assert.match(partial[1].text, /unresolved/); assert.equal(partial[2].art?.src, "/art/memorial-stair.jpg");
  const unrecorded = campaignRecap({ ...base, sceneId: "ending_quiet", flags: { mara_company_kept: true, archive_custody: true } });
  assert.equal(unrecorded[1].art?.src, "/art/chapter-week.jpg");
});
it("documents schematic art and keeps the campaign speech bindings unchanged", () => {
  const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
  assert.equal(phase.assets.length, 1); assert.equal(CITY_SCHEMATIC.src, "/art/city-schematic.jpg");
  assert.equal(sha("qa/media/campaign-dialogue-bindings.json"), phase.bindingSha256);
  for (const asset of phase.assets) { for (const f of asset.files) { assert.equal(sha(f.path), f.sha256); assert.ok(f.bytes < 1048576); } for (const ref of asset.references) assert.equal(sha(ref.path), ref.sha256); }
});
