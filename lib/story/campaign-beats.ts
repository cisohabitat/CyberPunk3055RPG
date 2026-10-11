import type { GameState } from "../types";

type ReturnBeat = {
  label: string;
  when: (state: GameState) => boolean;
  text: string | ((state: GameState) => string);
};

// The saved choice label selects emphasis, never an outcome. Each beat also
// requires the earned flag/journal fact; old or unrecognized logs use the hub's
// neutral fallback. Do not give Ren or Sera private knowledge through these lines.
export const RETURN_BEATS: Record<string, ReturnBeat[]> = {
  act2_middle: [
    { label: "Pause recovery. Keep Kerr's request open.", when: s => s.flags.kerr_route_failed && !s.flags.kerr_route_done && !s.flags.kerr_route_collected, text: "The case stays on the depot shelf. You come back with the failed attempt still yours, but without calling Kerr's request closed. There is time left in the week to decide what you can afford." },
    { label: "Record the observed handover and its actual terms.", when: s => s.flags.kerr_route_delivered, text: s => s.flags.kerr_route_trace
      ? s.flags.kerr_route_private
        ? "Kerr has the closed case; the depot has the name you promised to keep out of its register. The handover is complete. It is one promise you cannot call kept."
        : s.flags.kerr_route_registered
          ? "Kerr has the closed case. His name remains in the register he agreed to. You reach the canal with a handover to remember, not a report about what the brace will do."
          : "Kerr has the closed case. The recipient entry remains in the depot register. You reach the canal with a handover to remember, not a report about what the brace will do."
      : "The closed case is with Kerr, and the depot made no recipient entry. You observed the handover. The delivery is done; what the brace will do is still his to discover." },
    { label: "Leave the case held. Record collection as unresolved.", when: s => s.flags.kerr_route_unresolved, text: "You come back without the case. Kerr's slip stays in your pocket, folded along a promise you have not completed." },
    { label: "Pause with this entry saved.", when: s => s.flags.kerr_route_started && !s.flags.kerr_route_done, text: "The entry route is saved. You have a way into the depot, not a handover. The canal gives you room to decide what the other crossing will cost." },
    { label: "Pause with both crossings saved.", when: s => s.flags.kerr_route_started && !s.flags.kerr_route_done, text: "Both crossings are on the plan. The case is still at the depot. You put the slip away without writing collected on it." },
    { label: "Pause. Keep this task and its costs saved.", when: s => s.flags.depot_started && !s.flags.kerr_route_done, text: "The depot task will wait where you left it. Its costs do not disappear during the walk back. Neither does Kerr's request." },
    { label: "Give her time. Leave the recorder off.", when: s => s.flags.witness_deferred && !s.journal.some(e => e.id === "nia-account"), text: "You keep the quiet Nia asked for. There is no recording to carry back, and no sentence of hers to lend your speech. Ren waits without asking what happened in the room." },
    { label: "Attach Nia's account to the evidence.", when: s => s.flags.witness_done && s.journal.some(e => e.id === "nia-account"), text: "Nia's approved account stays with the evidence. Her room stays out of your conversation with Ren. Junie's name is still here by the grate; knowing more has not made it easier to say." },
    { label: "Attach the corroborating source, with locations withheld.", when: s => s.flags.memory_source_shared && s.flags.order_verified, text: "The packet has another source beside the export now. You have answered the challenge with something people can inspect. Ren's family is still more than the strength of your packet." },
    { label: "Correct the allegation's certainty. Keep the question open.", when: s => s.flags.memory_corrected, text: "You said less than you said the first time. The correction stays beside the allegation; the question has not gone away. At the grate, Junie's name needs no louder claim from you." },
    { label: "Repeat the accusation without another source.", when: s => s.flags.memory_doubled_down, text: "You repeated the accusation. One neighbor stopped lending it their name. Ren is still here, but the walk back supplied no source you did not have before." },
    { label: "Keep the uncertainty visible while looking for a source.", when: s => s.flags.memory_response_done && !s.flags.order_verified, text: "You left the question visible. The export has not become its own proof while you walked back. Ren keeps her feet above the water gathering in the grate." },
    { label: "Keep both decisions attached.", when: s => s.flags.archive_done && s.flags.order_verified, text: s => s.flags.archive_key_authenticated
      ? "You carry a reader-authenticated key match beside the earlier signature. The two decisions do not become one. At the canal, Ren is still waiting for what you will do with their names."
      : "You carry independent corroboration beside the export. It supports the cancellation without supplying a digital-key match. Ren is still waiting for what you will do with the names." },
    { label: "Record the gap. Keep the export.", when: s => s.flags.archive_done && s.flags.archive_unresolved, text: "You came back with the export and a gap beside it. The archive did not give you the missing source. Ren has not become less certain of who Junie was." },
    { label: "Pause the ledger request and return later.", when: s => s.flags.archive_paused && !s.flags.archive_done, text: "The ledger request stays at Edda's desk. You bring back the export and the failed archive attempt, with no new source attached. Ren's canal has room for a pause; it cannot make the missing record appear." },
    { label: "Keep the dispatch stub. Leave the desk’s answer open.", when: s => s.flags.response_done && s.flags.response_sent, text: "Mara kept her copy. You kept the dispatch stub. There is a private answer on its way to the desk, and no reply from the desk yet. The street is a different audience." },
    { label: "Leave the repair record with the neighborhood.", when: s => s.flags.pump_done && s.flags.pump_restored && s.flags.pump_local, text: "The gauge held when you left. The neighborhood has the repair record. For once the work was a circuit you could fix; Junie's name waits by a different kind of failure." },
    { label: "Return to the unfinished work.", when: s => s.flags.week_recovered, text: "You no longer have to unclench your hands before opening them. The rest helped you. The promises outside the clinic still need their own answers." },
    { label: "Record private dispatch acceptance; delivery remains unobserved.", when: s => s.flags.notice_done && s.flags.notice_private_confirmed, text: "The clinic has accepted private dispatch. The cards have not become observed deliveries just because you reached the canal. You leave the waiting with the work, rather than calling it finished." },
    { label: "Record the public window and its monitoring risk.", when: s => s.flags.notice_done && s.flags.notice_public_route, text: "The notice has a public window. It has an audience you cannot choose, too. At the grate you still have to decide who hears the larger story of this week." },
  ],
  act3_arrival: [
    { label: "Leave her answer and its limits in her own name.", when: s => s.flags.response_visit, text: s => s.flags.response_received
      ? "Mara's reply reached the unanswered queue. You leave her name on her answer, not on a finding the desk has never made. Sera's pencil waits above a different list."
      : s.flags.response_sent
        ? "Mara's reply was dispatched, but you bring no observed desk reply back to the wall. Sera's pencil waits above the names that were here before that request."
        : "Mara still has the envelope. You bring no desk reply back to the wall. Sera's pencil waits above the names that were here before that request." },
    { label: "Keep the contact limit without adding her name to the statement.", when: s => s.flags.lumen_boundary_visit && (s.flags.lumen_contact_limited || s.flags.lumen_private_contact), text: s => s.flags.lumen_contact_limited
      ? "Lumen left the desk open for messages, not a partnership. Your earlier choice still stands between you. Sera turns her pencil toward the wall; speaking here cannot answer for Lumen."
      : "You may leave Lumen a private message. Whether she answers is hers to decide. At the wall, Sera waits for an answer that belongs to you." },
    { label: "Keep the receipt and the limits in his own words.", when: s => s.flags.kerr_route_visit, text: s => s.flags.kerr_route_delivered
      ? "Kerr kept the case closed while you talked. You bring back his account of the handover, not a story about a cure. Sera's pencil is still poised above the wall."
      : "Kerr left collected blank. You bring that unfinished line back with you. It cannot decide what you say to Sera." },
    { label: "Acknowledge the broken terms. Keep the docket attached.", when: s => s.flags.kerr_route_acknowledged && s.flags.kerr_route_private && s.flags.kerr_route_trace, text: "You named the promise you broke. Kerr kept the docket beside it. Acknowledging the breach did not take his name out of the register; speaking at the wall will be another act." },
    { label: "Insist the register does not break my promise.", when: s => s.flags.kerr_route_denied && s.flags.kerr_route_private && s.flags.kerr_route_trace, text: "You argued with Kerr's account of the register. His name is still there. Sera has a pencil, not a way to make that disagreement disappear." },
    { label: "Keep the small answer without turning it into a favor.", when: s => s.flags.kerr_question_done, text: "Kerr wants an ordinary walk to an ordinary table. You carry his hope back without making it a result the closed case has proved. Sera waits beside the names of people who lost their ordinary mornings." },
    { label: "Keep his recommendation separate from the outcome.", when: s => s.flags.quill_route_visit, text: "Quill's letter and your outcome are separate lines. You leave them that way. At the wall, Sera has no fee to offer for what you say next." },
    { label: "File the public account with its sources and limits.", when: s => s.flags.testimony_published, text: "The public account is filed. Someone can question it after you leave. Sera turns from the records table to the wall: the account is there, but the names are still waiting for a voice." },
    { label: "Withdraw the draft and keep the sources in private custody.", when: s => s.flags.testimony_withdrawn, text: "You withdrew the draft. That does not undo what the hearing's listeners already heard. Sera turns back to the wall; the names still offer a smaller thing you can say." },
  ],
};

export function campaignReturnBeat(state: GameState): string | null {
  const label = state.log.at(-1);
  const beat = RETURN_BEATS[state.sceneId]?.find(entry => entry.label === label && entry.when(state));
  return beat ? typeof beat.text === "function" ? beat.text(state) : beat.text : null;
}
