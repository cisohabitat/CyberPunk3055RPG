import campaignArt from "../qa/media/campaign-art-bindings.json";

const PLACES: { test: (location: string) => boolean; src: string }[] = [
  { test: (location) => /shelter/.test(location), src: "/art/shelter.jpg" },
  { test: (location) => /memory|fragment/.test(location), src: "/art/memory-bench.jpg" },
  { test: (location) => /kite city/.test(location), src: "/art/opening.jpg" },
  { test: (location) => /chapel|chair|stair/.test(location), src: "/art/chapel.jpg" },
  { test: (location) => /spire|helion/.test(location), src: "/art/spire.jpg" },
  { test: (location) => /canal/.test(location), src: "/art/canal.jpg" },
  { test: (location) => /ward nine|nine/.test(location), src: "/art/wardnine.jpg" },
];

export type Illustration = { src: string; small: string; caption: string; description: string };
export type ViewableArt = Illustration & { tile?: number; width?: number; height?: number };
/** Only paintings that already carry the context actor receive a shorter identity strip. */
const PAINTED_ACTORS: Record<string, readonly string[]> = {
  "/art/quill-offer.jpg": ["Quill"], "/art/mara-revelation.jpg": ["Mara"],
  "/art/mara-present.jpg": ["Mara"], "/art/mara-window.jpg": ["Mara"], "/art/mara-shared-hour.jpg": ["Mara"],
  "/art/nia-arrival.jpg": ["Nia Pell"], "/art/kerr-handover.jpg": ["Kerr"],
  "/art/edda-archive.jpg": ["Edda"], "/art/sera-hearing.jpg": ["Sera"],
  "/art/nia-transfer.jpg": ["Nia Pell"], "/art/asa-dispatch.jpg": ["Asa"], "/art/ives-hearing.jpg": ["Ives"],
  "/art/attendant-confrontation.jpg": ["Masked attendant"],
  "/art/shelter-conversation.jpg": ["Sera", "Ren"], "/art/edda-service-review.jpg": ["Edda"], "/art/lumen-cup.jpg": ["Sister Lumen"],
  "/art/chapel-shared.jpg": ["Mara", "Sister Lumen"], "/art/wall-shared.jpg": ["Sera", "Ives"],
};
export function paintedActor(art: Illustration | undefined, speaker: string | undefined): boolean {
  return Boolean(art && speaker && Object.hasOwn(PAINTED_ACTORS, art.src) && PAINTED_ACTORS[art.src].includes(speaker));
}
export const TITLE_ART: Illustration = {
  src: "/art/title.jpg", small: "/art/title-small.jpg", caption: "Kite City · an hour of memory",
  description: "Symbolic title art: a lone runner studies a luminous glass memory shard above Kite City's rainy walkways, beneath an immense blue dome.",
};
export const OPENING_ART: Illustration = {
  src: "/art/opening.jpg", small: "/art/opening-small.jpg", caption: "Kite City · before midnight",
  description: "An amber noodle stall shelters a rainy walkway beneath the city's immense dome.",
};
const MEMORY_BENCH: Illustration = { src: "/art/memory-bench.jpg", small: "/art/memory-bench-small.jpg", caption: "Glass Chapel · the inspection bench", description: "Three luminous glass slivers stand in a worn copper viewer beside an empty clinic chair." };
const ENCOUNTERS: Record<string, Illustration> = {
  opening_city: OPENING_ART,
  memory_table: MEMORY_BENCH,
  memory_sequence: MEMORY_BENCH,
  act2_shelter_brief: { src: "/art/shelter.jpg", small: "/art/shelter-small.jpg", caption: "Ward Four · the shelter landing", description: "A passable ramp runs beside the shelter stair; bags, a chair and a bucket wait beside a leaking valve." },
  act2_freight_brief: { src: "/art/freight.jpg", small: "/art/freight-small.jpg", caption: "Canal gate · dispatch", description: "A closed, sealed diagnostic case rests under a lamp at a sheltered canal dispatch table." },
};
for (const id of ["kerr_terms", "kerr_terms_negotiate", "kerr_terms_named", "kerr_terms_bluff", "kerr_terms_bluffed", "kerr_terms_exposed", "kerr_terms_retreat"]) ENCOUNTERS[id] = {
  src: "/art/kerr-terms.jpg", small: "/art/kerr-terms-small.jpg", caption: "Glass Chapel · the price of a doorway",
  description: "Kerr, in a dark raincoat, listens against a worn metal chapel doorway; amber light catches his face and the one hand resting on the jamb.",
};
PAINTED_ACTORS["/art/kerr-terms.jpg"] = ["Kerr"];
for (const id of ["act2_mara_account", "act2_mara_account_told", "act2_mara_account_owned", "act2_mara_account_deflected", "act2_mara_account_distance", "act3_mara_account_return", "act3_mara_account_question", "act3_mara_account_repair"]) ENCOUNTERS[id] = {
  src: "/art/mara-account.jpg", small: "/art/mara-account-small.jpg", caption: "Ward Four · a conversation with a past",
  description: "Mara listens beside a rainy clinic window, one hand resting on her knee and the other out of view; an untouched ceramic cup stands between her and an empty visitor chair.",
};
PAINTED_ACTORS["/art/mara-account.jpg"] = ["Mara"];
for (const id of ["act2_technique_bench", "act2_technique_chrome", "act2_technique_chrome_submit", "act2_technique_ghost", "act2_technique_ghost_route", "act2_technique_face", "act2_technique_face_scope", "act2_technique_nerve", "act2_technique_nerve_handover", "act2_technique_result"]) ENCOUNTERS[id] = {
  src: "/art/correction-bench.jpg", small: "/art/correction-bench-small.jpg", caption: "Canal depot · two records stay separate", description: "A blank comparison sheet and closed opaque sleeve rest in separate trays beside an unpowered reference display on a lamp-lit filing bench. No signature, review receipt, authentication, personal identity or successful outcome is displayed.",
};
const SPIRE_COUNTER: Illustration = {
  src: "/art/spire-counter.jpg", small: "/art/spire-counter-small.jpg", caption: "Helion · the service counter",
  description: "Shift papers, a closed folio and a sleeved receiver rest on a worn service counter beneath an amber lamp; workers wait beyond the queue rails.",
};
const SPIRE_TERMINAL: Illustration = {
  src: "/art/spire-terminal.jpg", small: "/art/spire-terminal-small.jpg", caption: "Spire · the maintenance alcove",
  description: "Two dim maintenance panels overlook a paper request beneath glass, beside a mechanical latch and an old badge reader.",
};
const SPIRE_PAYROLL: Illustration = {
  src: "/art/spire-payroll.jpg", small: "/art/spire-payroll-small.jpg", caption: "Ward Nine · the payroll table",
  description: "Two empty chairs face a lamp-lit table with folded papers, a closed folio and a small reply relay beside a rain-streaked window.",
};
// Reuse neutral setting art across related steps, without depicting an unearned outcome.
for (const id of ["act2_spire_brief", "act2_spire_sources", "act2_spire_recovery", "act2_spire_receipt"]) ENCOUNTERS[id] = SPIRE_COUNTER;
for (const id of ["act2_spire_prep", "act2_spire_methods"]) ENCOUNTERS[id] = SPIRE_TERMINAL;
for (const id of ["act3_spire_visit", "act3_spire_reply"]) ENCOUNTERS[id] = SPIRE_PAYROLL;
const HEARING_TABLE: Illustration = {
  src: "/art/hearing-table.jpg", small: "/art/hearing-table-small.jpg", caption: "Ward Nine · a public account, not yet filed",
  description: "An untouched pencil, blank cover sheets, a closed privacy sleeve and an unmarked recorder wait on a worn table beside three empty chairs and a rainy window.",
};
for (const id of ["act3_testimony_review", "act3_testimony_consent", "act3_testimony_hearing", "act3_testimony_correction", "act3_testimony_record"]) ENCOUNTERS[id] = HEARING_TABLE;
const ARCHIVE_DESK: Illustration = {
  src: "/art/archive-desk.jpg", small: "/art/archive-desk-small.jpg", caption: "Helion · the service archive desk",
  description: "A closed maintenance ledger, a catalog beneath glass and a dim record reader sit under a brass task lamp before rows of steel drawers and a service shutter.",
};
for (const id of ["act2_archive_brief", "act2_archive_prep", "act2_archive_compare", "act2_archive_challenge", "act2_archive_door", "act2_archive_custody"]) ENCOUNTERS[id] = ARCHIVE_DESK;
for (const id of ["act2_district_brief", "act2_district_edda"]) ENCOUNTERS[id] = { src: "/art/edda-archive.jpg", small: "/art/edda-archive-small.jpg", caption: "Helion · a request has its own terms", description: "Edda waits at the archive counter with a closed ledger and folded blank paper; no request, public signature or outcome is shown." };
for (const id of ["act2_district_canal", "act2_district_docket", "act2_district_result"]) ENCOUNTERS[id] = { src: "/art/canal-dispatch.jpg", small: "/art/canal-dispatch-small.jpg", caption: "Canal depot · the ordinary service route", description: "A worn transit map and lamp sit before the canal-side dispatch shutter, stairs and waiting lift. No completed task or audit result is depicted." };
ENCOUNTERS.act2_district_work = { src: "/art/depot-review.jpg", small: "/art/depot-review-small.jpg", caption: "Canal depot · the main counter stays open", description: "A queue rail closes the anonymous side hatch beneath an unlettered review cover; the lit main counter has an open unmarked worker ledger. No payment, recipient name or completed review is shown." };
ENCOUNTERS.act2_district_rest = { ...SPIRE_PAYROLL, caption: "Canal service room · a place to sit", description: "Two empty chairs face a lamp-lit table and closed folio beside a rainy window. No treatment, appointment completion or restored archive access is depicted." };
ENCOUNTERS.act3_district_return = { src: "/art/archive-held-original.jpg", small: "/art/archive-held-original-small.jpg", caption: "Ward Nine · the source keeps its own terms", description: "A closed source ledger in a protective sleeve stays apart from a folded copy and pencil. No inquiry decision or restored shift is depicted." };
const COURIER_TABLE: Illustration = {
  src: "/art/courier-table.jpg", small: "/art/courier-table-small.jpg", caption: "Ward Nine · Asa's courier table",
  description: "A closed courier satchel, indistinct routing slips, a metal cup and a desk relay rest beside an empty chair with a dark coat and rust-colored scarf, overlooking rainy neighborhood walkways.",
};
for (const id of ["act3_freight_visit", "act3_freight_query", "act3_freight_reflection"]) ENCOUNTERS[id] = COURIER_TABLE;
ENCOUNTERS.act3_shelter_visit = {
  src: "/art/laundry-cart.jpg", small: "/art/laundry-cart-small.jpg", caption: "Ward Nine · the next ordinary job",
  description: "Damp clothes await washing in a wheeled cart beside a worn basin, spare towels, a battered stool and a teal raincoat beneath amber light and a rain-streaked window.",
};
const CANAL_DISPATCH: Illustration = { src: "/art/canal-dispatch.jpg", small: "/art/canal-dispatch-small.jpg", caption: "Canal depot · the planning alcove", description: "A neutral transit diagram rests beneath a lamp in a sheltered canal alcove; a closed canvas case waits on a shelf. No selected route or completed handover is depicted." };
for (const id of ["act2_route_map", "act2_route_exit", "act2_route_review", "act2_route_crossing", "act2_route_recovery", "act2_route_handling", "act2_depot_methods", "act2_depot_relay", "act2_depot_return", "act2_depot_outer_pass", "act2_depot_cart_pass", "act2_depot_return_pass", "act2_depot_carry", "act2_depot_load", "act2_depot_liability", "act2_depot_contract"]) ENCOUNTERS[id] = CANAL_DISPATCH;
const CLINIC_CONVERSATION: Illustration = { src: "/art/mara-present.jpg", small: "/art/mara-present-small.jpg", caption: "Ward Four · Mara, in the present", description: "Mara sits beside a rainy clinic window, her hands by an unmarked envelope and tea cup; an empty chair faces her across the table." };
for (const id of ["act2_response_invitation", "act2_response_agenda", "act3_response_visit"]) ENCOUNTERS[id] = CLINIC_CONVERSATION;
const MARA_WINDOW: Illustration = { src: "/art/mara-window.jpg", small: "/art/mara-window-small.jpg", caption: "Ward Four · a chair beside the rain", description: "Mara holds an ordinary ceramic cup beside a rain-streaked clinic window; an empty visitor chair faces her across the worn table, with no papers or recorder in view." };
for (const id of ["act2_mara_company", "act2_mara_company_kept"]) ENCOUNTERS[id] = MARA_WINDOW;
ENCOUNTERS.act2_witness_arrival = { src: "/art/nia-arrival.jpg", small: "/art/nia-arrival-small.jpg", caption: "Ward Nine · before the account", description: "Nia sits in her chair at a modest lamp-lit room table, one hand beside a closed notebook and the other on her chair arm." };
ENCOUNTERS.act2_route_receipt = { src: "/art/kerr-handover.jpg", small: "/art/kerr-handover-small.jpg", caption: "Ward Four · the closed case", description: "Kerr checks an unmarked tag beside the strap of a closed brace case on the sheltered stall counter." };
/** Only earned outcome flags select consequence art; ordinary saves keep neutral plates. */
export const ILLUSTRATION_STAGING = [

  {
    scenes: ["act2_shelter_rooms", "act2_shelter_result"], allFlags: ["shelter_restored"], anyFlags: [],
    noneFlags: ["shelter_declined", "shelter_unobserved", "shelter_hall", "shelter_failed"],
    illustration: { src: "/art/shelter-restored.jpg", small: "/art/shelter-restored-small.jpg", caption: "Ward Four · the valve holds", description: "A fresh collar holds the shelter valve's dry seam; the emptied bucket stands aside and a clean cloth rests beside tools. Old stains remain. No beds or referral room are shown." },
    reason: "A confirmed repair permits the dry valve detail; evacuation, failed work and unobserved moves retain neutral setting art. Repair establishes no room allocation, witness transfer or consent.",
  },
  {
    scenes: ["act2_freight_result", "act3_freight_visit"], allFlags: [], anyFlags: ["freight_delivered", "freight_late_received"], noneFlags: [],
    illustration: { src: "/art/courier-receipt.jpg", small: "/art/courier-receipt-small.jpg", caption: "Courier table · stock receipt confirmed", description: "An anonymous stock receipt with an indistinct stamp lies beside a closed reference ledger, pencil, metal cup and folded rust scarf. No parcel, passenger clearance or patient treatment is shown." },
    reason: "Observed or subsequently recorded stock receipt permits the returned receipt illustration. Intake, promises and queries alone do not. Exposed or late routes retain their actual limits; this image grants no clearance or treatment.",
  },
  {
    scenes: ["act3_arrival"], allFlags: ["testimony_done", "testimony_published"], anyFlags: [], noneFlags: ["testimony_withdrawn"],
    illustration: { src: "/art/hearing-filed.jpg", small: "/art/hearing-filed-small.jpg", caption: "Ward Nine · the bounded account is filed", description: "A slim public-account folder rests in an ordinary records tray beside a set-down pencil and stopped recorder; a separate dark privacy sleeve stays closed away from the tray. No names, addresses or authenticated seal are legible." },
    reason: "Only completed publication at the return to the wall shows the public filing tray. Drafts, discussion and withdrawal retain neutral art. Private sources remain separate, and publication supplies no new evidence, verdict or witness permission.",
  },
  {
    scenes: ["act2_mara_company_kept"], allFlags: ["mara_company_chosen"], anyFlags: ["mara_company_courier", "mara_company_waited"],
    noneFlags: ["mara_company_left", "mara_company_declined"],
    illustration: { src: "/art/mara-shared-hour.jpg", small: "/art/mara-shared-hour-small.jpg", caption: "Ward Four · the cup turns", description: "Mara holds her ordinary chipped cup beside the rainy clinic window, its notch toward the glass; the edge of the visitor chair remains in the foreground. No reply or recorder is displayed." },
    reason: "Only the committed choice to stay permits the shared-hour cup detail. Courier and deferred dispatch retain separate prose and no receipt, treatment, public permission or absolution is depicted.",
  },
  {
    scenes: ["act3_edda_visit"], allFlags: ["archive_custody"], anyFlags: [], noneFlags: [],
    illustration: { src: "/art/archive-held-original.jpg", small: "/art/archive-held-original-small.jpg", caption: "Ward Nine · the original stays separate", description: "A closed source ledger rests in a dark protective sleeve on the records table, apart from a folded paper copy; a pencil lies between them. No legible identity, authenticated seal or review verdict is displayed." },
    reason: "Only agreed custody permits the separately held original at the Ward Nine return. Both named and withheld copies retain their actual employer risk in prose; the painting adds no digital authentication, permission or resolved records review.",
  },
  {
    scenes: ["vault_quiet"], allFlags: ["lumen_here"], anyFlags: ["pact_copy", "pact_break", "pact_fake"], noneFlags: ["pact_sell"],
    illustration: { src: "/art/chapel-shared.jpg", small: "/art/chapel-shared-small.jpg", caption: "Glass Chapel · a minute before the choice", description: "Mara sits beneath the memory halo while Lumen waits beside the controls, her magenta optic lit. Both keep their hands away from the shard; no extraction or outcome is shown." },
    reason: "Only the authored pact placing Lumen at the plinth permits this shared chair-room composition. Selling refuses her presence; Mara remains in the chair and the original hour is unresolved.",
  },
  {
    scenes: ["act3_arrival"], allFlags: ["on_file", "act2_deal"], anyFlags: [], noneFlags: ["testimony_published"],
    illustration: { src: "/art/wall-shared.jpg", small: "/art/wall-shared-small.jpg", caption: "Ward Nine · the pencil and the open folio", description: "Sera holds her pencil beside the rain-worn memorial while Ives waits a step apart with an open black folio. No page changes hands and no private identity is legible." },
    reason: "Both arrival prose branches explicitly place Ives beside Sera when on_file and act2_deal hold. Completed public filing retains its preceding earned plate; no handover, consent, verdict or ending is implied.",
  },
  {
    scenes: ["act2_district_canal", "act2_district_docket", "act2_district_result"], allFlags: ["district_query_sent", "district_public_review"], anyFlags: [], noneFlags: [],
    illustration: { src: "/art/depot-review.jpg", small: "/art/depot-review-small.jpg", caption: "Canal depot · a public request changes the doors", description: "A queue rail blocks the lowered anonymous hatch beneath a blank audit cover; an open unmarked ledger waits at the accessible lit main counter. No completed review, payment or private identity is shown." },
    reason: "Only an actually submitted public register-review request changes this depot's anonymous hatch to a blocked route. Private service appointments retain the ordinary dispatch painting; no review finding or source authentication is implied.",
  },
] as const;
export function sceneIllustration(sceneId: string, flags: Readonly<Record<string, boolean>> = {}): Illustration | undefined {
  const outcome = ILLUSTRATION_STAGING.find(rule => (rule.scenes as readonly string[]).includes(sceneId)
    && rule.allFlags.every(flag => flags[flag])
    && (!rule.anyFlags.length || rule.anyFlags.some(flag => flags[flag]))
    && rule.noneFlags.every(flag => !flags[flag]));
  return outcome?.illustration ?? ENCOUNTERS[sceneId];
}

