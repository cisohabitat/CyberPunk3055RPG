import type { Choice, Effect, GameState, Scene } from "../types";

const inspected = ["spire_billing", "spire_protocol", "spire_receiver"];
const returnFromVisit = (state: GameState) => state.flags.spire_return_wall ? "ward_wall" : "act3_neighborhood";
export function spireVisitChoice(fromWall = false): Choice {
  return { id: "visit-spire-key", label: "Ask Edda what payroll did with the old maintenance key.", requireOrigin: "spire", requireAnyFlag: ["spire_started", "spire_declined", "origin_done"], hideIfFlag: "spire_visited", effects: { flags: fromWall ? ["spire_return_wall"] : [], flagsOff: fromWall ? [] : ["spire_return_wall"] }, next: "act3_spire_visit" };
}
export function spireOutcome(state: GameState): string {
  const trace = state.flags.old_badge_traced ? " Your old badge remains in the terminal’s query log; later closure did not erase it." : "";
  if (state.flags.spire_declined) return "Edda kept responsibility for her maintenance-key request. You observed no closure or payroll response.";
  if (state.flags.spire_closure_recorded || state.origin === "spire" && state.flags.origin_helped) return `${state.flags.spire_late_closed ? "The later payroll reply confirmed retirement of the obsolete maintenance key. No receiver was awarded after the week." : "Edda checked a receipt confirming that the obsolete maintenance key was retired in both service and payroll registers."} Future shift charges use her current number. Earlier disputed charges still need review; closure restores no suspended archive access or wages.${trace}`;
  if (state.flags.spire_pending) return "The staffed desk accepted Edda’s signed revocation request. Acceptance is not closure; the old billing key and earlier charges remain unresolved." + trace;
  if (state.flags.spire_unresolved || state.flags.origin_done) return "You stopped before a closure receipt. The obsolete key and disputed shift charges remain unresolved." + trace;
  if (state.flags.spire_key_revoked) return "The service reader reports retirement. Edda still needs to compare its receipt with the payroll register before you claim both stores are closed." + trace;
  return "Edda authorized retirement of an obsolete maintenance key. Read the billing slip, revocation protocol and receiver card, then choose one approach." + trace;
}
const failed: Effect = { strain: 1, factions: { helion: 1 }, flags: ["spire_failed", "old_badge_traced"] };
const retired = ["spire_key_revoked"];
const acknowledge = (state: GameState): Effect => ({
  flags: ["origin_done", "spire_done", "spire_closure_recorded", ...(!state.flags.old_badge_traced ? ["origin_helped", "spire_receiver_earned"] : [])],
  itemsAdd: !state.flags.old_badge_traced ? ["signal-baffle"] : [],
  factions: !state.flags.old_badge_traced ? { helion: -1 } : {},
  journal: [{ id: "spire-closure", text: "Edda matched the signed retirement receipt against service and payroll registers. Future shifts use her current billing number; earlier charges remain under review. The receipt concerns a present maintenance key, not the historical evacuation order.", kind: "fact" }],
});

function preparations(choices: Choice[]): Choice[] {
  return choices.map((choice) => ({ ...choice, requireAllFlags: [...inspected, "spire_consent"], hideIfFlag: "spire_prepared", effects: (state) => {
    const effect = typeof choice.effects === "function" ? choice.effects(state) : choice.effects;
    return { ...effect, flags: [...(effect?.flags ?? []), "spire_prepared"] };
  } }));
}

