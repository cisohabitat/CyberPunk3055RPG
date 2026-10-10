import type { Effect, GameState } from "./types";

export const NOTICE_SCHEDULES = [
  { id: "42", early: 4, late: 2 },
  { id: "33", early: 3, late: 3 },
  { id: "60", early: 6, late: 0 },
] as const;
export const NOTICE_SCHEDULE_FLAGS = NOTICE_SCHEDULES.map(p => `notice_schedule_${p.id}`);
export function noticeSchedule(s: GameState) {
  const plans = NOTICE_SCHEDULES.filter(p => s.flags[`notice_schedule_${p.id}`]);
  return plans.length === 1 ? plans[0] : undefined;
}
export function allocationOffer(s: GameState): string {
  const p = noticeSchedule(s);
  return !p || p.early > 4 || p.late > 3 ? "act2_notice_capacity" : p.late > 2 ? "act2_notice_counter" : "act2_notice_offer";
}
export function commitAllocation(s: GameState, channel: "standard" | "carry" | "paid"): Effect {
  const p = noticeSchedule(s);
  if (s.flags.notice_allocation_committed || !p || (channel === "standard" ? p.id !== "42" : p.id !== "33")) return {};
  return {
    strain: channel === "paid" ? 0 : channel === "carry" ? 2 : 1,
    creds: channel === "paid" ? -10 : 0,
    flags: ["notice_allocation_committed", "notice_private_confirmed", `notice_allocation_${p.id}`, `notice_allocation_${channel}`],
    journal: [{ id: "notice-allocation", kind: "fact", text: `Dispatch accepted six sealed cards: ${p.early} early and ${p.late} later, with the clinic as return contact. ${channel === "paid" ? "Ten creds funded an extra later carrier." : channel === "carry" ? "You carried the extra later card to dispatch for two strain." : "You carried the clinic return bundle for one strain."} No home list was supplied. Card receipt, appointment attendance and care outcomes remain unobserved.` }],
  };
}
export function allocationResponse(s: GameState): string {
  if (!s.flags.notice_allocation_committed) return "";
  const schedule = s.flags.notice_allocation_42 ? "four early and two later" : "three early and three later";
  const effort = s.flags.notice_allocation_paid ? "the extra carrier you funded" : s.flags.notice_allocation_carry ? "your extra later trip" : "your clinic return bundle";
  return `Lumen checks ${schedule} against the dispatch slip. 'That split needed ${effort}. Keep the work beside the plan.'${s.flags.notice_privacy_refused ? " The refused home-list offer remains on her notes; the accepted plan used the clinic instead." : ""}${s.flags.notice_delivery_delayed ? " The earlier crossing still failed; this later dispatch does not turn it into a delivery." : ""}`;
}