for (const id of ["stall", "pay", "job_owner"]) ENCOUNTERS[id] = { src: "/art/quill-offer.jpg", small: "/art/quill-offer-small.jpg", caption: "Ward Four · an offer, unanswered", description: "Quill waits beside an untouched bowl at an amber-lit stall counter while rain falls beyond the awning." };
for (const id of ["memo", "mara_why"]) ENCOUNTERS[id] = { src: "/art/mara-revelation.jpg", small: "/art/mara-revelation-small.jpg", caption: "The recorded hour · Mara", description: "Mara's recorded likeness sits beside the cyan memory apparatus; her steady gaze carries no present-day permission." };
for (const id of ["chapel_method_review", "chapel_window_exit"]) ENCOUNTERS[id] = { src: "/art/chapel-reader.jpg", small: "/art/chapel-reader-small.jpg", caption: "Glass Chapel · the maintenance landing", description: "A dim memory reader and mechanical latch face an empty wet stair beside a task lamp; their status is unresolved." };
const FINALE_ART: Record<string, { caption: string; description: string }> = {
  names: { caption: "Said Aloud · the pencil moves", description: "Sera writes indistinct marks on rain-worn memorial concrete, keeping a place for the names without displaying private identities." },
  quiet: { caption: "Left to the Rain · the stair remains", description: "Rain falls over the empty memorial stair while Sera stands aside with her pencil held still." },
  witness: { caption: "Already Loose · a late witness", description: "Sera listens beside the rain-worn wall, pencil poised over an unmarked notebook; no absolution or inquiry outcome is depicted." },
  listed: { caption: "On the Folio · the page is taken", description: "Ives closes a black folio at the memorial stair while Sera retains her pencil and watches." },
};
for (const [id, art] of Object.entries(FINALE_ART)) ENCOUNTERS[`ending_${id}`] = { src: `/art/finale-${id}.jpg`, small: `/art/finale-${id}-small.jpg`, ...art };

