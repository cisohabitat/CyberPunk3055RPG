import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, effectPreview, getScene, presentChoices, previewCheck, sceneText, stageCheck } from "./engine";
import { aftermath } from "./evidence";
import { characterConduct } from "./relationships";
import { routePlan, routeResume } from "./route-planning";
import { objectives } from "./objectives";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";
const base = (): GameState => ({ ...createCharacter({ handle: "Rex", givenName: "Ada", origin: "dustline", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } }), sceneId: "act2_middle", creds: 100, flags: { kerr_talked: true } });
function choice(state: GameState, id: string) { const found = presentChoices(state, getScene(state.sceneId)).find((c) => c.id === id); assert.ok(found?.enabled, `${state.sceneId}:${id}`); return found; }
function step(state: GameState, id: string, roll?: number) { return commitChoice(state, choice(state, id), roll === undefined ? undefined : { roll }).state; }
function plan(entry = "lift", exit = "gap", consent = "private") { let s = step(base(), "answer-kerr-collection"); for (const id of [consent === "private" ? "promise-private-collection" : "agree-registered-collection", `route-entry-${entry}`, `route-exit-${exit}`]) s = step(s, id); return s; }
function depart(s: GameState) { return step(s, s.flags.kerr_entry_lift ? "depart-kerr-lift" : "depart-kerr-foot"); }
function visit(s: GameState) { return step({ ...s, sceneId: "act3_arrival" }, "visit-kerr-collection"); }

