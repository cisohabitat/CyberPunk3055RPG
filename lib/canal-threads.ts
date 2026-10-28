import type { VisibleChoice } from "./engine";

/** Explicit navigation only; canonical choices retain their order and numbers. */
export const CANAL_THREADS = [
  { id: "sources", title: "Sources and the neighborhood", choices: ["hear-response", "trace-order", "resume-archive-recovery"] },
  { id: "care", title: "Witness care and the clinic", choices: ["help-clinic-notice", "help-clinic-pump", "take-recovery", "protect-witness", "return-witness", "repair-location", "hear-witness-pause", "hear-witness-account", "hear-witness-clinic", "hear-witness-move"] },
  { id: "promises", title: "People, work and promises", choices: ["work-witness-shift", "work-depot-return-shift", "work-chapel-shift", "hear-mara-response", "answer-kerr-collection", "pay-tab", "refuse-tab"] },
] as const;

export function canalThreads(sceneId: string, choices: VisibleChoice[]) {
  if (sceneId !== "act2_middle") return [];
  return CANAL_THREADS.map(thread => ({ id: thread.id, title: thread.title,
    choices: choices.filter(choice => choice.enabled && (thread.choices as readonly string[]).includes(choice.id)),
  })).filter(thread => thread.choices.length > 0);
}