export const PORTRAIT_ART: Record<string, string> = {
  Quill: "/art/quill.jpg", Orderly: "/art/orderly.jpg", "Sister Lumen": "/art/lumen.jpg",
  Kerr: "/art/kerr.jpg", Mara: "/art/mara.jpg", Ives: "/art/ives.jpg", Sera: "/art/sera.jpg",
  "Nia Pell": "/art/nia.jpg", Edda: "/art/edda.jpg", Asa: "/art/asa.jpg",
  Ren: "/art/ren-portrait.jpg", Stallholder: "/art/stallholder-portrait.jpg",
  Dispatcher: "/art/dispatcher-portrait.jpg", Mechanic: "/art/mechanic-portrait.jpg",
  "Masked attendant": "/art/masked-attendant-portrait.jpg",
};

export const SOURCE_ART: Record<string, Illustration> = {
  signature: { src: "/art/fragment-signature.jpg", small: "/art/fragment-signature-small.jpg", caption: "Signature · illustrative close-up", description: "Illustration of a glass sliver with an abstract signature stroke in a copper cradle; written source details carry the evidence." },
  order: { src: "/art/fragment-order.jpg", small: "/art/fragment-order-small.jpg", caption: "Command receipt · illustrative close-up", description: "Illustration of a receipt beneath glass beside relay hardware, with an empty issuer field; no authenticated issuer is depicted." },
  roster: { src: "/art/fragment-roster.jpg", small: "/art/fragment-roster-small.jpg", caption: "Roster · illustrative close-up", description: "Illustration of anonymous tally rows and an exit diagram beside a closed privacy sleeve; no names, addresses or rescue outcome are depicted." },
};
const PORTRAIT_VARIANTS: Record<string, { speaker: string; src: string }> = {};
export const CAST_PORTRAIT_VARIANTS = [
  { speaker: "Asa", asset: "/art/asa-terms.jpg", scenes: ["act2_freight_sources", "act2_freight_prep", "act2_freight_recovery"], reason: "Practical attention to terms and cold storage; no observed delivery or patient outcome." },
  { speaker: "Edda", asset: "/art/edda-scrutiny.jpg", scenes: ["act2_archive_brief", "act2_archive_prep", "act2_archive_compare", "act2_archive_challenge", "act2_archive_custody"], reason: "Archive scrutiny before a resolved issuing key; no payroll assignment or cleared inquiry." },
  { speaker: "Ren", asset: "/art/ren-listening.jpg", scenes: ["act2_middle", "act2_shelter_hall", "act2_shelter_rooms", "act3_shelter_visit"], reason: "Ren's attributed present conversation; attentive listening supplies no shelter repair or safety claim." },
  { speaker: "Orderly", asset: "/art/orderly-assessing.jpg", scenes: ["front", "districts"], reason: "Practiced courtesy during actual attendant dialogue; no accepted appointment or unobserved cuff mark." },
  { speaker: "Stallholder", asset: "/art/stallholder-speaking.jpg", scenes: ["opening_approach", "opening_neighbor"], reason: "Sober conversation about memory work; no acceptance of Quill's job or second person depicted." },
  { speaker: "Dispatcher", asset: "/art/dispatcher-considering.jpg", scenes: ["act2_notice_offer", "act2_notice_counter"], reason: "Considering the actual proposal without depicting agreement, money, receipt or dispatch." },
  { speaker: "Mechanic", asset: "/art/mechanic-explaining.jpg", scenes: ["act3_records_visit"], reason: "Explaining the limits of the record; no repaired evidence or authenticated issuer." },
  { speaker: "Masked attendant", asset: "/art/attendant-alert.jpg", scenes: ["hatch_caught"], reason: "Alert eyes keep the established respirator and identity, without adding a weapon or outcome." },
] as const;
for (const rule of CAST_PORTRAIT_VARIANTS) for (const id of rule.scenes) PORTRAIT_VARIANTS[id] = { speaker: rule.speaker, src: rule.asset };
for (const id of ["memo", "mara_why"]) PORTRAIT_VARIANTS[id] = { speaker: "Mara", src: "/art/mara-remorse.jpg" };
for (const id of ["act2_witness_door", "act2_witness_brief", "act3_testimony_nia"]) PORTRAIT_VARIANTS[id] = { speaker: "Nia Pell", src: "/art/nia-terms.jpg" };
PORTRAIT_VARIANTS.act2_shelter_brief = { speaker: "Ren", src: "/art/ren-concerned.jpg" };
for (const id of ["act3_arrival", "ending_names", "ending_quiet", "ending_witness"]) PORTRAIT_VARIANTS[id] = { speaker: "Sera", src: "/art/sera-attentive.jpg" };
for (const id of ["act2_kerr_collection_terms", "act2_route_receipt", "act3_kerr_collection"]) PORTRAIT_VARIANTS[id] = { speaker: "Kerr", src: "/art/kerr-considering.jpg" };
for (const id of ["job_owner", "why", "act2_quill_introduction", "act3_quill_introduction"]) PORTRAIT_VARIANTS[id] = { speaker: "Quill", src: "/art/quill-terms.jpg" };
for (const id of ["act2_helion", "act2_folio"]) PORTRAIT_VARIANTS[id] = { speaker: "Ives", src: "/art/ives-assessing.jpg" };
for (const id of ["act2_archive_door", "act3_testimony_hearing"]) PORTRAIT_VARIANTS[id] = { speaker: "Ives", src: "/art/ives-questioning.jpg" };
for (const id of ["memory_cross_exam", "memory_assurance", "memory_channel", "memory_model_test", "memory_sequence_result"]) PORTRAIT_VARIANTS[id] = { speaker: "Mara", src: "/art/mara-questioning.jpg" };
for (const id of ["memory_model_result", "memory_publication"]) PORTRAIT_VARIANTS[id] = { speaker: "Sister Lumen", src: "/art/lumen-challenging.jpg" };
for (const id of ["vault_quiet", "act2_lumen_door", "act3_chapel_return"]) PORTRAIT_VARIANTS[id] = { speaker: "Sister Lumen", src: "/art/lumen-considering.jpg" };
PORTRAIT_VARIANTS.act3_witness_visit = { speaker: "Nia Pell", src: "/art/nia-speaking.jpg" };
export const PORTRAIT_STAGING = [
  {"speaker": "Asa", "asset": "/art/asa-terms.jpg", "scenes": ["act2_ramp_terms", "act2_ramp_survey", "act2_ramp_gear", "act2_ramp_load", "act2_ramp_arrived", "act2_ramp_stopped", "act3_ramp_return"], "reason": "Established practical attention during the cooperative carry and personal return; no expression grants a receipt, treatment, or acquittal."},
  { speaker: "Kerr", asset: "/art/kerr-closed.jpg", scenes: ["act3_payoff_kerr"], allFlags: ["kerr_route_private", "kerr_route_trace"], reason: "The personal pause preserves Kerr's response to the known broken private terms. A minute together grants no forgiveness or reopened contact." },
  { speaker: "Mara", asset: "/art/mara-boundary.jpg", scenes: ["act2_response_agenda", "act2_response_refusal", "act2_response_terms", "act2_response_dispatch", "act3_response_visit"], allFlags: ["response_public_refused"], reason: "Mara's actual refusal remains a boundary after a private reply; this expression grants no new permission." },
  { speaker: "Sister Lumen", asset: "/art/lumen-guarded.jpg", scenes: ["act2_lumen_quiet", "act3_lumen_boundary", "act3_chapel_return"], anyFlags: ["betrayed_lumen", "response_clinic_refused"], reason: "Recorded betrayal or refused clinic sponsorship informs guarded attention, without depicting forgiveness." },
  { speaker: "Kerr", asset: "/art/kerr-closed.jpg", scenes: ["act2_route_receipt", "act3_kerr_collection", "act3_kerr_collection_response", "act3_kerr_personal_question"], allFlags: ["kerr_route_private", "kerr_route_trace"], reason: "Broken private collection terms keep a closed expression even after an observed handover or acknowledgement." },
  { speaker: "Quill", asset: "/art/quill-waiting.jpg", scenes: ["act2_quill_introduction", "act3_quill_introduction"], allFlags: ["quill_refused"], reason: "The recorded postponed tab keeps Quill unsmiling; late repayment does not erase the earlier refusal." },
  { speaker: "Sera", asset: "/art/sera-listening.jpg", scenes: ["act3_arrival", "ending_witness"], allFlags: ["confirmed_leak"], reason: "An admitted leak calls for attentive listening; it is not absolution or permission to quote another witness." },
  { speaker: "Edda", asset: "/art/edda-assignment.jpg", scenes: ["act3_edda_reply"], allFlags: ["edda_shift_paid"], reason: "Only an earned paid bench assignment permits Edda holding its notice beside the inquiry reference. Archive suspension and inquiry remain; no acquittal." },
  { speaker: "Kerr", asset: "/art/kerr-closed.jpg", scenes: ["act2_district_kerr_reply"], allFlags: ["kerr_route_private", "kerr_route_trace"], anyFlags: ["district_told_kerr_trace", "kerr_route_delivered", "kerr_route_visit"], reason: "Only a known broken private promise closes Kerr's expression here. An undisclosed docket cannot give him knowledge through the portrait; acknowledgement does not erase the trace." },
] as const;
export function portraitArt(speaker?: string, sceneId?: string, flags: Readonly<Record<string, boolean>> = {}): string | undefined {
  const conduct = PORTRAIT_STAGING.find(rule => rule.speaker === speaker && (rule.scenes as readonly string[]).includes(sceneId ?? "")
    && (!("allFlags" in rule) || rule.allFlags.every(flag => flags[flag]))
    && (!("anyFlags" in rule) || rule.anyFlags.some(flag => flags[flag])));
  if (conduct) return conduct.asset;
  const variant = sceneId ? PORTRAIT_VARIANTS[sceneId] : undefined;
  return variant && variant.speaker === speaker ? variant.src : PORTRAIT_ART[speaker ?? ""];
}

