import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { commitChoice, createCharacter, getScene, presentChoices, sceneText } from "./engine";
import { campaignCoda, encounterRecords, noticePlanRecord } from "./campaign-consequences";
import { aftermath } from "./evidence";
import { objectives, nextStep, unresolvedPromises } from "./objectives";
import { characterConduct } from "./relationships";
import { promiseStatus } from "./journal";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";

const base = (flags: Record<string, boolean> = {}): GameState => ({ ...createCharacter({ handle: "Integrator", givenName: "Ada", origin: "spire", bonus: { face: 2, chrome: 0, ghost: 0, nerve: 0 } }), sceneId: "act2_middle", flags, strain: 0, creds: 0 });
function step(s: GameState, id: string) { const c = presentChoices(s, getScene(s.sceneId)).find(c => c.id === id && c.enabled); assert.ok(c, `${s.sceneId}:${id}`); return commitChoice(s, c).state; }

describe("campaign integration", () => {
  for (const prefix of ["chapel", "witness"]) it(`${prefix} return work survives portable saves and closes only by actual work`, () => {
    let s = importRun(exportRun(base({ [`${prefix}_shift_owed`]: true, betrayed_lumen: true, witness_lost: true })));
    assert.ok(unresolvedPromises(s).some(row => row.id === `${prefix}-shift`));
    assert.match(nextStep(s), /shift.*open/);
    s = step(s, prefix === "chapel" ? "work-chapel-shift" : "work-witness-shift");
    assert.equal(s.strain, 1); assert.equal(s.flags[`${prefix}_shift_owed`], true);
    assert.equal(objectives(s).find(row => row.id === `${prefix}-shift`)?.status, "Complete");
    assert.match(promiseStatus(`${prefix}-shift-promise`, s.flags), /kept/);
    assert.throws(() => step(s, prefix === "chapel" ? "work-chapel-shift" : "work-witness-shift"));
    assert.equal(s.flags.betrayed_lumen, true); assert.equal(s.flags.witness_lost, true);
    assert.equal(s.flags.witness_consent, undefined); assert.equal(s.flags.order_verified, undefined);
    assert.equal(s.flags.nia_public_consent, undefined);
  });
  it("a zero-fund runner can leave work unresolved through the Week and Wall", () => {
    let s = step(base({ chapel_shift_owed: true, witness_shift_owed: true }), "stand");
    s = step(s, "back-to-board");
    const rows = objectives(s).filter(row => row.id.endsWith("-shift"));
    assert.equal(rows.length, 2); assert.ok(rows.every(row => row.status === "Unresolved"));
    assert.equal(s.creds, 0); assert.equal(s.strain, 0);
  });
  it("hearing Lumen does not complete work, refund a fee or erase attention and betrayal", () => {
    const original = { ...base({ chapel_method_face: true, chapel_shift_owed: true, watched: true, betrayed_lumen: true }), sceneId: "act3_neighborhood" };
    let s = step(original, "visit-chapel-return");
    assert.match(sceneText(getScene(s.sceneId), s), /owe the work.*sold my week/s);
    s = importRun(exportRun(step(s, "record-chapel-return")));
    assert.equal(s.creds, 0); assert.equal(s.strain, 0); assert.equal(s.flags.chapel_shift_kept, undefined);
    assert.equal(s.flags.watched, true); assert.equal(s.flags.betrayed_lumen, true);
    assert.equal(s.journal.filter(row => row.id === "chapel-return-response").length, 1);
    assert.throws(() => step(s, "visit-chapel-return"));
  });
  it("skipping a return conversation never claims it happened", () => {
    const s = base({ chapel_window_started: true, chapel_window_expired: true });
    assert.doesNotMatch(characterConduct(s, "Sister Lumen")!, /returned to hear/);
    assert.ok(presentChoices({ ...base(), sceneId: "act3_neighborhood" }, getScene("act3_neighborhood")).every(c => c.id !== "visit-chapel-return"));
    const contact = step({ ...s, sceneId: "act3_nia_contact" }, "accept-clinic-relay");
    assert.equal(contact.flags.chapel_response_heard, undefined);
    assert.ok(presentChoices(contact, getScene(contact.sceneId)).some(c => c.id === "visit-chapel-return"));
  });
  it("kept volunteer work changes Nia’s reply without buying permission", () => {
    const s = step(base({ witness_shift_owed: true }), "work-witness-shift");
    assert.match(sceneText(getScene("act3_witness_visit"), { ...s, sceneId: "act3_witness_visit" }), /kept your shift.*something I owe/s);
    assert.match(characterConduct(s, "Nia Pell")!, /worked.*owes you nothing.*No public/s);
  });
  for (const [flags, expected] of [
    [{ chapel_window_staffed_exit: true, chapel_window_expired: true, watched: true }, /staffed stair.*allowance ran out.*Earlier attention/s],
    [{ chapel_window_quiet_exit: true, chapel_window_query_seen: true, watched: true }, /quiet exit.*failed reader query.*did not erase/s],
    [{ chapel_window_expired: true, chapel_service_refused: true }, /outside.*ordinary doors.*fee stayed spent.*no return shift/s],
  ] as const) it(`preserves window outcome ${Object.keys(flags)[0]}`, () => {
    const record = encounterRecords(base({ ...flags, chapel_window_started: true })).find(row => row.id === "chapel-access")!;
    assert.match(record.detail, expected); assert.equal(record.open, false);
  });
  it("held and returned rigs keep different costs and earlier registration", () => {
    const held = base({ kerr_method_rig: true, kerr_route_trace: true, kerr_route_private: true, kerr_route_promised: true });
    assert.ok(unresolvedPromises(held).some(row => row.id === "depot-rig"));
    const returned = { ...held, flags: { ...held.flags, kerr_rig_returned: true, kerr_route_delivered: true } };
    assert.equal(objectives(returned).find(row => row.id === "depot-rig")?.status, "Complete");
    assert.match(characterConduct(returned, "Kerr")!, /Private terms broken.*refunded once/s);
    assert.equal(returned.creds, 0); // Reading a receipt never issues another refund.
  });
  for (const method of ["chrome", "nerve", "ghost"]) it(`remembers the ${method} transport at the cast sheet and all four finales`, () => {
    const s = base({ [`witness_method_${method}`]: true, witness_safe: true, witness_lost: true });
    assert.match(characterConduct(s, "Nia Pell")!, /Transport supplied no recording.*earlier exposed location/s);
    for (const sceneId of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) assert.ok(aftermath({ ...s, sceneId }).some(row => row.title === "Nia’s transfer method"));
    assert.equal(s.flags.nia_public_consent, undefined);
  });
  it("unaccepted drafts and refused contacts survive final recaps without becoming dispatch", () => {
    const s = base({ notice_started: true, notice_schedule_33: true, notice_privacy_refused: true, notice_plan_invalid: true });
    assert.match(noticePlanRecord(s), /unaccepted draft.*No dispatch.*capacity conflict.*refused/s);
    assert.ok(unresolvedPromises(s).some(row => row.id === "notice"));
    assert.match(aftermath(s).find(row => row.title === "Clinic allocation proposal")!.text, /No patient receipt/);
    assert.equal(s.flags.notice_allocation_committed, undefined);
  });
  it("accepted plans preserve the actual split, cost, failed crossing and observed replies", () => {
    const s = base({ notice_done: true, notice_allocation_committed: true, notice_allocation_33: true, notice_allocation_paid: true, notice_delivery_delayed: true, notice_privacy_refused: true, notice_receipt_observed: true });
    const text = aftermath(s).find(row => row.title === "Clinic distribution")!.text;
    assert.match(text, /three early and three later.*Ten creds.*refused.*crossing failed.*two private receipt.*attendance remain unknown/s);
    assert.equal(s.creds, 0); assert.equal(s.flags.nia_public_consent, undefined);
  });
  it("inconsistent saved allocation flags do not invent a precise split", () => {
    assert.match(noticePlanRecord(base({ notice_allocation_committed: true, notice_allocation_42: true, notice_allocation_33: true })), /inconsistent.*does not identify/);
  });
  for (const sceneId of ["ending_names", "ending_quiet", "ending_witness", "ending_listed"]) it(`${sceneId} retains historical failures, costs and an opening-motive reflection`, () => {
    const s = { ...base({ opening_identity: true, chapel_shift_owed: true, chapel_service_refused: true, witness_shift_owed: true, betrayed_lumen: true, kerr_method_rig: true, notice_schedule_60: true, notice_privacy_refused: true }), sceneId };
    assert.match(campaignCoda(s)!, /keep your name.*shift waiting.*not Nia/s);
    assert.ok(aftermath(s).some(row => row.title === "Borrowed depot rig" && /deposit remains held/.test(row.text)));
    assert.ok(aftermath(s).some(row => row.title === "Lumen" && /stops using/.test(row.text)));
    assert.ok(aftermath(s).some(row => /unaccepted draft.*refused/s.test(row.text)));
  });
  it("legacy runs have no invented encounter records or personal motive", () => {
    assert.deepEqual(encounterRecords(base()), []); assert.equal(noticePlanRecord(base()), ""); assert.equal(campaignCoda(base()), undefined);
  });
  it("historical access and transport methods are not counted as completed commitments", () => {
    const s = base({ chapel_window_started: true, chapel_window_expired: true, witness_method_chrome: true });
    assert.equal(encounterRecords(s).length, 2);
    assert.deepEqual(objectives(s), []);
  });
});
