import { allocationOffer, commitAllocation, noticeSchedule, NOTICE_SCHEDULE_FLAGS, NOTICE_SCHEDULES } from "../notice-allocation";
import type { Choice, Scene } from "../types";

const revise: Choice = { id: "revise-notice-allocation", label: "Revise the allocation. No charge for a draft.", hideIfFlag: "notice_allocation_committed", next: "act2_notice_allocation" };
const defer: Choice = { id: "defer-notice-allocation", label: "Leave the plan unresolved with clinic staff.", hideIfFlag: "notice_allocation_committed", effects: { flags: ["notice_done", "notice_unresolved"] }, next: "act2_middle" };
const resume: Choice = { id: "resume-notice-allocation-receipt", label: "Record the already accepted dispatch; do not pay again.", requireFlag: "notice_allocation_committed", next: "act2_notice_receipt" };

export const ALLOCATION_SCENES: Record<string, Scene> = {
  act2_notice_allocation: {
    id: "act2_notice_allocation", location: "Clinic dispatch desk, Glass Chapel", speaker: "Sister Lumen",
    text: s => `${s.flags.notice_allocation_committed ? "Dispatch already accepted. Record the existing receipt without spending again.\n\n" : noticeSchedule(s) ? `Saved draft: ${noticeSchedule(s)!.early} early / ${noticeSchedule(s)!.late} later. No dispatch accepted yet.\n\n` : ""}Six sealed appointment cards. The clinic can receive four people in the early window and three in the later one. Dispatch can carry four cards early, but only two later. Nobody's home belongs on its return slip.\n\nA four/two split fits both services. A three/three split fits the clinic but needs help with one later card. Six early overloads the clinic even if a courier can carry the paper. Draft a split, then offer a return contact. Changing a draft costs nothing; accepting dispatch commits the work or fare once.`,
    choices: [
      ...NOTICE_SCHEDULES.map((p): Choice => ({ id: `allocate-notice-${p.id}`, label: `Draft ${p.early} early / ${p.late} later.`, hideIfFlag: "notice_allocation_committed", effects: { flags: [`notice_schedule_${p.id}`], flagsOff: NOTICE_SCHEDULE_FLAGS.filter(f => f !== `notice_schedule_${p.id}`) }, next: "act2_notice_allocation_review" })),
      { id: "pause-notice-allocation", label: "Pause with the draft saved; arrange nothing yet.", hideIfFlag: "notice_allocation_committed", next: "act2_middle" },
      defer, resume,
    ],
  },
  act2_notice_allocation_review: {
    id: "act2_notice_allocation_review", location: "Clinic dispatch desk, Glass Chapel", speaker: "Sister Lumen",
    text: s => { const p = noticeSchedule(s); return `${p ? `Draft: ${p.early} early / ${p.late} later, six cards in total.` : "The saved draft has no single allocation. Choose a split again before offering it."}\n\nClinic capacity: four early / three later. Dispatch capacity: four early / two later. An appointment window and a courier load are different limits. The clinic offers its desk as a private return contact. A housing list would let dispatch call on homes, which Lumen will refuse.\n\nCompare the draft with both services. No roll changes these capacities or Lumen's answer.`; },
    choices: [
      { id: "offer-notice-clinic-contact", label: "Offer this schedule with the clinic as return contact.", requireAnyFlag: NOTICE_SCHEDULE_FLAGS, hideIfFlag: "notice_allocation_committed", effects: s => ({ flags: [allocationOffer(s) === "act2_notice_capacity" ? "notice_plan_invalid" : allocationOffer(s) === "act2_notice_counter" ? "notice_capacity_countered" : "notice_plan_feasible"] }), next: allocationOffer },
      { id: "offer-notice-home-contact", label: "Propose the housing list as a return contact.", detail: "Lumen refuses patient homes regardless of your standing. No list will be dispatched.", requireAnyFlag: ["notice_schedule_42", "notice_schedule_33"], hideIfAnyFlag: ["notice_privacy_refused", "notice_allocation_committed"], effects: { flags: ["notice_privacy_refused"], journal: [{ id: "notice-privacy-refusal", kind: "fact", text: "Lumen refused a home-list return contact. No patient homes were dispatched; a revised clinic contact can be offered." }] }, next: "act2_notice_privacy_refusal" },
      revise, defer, resume,
    ],
  },
  act2_notice_capacity: {
    id: "act2_notice_capacity", location: "Clinic dispatch desk, Glass Chapel", speaker: "Sister Lumen",
    text: s => `${noticeSchedule(s)?.id === "60" ? "Lumen draws a line after the fourth early slot. 'Carrying six papers isn't six places in the room. The last two would arrive to a full window.'" : "The saved draft does not identify one usable allocation. Choose one split before comparing capacities."}\n\nThis is a flawed schedule, not a refused private channel or a failed delivery. No fee, work or dispatch was committed. Revise the split, or leave staff to arrange it.`,
    choices: [revise, defer, resume],
  },
  act2_notice_privacy_refusal: {
    id: "act2_notice_privacy_refusal", location: "Clinic dispatch desk, Glass Chapel", speaker: "Sister Lumen",
    text: "Lumen places the housing sheet back in her drawer. 'No. Give them my desk, not somebody else's front door.'\n\nThe schedule can still be feasible; this return contact is not accepted. Standing and pressure cannot change her refusal. Keep it recorded and revise to the clinic contact, use an existing private channel, or leave the plan unresolved. No list, fee or delivery was committed.",
    choices: [revise, { id: "leave-notice-allocation-channel", label: "Compare the existing distribution channels instead.", hideIfFlag: "notice_allocation_committed", next: "act2_notice_methods" }, defer, resume],
  },
  act2_notice_offer: {
    id: "act2_notice_offer", location: "Clinic dispatch desk, Glass Chapel", speaker: "Sister Lumen",
    text: "Four early, two later. The dispatcher fits both bundles against the route slots. 'I can take that split if you carry the clinic's return bundle to this desk.' Lumen agrees to receive unclaimed cards through the clinic.\n\nAccepting commits one strain of carrying work, with no fare or home list. The desk then accepts the six sealed cards. This will be dispatch acceptance; later replies still have to establish any patient receipt.",
    choices: [
      { id: "accept-notice-standard", label: "Carry the return bundle. Add 1 strain; accept four/two dispatch.", requireFlag: "notice_schedule_42", hideIfFlag: "notice_allocation_committed", effects: s => commitAllocation(s, "standard"), next: s => s.flags.notice_allocation_committed ? "act2_notice_receipt" : "act2_notice_capacity" },
      revise, defer, resume,
    ],
  },
  act2_notice_counter: {
    id: "act2_notice_counter", location: "Clinic dispatch desk, Glass Chapel", speaker: "Sister Lumen",
    text: "Three early, three later fits the clinic. The dispatcher has only two later route slots. 'I won't promise the third. Carry it to the later desk yourself, fund another carrier, or change the split.'\n\nYour extra trip adds two strain. An extra carrier costs ten creds. Both retain the clinic return contact and sealed cards. This counteroffer adds no names to a public board and promises no patient attendance. You can revise to four/two without a fare, or leave the offer unaccepted.",
    choices: [
      { id: "accept-notice-extra-trip", label: "Carry the extra later card. Add 2 strain; accept three/three dispatch.", requireFlag: "notice_schedule_33", hideIfFlag: "notice_allocation_committed", effects: s => commitAllocation(s, "carry"), next: s => s.flags.notice_allocation_committed ? "act2_notice_receipt" : "act2_notice_capacity" },
      { id: "fund-notice-extra-carrier", label: "Pay ten creds for an extra later carrier.", requireFlag: "notice_schedule_33", hideIfFlag: "notice_allocation_committed", requireCreds: 10, effects: s => commitAllocation(s, "paid"), next: s => s.flags.notice_allocation_committed ? "act2_notice_receipt" : "act2_notice_capacity" },
      revise, defer, resume,
    ],
  },
};