export function placeArt(location: string): string {
  const value = location.toLowerCase();
  return PLACES.find((place) => place.test(value))?.src ?? "/art/stall.jpg";
}

export const DISTRICT_ART: Record<string, string> = {
  "to-kerr": "/art/stall.jpg",
  "to-lumen": "/art/chapel.jpg",
  "to-helion": "/art/spire.jpg",
  "to-ward-nine": "/art/wardnine.jpg",
};

// Neutral neighborhood settings; the leaking pump is restricted to its unresolved method scene.
for (const id of ["act2_notice_brief", "act2_notice_sources", "act2_notice_methods", "act2_notice_allocation", "act2_notice_allocation_review", "act2_notice_offer", "act2_notice_counter", "act2_notice_capacity", "act2_notice_privacy_refusal", "act2_notice_receipt"]) ENCOUNTERS[id] = {"src": "/art/notice-desk.jpg", "small": "/art/notice-desk-small.jpg", "caption": "Glass Chapel \u00b7 the dispatch desk", "description": "Loose blank stationery, an unmarked divider, a closed dispatch satchel and a dark relay wait on a worn clinic counter beside an empty chair."};
for (const id of ["act2_workshop"]) ENCOUNTERS[id] = {"src": "/art/repair-bench.jpg", "small": "/art/repair-bench-small.jpg", "caption": "District workshop \u00b7 one field kit", "description": "A copper probe, folded carrying harness, closed desk guide and bundled route shroud lie separately on a worn repair bench beneath a brass lamp."};
for (const id of ["act2_shelter_methods"]) ENCOUNTERS[id] = {"src": "/art/shelter-pump.jpg", "small": "/art/shelter-pump-small.jpg", "caption": "Ward Four \u00b7 the leaking pump", "description": "Moisture drips from an aging copper valve into an enamel bucket beside a dark controller and a loose brace in a cramped concrete pump room."};
for (const id of ["act2_witness_checkpoint"]) ENCOUNTERS[id] = {"src": "/art/witness-checkpoint.jpg", "small": "/art/witness-checkpoint-small.jpg", "caption": "City crossing \u00b7 the inspection point", "description": "An empty inspection booth and a dark scanner face a wet tiled passage beneath amber lamps, with the corridor bending out of view."};