describe("Kerr collection and observed conduct", () => {
  it("restores a partial draft, resets without cost and charges departure only once", () => {
    let s = step(step(base(), "answer-kerr-collection"), "promise-private-collection"); s = step(s, "route-entry-lift");
    s = importRun(exportRun(step(s, "pause-kerr-exit"))); assert.equal(s.creds, 100); assert.equal(s.flags.kerr_route_trace, undefined);
    s = step(s, "answer-kerr-collection"); assert.equal(s.sceneId, "act2_route_exit");
    s = step(s, "route-exit-walk"); assert.deepEqual(effectPreview(s, choice(s, "depart-kerr-lift")), ["Strain +1", "-10 cr"]);
    s = step(s, "reset-kerr-route"); assert.equal(routePlan(s).ready, false); assert.equal(s.creds, 100); assert.equal(s.flags.kerr_route_private, true);
    s = step(step(s, "route-entry-lift"), "route-exit-gap"); s = importRun(exportRun(step(s, "pause-kerr-route"))); s = step(s, "answer-kerr-collection");
    const departure = choice(s, "depart-kerr-lift"); s = depart(s); assert.equal(s.creds, 90); assert.equal(routeResume(s), "act2_route_crossing");
    assert.throws(() => commitChoice({ ...s, sceneId: "act2_route_review" }, departure));
    const poor = { ...plan(), creds: 9 }; assert.throws(() => step(poor, "depart-kerr-lift")); assert.equal(step(poor, "reset-kerr-route").creds, 9);
  });
  for (const [exit, method] of [["ramp", "route-use-sensor"], ["gap", "route-use-gap"], ["walk", "route-use-stairs"], ["gap", "route-negotiate"]]) it(`observes ${method} collection before receipt without inventing proof`, () => {
    let s = depart(plan("lift", exit)); const before = s.creds;
    s = importRun(exportRun(stageCheck(s, method, 8))); assert.equal(s.pendingCheck?.roll, 8);
    s = step(s, method, 8); assert.equal(s.flags.kerr_route_collected, true); assert.equal(s.flags.kerr_route_delivered, undefined);
    s = step(s, "record-kerr-receipt"); assert.equal(s.creds, before); assert.equal(s.flags.kerr_route_delivered, true); assert.equal(s.flags.kerr_route_trace, undefined);
    assert.equal(objectives(s)[0].status, "Complete"); assert.equal(s.flags.order_verified, undefined); assert.equal(s.flags.witness_consent, undefined);
    assert.throws(() => step(s, "answer-kerr-collection"));
  });
  it("uses Quill’s earned introduction only for negotiation and retains late payment history", () => {
    let s = step({ ...base(), flags: { kerr_talked: true, quill_refused: true } }, "answer-kerr-collection"); s = step(s, "ask-quill-introduction");
    assert.throws(() => step(s, "take-quill-introduction")); assert.throws(() => step({ ...s, creds: 39 }, "repay-quill-late"));
    s = step(s, "repay-quill-late"); assert.equal(s.creds, 60); assert.equal(s.flags.quill_refused, true); assert.throws(() => step(s, "repay-quill-late"));
    s = step(s, "take-repaid-introduction"); for (const id of ["promise-private-collection", "route-entry-stairs", "route-exit-ramp"]) s = step(s, id); s = depart(s);
    for (const id of ["route-use-sensor", "route-negotiate"]) { const check = choice(s, id).check!; const noIntro = previewCheck({ ...s, flags: { ...s.flags, kerr_route_intro: false } }, check); assert.equal(previewCheck(s, check).bonus - noIntro.bonus, id === "route-negotiate" ? 2 : 0); }
    assert.match(characterConduct(s, "Quill")!, /Late repayment.*Introduced/);
  });
  it("keeps entry registration through a successful exit, acknowledgement and all four finales", () => {
    let s = step(step(depart(plan("gate", "gap")), "route-use-gap", 8), "record-kerr-receipt"); s.flags.kerr_sold_you = true;
    assert.equal(objectives(s)[0].status, "Compromised"); s = visit(s); s = step(s, "answer-kerr-breach"); s = step(s, "acknowledge-kerr-disclosure");
    assert.equal(s.flags.kerr_route_trace, true); assert.match(characterConduct(s, "Kerr")!, /acknowledged.*sold your account/);
    s = step(s, "ask-kerr-personal-question"); s = step(s, "keep-kerr-personal-answer"); assert.throws(() => step(s, "ask-kerr-personal-question"));
    for (const sceneId of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) assert.match(aftermath({ ...s, sceneId }).find((r) => r.title === "Kerr’s collection")!.text, /promise was broken.*acknowledged.*earlier sale/s);
  });
  it("denial closes contact without deleting the promise, register or earlier betrayal", () => {
    let s = step(step(depart(plan("gate", "ramp")), "route-use-sensor", 8), "record-kerr-receipt"); s = step(visit(s), "answer-kerr-breach"); s = importRun(exportRun(step(s, "deny-kerr-disclosure")));
    assert.throws(() => step(s, "ask-kerr-personal-question")); assert.throws(() => step(s, "visit-kerr-collection")); assert.equal(s.flags.kerr_route_trace, true); assert.equal(s.journal.find((j) => j.id === "kerr-collection-promise")?.kind, "promise");
  });
  for (const [exit, method, traced] of [["ramp", "route-use-sensor", true], ["gap", "route-use-gap", false], ["walk", "route-use-stairs", false], ["gap", "route-negotiate", true]] as const) it(`keeps failure and recovery honest for ${method}`, () => {
    let s = depart(plan("stairs", exit)); s = importRun(exportRun(stageCheck(s, method, 1))); s = step(s, method, 1);
    assert.equal(s.sceneId, "act2_route_recovery"); assert.equal(Boolean(s.flags.kerr_route_trace), traced); assert.throws(() => step({ ...s, sceneId: "act2_route_crossing" }, method, 10));
    const courier = step(s, "fund-kerr-courier"); assert.equal(courier.creds, s.creds - 20); assert.equal(courier.flags.kerr_route_trace, true); assert.equal(courier.flags.kerr_route_delivered, undefined);
    assert.equal(step(courier, "record-kerr-receipt").flags.kerr_route_delivered, true);
    s = step({ ...s, creds: 0 }, "leave-kerr-case-held"); assert.equal(s.flags.kerr_route_delivered, undefined); assert.equal(objectives(s)[0].status, traced ? "Compromised" : "Unresolved");
    s = visit(s); if (traced) { s = step(s, "answer-kerr-breach"); s = step(s, "acknowledge-kerr-disclosure"); } else s = step(s, "acknowledge-private-collection");
    s = step(s, "ask-kerr-personal-question"); assert.match(sceneText(getScene(s.sceneId), s), /replacement is still at the depot/);
  });
  it("honors consented registration and honest refusal without pretending receipt", () => {
    let s = step(step(depart(plan("gate", "ramp", "registered")), "route-use-sensor", 8), "record-kerr-receipt"); assert.equal(objectives(s)[0].status, "Complete");
    assert.throws(() => step(visit(s), "answer-kerr-breach"));
    s = step(step(base(), "answer-kerr-collection"), "decline-kerr-collection"); s = step(visit(s), "acknowledge-kerr-collection"); s = step(s, "ask-kerr-personal-question");
    assert.match(sceneText(getScene(s.sceneId), s), /replacement is still at the depot/); assert.doesNotMatch(sceneText(getScene(s.sceneId), s), /received case/);
  });
});
