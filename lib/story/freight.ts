import { kitBonuses } from "../loadout";
import { openingMotive } from "./opening";
import type { Choice, GameState, Scene } from "../types";

const inspected = ["freight_seal", "freight_manifest", "freight_window"];
const returnFromVisit = (state: GameState) => state.flags.freight_return_wall ? "ward_wall" : "act3_neighborhood";
export function freightVisitChoice(fromWall = false): Choice {
  return { id: "visit-asa", label: "Ask Asa what became of the clinic parcel.", requireOrigin: "dustline", requireAnyFlag: ["freight_started", "freight_declined"], hideIfFlag: "visited_asa", effects: { flags: fromWall ? ["freight_return_wall"] : [], flagsOff: fromWall ? [] : ["freight_return_wall"] }, next: "act3_freight_visit" };
}
export function freightOutcome(state: GameState): string {
  const exposed = state.flags.freight_exposed ? " The earlier service route remains exposed." : "";
  if (state.flags.freight_started && !state.flags.freight_done) return "You accepted the sealed parcel. Keep it cold and observe a clinic stock receipt before claiming delivery." + exposed;
  if (state.flags.freight_late_received) return "A later clinic stock reply confirms receipt of the parcel. Its route was not certified during the week; no passenger clearance was earned. Patient treatment remains unobserved." + exposed;
  if (state.flags.freight_delivered) return state.flags.freight_exposed ? "The clinic acknowledged the sealed parcel. The freight route was exposed and retired; confirmed delivery did not restore a passenger clearance. Patient treatment remains unobserved." : "The clinic acknowledged the sealed parcel through an unregistered handover. Asa supplied one passenger clearance. The receipt establishes delivery, not patient treatment.";
  if (state.flags.freight_declined) return "You declined the parcel. Asa needed another carrier; you observed no clinic receipt.";
  if (state.flags.freight_late_unknown) return "The clinic found no matching stock entry in its reply. The parcel’s eventual delivery remains unknown.";
  if (state.flags.freight_unconfirmed) return "The parcel was left at the clinic intake hatch without an observed receipt. Delivery and treatment remain unconfirmed." + exposed;
  return "The attempt ended before a clinic receipt was observed. Asa still needed a usable carrier; delivery remains unconfirmed." + exposed;
}
const arrived = ["freight_at_intake"];
const finish = (state: GameState) => ({
  flags: ["origin_done", "freight_done", "freight_delivered", ...(!state.flags.freight_exposed ? ["origin_helped", "freight_clearance_earned"] : [])],
  itemsAdd: !state.flags.freight_exposed ? ["burner-route"] : [],
  factions: !state.flags.freight_exposed ? { quill: 1 } : {},
  journal: [{ id: "freight-receipt", text: "The clinic clerk checked the seal and cold indicator, then stamped the diagnostic parcel into stock. No patient names or treatment outcomes were attached.", kind: "fact" as const }],
});