// Pre-transfer and neutral chapter settings do not select an outcome.
for (const id of ["act2_witness_brief", "act2_witness_support"]) ENCOUNTERS[id] = {"src": "/art/nia-transfer.jpg", "small": "/art/nia-transfer-small.jpg", "caption": "Glass Chapel · Nia sets her own terms", "description": "Nia sits upright beside her clinic bed in her ordinary wheelchair, wearing shoes and resting one hand on its brake; an untouched photograph frame stays on the bedside shelf."};
for (const id of ["act2_recovery"]) ENCOUNTERS[id] = {"src": "/art/ordinary-rest.jpg", "small": "/art/ordinary-rest-small.jpg", "caption": "Glass Chapel · an ordinary seat", "description": "A plain wooden chair and folded blanket wait beside a water glass and a rain-streaked clinic window, with no memory apparatus or restraints."};
for (const id of ["act2_response_refusal", "act2_response_terms", "act2_response_dispatch", "act2_response_receipt"]) ENCOUNTERS[id] = {"src": "/art/private-reply.jpg", "small": "/art/private-reply-small.jpg", "caption": "Ward Four · the private reply table", "description": "A plain envelope, closed pen, unmarked cover papers and chipped cup sit on a small clinic writing table beside an empty chair."};
for (const id of ["ward_wall", "act3_arrival"]) ENCOUNTERS[id] = {"src": "/art/memorial-stair.jpg", "small": "/art/memorial-stair-small.jpg", "caption": "Ward Nine · the weathered names", "description": "Indistinct engraved rows cover a rain-worn memorial wall above a wet stair; a closed private ledger and spare capped writing tool rest on a sheltered ledge."};

