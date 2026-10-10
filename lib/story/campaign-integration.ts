import { chapelAccessRecord } from "../campaign-consequences";
import { chapelMethodResponse } from "../encounter-methods";
import type { Choice, Scene } from "../types";

export const chapelReturnChoice: Choice = {
  id: "visit-chapel-return", label: "Ask Lumen what your Chapel route left behind.",
  requireAnyFlag: ["chapel_window_started", "chapel_method_chrome", "chapel_method_face", "chapel_service_refused"],
  hideIfFlag: "chapel_response_heard", next: "act3_chapel_return",
};

export const INTEGRATION_SCENES: Record<string, Scene> = {
  act3_chapel_return: {
    id: "act3_chapel_return", location: "Clinic desk, Ward Nine", speaker: "Sister Lumen",
    text: s => {
      const method = chapelMethodResponse(s);
      const unfinished = !method && s.flags.chapel_window_started ? s.flags.chapel_window_expired || s.flags.chapel_window_failed ? "'The service window ended outside. You found another door; the patrol still noticed.'" : "'There is no departure on that plan. Don't give it an ending it hasn't earned.'" : "";
      const refused = s.flags.chapel_service_refused ? "The rejected work slip stays on the desk. 'They kept the tool fee, not your promise. You owe no shift for a bargain they refused.'" : "";
      return `Lumen puts the Chapel docket beside her cup. 'A door is a small thing until someone has to answer for it.'${method ? `\n\n${method}` : ""}${unfinished ? `\n\n${unfinished}` : ""}${refused ? `\n\n${refused}` : ""}\n\n${s.flags.betrayed_lumen ? "She leaves your marker under the docket. 'You sold my week. Coming back to this desk doesn't unsell it.'" : "She slides the cup toward you. 'Sit a minute. The next person through that door will need their own answer.'"}`;
    },
    choices: [{ id: "record-chapel-return", label: "Keep the actual reply. Return to the neighbors.", effects: s => ({ flags: ["chapel_response_heard"], journal: [{ id: "chapel-return-response", kind: "fact", text: [chapelMethodResponse(s), chapelAccessRecord(s), "You returned to Lumen to hear the Chapel record. No work was completed, watch erased or permission granted by this visit."].filter(Boolean).join(" ") }] }), next: "act3_neighborhood" }],
  },
};