export const FREIGHT_SCENES: Record<string, Scene> = {
  act2_freight_brief: {
    id: "act2_freight_brief", location: "Canal freight gate", speaker: "Asa",
    text: "Asa waits beside a cooling case with the battered courier badge you remember from the flats. ‘This is a diagnostic cartridge. The clinic can use it. My manifest can’t cross this gate.’\n\nThey put a finger on the seal. ‘Keep it cold. Get a stock receipt. No patient names in the book. If our service route stays private, I can spare one passenger clearance afterward. An official handover can get the parcel there, but it retires that route.’\n\nThe clearance is a favor for a completed private delivery, not a promise that someone received treatment. You can inspect the case before choosing a method.",
    choices: [
      { id: "accept-freight-terms", label: "Take responsibility for the sealed parcel and its receipt.", hideIfFlag: "freight_done", effects: { flags: ["freight_started"], journal: [{ id: "freight-promise", text: "You agreed to carry Asa’s sealed diagnostic parcel to clinic stock and seek a receipt, without patient names on the manifest.", kind: "promise" }] }, next: "act2_freight_sources" },
      { id: "decline-freight", label: "Tell Asa to find another carrier.", effects: { flags: ["origin_done", "freight_done", "freight_declined"] }, next: "act2_freight_result" },
    ],
  },
  act2_freight_sources: {
    id: "act2_freight_sources", location: "Canal dispatch table", speaker: "Asa",
    text: (state) => `Asa lays the case, a cargo slip and a gate timetable on the table. You need to know what you carry, where it belongs and when the crossing opens.\n\n${inspected.filter((flag) => state.flags[flag]).length}/3 checked. Each record concerns this delivery; none supplies evidence about the old evacuation order.${state.flags.freight_seal ? "\n\nSeal: intact; the indicator is cold. A staffed cold cabinet is available if the gate closes." : ""}${state.flags.freight_manifest ? "\n\nCargo slip: one diagnostic cartridge, addressed to clinic stock. No patient names. Registration records the courier and route." : ""}${state.flags.freight_window ? "\n\nTimetable: a gap between freight queues. Mapping it can improve a service crossing; it does not guarantee one." : ""}`,
    choices: [
      { id: "inspect-freight-seal", label: "Check the seal and the cold indicator.", hideIfFlag: "freight_seal", effects: { flags: ["freight_seal"], journal: [{ id: "freight-seal", text: "The diagnostic case is sealed and its indicator is in the cold band. The gate has a staffed cold cabinet if the route closes.", kind: "fact" }] }, next: "act2_freight_sources" },
      { id: "inspect-freight-manifest", label: "Read the cargo slip and the clinic stock code.", hideIfFlag: "freight_manifest", effects: { flags: ["freight_manifest"], journal: [{ id: "freight-manifest", text: "The slip identifies one diagnostic cartridge and a clinic stock code. It contains no patient name. A registered handover records the courier and route.", kind: "fact" }] }, next: "act2_freight_sources" },
      { id: "inspect-freight-window", label: "Compare the public gate timetable with the service turn.", hideIfFlag: "freight_window", effects: { flags: ["freight_window"], journal: [{ id: "freight-window", text: "The published gate schedule leaves a service turn between freight queues. Mapping it does not guarantee a silent crossing.", kind: "fact" }] }, next: "act2_freight_sources" },
      { id: "prepare-freight", label: "Choose one preparation for the crossing.", requireAllFlags: inspected, next: "act2_freight_prep" },
    ],
  },
  act2_freight_prep: {
    id: "act2_freight_prep", location: "Canal service turn", speaker: "Asa",
    text: "The next queue is moving. There is time for one preparation: map a gap, isolate the stock reader, arrange an escort or brace the cooling case. Your practiced skill may turn preparation into a different method.\n\nA sealed cold courier costs twenty-five creds. The official desk is free but records the route. Neither method publishes patient names.",
    choices: [
      ...[["scout", "Map the service gap.", "freight_scouted"], ["reader", "Isolate the stock reader.", "freight_reader"], ["escort", "Arrange a freight volunteer’s escort.", "freight_escort"], ["brace", "Brace the cooling case for the ramp.", "freight_braced"]].map(([id, label, flag]) => ({ id: `prep-freight-${id}`, label, requireFlag: id === "reader" ? "perk_chrome" : id === "escort" ? "perk_face" : id === "brace" ? "perk_nerve" : undefined, detail: id === "scout" ? "Ghost service check +1; trained Ghost also unlocks a silent crossing at Strain +1." : id === "reader" ? "Trained Chrome unlocks a local stock transfer at Strain +1." : id === "escort" ? "Trained Face and Quill standing 1 unlock a sponsor at a cost of one step of trust." : "Trained Nerve unlocks the service ramp with a braced-case bonus of +2.", effects: { flags: [flag] }, next: "act2_freight_crossing" })),
      { id: "freight-without-prep", label: "Keep the queue moving. Use the courier or official desk.", next: "act2_freight_crossing" },
    ],
  },
  act2_freight_crossing: {
    id: "act2_freight_crossing", location: "Canal checkpoint", speaker: "Asa",
    text: "A gate clerk calls the next manifest. The cooling case stays under the dispatch cabinet until you have a route. You can risk the service turn, use a prepared specialist method, pay for sealed carriage or register the handover.\n\nIf a private crossing is noticed, delivery can still continue. Asa’s old passenger route will remain exposed.",
    choices: [
      { id: "freight-service-run", label: "Carry the case through the service turn.", hideIfFlag: "freight_attempted", check: { stat: "ghost", dc: 10, label: "Carry the sealed freight", itemBonuses: kitBonuses("ghost"), flagBonuses: [{ flag: "freight_scouted", amount: 1, label: "Mapped service gap" }] }, effects: { flags: ["freight_attempted"] }, successEffects: { flags: arrived }, failEffects: { flags: ["freight_exposed"], strain: 1, factions: { helion: 1 } }, resultSuccess: "You reach the clinic hatch with the seal and cold indicator intact. A receipt still needs to be observed.", resultFail: "The clerk marks the service turn. You put the case in the staffed cold cabinet; its delivery can continue, but the route is exposed.", nextSuccess: "act2_freight_intake", nextFail: "act2_freight_recovery" },
      { id: "freight-ghost-gap", label: "Use your mapped gap without a second guess.", requireAllFlags: ["perk_ghost", "freight_scouted"], detail: "Strain +1. A trained silent crossing without a roll; a receipt still comes afterward.", effects: { strain: 1, flags: [...arrived, "freight_method_ghost"] }, next: "act2_freight_intake" },
      { id: "freight-chrome-stock", label: "Write a local stock transfer, with no courier name in the carrier.", requireAllFlags: ["perk_chrome", "freight_reader"], detail: "Strain +1. The reader carries the clinic stock code; it supplies no historical proof.", effects: { strain: 1, flags: [...arrived, "freight_method_chrome"] }, next: "act2_freight_intake" },
      { id: "freight-face-escort", label: "Have the prepared volunteer sponsor the sealed crossing.", requireAllFlags: ["perk_face", "freight_escort"], requireFaction: { faction: "quill", min: 1 }, detail: "Spend one step of Quill’s trust. The sponsor keeps the patient fields blank.", effects: { factions: { quill: -1 }, flags: [...arrived, "freight_method_face"] }, next: "act2_freight_intake" },
      { id: "freight-nerve-ramp", label: "Carry the braced case down the service ramp.", requireAllFlags: ["perk_nerve", "freight_braced"], check: { stat: "nerve", dc: 8, label: "Carry the braced cooling case", itemBonuses: kitBonuses("nerve"), flagBonuses: [{ flag: "freight_braced", amount: 2, label: "Braced case" }] }, successEffects: { strain: 1, flags: [...arrived, "freight_method_nerve"] }, failEffects: { strain: 1, flags: ["freight_exposed"] }, resultSuccess: "You lower the case to clinic intake. The seal holds; a receipt is the remaining step.", resultFail: "The gate locks before the ramp clears. Staff keep the case cold while the crossing is entered in the gate book.", nextSuccess: "act2_freight_intake", nextFail: "act2_freight_recovery" },
      { id: "freight-paid-courier", label: "Pay for sealed cold carriage.", requireCreds: 25, detail: "25 creds. A private delivery route without a check; wait for the receipt to earn the clearance.", effects: { creds: -25, flags: arrived }, next: "act2_freight_intake" },
      { id: "freight-official-desk", label: "Use the free official cargo desk.", detail: "Helion standing +1. The courier and route are recorded; no passenger clearance can be earned here.", effects: { factions: { helion: 1 }, flags: [...arrived, "freight_exposed", "freight_registered"] }, next: "act2_freight_intake" },
    ],
  },
  act2_freight_recovery: {
    id: "act2_freight_recovery", location: "Canal cold cabinet", speaker: "Asa",
    text: "The cabinet keeps the parcel cold. Asa looks at the clerk’s mark beside the service turn. ‘We can finish the delivery. We can’t pretend they didn’t see us.’\n\nThere is no second private crossing to roll. Pay for cold carriage, accept the official desk or return the case for another carrier. A later receipt cannot erase the exposed route.",
    choices: [
      { id: "freight-recovery-courier", label: "Pay twenty-five creds to finish the delivery.", requireCreds: 25, effects: { creds: -25, flags: arrived }, next: "act2_freight_intake" },
      { id: "freight-recovery-desk", label: "Finish through the free official desk.", effects: { factions: { helion: 1 }, flags: [...arrived, "freight_registered"] }, next: "act2_freight_intake" },
      { id: "freight-return-case", label: "Return the cold case to Asa. Delivery remains unconfirmed.", effects: { flags: ["origin_done", "freight_done", "freight_abandoned"] }, next: "act2_freight_result" },
    ],
  },
  act2_freight_intake: {
    id: "act2_freight_intake", location: "Clinic freight hatch", speaker: "Asa",
    text: "The clinic clerk has the case on the intake shelf. The indicator is still in the cold band. A stamped stock receipt would establish delivery of this parcel; it would say nothing about who received care.\n\nYou can wait for the clerk to check the seal and stamp it, or leave the case with the next batch and return before observing custody. Only a confirmed private delivery earns Asa’s one-use passenger clearance.",
    choices: [
      { id: "acknowledge-freight-receipt", label: "Wait for the stamped clinic stock receipt.", requireFlag: "freight_at_intake", hideIfFlag: "freight_done", effects: finish, next: "act2_freight_result" },
      { id: "leave-freight-batch", label: "Leave the case in the batch without observing a receipt.", requireFlag: "freight_at_intake", hideIfFlag: "freight_done", effects: { flags: ["origin_done", "freight_done", "freight_unconfirmed"] }, next: "act2_freight_result" },
    ],
  },
  act2_freight_result: {
    id: "act2_freight_result", location: "Canal dispatch table", speaker: "Asa",
    text: (state) => `${freightOutcome(state)}\n\n${state.flags.freight_clearance_earned ? "Asa slides the passenger clearance under the gate rail. ‘One crossing. Tell me when the week is over what it was for.’" : "Asa shuts the manifest. ‘I can answer for what we saw. I can’t sign for the part we didn’t.’"}\n\nThe district calls are still waiting.`,
    choices: [{ id: "return-freight-board", label: "Return to the district board.", next: "districts" }],
  },
  act3_freight_visit: {
    id: "act3_freight_visit", location: "Ward Nine courier table", speaker: "Asa",
    text: (state) => `Asa is counting clinic slips beside the wall. They clear a place for you at the table.\n\n${freightOutcome(state)}\n\n${state.flags.freight_clearance_earned ? state.items.includes("burner-route") ? "Your one-use passenger clearance is still in your pack. Asa will not issue a second." : "The clearance is no longer in your pack. Asa will not replace it with another favor." : "No passenger clearance was issued for this delivery."}\n\n‘A parcel is somebody’s morning,’ they say. ‘What were you trying to carry for yourself?’`,
    choices: [
      { id: "query-freight-receipt", label: "Ask the clinic to check its stock book before claiming delivery.", requireAnyFlag: ["freight_unconfirmed", "freight_abandoned", "freight_declined"], hideIfFlag: "freight_queried", effects: { flags: ["freight_queried"] }, next: "act3_freight_query" },
      { id: "reflect-freight-motive", label: "Tell Asa why you took work that night.", next: "act3_freight_reflection" },
      { id: "close-freight-visit", label: "Keep the receipt’s limits and leave the table.", effects: { flags: ["visited_asa"] }, next: returnFromVisit },
    ],
  },
  act3_freight_query: {
    id: "act3_freight_query", location: "Ward Nine courier table", speaker: "Asa",
    text: (state) => state.flags.freight_unconfirmed ? "A clinic clerk brings the batch book. The sealed case you left at intake was entered into stock afterward. You can now confirm receipt. You cannot turn that late answer into a private route certified during the week, or into an observed patient outcome." : "The clerk returns without a matching stock entry for your case. Another carrier may still be involved. The reply establishes that this desk has no matching receipt; it does not prove what happened elsewhere.",
    choices: [{ id: "record-freight-reply", label: "Record the actual stock reply, then return to Asa.", effects: (state) => ({ flags: [state.flags.freight_unconfirmed ? "freight_late_received" : "freight_late_unknown"], journal: [{ id: "freight-late-reply", text: state.flags.freight_unconfirmed ? "A later clinic batch-book reply confirms the parcel entered stock after it was left at intake. No passenger clearance or patient treatment was established." : "The clinic’s stock reply found no matching entry for the case. Its eventual delivery remains unknown.", kind: "fact" }] }), next: "act3_freight_visit" }],
  },
  act3_freight_reflection: {
    id: "act3_freight_reflection", location: "Ward Nine courier table", speaker: "Asa",
    text: (state) => `${openingMotive(state) || "You tell Asa the job seemed like a way to keep moving. That was before you knew what the hour contained."}\n\n${state.flags.opening_exit ? "‘A way out still has somebody at the other end,’ Asa says. ‘Choose who you ask to hold the door.’" : state.flags.opening_identity ? "‘Keep your name,’ Asa says. ‘And remember that the people receiving your work have names too.’" : "‘I know what a paid tomorrow means,’ Asa says. ‘Just keep the receipt honest about whose morning it bought.’"}\n\nThey fold the slip. The wall is still there, and the next decision belongs to you.`,
    choices: [{ id: "finish-freight-reflection", label: "Leave Asa’s table and return to the wall’s questions.", effects: { flags: ["visited_asa", "freight_reflected"] }, next: returnFromVisit }],
  },
};
