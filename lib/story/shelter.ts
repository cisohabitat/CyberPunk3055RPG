import { kitBonuses } from "../loadout";
import type { Choice, GameState, Scene } from "../types";

const returnFromVisit = (state: GameState) => state.flags.shelter_return_wall ? "ward_wall" : "act3_neighborhood";
export function shelterVisitChoice(fromWall = false): Choice {
  return { id: "visit-shelter-neighbors", label: "Ask Sera how the shelter neighbors spent the night.", requireOrigin: "gutterwire", requireAnyFlag: ["shelter_started", "shelter_declined"], hideIfFlag: "shelter_visited", effects: { flags: fromWall ? ["shelter_return_wall"] : [], flagsOff: fromWall ? [] : ["shelter_return_wall"] }, next: "act3_shelter_visit" };
}
export function shelterOutcome(state: GameState): string {
  if (state.flags.shelter_declined) return "You left the shelter response to Sera’s crew. You did not observe where the residents slept.";
  if (!state.flags.shelter_done) return state.flags.shelter_restored ? "The valve holds. Resident beds and a possible private referral still need an allocation." : "You agreed to help the shelter. Repair and sleeping arrangements remain separate tasks.";
  if (state.flags.shelter_unobserved) return "The crew kept responsibility for the move. You observed neither a completed evacuation nor the residents’ sleeping arrangements.";
  if (state.flags.shelter_hall) return "Residents reached the staffed hall. It has shared mattresses and no private witness room. The shelter valve still needs repair.";
  if (state.flags.shelter_reserved) return `The valve holds. One willing household accepted the equipped hall annex so Sera could reserve a private referral room. ${state.items.includes("witness-token") ? "The one-use shelter token is still in your pack." : "The token is no longer in your pack; Sera will not issue another."} Reserving a room alone did not move Nia.`;
  return "The valve holds. You kept every dry shelter room for its residents; no private referral room was reserved.";
}
const repaired = ["shelter_restored"];
const reserve = { flags: ["origin_done", "origin_helped", "shelter_done", "shelter_reserved"], itemsAdd: ["witness-token"], journal: [{ id: "shelter-room", text: "Sera confirmed resident beds and a consenting household’s equipped hall-annex move, then reserved one private referral room. The token reserves capacity; it does not establish Nia’s transfer or testimony.", kind: "fact" as const }] };