// The reviewed campaign catalog enumerates ids; future scenes need a new decision.
for (const plate of campaignArt.plates) for (const id of plate.scenes) {
  ENCOUNTERS[id] = { src: plate.src, small: plate.small, caption: plate.caption, description: plate.description };
}
ENCOUNTERS.act2_freight_brief = { src: "/art/asa-dispatch.jpg", small: "/art/asa-dispatch-small.jpg", caption: "Canal freight gate · Asa sets the terms", description: "Asa, wearing a rust scarf and worn courier coat, touches the closed cooling case seal beneath the gate lamp; the case remains at dispatch." };
ENCOUNTERS.act3_testimony_hearing = { src: "/art/ives-hearing.jpg", small: "/art/ives-hearing-small.jpg", caption: "Ward Nine · Ives asks for the source", description: "Ives faces the visitor at the rain-lit records table, a closed black folio beside the unmarked running recorder; blank cover papers and a pencil wait beside an empty chair." };

for (const id of ["act2_archive_brief", "act2_archive_challenge", "act2_archive_custody"]) ENCOUNTERS[id] = {
  src: "/art/edda-archive.jpg", small: "/art/edda-archive-small.jpg", caption: "Helion · Edda keeps her own terms",
  description: "Edda sits at the service archive desk, one hand on a closed worn ledger and the other holding blank folded paper. No identifying record, signature or authenticated outcome is displayed.",
};
for (const id of ["act3_testimony_review", "act3_testimony_correction", "act3_testimony_record"]) ENCOUNTERS[id] = {
  src: "/art/sera-hearing.jpg", small: "/art/sera-hearing-small.jpg", caption: "Ward Nine · the account can still change",
  description: "Sera holds a pencil over a blank cover sheet at the rain-lit records table. A closed folder stays separate beside her hand; the recorder shows no operating status, private identity or filed outcome.",
};
ENCOUNTERS.act2_witness_safe = { ...ENCOUNTERS.act2_witness_arrival, caption: "Ward Nine · Nia reviews her own words" };
ENCOUNTERS.act2_witness_return_private = { ...ENCOUNTERS.act2_witness_arrival, caption: "Ward Nine · the room stays hers" };
for (const id of ["act2_witness_return_registered", "act2_witness_return_relocated"]) ENCOUNTERS[id] = { ...ENCOUNTERS.act2_witness_lost, caption: "Clinic relay · Nia answers on her terms" };
ENCOUNTERS.act3_witness_shift_return = { ...ENCOUNTERS.act3_lumen_boundary, caption: "Glass Chapel · the work left behind" };

