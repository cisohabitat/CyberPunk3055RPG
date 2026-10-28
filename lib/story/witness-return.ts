import { WITNESS_RETURN_QUOTES as Q, witnessWorkReply } from "../witness-return";
import type { Scene } from "../types";

export const WITNESS_RETURN_SCENES: Record<string, Scene> = {
  act2_witness_return_private: {
    id: "act2_witness_return_private", location: "Witness room, Ward Nine", speaker: "Nia Pell",
    text: state => {
      const approved = state.journal.some(row => row.id === "nia-account");
      return `Nia has moved the photograph away from the transfer papers. She notices you looking and turns it toward the window, where she wants it. The recorder stays closed.\n\n"${approved ? Q.approved : Q.waiting}"\n\n${witnessWorkReply(state) || "She watches a square of light travel across the shelf. For a moment, nothing in the room is waiting to become evidence."}`;
    },
    choices: [{ id: "keep-witness-room-boundary", label: "Leave the room and her words on her terms.", effects: state => ({ flags: [state.journal.some(row => row.id === "nia-account") ? "witness_return_approved" : "witness_return_waiting"], journal: [{ id: "witness-room-return", kind: "claim", text: "Nia described what the private room means to her. No new recording, public quotation or contact permission was requested or supplied." }] }), next: "act2_middle" }],
  },
  act2_witness_return_registered: {
    id: "act2_witness_return_registered", location: "Clinic relay, Glass Chapel", speaker: "Nia Pell",
    text: `Lumen patches the call through her desk. You hear a cup touch a bed rail. Nia waits until the sound outside her door has passed.\n\n"${Q.registered}"\n\nThe nurse is still caring for her. Neither of you turns that care into a private address.`,
    choices: [{ id: "keep-witness-clinic-boundary", label: "Keep her response beside the cost of the exposed room.", effects: { flags: ["witness_return_registered"], journal: [{ id: "witness-clinic-return", kind: "claim", text: "Nia described hearing her room number outside the clinic door. Medical care did not make the registered location private or supply a new historical source." }] }, next: "act2_middle" }],
  },
  act2_witness_return_relocated: {
    id: "act2_witness_return_relocated", location: "Clinic relay, Ward Nine", speaker: "Nia Pell",
    text: `The clinic relay carries a different room's quiet. Nia gives you no address. A small scrape comes through the line as she moves the photograph.\n\n"${Q.relocated}"\n\nShe ends the call herself. The second move remains in the record beside the first breach.`,
    choices: [{ id: "keep-witness-move-boundary", label: "Keep both moves in the account.", effects: { flags: ["witness_return_relocated"], journal: [{ id: "witness-relocation-return", kind: "claim", text: "Nia described unpacking again. The new room remains private; relocation did not erase the first exposed address or change testimony permission." }] }, next: "act2_middle" }],
  },
  act3_witness_shift_return: {
    id: "act3_witness_shift_return", location: "Clinic desk, Glass Chapel", speaker: "Sister Lumen",
    text: `The clinic relay reaches Lumen between two names on the work board. Your promised shift still has her handwriting beside it. She does not cross your name out.\n\n"${Q.workMissed}"\n\nShe waits for you to answer, then returns to the next name. The work board keeps its own account of your week.`,
    choices: [{ id: "acknowledge-unkept-witness-shift", label: "Acknowledge the work you left to her.", effects: { flags: ["witness_return_shift_heard"], journal: [{ id: "witness-unkept-shift-return", kind: "claim", text: "Lumen said she covered the clinic shift you promised. Hearing her response did not complete that work, erase the promise, grant forgiveness or change Nia's permissions." }] }, next: "act3_witness_visit" }],
  },
};
