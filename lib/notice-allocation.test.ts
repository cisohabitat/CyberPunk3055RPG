import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, effectPreview, getScene, presentChoices, sceneText } from "./engine";
import { allocationResponse, commitAllocation, noticeSchedule } from "./notice-allocation";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";
const base = (): GameState => ({ ...createCharacter({ handle: "Allocation", givenName: "Ada", origin: "dustline", bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 } }), sceneId: "act2_notice_methods", creds: 0, strain: 0, flags: { notice_started: true, notice_map: true, notice_slip: true, notice_card: true, memory_prepared: true } });
function step(s: GameState, id: string) { const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled); assert.ok(c, `${s.sceneId}:${id}`); assert.equal(c.check, undefined); return commitChoice(s, c).state; }
function draft(id: string) { return step(step(base(), "compare-notice-allocation"), `allocate-notice-${id}`); }
describe("clinic schedule and workload negotiation", () => {
  it("saves a draft through pause and source review without spending or accepting dispatch", () => {
    let s = step(draft("33"), "revise-notice-allocation"); s = step(s, "pause-notice-allocation"); s = importRun(exportRun(s));
    for (const id of ["help-clinic-notice", "accept-notice", "plan-notice", "compare-notice-allocation"]) s = step(s, id);
    assert.equal(noticeSchedule(s)?.id, "33"); assert.equal(s.creds, 0); assert.equal(s.strain, 0); assert.equal(s.flags.notice_private_confirmed, undefined);
  });
  it("distinguishes an overloaded clinic from a refused contact and a delayed delivery", () => {
    let s = step(draft("60"), "offer-notice-clinic-contact"); assert.equal(s.sceneId, "act2_notice_capacity"); assert.equal(s.flags.notice_plan_invalid, true);
    for (const flag of ["notice_privacy_refused", "notice_delivery_delayed", "notice_private_confirmed"]) assert.equal(s.flags[flag], undefined);
    s = step(s, "revise-notice-allocation"); s = step(s, "allocate-notice-42"); s = step(s, "offer-notice-clinic-contact"); assert.equal(s.sceneId, "act2_notice_offer"); assert.equal(s.creds, 0); assert.equal(s.strain, 0);
  });
  it("a feasible split with a home contact is refused even at maximum standing", () => {
    let s = draft("42"); s.factions.lumen = 5; s = step(s, "offer-notice-home-contact"); assert.equal(s.sceneId, "act2_notice_privacy_refusal");
    assert.equal(s.flags.notice_privacy_refused, true); assert.equal(s.flags.notice_private_confirmed, undefined); assert.equal(s.flags.witness_consent, undefined); assert.equal(s.flags.nia_public_consent, undefined);
    for (const id of ["revise-notice-allocation", "allocate-notice-42"]) s = step(s, id); assert.throws(() => step(s, "offer-notice-home-contact"));
    s = step(step(s, "offer-notice-clinic-contact"), "accept-notice-standard"); assert.equal(s.flags.notice_privacy_refused, true); assert.equal(s.strain, 1); assert.ok(s.journal.some(j => j.id === "notice-privacy-refusal"));
  });
  it("four/two dispatch commits one return workload, with receipt still unobserved", () => {
    let s = step(draft("42"), "offer-notice-clinic-contact"); s = step(s, "accept-notice-standard"); s = importRun(exportRun(s));
    assert.equal(s.strain, 1); assert.equal(s.flags.notice_done, undefined); assert.equal(s.flags.notice_receipt_observed, undefined); assert.equal(s.flags.order_verified, undefined);
    s = step(s, "record-private-notice"); assert.equal(s.flags.notice_done, true); assert.throws(() => step(s, "accept-notice-standard")); assert.match(allocationResponse(s), /four early and two later/);
  });
  it("three/three fits clinic capacity but needs an additional carrier or the runner's work", () => {
    let s = step(draft("33"), "offer-notice-clinic-contact"); assert.equal(s.sceneId, "act2_notice_counter"); assert.equal(s.flags.notice_capacity_countered, true);
    assert.throws(() => step(s, "fund-notice-extra-carrier")); const carried = step(s, "accept-notice-extra-trip"); assert.equal(carried.strain, 2); assert.equal(carried.creds, 0); assert.equal(carried.flags.notice_receipt_observed, undefined);
    const funded = step({ ...s, creds: 10 }, "fund-notice-extra-carrier"); assert.equal(funded.creds, 0); assert.equal(funded.strain, 0); assert.match(allocationResponse(funded), /extra carrier you funded/);
  });
  it("cost previews match each accepted offer and funds gate the paid counteroffer", () => {
    const s = { ...step(draft("33"), "offer-notice-clinic-contact"), creds: 9 };
    const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === "fund-notice-extra-carrier")!; assert.equal(c.enabled, false); assert.match(c.disabledReason!, /10 creds/); assert.deepEqual(effectPreview({ ...s, creds: 10 }, c), ["-10 cr"]);
  });
  it("can revise a counteroffer to a zero-fare plan or defer without an invented dispatch", () => {
    let s = step(draft("33"), "offer-notice-clinic-contact"); const deferred = step(s, "defer-notice-allocation"); assert.equal(deferred.flags.notice_unresolved, true); assert.equal(deferred.flags.notice_private_confirmed, undefined); assert.equal(deferred.strain, 0);
    s = step(s, "revise-notice-allocation"); s = step(s, "allocate-notice-42"); s = step(step(s, "offer-notice-clinic-contact"), "accept-notice-standard"); assert.equal(s.flags.notice_capacity_countered, true); assert.equal(s.flags.notice_allocation_42, true); assert.equal(s.strain, 1);
  });
  it("later replies preserve two actual acknowledgements, the plan and any earlier refusal", () => {
    let s = step(draft("33"), "offer-notice-home-contact"); for (const id of ["revise-notice-allocation", "allocate-notice-33", "offer-notice-clinic-contact", "accept-notice-extra-trip", "record-private-notice"]) s = step(s, id);
    const text = sceneText(getScene("act3_notice_visit"), s); assert.match(text, /Two sealed cards/); assert.match(text, /three early and three later/); assert.match(text, /refused home-list offer/); assert.match(text, /do not know|does not tell me/);
    assert.equal(s.flags.notice_receipt_observed, undefined);
  });
  it("recovery from an earlier failed delivery can negotiate another channel without erasing failure", () => {
    let s = { ...base(), sceneId: "act2_notice_recovery", flags: { ...base().flags, notice_delivery_delayed: true, notice_attempted: true } };
    for (const id of ["compare-notice-allocation", "allocate-notice-42", "offer-notice-clinic-contact", "accept-notice-standard"]) s = step(s, id);
    assert.equal(s.flags.notice_delivery_delayed, true); assert.equal(s.flags.notice_receipt_observed, undefined); assert.equal(s.flags.notice_private_confirmed, true);
  });
  it("invalid/conflicting or already committed drafts cannot charge again", () => {
    const invalid = { ...base(), flags: { notice_schedule_42: true, notice_schedule_33: true } }; assert.equal(noticeSchedule(invalid), undefined); assert.deepEqual(commitAllocation(invalid, "paid"), {});
    const accepted = step(step(draft("33"), "offer-notice-clinic-contact"), "accept-notice-extra-trip"); assert.deepEqual(commitAllocation(accepted, "carry"), {});
    const recovered = step({ ...accepted, sceneId: "act2_notice_counter" }, "resume-notice-allocation-receipt"); assert.equal(recovered.strain, 2); assert.equal(recovered.sceneId, "act2_notice_receipt");
    assert.match(sceneText(getScene("act2_notice_allocation"), { ...accepted, sceneId: "act2_notice_allocation" }), /already accepted/);
    assert.match(sceneText(getScene("act2_notice_capacity"), invalid), /does not identify one usable/);
  });
});
