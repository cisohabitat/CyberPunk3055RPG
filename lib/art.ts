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
export function sceneIllustration(sceneId: string): Illustration | undefined { return ENCOUNTERS[sceneId]; }

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
export const PORTRAIT_STAGING = [
  { speaker: "Mara", asset: "/art/mara-boundary.jpg", scenes: ["act2_response_agenda", "act2_response_refusal", "act2_response_terms", "act2_response_dispatch", "act3_response_visit"], allFlags: ["response_public_refused"], reason: "Mara's actual refusal remains a boundary after a private reply; this expression grants no new permission." },
  { speaker: "Sister Lumen", asset: "/art/lumen-guarded.jpg", scenes: ["act2_lumen_quiet", "act3_lumen_boundary", "act3_chapel_return"], anyFlags: ["betrayed_lumen", "response_clinic_refused"], reason: "Recorded betrayal or refused clinic sponsorship informs guarded attention, without depicting forgiveness." },
  { speaker: "Kerr", asset: "/art/kerr-closed.jpg", scenes: ["act2_route_receipt", "act3_kerr_collection", "act3_kerr_collection_response", "act3_kerr_personal_question"], allFlags: ["kerr_route_private", "kerr_route_trace"], reason: "Broken private collection terms keep a closed expression even after an observed handover or acknowledgement." },
  { speaker: "Quill", asset: "/art/quill-waiting.jpg", scenes: ["act2_quill_introduction", "act3_quill_introduction"], allFlags: ["quill_refused"], reason: "The recorded postponed tab keeps Quill unsmiling; late repayment does not erase the earlier refusal." },
  { speaker: "Sera", asset: "/art/sera-listening.jpg", scenes: ["act3_arrival", "ending_witness"], allFlags: ["confirmed_leak"], reason: "An admitted leak calls for attentive listening; it is not absolution or permission to quote another witness." },
  { speaker: "Edda", asset: "/art/edda-assignment.jpg", scenes: ["act3_edda_reply"], allFlags: ["edda_shift_paid"], reason: "Only an earned paid bench assignment permits Edda holding its notice beside the inquiry reference. Archive suspension and inquiry remain; no acquittal." },
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