export const SPIRE_SCENES: Record<string, Scene> = {
  act2_spire_brief: {
    id: "act2_spire_brief", location: "Helion service counter", speaker: "Edda",
    text: "Edda recognizes the notch in your old badge. She shields a shift slip from Ives.\n\n‘The obsolete key bills me after I clock out. Close that number, not my current account.’ She sets a receiver beside it. ‘A clean receipt and this is yours. Wake their badge reader and it stays here.’\n\nShe signs the request. Earlier charges still need review; the private form carries no archive extraction or witness names.",
    choices: [
      { id: "accept-spire-key", label: "Agree to retire the obsolete key and keep her current account open.", hideIfFlag: "spire_done", effects: { flags: ["spire_started", "spire_consent"], journal: [{ id: "spire-promise", text: "Edda authorized retirement of her obsolete maintenance key, not deletion of her current account. Observe both service and payroll closure before claiming success; earlier charges and any records inquiry remain separate.", kind: "promise" }] }, next: "act2_spire_sources" },
      { id: "decline-spire-key", label: "Tell Edda you cannot take responsibility for the request.", hideIfFlag: "spire_done", effects: { flags: ["origin_done", "spire_done", "spire_declined"] }, next: "act2_spire_result" },
    ],
  },
  act2_spire_sources: {
    id: "act2_spire_sources", location: "Helion service counter", speaker: "Edda",
    text: (state) => `The slip, a service card and the receiver’s paper sleeve cover half the counter. Edda keeps her thumb over the current account number.\n\n‘Read all three. The terminal is happy to close the wrong thing.’ You can turn the papers without sending a query.\n\n${inspected.filter((flag) => state.flags[flag]).length}/3 checked.${state.flags.spire_billing ? "\n\nBilling slip: the obsolete key and current payroll account are different numbers. Retire only the obsolete key; disputed earlier charges stay on the review sheet." : ""}${state.flags.spire_protocol ? "\n\nService card: retirement needs a matching receipt from service and payroll. A queue ticket is only an accepted request." : ""}${state.flags.spire_receiver ? "\n\nReceiver sleeve: one baffle after an observed, untraced closure. It can help trace a later receipt, but supplies no historical authentication by itself." : ""}`,
    choices: ([
      { id: "inspect-spire-billing", label: "Compare the obsolete key with her current shift number.", hideIfFlag: "spire_billing", effects: { flags: ["spire_billing"], journal: [{ id: "spire-billing", text: "The shift slip distinguishes an obsolete maintenance key from Edda’s active payroll account. Old charges remain disputed; the current account must stay open.", kind: "fact" }] }, next: "act2_spire_sources" },
      { id: "inspect-spire-protocol", label: "Read how service retirement reaches the payroll register.", hideIfFlag: "spire_protocol", effects: { flags: ["spire_protocol"], journal: [{ id: "spire-protocol", text: "The service protocol requires a matching retirement receipt in service and payroll registers. A queued request is not a completed revocation.", kind: "fact" }] }, next: "act2_spire_sources" },
      { id: "inspect-spire-receiver", label: "Read the receiver’s limits and Edda’s handover terms.", hideIfFlag: "spire_receiver", effects: { flags: ["spire_receiver"], journal: [{ id: "spire-receiver", text: "Edda will release one signal baffle only after an observed closure without an old-badge trace. It assists a later archive check; possession authenticates no historical order.", kind: "fact" }] }, next: "act2_spire_sources" },
      { id: "plan-spire-key", label: "Keep the current number out of the retirement field. Prepare one approach.", requireAllFlags: inspected, next: "act2_spire_prep" },
    ] satisfies Choice[]).map((choice) => ({ ...choice, requireFlag: "spire_consent" })),
  },
  act2_spire_prep: {
    id: "act2_spire_prep", location: "Spire service alcove", speaker: "Edda",
    text: "The next shift is waiting for the counter. Edda can give you time for one preparation.\n\nCopy the field order for a Chrome attempt, isolate the local reader with practiced signal discipline, arrange a countersigning clerk, map the maintenance mirror, or steady the service latch. Prepared skills offer different costs. A thirty-five-creds processor can also close both stores without using your old badge.",
    choices: preparations([
      { id: "spire-prep-fields", label: "Copy the two-store field order onto the sleeve.", detail: "Chrome retirement check +1; the spoof chip can add its listed +1.", effects: { flags: ["spire_fields"] }, next: "act2_spire_methods" },
      { id: "spire-prep-reader", label: "Isolate the local reader from the badge carrier.", requireFlag: "perk_chrome", detail: "Prepared Chrome retirement without a roll costs Strain +1.", effects: { flags: ["spire_reader"] }, next: "act2_spire_methods" },
      { id: "spire-prep-clerk", label: "Agree a countersignature with the service clerk.", requireFlag: "perk_face", detail: "Prepared Face retirement spends one step of Helion standing; minimum 1.", effects: { flags: ["spire_clerk"] }, next: "act2_spire_methods" },
      { id: "spire-prep-mirror", label: "Map the authorized maintenance mirror away from the badge reader.", requireFlag: "perk_ghost", detail: "Prepared Ghost retirement costs Strain +1 without a roll.", effects: { flags: ["spire_mirror"] }, next: "act2_spire_methods" },
      { id: "spire-prep-latch", label: "Brace the service latch for Edda’s signed retirement cycle.", requireFlag: "perk_nerve", detail: "Unlock a Nerve DC 9 attempt with a +1 latch bonus; a miss logs the old badge.", effects: { flags: ["spire_latch"] }, next: "act2_spire_methods" },
      { id: "spire-no-prep", label: "Use the terminal as it stands, or pay the processor.", next: "act2_spire_methods" },
    ]),
  },
  act2_spire_methods: {
    id: "act2_spire_methods", location: "Spire maintenance terminal", speaker: "Edda",
    text: "Edda holds the signed request against the terminal. Only the obsolete number is in the retirement field.\n\n‘One attempt. If it rejects you, we go to the desk. Your old badge will be in its log.’ She keeps the receiver covered until service and payroll agree. This is today's maintenance key, not the evacuation order.",
    choices: ([
      { id: "spire-retire-terminal", label: "Retire the obsolete key through the terminal.", hideIfFlag: "spire_attempted", check: { stat: "chrome", dc: 10, label: "Retire both maintenance-key entries", itemBonuses: [{ item: "spoof-chip", amount: 1 }], flagBonuses: [{ flag: "spire_fields", amount: 1, label: "Two-store field order" }] }, effects: { flags: ["spire_attempted"] }, successEffects: { flags: retired }, failEffects: failed, resultSuccess: "Both readers return a retirement number. Edda asks to compare the printed receipt.", resultFail: "The carrier catches your old badge. The request is rejected; the query remains logged.", nextSuccess: "act2_spire_receipt", nextFail: "act2_spire_recovery" },
      { id: "spire-local-reader", label: "Complete the retirement through your isolated local reader.", requireAllFlags: ["perk_chrome", "spire_reader"], detail: "Strain +1. No roll; Edda’s active account remains open.", effects: { strain: 1, flags: [...retired, "spire_method_chrome"] }, next: "act2_spire_receipt" },
      { id: "spire-clerk-signature", label: "Use the clerk’s agreed countersignature.", requireAllFlags: ["perk_face", "spire_clerk"], requireFaction: { faction: "helion", min: 1 }, detail: "Spend one step of Helion standing. No old badge query; check the receipt next.", effects: { factions: { helion: -1 }, flags: [...retired, "spire_method_face"] }, next: "act2_spire_receipt" },
      { id: "spire-mirror-cycle", label: "Run Edda’s signed cycle through the maintenance mirror.", requireAllFlags: ["perk_ghost", "spire_mirror"], detail: "Strain +1. No roll and no substitution of another worker’s account.", effects: { strain: 1, flags: [...retired, "spire_method_ghost"] }, next: "act2_spire_receipt" },
      { id: "spire-hold-latch", label: "Hold the service latch while Edda runs the signed cycle.", requireAllFlags: ["perk_nerve", "spire_latch"], hideIfFlag: "spire_attempted", check: { stat: "nerve", dc: 9, label: "Hold the maintenance retirement cycle", flagBonuses: [{ flag: "spire_latch", amount: 1, label: "Braced service latch" }] }, effects: { flags: ["spire_attempted"] }, successEffects: { strain: 1, flags: [...retired, "spire_method_nerve"] }, failEffects: failed, resultSuccess: "The latch holds until both registers return. Your hands shake as Edda takes the receipt.", resultFail: "The latch releases early. The badge reader wakes and logs the rejected cycle.", nextSuccess: "act2_spire_receipt", nextFail: "act2_spire_recovery" },
      { id: "spire-pay-processor", label: "Pay thirty-five creds for a staffed retirement cycle.", requireCreds: 35, detail: "Close both stores without a roll or an old-badge query. Check the receipt before earning the receiver.", effects: { creds: -35, flags: [...retired, "spire_processor"] }, next: "act2_spire_receipt" },
      { id: "spire-use-desk", label: "Leave the terminal alone. File through the free staffed desk.", next: "act2_spire_recovery" },
    ] satisfies Choice[]).map((choice) => ({ ...choice, requireFlag: "spire_consent", hideIfAnyFlag: ["spire_attempted", "spire_done", "spire_key_revoked"] })),
  },
  act2_spire_recovery: {
    id: "act2_spire_recovery", location: "Helion staffed service desk", speaker: "Edda",
    text: (state) => `${state.flags.old_badge_traced ? "The terminal has your badge number. Edda puts its rejection beside the signed request. ‘We can close the key. We can’t make that query disappear.’" : "Edda covers the badge reader and takes a queue ticket. ‘The staffed desk is slower. You don’t need to wake that thing to ask.’"}\n\nThirty-five creds buy a processor’s completed retirement cycle. The free desk accepts a signed request for a later response; it guarantees no closure tonight. You can also stop here. A second terminal roll is unavailable, and a traced badge prevents a receiver handover even after paid recovery.`,
    choices: [
      { id: "spire-recovery-processor", label: "Pay thirty-five creds to complete the retirement now.", requireCreds: 35, requireFlag: "spire_consent", hideIfAnyFlag: ["spire_done", "spire_key_revoked"], effects: { creds: -35, flags: [...retired, "spire_processor"] }, next: "act2_spire_receipt" },
      { id: "spire-file-request", label: "File Edda’s signed request at the free desk.", requireFlag: "spire_consent", hideIfFlag: "spire_done", effects: { flags: ["origin_done", "spire_done", "spire_pending"], journal: [{ id: "spire-desk-request", text: "The staffed desk acknowledged Edda’s signed retirement request. No closure was confirmed during The Week; retain the reference for a later payroll reply.", kind: "fact" }] }, next: "act2_spire_result" },
      { id: "spire-stop-request", label: "Return the papers without claiming the old key is closed.", hideIfFlag: "spire_done", effects: { flags: ["origin_done", "spire_done", "spire_unresolved"] }, next: "act2_spire_result" },
    ],
  },
  act2_spire_receipt: {
    id: "act2_spire_receipt", location: "Helion service counter", speaker: "Edda",
    text: (state) => `Edda reads the retirement number from the printout and from payroll’s reply. They match. Her current account still opens; the old maintenance number no longer takes new shift charges.\n\n${state.flags.old_badge_traced ? "She leaves the receiver in its sleeve. ‘They have your badge. I’m not adding this serial number to the same trail.’ The logged query survives the closure." : "She pushes the receiver across the counter. ‘One clean number. One receiver. The old charges are still a fight.’"}\n\nRecord both-store closure before leaving. The old invoices have not been refunded, any archive inquiry remains open, and this receipt authenticates no historical evacuation order.`,
    choices: [{ id: "acknowledge-spire-closure", label: "Record the matched closure receipt and Edda’s current account.", requireFlag: "spire_key_revoked", hideIfFlag: "spire_done", effects: acknowledge, next: "act2_spire_result" }],
  },
  act2_spire_result: {
    id: "act2_spire_result", location: "Spire service exit", speaker: "Edda",
    text: (state) => `${spireOutcome(state)}\n\nEdda folds the papers into her coat. ‘Come back when payroll answers. They don’t always send the same answer to the person who asked.’\n\nThe district board still has this week’s calls.`,
    choices: [{ id: "spire-return-board", label: "Return to the district board.", next: "districts" }],
  },
  act3_spire_visit: {
    id: "act3_spire_visit", location: "Ward Nine payroll table", speaker: "Edda",
    text: (state) => `${state.flags.spire_pending ? "Edda lays down her queue ticket. ‘They accepted the request. They haven't closed the key. Will you sit while I ask payroll?’" : state.flags.spire_closure_recorded || state.flags.origin_helped ? "Edda brings a shift slip with her current number. New charges have stopped using the obsolete key; the old invoices remain disputed." : state.flags.spire_declined ? "Edda has the folded slip you left with her. ‘You didn't take this on. I haven't brought you a closure receipt.’" : "Edda brings the same slip. You left without a closure receipt; the old key remains unresolved."}

${state.flags.old_badge_traced ? "She keeps the old-badge query beside the slip. ‘That part didn't go away.’" : "She smooths the crease you remember from the counter."}

${state.flags.archive_custody && (state.flags.edda_exposed || state.flags.archive_method_face || state.flags.archive_method_nerve) ? "Her archive access is still suspended. ‘The key and the inquiry are different jobs. We can ask about temporary work separately.’" : "‘No wage receipt today,’ she says. ‘Just what payroll did with the number.’"}`,
    choices: [
      { id: "query-spire-reply", label: "Wait with Edda for the signed request’s payroll reply.", requireFlag: "spire_pending", hideIfFlag: "spire_reply_queried", effects: { flags: ["spire_reply_queried", "spire_reply_closed"] }, next: "act3_spire_reply" },
      { id: "close-spire-visit", label: "Keep the actual payroll position and return.", hideIfFlag: "spire_visited", effects: (state) => ({ flags: ["spire_visited"], journal: [{ id: "spire-payroll-response", text: spireOutcome(state), kind: "fact" }] }), next: returnFromVisit },
    ],
  },
  act3_spire_reply: {
    id: "act3_spire_reply", location: "Ward Nine payroll table", speaker: "Edda",
    text: (state) => `The relay returns a signed retirement reply against Edda’s request reference. Service and payroll now show the obsolete key as retired; her current account remains open. The reply supplies no refund for earlier charges and no decision on the archive inquiry.\n\n${state.flags.old_badge_traced ? "Your old badge remains on the earlier query. Edda puts that printout beside the new reply, without crossing it out." : "The reply uses the request reference without opening an old-badge query."}\n\n‘Late is still useful,’ Edda says. ‘Don’t date it last week.’ She keeps the receiver: tonight’s confirmation cannot create an earlier clean handover. Her signed receipt can support a separate private work application if she authorizes one.`,
    choices: [{ id: "record-spire-reply", label: "Record the later closure and preserve the earlier uncertainty.", requireFlag: "spire_reply_closed", hideIfFlag: "spire_visited", effects: { flags: ["spire_key_revoked", "spire_closure_recorded", "spire_late_closed", "spire_visited"], flagsOff: ["spire_pending"], journal: [{ id: "spire-late-closure", text: "A later signed payroll reply confirmed retirement in both stores under Edda’s accepted request reference. The earlier week had no closure confirmation. No receiver, refunded charge, restored wage or archive-inquiry decision followed from this reply.", kind: "fact" }] }, next: returnFromVisit }],
  },
};
