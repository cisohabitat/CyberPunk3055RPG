import type { Choice, Scene } from "../types";

const closed = ["kerr_route_collected", "kerr_route_failed", "kerr_route_done", "depot_complete", "depot_failed"];
const pause: Choice = { id: "pause-depot-task", label: "Pause. Keep this task and its costs saved.", next: "act2_middle" };
const hold: Choice = { id: "abandon-depot-task", label: "Stop this attempt. Leave the case held.", requireFlag: "depot_started", hideIfAnyFlag: closed, effects: { flags: ["depot_failed", "kerr_route_failed"] }, next: "act2_route_recovery" };
const collected = (method: string) => ({ flags: ["depot_complete", "kerr_route_collected", `depot_collected_${method}`] });
const failed = { strain: 1, flags: ["depot_failed", "kerr_route_failed"] };
function begin(stat: string, label: string, next: string, exit?: string): Choice {
  return { id: `begin-depot-${stat}`, label, requireAllFlags: ["kerr_route_started", `perk_${stat}`, ...(exit ? [`kerr_exit_${exit}`] : [])], hideIfAnyFlag: [...closed, "depot_started"], effects: { flags: ["depot_started", `depot_${stat}`] }, next };
}

export const DEPOT_SCENES: Record<string, Scene> = {
  act2_depot_methods: {
    id: "act2_depot_methods", location: "Canal dispatch alcove",
    text: "The shutter is still down. Your trained method can turn the depot problem into work you control: repair a release circuit, read a patrol sequence, manage a load, or agree who carries the release liability.\n\nChoose one attempt. Reading and settings spend nothing; these are saved decisions, not real-time challenges. Each method states its costs before commitment. A stopped or failed attempt leaves the case held, with the registered courier recovery still available. An anonymous release never erases registration from your entry gate.",
    choices: [
      begin("chrome", "Chrome: repair the sensor-ramp release circuit.", "act2_depot_relay", "ramp"),
      begin("ghost", "Ghost: watch the patrol-gap sequence.", "act2_depot_outer_pass", "gap"),
      begin("nerve", "Nerve: plan the maintenance-stair load.", "act2_depot_carry", "walk"),
      begin("face", "Face: negotiate release liability at the counter.", "act2_depot_liability"),
      { id: "leave-depot-methods", label: "Keep the original roll, rig and sorting-shift options.", hideIfFlag: "depot_started", next: "act2_route_crossing" },
    ],
  },
  act2_depot_relay: {
    id: "act2_depot_relay", location: "Canal dispatch alcove",
    text: "Your Chrome training separates two circuits: recipient autocomplete and the depot's return address. The case needs the return address if delivery stops. Only the recipient circuit needs isolation.\n\nA disposable buffer costs ten creds and leaves no fault. A local disconnect costs one strain and leaves a maintenance fault against the depot machine. Neither option writes a new recipient. You must still preserve the return circuit next; cutting both strands will hold the case.",
    choices: [
      { id: "depot-fit-buffer", label: "Fit the disposable buffer. Pay 10 creds.", requireFlag: "depot_chrome", requireCreds: 10, hideIfAnyFlag: [...closed, "depot_buffer", "depot_disconnect"], effects: { creds: -10, flags: ["depot_buffer"] }, next: "act2_depot_return" },
      { id: "depot-disconnect-recipient", label: "Isolate the recipient relay. Add 1 strain; leave a service fault.", requireFlag: "depot_chrome", hideIfAnyFlag: [...closed, "depot_buffer", "depot_disconnect"], effects: { strain: 1, flags: ["depot_disconnect"] }, next: "act2_depot_return" }, pause, hold,
    ],
  },
  act2_depot_return: {
    id: "act2_depot_return", location: "Canal dispatch alcove",
    text: "The recipient relay is isolated. The remaining strand is marked DEPOT RETURN, not Kerr's address. Keeping it lets the shutter release a closed case that can come back here. Clearing it loses the return route and locks the shutter. Your buffer fee or disconnect effort is already spent.",
    choices: [
      { id: "depot-preserve-return", label: "Keep the depot return address. Release the closed case.", requireAnyFlag: ["depot_buffer", "depot_disconnect"], hideIfAnyFlag: closed, effects: collected("chrome"), next: "act2_route_receipt" },
      { id: "depot-clear-return", label: "Clear both circuits, including the depot return address.", detail: "The shutter will lock; add 1 strain recovering the uncompleted release. No new recipient entry.", requireAnyFlag: ["depot_buffer", "depot_disconnect"], hideIfAnyFlag: closed, effects: failed, next: "act2_route_recovery" }, pause, hold,
    ],
  },
  act2_depot_outer_pass: {
    id: "act2_depot_outer_pass", location: "Canal dispatch alcove",
    text: "The patrol walks away from the shutter. A loaded cart is about to follow it. Your Ghost training catches the habit: the patrol turns back to inspect each cart, then walks away again after the inspection. The first empty corridor is bait for anyone who follows the cart.\n\nWatching the cart pass costs nothing. Waiting through its inspection to the return pass adds one strain. Nothing advances while you read, save or change settings.",
    choices: [
      { id: "depot-watch-cart", label: "Watch the cart pass before crossing.", requireFlag: "depot_ghost", hideIfAnyFlag: [...closed, "depot_cart_pass"], effects: { flags: ["depot_cart_pass"] }, next: "act2_depot_cart_pass" },
      { id: "depot-follow-first-gap", label: "Follow the first gap before the cart inspection.", detail: "The patrol will turn back. Case held; add 1 strain. No new recipient entry.", requireFlag: "depot_ghost", hideIfAnyFlag: closed, effects: failed, next: "act2_route_recovery" }, pause, hold,
    ],
  },
  act2_depot_cart_pass: {
    id: "act2_depot_cart_pass", location: "Canal dispatch alcove",
    text: "The loaded cart covers the shutter from one direction. From the other, the patrol is turning back to inspect it. The cart provides cover but brings the inspection with it. Wait until the inspection is finished, or commit to following it now.",
    choices: [
      { id: "depot-wait-return", label: "Wait through the inspection. Add 1 strain.", requireAllFlags: ["depot_ghost", "depot_cart_pass"], hideIfAnyFlag: [...closed, "depot_return_pass"], effects: { strain: 1, flags: ["depot_return_pass"] }, next: "act2_depot_return_pass" },
      { id: "depot-follow-cart", label: "Cross behind the cart while it is being inspected.", detail: "The inspection catches the approach. Case held; add 1 strain. No new recipient entry.", requireAllFlags: ["depot_ghost", "depot_cart_pass"], hideIfAnyFlag: closed, effects: failed, next: "act2_route_recovery" }, pause, hold,
    ],
  },
  act2_depot_return_pass: {
    id: "act2_depot_return_pass", location: "Canal dispatch alcove",
    text: "The inspection is over. The cart waits against the outer wall while the patrol walks away a second time. This is the return pass you watched for. You can carry the closed case through the gap now. The strain from waiting is already paid; reading this moment cannot make it expire.",
    choices: [{ id: "depot-cross-return", label: "Cross on the observed return pass. Collect the case.", requireAllFlags: ["depot_ghost", "depot_return_pass"], hideIfAnyFlag: closed, effects: collected("ghost"), next: "act2_route_receipt" }, pause, hold],
  },
  act2_depot_carry: {
    id: "act2_depot_carry", location: "Canal dispatch alcove",
    text: "Your Nerve training tests the sealed case without opening it. Its weight sits below the top strap; carrying it high will catch the stair rail. Keep the load low.\n\nA landing cradle costs five creds and permits rest stops: one additional strain. Carrying without it costs no creds but adds two strain. These costs are beyond the entry and stair effort already paid on departure. You choose the load position next.",
    choices: [
      { id: "depot-rent-cradle", label: "Rent a landing cradle. Pay 5 creds; add 1 strain.", requireFlag: "depot_nerve", requireCreds: 5, hideIfAnyFlag: [...closed, "depot_cradle", "depot_direct"], effects: { creds: -5, strain: 1, flags: ["depot_cradle"] }, next: "act2_depot_load" },
      { id: "depot-carry-direct", label: "Carry without a cradle. Add 2 strain.", requireFlag: "depot_nerve", hideIfAnyFlag: [...closed, "depot_cradle", "depot_direct"], effects: { strain: 2, flags: ["depot_direct"] }, next: "act2_depot_load" }, pause, hold,
    ],
  },
  act2_depot_load: {
    id: "act2_depot_load", location: "Canal dispatch alcove",
    text: "The case stays sealed. The rail is higher than the case's centre of weight. A low carry keeps the strap beneath the rail; lifting by the top strap catches it. Your chosen cradle fee and carrying effort are already paid. A caught load goes back to the shelf, with one more strain and no new recipient entry.",
    choices: [
      { id: "depot-carry-low", label: "Keep the case low and clear the rail.", requireAnyFlag: ["depot_cradle", "depot_direct"], hideIfAnyFlag: closed, effects: collected("nerve"), next: "act2_route_receipt" },
      { id: "depot-lift-high", label: "Lift by the top strap beside the stair rail.", detail: "The load catches. Case held; add 1 strain.", requireAnyFlag: ["depot_cradle", "depot_direct"], hideIfAnyFlag: closed, effects: failed, next: "act2_route_recovery" }, pause, hold,
    ],
  },
  act2_depot_liability: {
    id: "act2_depot_liability", location: "Canal dispatch alcove",
    text: "The steward wants someone responsible for a lost case. Your Face training separates the runner's work docket from the recipient register. You can put your own return work on the docket, or pay for the steward to take liability, while leaving Kerr out.\n\nThe other contract names Kerr as recipient. It costs no creds or work but records both your handle and his name. Kerr has not agreed to work for this depot; you cannot offer his time.",
    choices: [
      { id: "depot-offer-own-liability", label: "Offer my own work or payment. Review those terms.", requireFlag: "depot_face", hideIfAnyFlag: [...closed, "depot_own_liability"], effects: { flags: ["depot_own_liability"] }, next: "act2_depot_contract" },
      { id: "depot-sign-recipient", label: "Accept recipient registration. Release the case.", detail: "Records your handle and Kerr's name. Breaks any private-collection promise. No fee or return work.", requireFlag: "depot_face", hideIfAnyFlag: closed, effects: { flags: [...collected("face").flags, "kerr_route_trace", "depot_registered_contract"] }, next: "act2_route_receipt" }, pause, hold,
    ],
  },
  act2_depot_contract: {
    id: "act2_depot_contract", location: "Canal dispatch alcove",
    text: "The steward keeps Kerr's recipient box empty. Only your handle goes on a separate work docket. You can promise one return sorting shift, completed later for one strain, or pay fifteen creds for the steward to take the liability now.\n\nThe return shift is your obligation. Leaving the Week does not complete it. Neither choice erases an entry-gate register or makes Kerr owe you work.",
    choices: [
      { id: "depot-promise-return-shift", label: "Promise my return sorting shift. Collect the case.", detail: "No upfront fee or strain. One shift remains owed until worked later for 1 strain; Kerr owes nothing.", requireAllFlags: ["depot_face", "depot_own_liability"], hideIfAnyFlag: closed, effects: { flags: [...collected("face").flags, "depot_shift_owed"], journal: [{ id: "depot-return-promise", kind: "promise", text: "You offered one depot return sorting shift in your own name for anonymous case release. Work costs one strain when completed. Kerr owes no work; existing recipient registration remains." }] }, next: "act2_route_receipt" },
      { id: "depot-pay-liability", label: "Pay 15 creds for the steward's liability. Collect the case.", requireAllFlags: ["depot_face", "depot_own_liability"], requireCreds: 15, hideIfAnyFlag: closed, effects: { creds: -15, flags: [...collected("face").flags, "depot_cash_liability"] }, next: "act2_route_receipt" }, pause, hold,
    ],
  },
};