export const SHELTER_SCENES: Record<string, Scene> = {
  act2_shelter_brief: {
    id: "act2_shelter_brief", location: "Ward Four shelter stair", speaker: "Sera",
    text: "The stair rail is sticky with coolant. Sera catches a bucket under the landing. You remember this stair being taller.\n\n‘Six households upstairs. One valve downstairs. We stop the leak or move everyone to the hall.’ A resident, Ren, sets a kettle on a dry step. ‘We can walk. My father needs the ramp, not the stairs.’\n\nSera has no spare room to promise yet. Repair comes first; beds come after. Ren’s family is willing to use the hall annex if someone covers its mattresses. No one will be displaced without agreeing.",
    choices: [
      { id: "accept-shelter", label: "Help the residents, then decide what room can be spared.", hideIfFlag: "shelter_done", effects: { flags: ["shelter_started"], journal: [{ id: "shelter-promise", text: "You agreed to help Sera respond to the shelter leak. Resident beds must be settled before a private referral room can be reserved.", kind: "promise" }] }, next: "act2_shelter_prep" },
      { id: "decline-shelter", label: "Tell Sera you cannot take responsibility for this move.", effects: { flags: ["origin_done", "shelter_done", "shelter_declined"] }, next: "act2_shelter_result" },
    ],
  },
  act2_shelter_prep: {
    id: "act2_shelter_prep", location: "Shelter landing", speaker: "Sera",
    text: "Ren’s father checks the ramp with his cane. You have time for one preparation before the coolant reaches the door sill.\n\nA brace improves the valve check. A trained technician can isolate the controller; a practiced negotiator can organize the repair crew. Mapping the ramp lets a trained runner evacuate without a roll, but it does not repair the pump. Forty creds hire the shelter fitter without a check.",
    choices: [
      { id: "shelter-prep-brace", label: "Wedge a brace under the valve housing.", detail: "Nerve valve check +1. Equipment can add its own listed bonus.", effects: { flags: ["shelter_braced"] }, next: "act2_shelter_methods" },
      { id: "shelter-prep-controller", label: "Find the controller’s local isolation switch.", requireFlag: "perk_chrome", detail: "Trained Chrome repair costs Strain +1 without a roll.", effects: { flags: ["shelter_isolated"] }, next: "act2_shelter_methods" },
      { id: "shelter-prep-crew", label: "Agree a repair shift with the neighborhood crew.", requireFlag: "perk_face", detail: "Trained Face can spend one step of ward trust for crew repair.", effects: { flags: ["shelter_crew"] }, next: "act2_shelter_methods" },
      { id: "shelter-prep-ramp", label: "Clear the accessible ramp to the staffed hall.", detail: "A prepared Ghost evacuation costs Strain +1. It saves no private room.", effects: { flags: ["shelter_ramp"] }, next: "act2_shelter_methods" },
      { id: "shelter-no-prep", label: "Call the fitter or start the move now.", next: "act2_shelter_methods" },
    ],
  },
  act2_shelter_methods: {
    id: "act2_shelter_methods", location: "Shelter pump room", speaker: "Sera",
    text: "The valve shudders against its stop. Ren keeps the door clear while the neighbors carry bags to the landing.\n\nYou can try one repair, use a prepared skill or pay the fitter. Evacuating to the hall is also a complete response to tonight’s danger; it leaves the shelter repair unfinished. A failed valve attempt cannot be rolled again.",
    choices: [
      { id: "shelter-turn-valve", label: "Hold the housing and turn the valve.", hideIfFlag: "shelter_attempted", check: { stat: "nerve", dc: 10, label: "Hold the leaking shelter valve", itemBonuses: kitBonuses("nerve"), flagBonuses: [{ flag: "shelter_braced", amount: 1, label: "Valve brace" }] }, effects: { flags: ["shelter_attempted"] }, successEffects: { flags: repaired }, failEffects: { flags: ["shelter_failed"], strain: 1 }, resultSuccess: "The flow stops. The crew checks the landing before assigning any beds.", resultFail: "The stop shears. You pull clear and Sera opens the hall route; tonight’s repair is over.", nextSuccess: "act2_shelter_rooms", nextFail: "act2_shelter_evacuation" },
      { id: "shelter-local-control", label: "Isolate the controller and close the bypass locally.", requireAllFlags: ["perk_chrome", "shelter_isolated"], detail: "Strain +1. Repair without a check; no tenancy data enters the controller.", effects: { strain: 1, flags: [...repaired, "shelter_method_chrome"] }, next: "act2_shelter_rooms" },
      { id: "shelter-crew-repair", label: "Call in the repair shift you agreed.", requireAllFlags: ["perk_face", "shelter_crew"], requireFaction: { faction: "wards", min: 1 }, detail: "Spend one step of ward trust. The crew repairs the valve without a roll.", effects: { factions: { wards: -1 }, flags: [...repaired, "shelter_method_face"] }, next: "act2_shelter_rooms" },
      { id: "shelter-hire-fitter", label: "Pay forty creds for the shelter fitter.", requireCreds: 40, effects: { creds: -40, flags: [...repaired, "shelter_fitter"] }, next: "act2_shelter_rooms" },
      { id: "shelter-ghost-ramp", label: "Lead the residents down your cleared ramp.", requireAllFlags: ["perk_ghost", "shelter_ramp"], detail: "Strain +1. Reach the hall without a roll; the pump remains broken.", effects: { strain: 1, flags: ["shelter_at_hall", "shelter_method_ghost"] }, next: "act2_shelter_hall" },
      { id: "shelter-start-evacuation", label: "Leave the valve. Arrange the free hall move.", next: "act2_shelter_evacuation" },
    ],
  },
  act2_shelter_evacuation: {
    id: "act2_shelter_evacuation", location: "Shelter exit ramp", speaker: "Sera",
    text: "The hall caretaker opens the ramp entrance. The neighbors can walk together, with a chair for Ren’s father. Carrying bags and guiding the chair will cost you effort, but no money.\n\nSera will stay if you leave. That means someone remains responsible; it does not mean you have seen everyone arrive. The hall offers shared mattresses, not a private room for Nia.",
    choices: [
      { id: "shelter-guide-hall", label: "Help the chair and the bags down the ramp.", detail: "Strain +1. Free evacuation; confirm arrival with the caretaker.", effects: { strain: 1, flags: ["shelter_at_hall"] }, next: "act2_shelter_hall" },
      { id: "shelter-leave-crew", label: "Leave the move with Sera. Do not claim an arrival.", effects: { flags: ["origin_done", "shelter_done", "shelter_unobserved"] }, next: "act2_shelter_result" },
    ],
  },
  act2_shelter_hall: {
    id: "act2_shelter_hall", location: "Ward Four staffed hall", speaker: "Sera",
    text: "Ren’s father rolls through the ramp door. The caretaker counts all six households inside, then unlocks the mattress cupboard. Ren fills the kettle.\n\n‘We’re here,’ Ren says. ‘It’s loud. It’s still somewhere.’ The pump remains broken and there is no private referral room. This is an observed evacuation, not a repair report or a witness transfer.",
    choices: [{ id: "shelter-confirm-hall", label: "Record the arrival and leave the valve repair open.", requireFlag: "shelter_at_hall", hideIfFlag: "shelter_done", effects: { flags: ["origin_done", "shelter_done", "shelter_hall"], factions: { wards: 1 }, journal: [{ id: "shelter-arrival", text: "The staffed hall caretaker counted all six shelter households inside. Shared mattresses were available; the valve still needed repair and no private witness room was reserved.", kind: "fact" }] }, next: "act2_shelter_result" }],
  },
  act2_shelter_rooms: {
    id: "act2_shelter_rooms", location: "Shelter dry landing", speaker: "Sera",
    text: "The crew has checked the landing. It is dry enough to sleep upstairs tonight. Ren puts their bags beside the door.\n\n‘We offered the hall annex if you need one room for a private referral,’ Ren says. ‘But it needs mattresses, and Dad needs that ramp.’ Sera checks with them again before offering you a token.\n\nForty creds fund delivered mattresses, or ward standing 2 can secure them by spending one step of trust. You can also carry donated mattresses from the store yourself at Strain +1. Otherwise keep every room for the residents. A token is capacity for a later transfer; Nia is not here yet.",
    choices: [
      { id: "shelter-all-residents", label: "Keep every dry room for the resident households.", requireFlag: "shelter_restored", hideIfFlag: "shelter_done", detail: "Ward standing +1. No witness token; Nia still needs another route.", effects: { flags: ["origin_done", "shelter_done", "shelter_resident_rooms"], factions: { wards: 1 }, journal: [{ id: "shelter-room", text: "The valve held and all dry rooms stayed with their resident households. No private referral capacity was reserved.", kind: "fact" }] }, next: "act2_shelter_result" },
      { id: "shelter-fund-annex", label: "Fund Ren’s agreed annex move and reserve the referral room.", requireFlag: "shelter_restored", hideIfFlag: "shelter_done", requireCreds: 40, detail: "40 creds. Earn one shelter token after resident beds are confirmed.", effects: { ...reserve, creds: -40 }, next: "act2_shelter_result" },
      { id: "shelter-carry-annex", label: "Carry donated mattresses for Ren’s agreed annex move.", requireFlag: "shelter_restored", hideIfFlag: "shelter_done", detail: "Strain +1. Earn one shelter token after resident beds are confirmed.", effects: { ...reserve, strain: 1 }, next: "act2_shelter_result" },
      { id: "shelter-ward-annex", label: "Ask the wards to fund the annex Ren agreed to use.", requireFlag: "shelter_restored", hideIfFlag: "shelter_done", requireFaction: { faction: "wards", min: 2 }, detail: "Spend one step of ward trust. Earn one shelter token.", effects: { ...reserve, factions: { wards: -1 } }, next: "act2_shelter_result" },
    ],
  },
  act2_shelter_result: {
    id: "act2_shelter_result", location: "Ward Four shelter stair", speaker: "Sera",
    text: (state) => `${shelterOutcome(state)}\n\nSera wrings coolant from a cloth. ‘Come back when it’s daylight. A place to sleep is the start of a night, not the whole of it.’\n\nThe district board still has this week’s calls.`,
    choices: [{ id: "shelter-return-board", label: "Return to the district board.", next: "districts" }],
  },
  act3_shelter_visit: {
    id: "act3_shelter_visit", location: "Ward Nine neighbor table", speaker: "Sera",
    text: (state) => `${shelterOutcome(state)}\n\n${state.flags.shelter_unobserved || state.flags.shelter_declined ? "Sera has no arrival count to show you here. The earlier crew response remains unobserved by you; she asks you not to turn that gap into a story of abandonment." : state.flags.shelter_hall || state.flags.shelter_reserved ? "Ren brings back the kettle. ‘Dad reached the ramp. We slept, but the hall lights stayed on.’ The cloth bags still smell of coolant." : "Ren brings back the kettle. ‘We slept upstairs. The floor was dry. Everything we packed still smells of coolant.’"}\n\nSera has a laundry cart for the households affected by the leak. You can fund a wash or help carry it; either helps with today’s work, without repairing an unfinished valve or creating another token.`,
    choices: [
      { id: "shelter-fund-laundry", label: "Pay twenty creds for the residents’ laundry.", requireCreds: 20, effects: { creds: -20, flags: ["shelter_followup_paid", "shelter_visited"], journal: [{ id: "shelter-followup", text: "You funded a laundry wash for leak-affected residents. The earlier repair, sleeping arrangements and referral capacity remain as recorded.", kind: "fact" }] }, next: returnFromVisit },
      { id: "shelter-carry-laundry", label: "Carry the laundry cart to the washhouse.", detail: "Strain +1. No money, new token, or historical evidence.", effects: { strain: 1, flags: ["shelter_followup_helped", "shelter_visited"], journal: [{ id: "shelter-followup", text: "You helped take leak-affected residents’ laundry to the washhouse. This changed no prior repair, referral capacity or witness permission.", kind: "fact" }] }, next: returnFromVisit },
      { id: "shelter-listen-leave", label: "Listen, keep the limits of what you saw, and return.", effects: { flags: ["shelter_visited"] }, next: returnFromVisit },
    ],
  },
};
