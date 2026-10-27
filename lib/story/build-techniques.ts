import { beginTechnique, fastNerveTechnique, finishTechnique, processCosignAllowed, spendTechnique, techniqueMode, techniqueStatus } from "../build-techniques";
import { districtRemaining } from "../district-response";
import { TECHNIQUE_QUOTES as Q } from "../technique-dialogue";
import type { Choice, Scene, StatId } from "../types";
const say = (key: keyof typeof Q) => `“${Q[key]}”`;
const pause: Choice = { id: "pause-technique", label: "Pause with the actual costs and remaining actions saved.", detail: "Free. Reading, conversation, playback and settings consume no depot actions.", next: "act2_district_canal" };
const abandon: Choice = { id: "abandon-technique", label: "Set aside this specialist attempt without refunding its costs.", detail: "Any signature, effort and waived work remain. The ordinary courier can still be used if a depot action remains; no review reference is claimed.", effects: { flags: ["technique_closed"] }, next: "act2_district_canal" };
const plan = (stat: StatId, label: string, next: string): Choice => ({ id: `plan-technique-${stat}`, label, requireFlag: `perk_${stat}`, next });
export const TECHNIQUE_SCENES: Record<string, Scene> = {
  act2_technique_bench: {
    id: "act2_technique_bench", location: "Canal filing bench",
    text: "The depot offers a review reference for a readable procedural correction: a heading that confuses workers with recipients, a route that loses its return code, or a filing whose scope needs stating. A reference confirms receipt for review, not that the correction is true. No original evidence or witness material belongs in this packet.\n\nYour earned training opens a method. Matching equipment can change the sacrifice: a diagnostic trace, a courier signature, waived paid work, or handling effort. Compare before committing. Ordinary delivery remains available outside this bench if an action remains. Nothing here changes a die, grants another skill or erases an earlier register.",
    choices: [
      plan("chrome", "Chrome: reconcile the two record fields.", "act2_technique_chrome"),
      plan("ghost", "Ghost: control the packet's routing exposure.", "act2_technique_ghost"),
      plan("face", "Face: negotiate the filing's voluntary scope.", "act2_technique_face"),
      plan("nerve", "Nerve: choose a protected carry and recovery plan.", "act2_technique_nerve"), pause, abandon,
    ],
  },
  act2_technique_chrome: {
    id: "act2_technique_chrome", location: "Canal filing bench", speaker: "Dispatcher",
    text: `${say("chrome")}\n\nThe display says PEOPLE: 3. Its public source fields say WORKERS: 3 and RECIPIENTS: 2. These are different populations. The proposed correction concerns the display heading; it cannot invent a third recipient.\n\nCounter diagnostics record your own handle and add one Helion standing/exposure. With an Archive Probe, portable verification instead costs one strain and leaves a device-service trace. It does not erase an earlier public audit signature. Preparation spends one depot action; a bounded submission spends the second.`,
    choices: [
      { id: "prepare-technique-chrome-counter", label: "Use the named counter diagnostic.", detail: "One depot action; Helion +1; your diagnostic handle remains recorded. No strain cost.", requireFlag: "perk_chrome", effects: s => beginTechnique(s, "chrome", "counter", { factions: { helion: 1 }, flags: ["technique_named_diagnostic"] }), next: "act2_technique_chrome_submit" },
      { id: "prepare-technique-chrome-portable", label: "Use the Archive Probe to verify away from the named console.", detail: "One depot action; Strain +1; device-service trace remains. Earlier signatures are unchanged.", requireFlag: "perk_chrome", requireItem: "archive-probe", maxStrain: 4, effects: s => beginTechnique(s, "chrome", "portable", { strain: 1, flags: ["technique_portable_fault"] }), next: "act2_technique_chrome_submit" }, pause, abandon,
    ],
  },
  act2_technique_chrome_submit: {
    id: "act2_technique_chrome_submit", location: "Canal filing bench",
    text: "The verified source still has three workers and two recipients. The display's number came from the worker field. Attach a request to label that display Workers, preserving both original counts. Forcing the recipient field to three would add a person who is not in the source.\n\nYour preparation and its trace are already committed. Inspection is free. Submitting uses one remaining depot action; an unsupported alteration leaves the packet held without a review reference.",
    choices: [
      { id: "submit-technique-chrome-label", label: "Request the Workers heading; preserve Workers 3 and Recipients 2.", detail: "One depot action. Receive a bounded review reference; Wards +1. No issuing-key or inquiry decision.", effects: s => finishTechnique(s, true), next: "act2_technique_result" },
      { id: "reject-technique-chrome-invent", label: "Change the recipient count to three to make the totals match.", detail: "One depot action. Unsupported alteration: packet held, no reference or standing reward.", effects: s => finishTechnique(s, false), next: "act2_technique_result" }, pause, abandon,
    ],
  },
  act2_technique_ghost: {
    id: "act2_technique_ghost", location: "Canal filing bench", speaker: "Dispatcher",
    text: `${say("ghost")}\n\nThe public counter accepts a sealed procedural packet by its depot return reference. It does not require a witness identity. You can sign as its courier, or use a Route Shroud to screen the outer packet tags while carrying it to the same lit counter. That equipment does not reopen a closed side hatch or remove digital records.\n\nA signed handoff costs one action and no strain. Screening costs one action and one strain. Routing the bounded packet then costs one more action.`,
    choices: [
      { id: "prepare-technique-ghost-signed", label: "Prepare a handoff under your own courier signature.", detail: "One depot action. Your new courier signature remains; no recipient name is supplied.", requireFlag: "perk_ghost", effects: s => beginTechnique(s, "ghost", "signed", { flags: ["technique_courier_signed"] }), next: "act2_technique_ghost_route" },
      { id: "prepare-technique-ghost-screened", label: "Screen the packet tags with the Route Shroud.", detail: "One depot action; Strain +1. No new courier signature. Earlier records and hatch restrictions remain.", requireFlag: "perk_ghost", requireItem: "route-shroud", maxStrain: 4, effects: s => beginTechnique(s, "ghost", "screened", { strain: 1, flags: ["technique_screened"] }), next: "act2_technique_ghost_route" }, pause, abandon,
    ],
  },
  act2_technique_ghost_route: {
    id: "act2_technique_ghost_route", location: "Canal filing bench",
    text: "The envelope has two separate fields: DEPOT REVIEW is its return reference; RECIPIENT NAME is empty. The return reference identifies a public desk, not a living witness's location. Keep the reference so a clerk can route and acknowledge the packet.\n\nDeleting every field would leave a packet the counter cannot return or track. The committed sleeve or courier signature stays as chosen; neither is an eraser for older records.",
    choices: [
      { id: "submit-technique-ghost-reference", label: "Keep the depot return reference and the empty recipient field.", detail: "One depot action. Receive a bounded review reference; Wards +1.", effects: s => finishTechnique(s, true), next: "act2_technique_result" },
      { id: "reject-technique-ghost-strip", label: "Strip the return reference along with every other field.", detail: "One depot action. The packet cannot be routed: held, no reference or standing reward.", effects: s => finishTechnique(s, false), next: "act2_technique_result" }, pause, abandon,
    ],
  },
  act2_technique_face: {
    id: "act2_technique_face", location: "Canal filing bench", speaker: "Dispatcher",
    text: s => `${say("face")}\n\nYou can file the bounded procedure under your own signature. A Clinic Desk Guide also lets you ask for a process-only co-sign. It supplies no agreement by itself. The bargain needs Kerr's valid introduction and an actually offered public sorting shift; you give up that paid opportunity, with your own handle on a private work docket. No one else's time is offered.\n\n${s.flags.technique_cosign_asked ? processCosignAllowed(s) ? say("offer") : say("refusal") : "Asking and reading the reply are free. No work has been waived and no depot action spent."}`,
    choices: [
      { id: "ask-technique-cosign", label: "Use the Desk Guide to ask for a process-only co-sign.", detail: "Free conversation. The Dispatcher can refuse; a guide does not override contact limits.", requireFlag: "perk_face", requireItem: "desk-guide", effects: { flags: ["technique_cosign_asked"] }, next: "act2_technique_face" },
      { id: "prepare-technique-face-self", label: "Prepare the bounded filing under your own signature.", detail: "One depot action. Your filing signature remains. No co-sign or wage waiver is claimed.", requireFlag: "perk_face", effects: s => beginTechnique(s, "face", "self", { flags: ["technique_filing_signed"] }), next: "act2_technique_face_scope" },
      { id: "prepare-technique-face-cosign", label: "Accept the voluntary process-only co-sign; waive the paid sorting opportunity.", detail: "One depot action. No sorting wage can be claimed later. Your private work-docket handle remains; source truth and witness permission stay separate.", requireFlag: "perk_face", requireItem: "desk-guide", effects: s => beginTechnique(s, "face", "cosign", { flags: ["technique_work_waived"], journal: [{ id: "technique-work-waiver", kind: "promise", text: "You accepted a voluntary process-only co-sign in exchange for giving up the offered paid depot sorting shift. Your own handle remains on a private work docket; no sorting wage, witness agreement or source certification is granted." }] }), next: "act2_technique_face_scope" }, pause, abandon,
    ],
  },
  act2_technique_face_scope: {
    id: "act2_technique_face_scope", location: "Canal filing bench", speaker: "Dispatcher",
    text: `${say("scope")}\n\nA process-only submission asks the desk to review a procedural correction. Asking a co-signer to certify the Ward Nine source exceeds the terms and will be refused. Your signature or waived work is already recorded; changing the request cannot refund it. Submission uses the second depot action.`,
    choices: [
      { id: "submit-technique-face-process", label: "Submit only the agreed procedural scope.", detail: "One depot action. Review reference received; Wards +1. No independent source authentication.", effects: s => finishTechnique(s, true), next: "act2_technique_result" },
      { id: "reject-technique-face-truth", label: "Ask the filing to certify the truth of the Ward Nine source.", detail: "One depot action. The Dispatcher refuses this scope; no reference or standing reward. Any waiver remains.", effects: s => finishTechnique(s, false, { flags: ["technique_truth_refused"] }), next: "act2_technique_result" }, pause, abandon,
    ],
  },
  act2_technique_nerve: {
    id: "act2_technique_nerve", location: "Canal filing bench",
    text: "The correction copy must stay dry and flat. Its wet outer transit wrap can travel separately; it is not the source original, which stays under its existing custody. Your Nerve training offers a deliberate carry: one action to prepare, one to observe intake. Direct handling adds two strain; a Chair Harness support adds one.\n\nWith the harness you can instead make a protected single-trip handover: two strain and one action, with intake observed in that action. That can leave one action for unloading and a short recovery. It is physical load management, not clinical treatment. The faster method needs Strain at most three; supported carry works at four.",
    choices: [
      { id: "prepare-technique-nerve-direct", label: "Prepare the direct protected carry.", detail: "One action now, one to finish; Strain +2 now. Keep the copy separate from the wet wrap.", requireFlag: "perk_nerve", maxStrain: 3, effects: s => beginTechnique(s, "nerve", "direct", { strain: 2 }), next: "act2_technique_nerve_handover" },
      { id: "prepare-technique-nerve-supported", label: "Brace the copy with the Chair Harness and use rest stops.", detail: "One action now, one to finish; Strain +1 now. The harness remains yours.", requireFlag: "perk_nerve", requireItem: "chair-harness", maxStrain: 4, effects: s => beginTechnique(s, "nerve", "supported", { strain: 1 }), next: "act2_technique_nerve_handover" },
      { id: "prepare-technique-nerve-fast", label: "Make the harness single-trip delivery and observe intake.", detail: "One depot action; Strain +2; Wards +1; bounded review reference received. One action can remain for unloading/recovery.", requireFlag: "perk_nerve", requireItem: "chair-harness", maxStrain: 3, effects: fastNerveTechnique, next: "act2_technique_result" }, pause, abandon,
    ],
  },
  act2_technique_nerve_handover: {
    id: "act2_technique_nerve_handover", location: "Canal filing bench",
    text: "The copy is dry. The transit wrap is wet. Your handling effort has already been paid. Lay the copy in the dry intake tray while the wet wrap stays outside it, then observe the clerk's receipt.\n\nLeaving the copy inside the wet wrap will make it unreadable at intake. The desk will hold it for repair and supply no review reference. Reading or pausing cannot change either condition.",
    choices: [
      { id: "submit-technique-nerve-dry", label: "Lay the dry copy flat; retain the wet transit wrap separately.", detail: "One depot action. Observe intake and receive the bounded review reference; Wards +1.", effects: s => finishTechnique(s, true), next: "act2_technique_result" },
      { id: "reject-technique-nerve-wet", label: "Leave the copy inside the wet outer wrap in the intake tray.", detail: "One depot action. Unreadable packet held; no reference or standing reward.", effects: s => finishTechnique(s, false), next: "act2_technique_result" }, pause, abandon,
    ],
  },
  act2_technique_result: {
    id: "act2_technique_result", location: "Canal filing bench", speaker: "Dispatcher",
    text: s => `${s.flags.technique_review_reference ? say("received") : s.flags.technique_truth_refused ? say("truth") : say("held")}\n\n${techniqueStatus(s)}\n\n${districtRemaining(s)} depot actions remain. Every source original, witness permission, issuing-key result and employment inquiry keeps its own existing status.${techniqueMode(s) === "fast" && !s.flags.technique_harness_recovered ? " The single-trip harness carry can leave one action to unload and recover at most one strain." : ""}`,
    choices: [
      { id: "technique-harness-rest", label: "Unload the harness and take a short recovery pause.", detail: "One depot action; recover at most one strain, once. No medicine or treatment result.", requireFlag: "perk_nerve", requireItem: "chair-harness", effects: s => spendTechnique(s, { strain: -1, flags: ["technique_harness_recovered"], journal: [{ id: "technique-harness-recovery", kind: "fact", text: "After the observed single-trip handover, you spent one depot action unloading the harness and recovered at most one strain. No clinical treatment, extra wage or source was supplied." }] }), next: "act2_technique_result" },
      { id: "leave-technique-result", label: "Keep the actual result and return to the depot.", next: "act2_district_canal" }, abandon,
    ],
  },
};