for (const id of ["act2_craft_archive", "act2_craft_archive_issuer"]) ENCOUNTERS[id] = { ...ENCOUNTERS.act2_archive_compare, caption: "Helion · a question before a query" };
for (const id of ["act2_craft_archive_challenge", "act2_craft_archive_ledger"]) ENCOUNTERS[id] = { ...ENCOUNTERS.act2_archive_brief, caption: "Helion · Edda keeps the request bounded" };
ENCOUNTERS.act3_craft_archive_return = { src: "/art/correction-bench.jpg", small: "/art/correction-bench-small.jpg", caption: "Ward Nine · the question beside the answer", description: "Blank sheets and a closed unmarked sleeve lie in separate trays at a rain-lit workbench. They depict no retrieved source, authenticated key, submitted finding or restored shift." };
ENCOUNTERS.act3_payoff_edda = { ...ENCOUNTERS.act3_craft_archive_return, caption: "Ward Nine · a place beside the work" };
ENCOUNTERS.act3_payoff_kerr = { ...ENCOUNTERS.act3_kerr_collection, caption: "Ward Nine · the space beside the table" };
for (const id of ["act2_craft_kerr_offer", "act2_craft_kerr_settlement", "act3_craft_kerr_settlement"]) ENCOUNTERS[id] = { ...ENCOUNTERS.act2_kerr_collection_terms, caption: "Ward Four · a fare has terms" };

