import type { Scene, StatId } from "../types";

const methods: { id: string; stat: StatId; label: string; success: string; fail: string }[] = [
  { id: "isolate-pump", stat: "chrome", label: "Isolate the damaged relay and restart the spare.", success: "The spare takes the load. The clinic's cold cabinet returns to its marked range.", fail: "The relay trips again. The cabinet has to be emptied before another restart." },
  { id: "dispatch-pump", stat: "face", label: "Get the maintenance dispatcher to send the spare crew.", success: "You secure a repair slot under the pump number. The crew asks for no patient list.", fail: "The dispatcher closes the emergency slot. Lumen starts packing the cold cabinet." },
  { id: "route-pump", stat: "ghost", label: "Reach the service valve through the closed freight passage.", success: "You open the bypass from the dry side. The gauge climbs into its marked range.", fail: "The freight gate locks before you reach the valve. There is no safe second pass tonight." },
  { id: "brace-pump", stat: "nerve", label: "Hold the manual bypass while Lumen switches the circuit.", success: "You keep the wheel steady until the spare circuit takes over. Lumen taps your hand: release.", fail: "The wheel kicks back. You let go before it takes your hand; the spare circuit stays dark." },
];

export const COMMUNITY_SCENES: Record<string, Scene> = {
  act2_pump_brief: {
    id: "act2_pump_brief", location: "Ward Nine coolant station", speaker: "Sister Lumen",
    text: "A pump beneath the clinic has stopped. Lumen has twenty minutes of cold storage left, and a trolley beside the cabinet. This is today's worn relay, not evidence of the dump that killed Ward Nine.\n\n'Help the room before you make it a sentence,' she says. 'If the spare won't start, we move the medicines.'\n\nKerr is standing at the freight gate. He has a service key and the same bad knee. Whether he stays depends on what passed between you in Ward Four.",
    choices: [
      { id: "ask-kerr-pump", label: "Ask Kerr to hold the service door.", requireFlag: "kerr_told", hideIfAnyFlag: ["kerr_sold_you", "pump_kerr", "pump_attempted", "pump_done"], detail: "He heard the names earlier. His help adds +1 to this pump attempt; it grants no evidence.", effects: { flags: ["pump_kerr"] }, next: "act2_pump_methods" },
      { id: "work-pump", label: "Choose a way to restore the coolant.", hideIfAnyFlag: ["pump_attempted", "pump_done"], next: "act2_pump_methods" },
      { id: "leave-pump-brief", label: "Leave Lumen to move the cabinet. Keep your other commitments.", next: "act2_middle" },
    ],
  },
  act2_pump_methods: {
    id: "act2_pump_methods", location: "Ward Nine coolant station", speaker: "Kerr",
    text: (state) => `${state.flags.pump_kerr ? "Kerr props the door with his service key. 'The knee won't hold a wheel. The door I can do.' He stays where you can see him." : state.flags.kerr_sold_you ? "Kerr leaves the gate key on a hook. 'You have no reason to want me behind you.' He steps out of the room." : "Kerr points out the service entrance, then leaves. The key belongs to this door, not to a favor you have earned."}\n\nThe relay, dispatcher, freight passage, and bypass offer different routes to the same spare circuit. There is time for one attempt. Your investigation equipment was designed for readers and transfers; it gives no pump bonus. If the attempt fails, the medicines still have a transfer route.`,
    choices: methods.map((method) => ({
      id: method.id, label: method.label, hideIfAnyFlag: ["pump_attempted", "pump_done"],
      check: { stat: method.stat, dc: 8, label: "Restore the clinic coolant", flagBonuses: [{ flag: "pump_kerr", amount: 1, label: "Kerr holds the service door" }] },
      successEffects: { flags: ["pump_attempted", "pump_restored", `pump_${method.stat}`] },
      failEffects: { flags: ["pump_attempted", "pump_failed", `pump_${method.stat}`], strain: 1 },
      resultSuccess: method.success, resultFail: method.fail,
      nextSuccess: "act2_pump_report", nextFail: "act2_pump_triage",
    })),
  },
  act2_pump_triage: {
    id: "act2_pump_triage", location: "Clinic loading ramp", speaker: "Sister Lumen",
    text: "The spare is still dark. Lumen seals the medicines in insulated boxes. A courier can take them to another cold cabinet for thirty-five creds. You can carry them up the service stairs yourself; the climb will cost you pressure.\n\nNeither option repairs the pump. Both preserve this cabinet's contents for tonight. Leaving means Lumen will arrange the transfer herself, drawing staff away from the clinic. There is no second roll at the broken relay.",
    choices: [
      { id: "fund-cold-transfer", label: "Pay thirty-five creds for the cold-storage courier.", requireCreds: 35, requireFlag: "pump_failed", hideIfFlag: "pump_done", detail: "Preserve the medicines; the pump still needs repair.", effects: { creds: -35, flags: ["pump_done", "pump_supplies_saved", "pump_courier"], journal: [{ id: "pump-transfer", text: "You funded a cold-storage transfer after the spare circuit failed. The medicines were preserved; the pump remains unrepaired.", kind: "fact" }] }, next: "act2_middle" },
      { id: "carry-cold-transfer", label: "Carry the insulated boxes up the service stairs.", requireFlag: "pump_failed", hideIfFlag: "pump_done", detail: "Gain 2 strain, capped at 5. Preserve the medicines without repairing the pump.", effects: { strain: 2, flags: ["pump_done", "pump_supplies_saved", "pump_carried"], journal: [{ id: "pump-transfer", text: "You carried the medicines to another cold cabinet. The pump remains unrepaired.", kind: "fact" }] }, next: "act2_middle" },
      { id: "leave-cold-transfer", label: "Let Lumen divert her staff to the transfer.", requireFlag: "pump_failed", hideIfFlag: "pump_done", detail: "The clinic loses one step of trust. Record that you left the emergency to its staff.", effects: { flags: ["pump_done", "pump_left"], factions: { lumen: -1 }, journal: [{ id: "pump-transfer", text: "You left the failed pump and transfer to clinic staff. Their outcome was not observed by you.", kind: "fact" }] }, next: "act2_middle" },
    ],
  },
  act2_pump_report: {
    id: "act2_pump_report", location: "Ward Nine coolant station", speaker: "Sister Lumen",
    text: "The gauge holds. Lumen records the relay number, temperature, and next inspection date. Helion offers forty creds for a repair report carrying the contractor's handle and station number. It asks for no patient names.\n\nThe neighborhood can keep its own maintenance record instead. The circuit works either way. Choose who gets the receipt; today's repaired relay proves nothing about the old counter-order.",
    choices: [
      { id: "keep-pump-local", label: "Leave the repair record with the neighborhood.", requireFlag: "pump_restored", hideIfFlag: "pump_done", detail: "Ward standing +1. No rebate; keep the contractor's handle off the tower receipt.", effects: { flags: ["pump_done", "pump_local"], factions: { wards: 1 }, journal: [{ id: "pump-repair", text: "The clinic coolant was restored. The neighborhood retains the maintenance record; this repair authenticates no historical order.", kind: "fact" }] }, next: "act2_middle" },
      { id: "file-pump-rebate", label: "File the contractor receipt with Helion for forty creds.", requireFlag: "pump_restored", hideIfFlag: "pump_done", detail: "Helion +1, wards −1. The tower gets your handle and station number, without patient names.", effects: { creds: 40, flags: ["pump_done", "pump_rebate"], factions: { helion: 1, wards: -1 }, journal: [{ id: "pump-repair", text: "The clinic coolant was restored. Helion paid forty creds and received the contractor handle and station number, without patient names. This repair authenticates no historical order.", kind: "fact" }] }, next: "act2_middle" },
    ],
  },
  act3_pump_visit: {
    id: "act3_pump_visit", location: "Ward Nine clinic service door", speaker: "Kerr",
    text: (state) => `${state.flags.pump_restored ? "The gauge remains in range. The clinic has booked another inspection; your repair bought time, not a permanent cure." : state.flags.pump_supplies_saved ? "The cold cabinet stands empty. The transferred medicines reached the other clinic; Lumen is still waiting for a replacement relay." : "Lumen's transfer trolley is gone. You did not stay to see where the boxes went. A blank beside the delivery line remains a blank."}\n\n${state.flags.pump_rebate ? "A Helion contractor receipt is clipped beside the gauge. Your handle and the station number remain on it. No patient name was sent." : state.flags.pump_local ? "The neighborhood's maintenance sheet hangs beside the gauge. Sera has left a space for the next inspection." : "The maintenance sheet still marks the relay for replacement."}\n\n${state.flags.pump_kerr ? "Kerr turns the service key over in his palm. 'You told me the names. This time I kept a door open. That doesn't settle the rest of my week.'" : state.flags.kerr_sold_you ? "Kerr stays outside. A useful key did not undo his earlier sale of your confession." : "Kerr checks the door catch. You shared a room with a broken machine; it has not made either of you the other's creditor."}`,
    choices: [{ id: "leave-pump-visit", label: "Return to the neighbors before the wall.", effects: { flags: ["visited_pump"] }, next: "act3_neighborhood" }],
  },
};
