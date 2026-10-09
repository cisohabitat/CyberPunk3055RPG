import { kitBonuses } from "../loadout";
import { PERKS } from "../progression";
import { archiveArrival } from "./archive";
import { witnessArrival } from "./operations";
import type { GameState, Scene } from "../types";

export const MISSION_SCENES: Record<string, Scene> = {
  act2_training: {
    id: "act2_training", location: "Ward Four",
    text: "A week gives you time to practice one thing. You find a quiet stair, mark a circuit on paper, count your breath, and replay the moment the door almost closed. Choose what you will be better at the next time the city asks.",
    choices: PERKS.map((perk) => ({ id: `learn-${perk.stat}`, label: perk.name, detail: perk.description, hideIfFlag: "perk_trained", effects: { flags: ["perk_trained", `perk_${perk.stat}`] }, next: "street_after" })),
  },
  act2_origin_gutterwire: {
    id: "act2_origin_gutterwire", location: "Ward Four", speaker: "Sera",
    text: "Sera knows the stair you grew up on. A shelter pump has stopped, and the rooms above it are taking coolant. Dry rooms could let her hold a bed for Nia, once the residents have somewhere to sleep.\n\n\"No speeches. Put your shoulder here. Someone has to sleep upstairs tonight.\"",
    choices: [
      { id: "plan-shelter", label: "Help Sera plan the repair and resident beds.", requireOrigin: "gutterwire", hideIfFlag: "origin_done", next: "act2_shelter_brief" },
      { id: "move-valve", hideIfFlag: "origin_done", label: "Brace the pump and turn the valve.", requireOrigin: "gutterwire", check: { stat: "nerve", dc: 8, label: "Hold the shelter pump" }, successEffects: { flags: ["origin_done", "origin_helped"], itemsAdd: ["witness-token"], factions: { wards: 1 } }, failEffects: { flags: ["origin_done"], strain: 1 }, resultSuccess: "The valve holds. Sera reserves the dry room.", resultFail: "The valve slips. You get the neighbors upstairs, but the spare room is lost.", nextSuccess: "act2_origin_return", nextFail: "act2_origin_return" },
      { id: "leave-pump", label: "Leave the pump to its crew.", effects: { flags: ["origin_done"] }, next: "act2_origin_return" },
    ],
  },
  act2_origin_spire: {
    id: "act2_origin_spire", location: "Helion Spire", speaker: "Ives",
    text: "The technician behind the service desk remembers your badge. Edda slides a receiver across the counter while Ives watches the queue. It can isolate a command receipt from the tower's surveillance carrier.\n\n\"I need the old maintenance key out of this terminal,\" Edda says. \"They still bill my shifts against it. Get it out clean and take the receiver.\"",
    choices: [
      { id: "clear-key", label: "Revoke Edda's old key.", requireOrigin: "spire", check: { stat: "chrome", dc: 9, label: "Close the maintenance key", itemBonuses: [{ item: "spoof-chip", amount: 1 }] }, successEffects: { flags: ["origin_done", "origin_helped"], itemsAdd: ["signal-baffle"], factions: { helion: -1 } }, failEffects: { flags: ["origin_done", "old_badge_traced"], factions: { helion: 1 }, strain: 1 }, resultSuccess: "Edda's next shift has her own number. The receiver is yours.", resultFail: "The terminal keeps the key and logs your old badge. Edda pulls the receiver back.", nextSuccess: "act2_origin_return", nextFail: "act2_origin_return" },
      { id: "leave-key", label: "Keep your old clearance out of it.", effects: { flags: ["origin_done"] }, next: "act2_origin_return" },
    ],
  },
  act2_origin_dustline: {
    id: "act2_origin_dustline", location: "Canal freight gate", speaker: "Quill",
    text: "Quill has a courier packet and a name you knew outside the dome. Asa cannot cross the canal gate with a medical parcel on their manifest. You know the service turn before the checkpoint.\n\n\"It goes to a clinic,\" Quill says, without making that a pitch. \"Get it there. Asa will leave you a clearance for one passenger.\"",
    choices: [
      { id: "plan-freight", label: "Meet Asa and plan the sealed delivery.", requireOrigin: "dustline", hideIfFlag: "origin_done", next: "act2_freight_brief" },
      { id: "courier-run", hideIfFlag: "origin_done", label: "Carry the parcel through the service turn.", requireOrigin: "dustline", check: { stat: "ghost", dc: 8, label: "Run the old freight route", itemBonuses: [{ item: "layout-scrap", amount: 1 }] }, successEffects: { flags: ["origin_done", "origin_helped"], itemsAdd: ["burner-route"], factions: { quill: 1 } }, failEffects: { flags: ["origin_done"], strain: 1, factions: { helion: 1 } }, resultSuccess: "The clinic signs the packet. Asa leaves the passenger clearance under the gate rail.", resultFail: "The clinic gets the parcel through an official desk. The route is exposed, and Asa cannot reuse it.", nextSuccess: "act2_origin_return", nextFail: "act2_origin_return" },
      { id: "leave-parcel", label: "Let another courier take it.", effects: { flags: ["origin_done"] }, next: "act2_origin_return" },
    ],
  },
  act2_origin_return: {
    id: "act2_origin_return", location: "District board",
    text: (state) => state.flags.origin_helped ? "Your contact has a reason to answer the next call. The favor left a practical thing in your pocket, and a person who can explain where it came from.\n\nThe district board still has the calls from this week." : "Your contact has their own work to finish. The old route is still a place you know; it is not a favor you earned.\n\nYou return to the district board with the calls from this week still waiting.",
    choices: [{ id: "return-board", label: "Return to the board.", next: "districts" }],
  },
  act2_witness_door: {
    id: "act2_witness_door", location: "Witness room, Glass Chapel", speaker: "Sister Lumen",
    text: "Nia Pell waits behind a clinic curtain. She signed a housing slip, saw the evacuation canceled, and left through a service hatch. Her home is still on a Helion register.\n\n\"Don't publish my address and call that courage,\" she says. \"Give me somewhere they don't rent to me. Then I'll tell Sera what I saw.\"\n\nLumen has a transport chair. Getting it past the canal checkpoint is your part of the promise.",
    choices: [
      { id: "use-shelter", label: "Use the room the wards reserved.", detail: "Spend the shelter token. Nia gets a safe room without a roll.", requireItem: "witness-token", consumeItems: ["witness-token"], effects: { flags: ["witness_done", "witness_safe"], factions: { wards: 1 } }, next: witnessArrival },
      { id: "use-freight", label: "Burn Asa's passenger clearance.", detail: "Spend the burner route. Nia passes as a freight passenger without a roll.", requireItem: "burner-route", consumeItems: ["burner-route"], effects: { flags: ["witness_done", "witness_safe"] }, next: witnessArrival },
      { id: "quill-room", label: "Ask Quill to cover the room.", detail: "Standing 2 required. His guarantee costs one step of trust.", requireFaction: { faction: "quill", min: 2 }, effects: { flags: ["witness_done", "witness_safe"], factions: { quill: -1 } }, next: witnessArrival },
      { id: "pay-room", label: "Pay for an unregistered clinic room.", detail: "Ninety creds reserve an unregistered room and medical transport. No roll.", requireCreds: 90, effects: { creds: -90, flags: ["witness_done", "witness_safe"] }, next: witnessArrival },
      { id: "slip-witness", label: "Take Nia through the canal service hatch.", check: { stat: "ghost", dc: 9, label: "Move Nia unseen", flagBonuses: [{ flag: "witness_scouted", amount: 2, label: "Patrol gap" }, { flag: "witness_alert", amount: -1, label: "Desk alerted" }], itemBonuses: [...kitBonuses("ghost"), { item: "layout-scrap", amount: 1 }] }, successEffects: { flags: ["witness_done", "witness_safe"], factions: { wards: 1 } }, failEffects: { strain: 1, flags: ["witness_checkpoint"] }, resultSuccess: "The chair reaches a back room. Nia chooses the name on its door.", resultFail: "A scanner stops the chair at the canal gate. You still have time to negotiate.", nextSuccess: witnessArrival, nextFail: "act2_witness_checkpoint" },
      { id: "chrome-transfer", label: "Write a clinic-only transfer using the scanner protocol.", detail: "Signal discipline and scanner preparation. Strain +1; the address field stays blank.", requireAllFlags: ["perk_chrome", "witness_scanner"], effects: { strain: 1, flags: ["witness_done", "witness_safe", "witness_method_chrome"] }, next: witnessArrival },
      { id: "face-transfer", label: "Have the volunteer take responsibility for the room.", detail: "Read the room and escort preparation. Spend one step of clinic trust; no tenancy entry.", requireAllFlags: ["perk_face", "witness_escort"], requireFaction: { faction: "lumen", min: 1 }, effects: { factions: { lumen: -1 }, flags: ["witness_done", "witness_safe", "witness_method_face"] }, next: witnessArrival },
      { id: "ghost-transfer", label: "Use the patrol gap you mapped.", detail: "Count the exits and patrol preparation. Strain +1; one silent crossing without a roll.", requireAllFlags: ["perk_ghost", "witness_scouted"], effects: { strain: 1, flags: ["witness_done", "witness_safe", "witness_method_ghost"] }, next: witnessArrival },
      { id: "nerve-transfer", label: "Carry the braced chair down the narrow service ramp.", detail: "Steady hands and chair preparation. A miss reaches the checkpoint; Nia remains in your care.", requireAllFlags: ["perk_nerve", "witness_braced"], check: { itemBonuses: kitBonuses("nerve"), stat: "nerve", dc: 9, label: "Carry the transport chair", flagBonuses: [{ flag: "witness_braced", amount: 2, label: "Braced chair" }] }, successEffects: { flags: ["witness_done", "witness_safe", "witness_method_nerve"], strain: 1 }, failEffects: { flags: ["witness_checkpoint"], strain: 1 }, resultSuccess: "You lower the chair a step at a time. The clinic takes Nia through a door without a tenancy screen.", resultFail: "The lift gate locks. You take the chair back to the staffed crossing and ask for a transfer.", nextSuccess: witnessArrival, nextFail: "act2_witness_checkpoint" },
      { id: "leave-witness", label: "Leave the move unresolved.", detail: "The private record stays private. Nia still needs a safe route.", next: "act2_middle" },
    ],
  },
  act2_witness_checkpoint: {
    id: "act2_witness_checkpoint", location: "Canal checkpoint", speaker: "Kerr",
    text: "The scanner sees a patient, a chair, and the empty space where a tenancy number should be. Kerr puts his hand over the screen.\n\n\"I can keep this off the register if you give me a clinic transfer I can sign. Get the desk to accept it. Then move.\"\n\nNia keeps her hands flat on the chair arms. She is watching what you do with her name.",
    choices: [
      { id: "clinic-transfer", label: "Trade Lumen's clinic marker for a transfer.", detail: "Spend the marker. Strain eases by 1; the clinic takes responsibility for the room.", requireItem: "clinic-marker", consumeItems: ["clinic-marker"], effects: { strain: -1, flags: ["witness_done", "witness_safe"] }, next: witnessArrival },
      { id: "argue-transfer", label: "Make the desk accept an emergency transfer.", check: { itemBonuses: kitBonuses("face"), stat: "face", dc: 8, label: "Keep Nia off the register", flagBonuses: [{ flag: "witness_escort", amount: 1, label: "Volunteer escort" }, { flag: "witness_alert", amount: -1, label: "Desk alerted" }], factionBonuses: [{ faction: "lumen", min: 2, amount: 1, label: "Clinic standing" }] }, successEffects: { flags: ["witness_done", "witness_safe"] }, failEffects: { flags: ["witness_done", "witness_lost"], factions: { helion: 1, wards: -1 } }, resultSuccess: "The desk stamps the clinic form. Kerr lifts his hand without waking the scanner.", resultFail: "The desk asks for tenancy. Nia has to give a number, and the tower gets her new room.", nextSuccess: witnessArrival, nextFail: "act2_witness_lost" },
      { id: "registered-transfer", label: "Accept a registered transfer.", detail: "Nia reaches medical care. Helion gets her location.", effects: { flags: ["witness_done", "witness_lost"], factions: { helion: 1 } }, next: "act2_witness_lost" },
    ],
  },
  act2_witness_safe: {
    id: "act2_witness_safe", location: "Witness room, Ward Nine", speaker: "Sera",
    text: "Nia records the evacuation counter-order in her own words. Sera gives her a playback button and waits while she listens to herself.\n\n\"That part stays,\" Nia says. \"The address doesn't. If they ask where I am, tell them I am available through you.\"\n\nSera labels the account with its source. It now corroborates the receipt without publishing a home.",
    choices: [{ id: "file-account", label: "Attach Nia's account to the evidence.", effects: { flags: ["witness_done", "witness_safe", "order_verified"], factions: { wards: 1 }, journal: [{ id: "nia-account", text: "Nia Pell corroborated Helion's canceled evacuation from a protected room.", kind: "fact" }] }, next: "act2_middle" }],
  },
  act2_witness_lost: {
    id: "act2_witness_lost", location: "Glass Chapel", speaker: "Sister Lumen",
    text: "Nia receives treatment, but her transfer is on the tenancy register. Lumen writes down which desk requested it.\n\n\"We can still keep her account,\" she says. \"We cannot tell her the room is private. Say exactly what happened.\"\n\nNia agrees to a recording through the clinic. She asks that Sera receive it before the tower calls her.",
    choices: [{ id: "record-cost", label: "Keep the account and record the breach.", effects: { flags: ["witness_done", "witness_lost", "order_verified"], journal: [{ id: "nia-account", text: "Nia corroborated the order, but her clinic location entered Helion's tenancy register.", kind: "fact" }] }, next: "act2_middle" }],
  },
  act2_archive_door: {
    id: "act2_archive_door", location: "Helion service archive", speaker: "Ives",
    text: "Your intact export has a receipt number. The tower keeps its counterpart in a service archive, beside revisions to the maintenance schedule.\n\nIves meets you outside the reader. \"If you allege an instruction, identify its issuer. We will challenge anything less.\"\n\nYou can authenticate the command chain. A rejected query will reveal which record you brought.",
    choices: [
      { id: "trace-receipt", label: "Match the receipt to its issuing key.", check: { stat: "chrome", dc: 9, label: "Authenticate the counter-order", flagBonuses: [{ flag: "archive_indexed", amount: 2, label: "Index compared" }, { flag: "archive_reader_alert", amount: -1, label: "Reader alerted" }], itemBonuses: [...kitBonuses("chrome"), { item: "signal-baffle", amount: 1 }, { item: "spoof-chip", amount: 1 }] }, successEffects: { flags: ["archive_done", "order_verified", "archive_key_authenticated"], factions: { wards: 1, helion: -1 }, journal: [{ id: "verified-order", text: "The service archive authenticates the key that canceled Ward Nine's evacuation.", kind: "fact" }] }, failEffects: { strain: 1, flags: ["archive_flagged"], factions: { helion: 1 } }, resultSuccess: "The issuing key matches. Mara's account has a command chain attached.", resultFail: "The reader quarantines the key and logs your query. A technician offers another way to corroborate it.", nextSuccess: archiveArrival, nextFail: "act2_archive_gap" },
      { id: "isolate-key", label: "Isolate the issuing key on a local reader.", detail: "Signal discipline. Strain +1; the reader authenticates the key without a network query.", requireFlag: "perk_chrome", effects: { strain: 1, flags: ["archive_done", "order_verified", "archive_method_chrome", "archive_key_authenticated"], factions: { wards: 1 }, journal: [{ id: "verified-order", text: "A local service reader authenticated the exported cancellation against the issuing key.", kind: "fact" }] }, next: archiveArrival },
      { id: "request-invoice", label: "Ask Edda to countersign the maintenance invoice.", detail: "Read the room. Edda supplies corroboration; Helion logs your request.", requireFlag: "perk_face", effects: { factions: { helion: 1 }, flags: ["archive_done", "order_verified", "archive_method_face", "archive_flagged"], journal: [{ id: "verified-order", text: "Edda's countersigned maintenance invoice independently corroborates the evacuation cancellation.", kind: "fact" }] }, next: archiveArrival },
      { id: "lift-carbon", label: "Recover the ledger's carbon copy from the service slot.", detail: "Count the exits. A failed retrieval still leaves the staffed ledger route.", requireFlag: "perk_ghost", check: { itemBonuses: kitBonuses("ghost"), stat: "ghost", dc: 9, label: "Recover the carbon ledger", flagBonuses: [{ flag: "archive_patrol", amount: 2, label: "Service interval" }, { flag: "archive_reader_alert", amount: -1, label: "Reader alerted" }] }, successEffects: { flags: ["archive_done", "order_verified", "archive_method_ghost"], journal: [{ id: "verified-order", text: "A service-ledger carbon copy corroborates the key and time of the evacuation cancellation.", kind: "fact" }] }, failEffects: { flags: ["archive_flagged"], strain: 1 }, resultSuccess: "The carbon lists the key and the canceled evacuation. You keep its date and ledger number attached.", resultFail: "The slot closes on the sleeve. Edda points to the public search desk before the guard arrives.", nextSuccess: archiveArrival, nextFail: "act2_archive_gap" },
      { id: "hold-reader", label: "Hold the inspection hatch while Edda reads the ledger.", detail: "Steady hands. You take the physical risk while she checks the record.", requireFlag: "perk_nerve", check: { itemBonuses: kitBonuses("nerve"), stat: "nerve", dc: 9, label: "Hold the archive inspection hatch", flagBonuses: [{ flag: "archive_hatch", amount: 2, label: "Hatch braced" }] }, successEffects: { strain: 1, flags: ["archive_done", "order_verified", "archive_method_nerve"], journal: [{ id: "verified-order", text: "Edda inspected the maintenance ledger while the hatch was held open and corroborated the counter-order.", kind: "fact" }] }, failEffects: { strain: 1, flags: ["archive_flagged"] }, resultSuccess: "Edda reads the key and signs the extraction. The hatch falls after her hand is clear.", resultFail: "The lock starts to cycle. You pull Edda clear; the invoice can still be requested at the desk.", nextSuccess: archiveArrival, nextFail: "act2_archive_gap" },
      { id: "leave-archive", label: "Keep the export without authenticating it.", detail: "The archive promise remains unresolved.", next: "act2_middle" },
    ],
  },
  act2_archive_gap: {
    id: "act2_archive_gap", location: "Helion service archive",
    text: "Edda finds the shift ledger that used the issuing key. The reader blocked the digital chain; a maintenance invoice can still corroborate the instruction.\n\nShe can bill the search to your old employee number if you have one. Otherwise the archive charges twenty-five creds. The unverified export remains yours either way.",
    choices: [
      { id: "old-employee", label: "Use your old employee number.", requireOrigin: "spire", detail: "Your old badge acquires another trace. The invoice corroborates the order.", effects: { flags: ["archive_done", "order_verified", "old_badge_traced"], factions: { helion: 1 } }, next: archiveArrival },
      { id: "buy-ledger", label: "Pay for the shift ledger.", requireCreds: 25, effects: { creds: -25, flags: ["archive_done", "order_verified"] }, next: archiveArrival },
      { id: "keep-gap", label: "Record the gap. Keep the export.", effects: { flags: ["archive_done", "archive_unresolved"], journal: [{ id: "archive-gap", text: "The export names an issuing key; the service archive refused to authenticate it.", kind: "claim" }] }, next: "act2_middle" },
    ],
  },
  act2_archive_verified: {
    id: "act2_archive_verified", location: "The dry canal",
    text: "The signature is still Mara's. An independent source corroborates the later evacuation counter-order. Neither fact cancels the other.\n\nYou can give Sera a chain someone outside the chapel can examine. The dead are no longer evidence only a corporation can authenticate.",
    choices: [{ id: "keep-chain", label: "Keep both decisions attached.", effects: { flags: ["archive_done", "order_verified"], journal: [{ id: "verified-order", text: "An independent source corroborates Helion's canceled evacuation.", kind: "fact" }] }, next: "act2_middle" }],
  },
};