// Deliberate new viewpoints override only these two reviewed catalog scenes.
ENCOUNTERS.act2_archive_prep = {
  src: "/art/archive-preparation.jpg", small: "/art/archive-preparation-small.jpg", caption: "Helion · before the search",
  description: "A closed service folio and unused inspection light rest beside a dark reader on the scratched archive preparation desk; the drawers remain shut.",
};
ENCOUNTERS.hatch = {
  src: "/art/incinerator-flue.jpg", small: "/art/incinerator-flue-small.jpg", caption: "Glass Chapel · the incinerator vein",
  description: "A square closed hatch hangs above a curved incinerator flue, framed by copper ducts, maintenance rails and cold light from a high grille.",
};

// Chapter texture stays separate from framed scene illustrations.
export const CHAPTER_BACKDROPS: Record<string, Illustration> = {
  "card_week": {
    "src": "/art/chapter-week.jpg",
    "small": "/art/chapter-week-small.jpg",
    "caption": "The Week \u00b7 the street waits",
    "description": "Closed shop shutters and inhabited balconies line a rain-dark lower-ward street beneath the distant dome at blue dawn."
  },
  "card_wall": {
    "src": "/art/chapter-wall.jpg",
    "small": "/art/chapter-wall-small.jpg",
    "caption": "The Wall \u00b7 weather and memory",
    "description": "Rain traces indistinct engraved rows on a weathered memorial wall beneath a muted green lamp beside an empty walkway."
  }
};
export function sceneBackdrop(sceneId: string, location: string): string {
  return Object.hasOwn(CHAPTER_BACKDROPS, sceneId) ? CHAPTER_BACKDROPS[sceneId].src : placeArt(location);
}

// Consequential moments: actual confrontation and held-case aftermath only.
ENCOUNTERS.hatch_caught = {
  "src": "/art/attendant-confrontation.jpg",
  "small": "/art/attendant-confrontation-small.jpg",
  "caption": "Glass Chapel \u00b7 caught at the hatch",
  "description": "The masked attendant stands among copper service pipes with an ordinary wrench held low and a collar microphone visible; the corridor beyond remains empty."
};
ENCOUNTERS.act2_route_recovery = {
  "src": "/art/held-case.jpg",
  "small": "/art/held-case-small.jpg",
  "caption": "Canal depot \u00b7 the case stays held",
  "description": "A closed canvas-covered case rests on a worn shelf beneath an amber lamp beside the shut depot service shutter; a second shelf is empty."
};

// Literal pre-decision conversations, each reviewed against its complete authored prose.
ENCOUNTERS.act2_shelter_brief = { src: "/art/shelter-conversation.jpg", small: "/art/shelter-conversation-small.jpg", caption: "Ward Four · before the repair", description: "Sera catches a bucket under the leaking shelter valve while Ren sets a kettle on a dry step beside the ramp. The repair and resident beds remain undecided." };
ENCOUNTERS.act2_spire_sources = { src: "/art/edda-service-review.jpg", small: "/art/edda-service-review-small.jpg", caption: "Helion · three things to read", description: "Edda rests both hands on the counter, covering the current account number on a slip beside a separate service card and closed receiver sleeve. No query, handover or completed closure is shown." };
ENCOUNTERS.act2_lumen_quiet = { src: "/art/lumen-cup.jpg", small: "/art/lumen-cup-small.jpg", caption: "Ward Four · the ring beneath the cup", description: "Lumen lifts Mara’s cup to wipe its ring from the clinic table beside the spare chair and rainy window, her magenta optic lit. No signature or endorsement is shown." };

// Explicit neutral plates for the cooperative freight carry; never depict a receipt.
ENCOUNTERS.act2_ramp_terms = { ...ENCOUNTERS.act2_freight_brief, caption: "Canal freight · Asa keeps the gate task bounded" };
for (const id of ["act2_ramp_survey", "act2_ramp_gear", "act2_ramp_load", "act2_ramp_arrived", "act2_ramp_stopped"]) ENCOUNTERS[id] = {"src": "/art/freight-ramp.jpg", "small": "/art/freight-ramp-small.jpg", "caption": "Canal freight ramp · a place to set the weight down", "description": "An empty covered freight ramp turns beside a broad landing, a closed metal storage hood and a narrowing rail. No cargo, handover, receipt or treatment is shown."};
ENCOUNTERS.act3_ramp_return = { ...COURIER_TABLE, caption: "Ward Nine · a carry beside its actual record" };

// Same neutral bench; no depicted signature, receipt, witness or successful review.
for (const id of ["act2_return_routing_terms","act2_return_routing_read","act2_return_routing_prepare","act2_return_routing_route","act2_return_routing_result","act3_return_routing_return"]) ENCOUNTERS[id] = { ...ENCOUNTERS.act2_technique_bench };

for (const id of ["act3_sera_shift", "act3_sera_carry", "act3_sera_watch", "act3_sera_reply"]) ENCOUNTERS[id] = { ...ENCOUNTERS.act3_testimony_review };
