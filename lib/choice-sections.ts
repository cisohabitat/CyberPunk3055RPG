/** Presentation only. Explicit authored membership; choices keep canonical order and numbers. */
export const CHOICE_SECTIONS: Record<string, { title: string; choices: string[] }[]> = {
  stall: [
    { title: "Questions and terms", choices: ["ask-pay", "ask-why", "ask-chapel", "ask-owner"] },
    { title: "Accept the job", choices: ["accept"] },
  ],
  route: [
    { title: "Plan your entry", choices: ["begin-chapel-window", "prepare-chapel-method"] },
    { title: "Choose a door", choices: ["pass", "use-pass", "hatch", "side"] },
  ],
  kerr: [
    { title: "Talk to Kerr", choices: ["tell-truth", "bluff-kerr", "talk-leave"] },
    { title: "Act under pressure", choices: ["slip", "fight", "dose", "crash", "copy-hot"] },
    { title: "Consider different terms", choices: ["kerr-open-terms"] },
  ],
  act2_witness_door: [
    { title: "Review support", choices: ["compare-witness-support"] },
    { title: "Use a room or guarantee", choices: ["use-shelter", "use-freight", "quill-room", "pay-room"] },
    { title: "Attempt the crossing", choices: ["slip-witness", "chrome-transfer", "face-transfer", "ghost-transfer", "nerve-transfer"] },
    { title: "Leave it open", choices: ["leave-witness"] },
  ],
  act2_archive_door: [
    { title: "Test the source", choices: ["trace-receipt", "isolate-key", "request-invoice", "lift-carbon", "hold-reader"] },
    { title: "Leave it open", choices: ["leave-archive"] },
  ],
  ward_wall: [
    { title: "Ask about the neighborhood", choices: ["visit-shelter-neighbors", "visit-spire-key", "visit-asa"] },
    { title: "Approach the names", choices: ["face-sera", "read-third"] },
  ],
  act3_neighborhood: [
    { title: "People and unfinished work", choices: ["craft-return-edda", "payoff-return-draft", "visit-chapel-return", "visit-shelter-neighbors", "visit-spire-key", "visit-asa", "visit-notice", "return-notice-response", "visit-pump", "visit-nia", "visit-records", "return-edda-payroll", "visit-edda"] },
    { title: "Return to the wall", choices: ["go-wall"] },
  ],
};
export function choiceSection(sceneId: string, choiceId: string): string | undefined {
  return Object.hasOwn(CHOICE_SECTIONS, sceneId) ? CHOICE_SECTIONS[sceneId].find(section => section.choices.includes(choiceId))?.title : undefined;
}
