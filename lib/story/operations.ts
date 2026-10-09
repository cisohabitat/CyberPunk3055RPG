import { freightVisitChoice } from "./freight";
import { kitBonuses } from "../loadout";
import type { GameState, Scene } from "../types";

// Existing saves already at a transfer retain their route. New briefed missions
// pause for witness review before an account can be attached.
export const witnessArrival = (state: GameState) => state.flags.witness_briefed ? "act2_witness_arrival" : "act2_witness_safe";

export const OPERATION_SCENES: Record<string, Scene> = {
  act2_witness_brief: {
    id: "act2_witness_brief", location: "Witness room, Glass Chapel", speaker: "Nia Pell",
    text: "Nia has her shoes on. She has not packed the photograph on the bedside shelf.\n\n\"You promised a witness. I promised nothing to a transmitter. I need care, a room they don't own, and a say in which words leave it. Can you do those separately?\"\n\nLumen lays the transfer form beside the photograph. Nia asks you to leave the address field blank. The move is urgent; the recording can wait.",
    choices: [
      { id: "agree-terms", label: "Agree. Move her first; she reviews any account.", detail: "Prepare a transfer. Safety is not permission to publish.", effects: { flags: ["witness_briefed"] }, next: "act2_witness_plan" },
      { id: "leave-brief", label: "Admit you cannot make that promise yet.", detail: "Return to the canal. Her location stays private; the move remains open.", next: "act2_middle" },
    ],
  },
  act2_witness_plan: {
    id: "act2_witness_plan", location: "Canal service map", speaker: "Sister Lumen",
    text: "A chair, two bridges, one scanner. Lumen marks the clinic entrance on the back of a meal receipt.\n\nThere is time for one piece of preparation before the orderly brings Nia down. Read the scanner, learn the patrol gap, arrange an escort, or steady the chair. Each leaves a different way through. You can also spend a room reservation or freight clearance you already earned.",
    choices: [
      { id: "read-scanner", label: "Inspect the scanner's transfer protocol.", check: { itemBonuses: kitBonuses("chrome"), stat: "chrome", dc: 8, label: "Read the transfer scanner" }, successEffects: { flags: ["witness_scanner"] }, failEffects: { flags: ["witness_alert"], strain: 1 }, resultSuccess: "The scanner accepts a clinic signature without a tenancy field. You copy the form's structure, not a patient's identity.", resultFail: "The scanner logs the query. The desk will be looking for a transfer now.", nextSuccess: "act2_witness_door", nextFail: "act2_witness_door" },
      { id: "scout-patrol", label: "Walk the patrol's return route.", check: { itemBonuses: kitBonuses("ghost"), stat: "ghost", dc: 7, label: "Scout the canal crossing" }, successEffects: { flags: ["witness_scouted"] }, failEffects: { flags: ["witness_alert"], strain: 1 }, resultSuccess: "The patrol doubles back at the lift. The service hatch stays unwatched for one crossing.", resultFail: "The patrol notices the second pass. You still know the route, but the window closes.", nextSuccess: "act2_witness_door", nextFail: "act2_witness_door" },
      { id: "arrange-escort", label: "Ask the clinic for a volunteer escort.", check: { itemBonuses: kitBonuses("face"), stat: "face", dc: 8, label: "Arrange a clinic escort", factionBonuses: [{ faction: "lumen", min: 2, amount: 1, label: "Clinic standing" }] }, successEffects: { flags: ["witness_escort"] }, failEffects: { flags: ["witness_alert"] }, resultSuccess: "A volunteer signs responsibility for the crossing. The room is still your problem.", resultFail: "The request reaches the official desk. Nobody volunteers without a registered room.", nextSuccess: "act2_witness_door", nextFail: "act2_witness_door" },
      { id: "steady-chair", label: "Brace the chair for the service ramp.", check: { itemBonuses: kitBonuses("nerve"), stat: "nerve", dc: 7, label: "Prepare the transport chair" }, successEffects: { flags: ["witness_braced"] }, failEffects: { strain: 1 }, resultSuccess: "You lock the wheel and lash the frame. The chair can take the narrow ramp without throwing its passenger.", resultFail: "The lock slips against your palm. The main crossing remains available.", nextSuccess: "act2_witness_door", nextFail: "act2_witness_door" },
      { id: "use-existing-plan", label: "Use the resources already in your pocket.", detail: "No preparation bonus. Choose the transfer method next.", next: "act2_witness_door" },
    ],
  },
  act2_witness_arrival: {
    id: "act2_witness_arrival", location: "Witness room, Ward Nine", speaker: "Nia Pell",
    text: "Nia tests the window catch before she sits. No tenancy screen asks for her name. Sera puts a recorder on the table and keeps it switched off.\n\n\"You got me here,\" Nia says. \"Now I want to hear the words before anyone uses them. No address. No photograph. If I stop, you stop.\"\n\nShe takes the photograph from her coat. She did pack it after all.",
    choices: [
      { id: "review-account", label: "Let Nia review and approve her account.", detail: "Record only what she authorizes. Attach it in the next step.", effects: { flags: ["witness_consent"], flagsOff: ["witness_deferred"] }, next: "act2_witness_safe" },
      { id: "defer-account", label: "Give her time. Leave the recorder off.", detail: "Her room is safe; the evidence promise remains open. You can return before closing the week.", effects: { flags: ["witness_deferred"] }, next: "act2_middle" },
    ],
  },
  act2_witness_repair: {
    id: "act2_witness_repair", location: "Glass Chapel", speaker: "Sister Lumen",
    text: "The tower calls the clinic asking for Nia's room number. Lumen lets it ring.\n\n\"We can move her again. It won't erase the first register entry. Say that to her before you call this repaired.\"\n\nA second clinic has an unregistered room. It costs sixty creds, or a clinic favor backed by standing. Her recorded account can stay with Sera while she moves.",
    choices: [
      { id: "fund-second-room", label: "Pay for a second room and a private transfer.", requireCreds: 60, detail: "The old location stays exposed. The tower does not get her new one.", effects: { creds: -60, flags: ["witness_relocated"] }, next: "act2_middle" },
      { id: "clinic-second-room", label: "Call in the clinic's standing for another transfer.", requireFaction: { faction: "lumen", min: 3 }, detail: "Spend two steps of clinic trust. The earlier breach remains recorded.", effects: { factions: { lumen: -2 }, flags: ["witness_relocated"] }, next: "act2_middle" },
      { id: "leave-repair", label: "Leave the clinic to arrange what it can.", detail: "Her current location remains known to Helion.", next: "act2_middle" },
    ],
  },
  act2_public_response: {
    id: "act2_public_response", location: "District board, Ward Four", speaker: "Sera",
    text: (state) => `${state.flags.memory_public_claim ? "Helion has posted a denial beside the district board. It quotes your allegation, then asks who authenticated the issuing key. Neighbors read the denial before the packet." : "A neighbor pins your bounded account beside the district board. She has circled the words 'issuing key unverified' and asks what has changed since the chapel."}\n\n${state.flags.order_verified ? "You now have an independent source for the cancellation. That answers the challenge; it does not clear Mara's signature or give anyone permission to publish Nia's home." : "The receipt is still an export. Calling it proof of its own issuer would make the same leap again."}\n\nSera hands you a pencil. \"What do we put beside it?\"`,
    choices: [
      { id: "answer-with-source", label: "Attach the corroborating source, with locations withheld.", requireFlag: "order_verified", detail: "Explain the source. Keep the signature and later instruction distinct.", effects: { flags: ["memory_response_done", "memory_source_shared"], factions: { wards: 1 } }, next: "act2_middle" },
      { id: "correct-public-claim", label: "Correct the allegation's certainty. Keep the question open.", requireFlag: "memory_public_claim", hideIfFlag: "order_verified", detail: "Lose one step of ward trust. The correction does not authenticate the key.", effects: { flags: ["memory_response_done", "memory_corrected"], factions: { wards: -1, helion: -1 }, journal: [{ id: "packet-correction", text: "The public allegation was corrected: the export records a cancellation, but its issuing key remains unverified.", kind: "claim" }] }, next: "act2_middle" },
      { id: "repeat-public-claim", label: "Repeat the accusation without another source.", requireFlag: "memory_public_claim", hideIfFlag: "order_verified", detail: "Helion escalates the challenge. Some neighbors stop lending the packet their names.", effects: { flags: ["memory_response_done", "memory_doubled_down"], factions: { wards: -1, helion: 1 } }, next: "act2_middle" },
      { id: "hold-public-account", label: "Keep the uncertainty visible while looking for a source.", hideIfAnyFlag: ["order_verified", "memory_public_claim"], detail: "Do not claim verification. The current account remains bounded.", effects: { flags: ["memory_response_done"] }, next: "act2_middle" },
    ],
  },
  act3_neighborhood: {
    id: "act3_neighborhood", location: "Ward Nine", speaker: "Sera",
    text: (state) => `The way to the wall passes the clinic and a table where neighbors compare maintenance notices. The people from your week are here before your ending.\n\n${state.flags.witness_relocated ? "Lumen has left a message: Nia's second room is private. The first entry is still on the register." : state.flags.witness_lost ? "A tower inquiry sits unopened on the clinic desk. It names the room your transfer registered." : state.flags.witness_safe ? "The clinic has a blank address field and a message from Nia: ask before visiting." : state.flags.memory_witness || state.flags.memory_redacted ? "The clinic still has a transfer chair waiting. A protected roster did not finish the journey." : "The clinic has no transfer arranged in your name. Your promise concerned the archive."}\n\n${state.flags.memory_doubled_down ? "At the records table, a neighbor has stopped signing your packet." : state.flags.memory_corrected ? "At the records table, your correction is clipped to the allegation. Neither has been erased." : state.flags.memory_source_shared ? "At the records table, the independent source is attached. People can inspect the chain without a home address." : "At the records table, the export is still being compared with what people remember."}\n\nYou can hear what changed before going to the wall.`,
    choices: [
      freightVisitChoice(),
      { id: "visit-notice", label: "Ask Lumen what happened to the clinic notice.", requireFlag: "notice_done", hideIfFlag: "visited_notice", next: "act3_notice_visit" },
      { id: "return-notice-response", label: "Return to Lumen about the observed clinic window.", requireAllFlags: ["visited_notice", "notice_monitored"], hideIfFlag: "notice_repair_done", next: "act3_notice_repair" },
      { id: "visit-pump", label: "See what became of the coolant emergency.", requireFlag: "pump_done", hideIfFlag: "visited_pump", next: "act3_pump_visit" },
      { id: "visit-nia", label: "Ask whether Nia wants a visitor.", requireAnyFlag: ["witness_safe", "witness_lost"], hideIfFlag: "visited_nia", next: "act3_witness_visit" },
      { id: "visit-records", label: "Sit at the records table.", hideIfFlag: "visited_records", next: "act3_records_visit" },
      { id: "return-edda-payroll", label: "Return to Edda about a private payroll request.", requireAllFlags: ["archive_custody", "visited_edda"], requireAnyFlag: ["edda_exposed", "archive_method_face", "archive_method_nerve"], hideIfFlag: "edda_shift_done", next: "act3_edda_terms" },
      { id: "visit-edda", label: "Answer Edda’s message about the archive.", requireFlag: "archive_custody", hideIfFlag: "visited_edda", next: "act3_edda_visit" },
      { id: "go-wall", label: "Go directly to the names.", next: "ward_wall" },
    ],
  },
  act3_witness_visit: {
    id: "act3_witness_visit", location: "Witness room, Ward Nine", speaker: "Nia Pell",
    text: (state) => `${state.flags.witness_relocated ? "Nia answers through the clinic relay. 'The second room is quiet. The first one still gets calls. Both belong in your account.'" : state.flags.witness_lost ? "Nia agrees to a call through Lumen. 'They know the room. Don't tell the wall I was protected because you still have my words.'" : "Nia agrees to a visit through Sera. She has put the photograph where she can see it from bed. 'The room is mine to name. That matters more than what you called the job.'"}\n\n${state.journal.some((entry) => entry.id === "nia-account") ? "Her approved account is with Sera. She asks you to describe its source without turning her into a symbol." : "The recorder is still off. She has not given you an account to attach. A safe room bought no testimony."}\n\nShe asks which part you will remember when the wall asks for a sentence.`,
    choices: [
      { id: "ask-nia-contact", label: "Ask how Nia wants future contact handled.", hideIfFlag: "nia_contact_set", next: "act3_nia_contact" },
      { id: "acknowledge-nia", label: "Remember the person and the limits she set.", effects: { flags: ["visited_nia"] }, next: (state) => (state.flags.archive_custody || state.flags.pump_done) ? "act3_neighborhood" : "ward_wall" },
    ],
  },
  act3_nia_contact: {
    id: "act3_nia_contact", location: "Clinic relay, Ward Nine", speaker: "Nia Pell",
    text: (state) => `${state.flags.witness_lost ? "Nia keeps the call on the clinic relay. The first room is still in the register; she will not give you another address." : "Nia closes the photograph before she answers. Her room does not become a return address for your next investigation."}\n\n"If you have another question, leave it with the clinic. I decide whether to answer. Or let this be the last question for a while. I can choose that even if you helped me."\n\n${state.journal.some((entry) => entry.id === "nia-account") ? "Her already approved account stays with Sera under its existing terms. Contact permission changes no recording or public quotation permission." : "There is still no approved account attached. A contact channel is not testimony."}`,
    choices: [
      { id: "accept-clinic-relay", label: "Accept a clinic relay; Nia decides whether to answer.", detail: "No home address or public quotation permission.", effects: { flags: ["visited_nia", "nia_contact_set", "nia_contact_relay"], journal: [{ id: "nia-contact", text: "Nia permits questions to be left through the clinic relay and retains the choice to answer. No home address, recording consent, or public quotation permission was supplied.", kind: "fact" }] }, next: "act3_neighborhood" },
      { id: "give-nia-space", label: "Offer no further questions. Let her pause contact.", detail: "Her existing account and its source limits remain as recorded.", effects: { flags: ["visited_nia", "nia_contact_set", "nia_contact_paused"], journal: [{ id: "nia-contact", text: "You agreed to pause further questions to Nia. Any existing approved account retains its previous terms; no new permission was given.", kind: "fact" }] }, next: "act3_neighborhood" },
    ],
  },
  act3_records_visit: {
    id: "act3_records_visit", location: "Ward Nine records table", speaker: "Sera",
    text: (state) => `${state.flags.order_verified ? "A mechanic has checked the independent source against the export. He points to two decisions: Mara's signature, then the cancellation. 'Now I can ask two questions instead of repeating one accusation.'" : "A mechanic has put a question mark beside the issuing key. 'The file says evacuation was canceled. I still need to know who sent it. Don't rub out the question mark because the wall is waiting.'"}\n\n${state.flags.memory_doubled_down ? "He has crossed his name off the distribution list. He will read a new source; he will not repeat the same unsupported certainty." : state.flags.memory_corrected ? "Your correction stays attached to the original packet. He says a correction is worth keeping because the first sentence already traveled." : "He keeps both the source and its limits in view."}\n\nSera closes the ledger. The names on the wall do not settle this inquiry. They tell you why it has to continue.`,
    choices: [{ id: "keep-limits", label: "Leave the source and its limits available for inspection.", effects: { flags: ["visited_records"] }, next: (state) => (state.flags.archive_custody || state.flags.pump_done) ? "act3_neighborhood" : "ward_wall" }],
  },
};
