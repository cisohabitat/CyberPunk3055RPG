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
const CANAL_DISPATCH: Illustration = { src: "/art/canal-dispatch.jpg", small: "/art/canal-dispatch-small.jpg", caption: "Canal depot · the planning alcove", description: "A neutral transit diagram rests beneath a lamp in a sheltered canal alcove; a closed canvas case waits on a shelf. No selected route or completed handover is depicted." };
for (const id of ["act2_route_map", "act2_route_exit", "act2_route_review", "act2_route_crossing", "act2_route_recovery", "act2_route_handling"]) ENCOUNTERS[id] = CANAL_DISPATCH;
const CLINIC_CONVERSATION: Illustration = { src: "/art/clinic-conversation.jpg", small: "/art/clinic-conversation-small.jpg", caption: "Ward Four · the conversation room", description: "Two empty chairs face a modest lamp-lit clinic table with an unmarked envelope and ceramic cup; a closed reply drawer waits beside the rainy window." };
for (const id of ["act2_response_invitation", "act2_response_agenda", "act3_response_visit"]) ENCOUNTERS[id] = CLINIC_CONVERSATION;
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
};

export const SOURCE_ART: Record<string, Illustration> = {
  signature: { src: "/art/fragment-signature.jpg", small: "/art/fragment-signature-small.jpg", caption: "Signature · illustrative close-up", description: "Illustration of a glass sliver with an abstract signature stroke in a copper cradle; written source details carry the evidence." },
  order: { src: "/art/fragment-order.jpg", small: "/art/fragment-order-small.jpg", caption: "Command receipt · illustrative close-up", description: "Illustration of a receipt beneath glass beside relay hardware, with an empty issuer field; no authenticated issuer is depicted." },
  roster: { src: "/art/fragment-roster.jpg", small: "/art/fragment-roster-small.jpg", caption: "Roster · illustrative close-up", description: "Illustration of anonymous tally rows and an exit diagram beside a closed privacy sleeve; no names, addresses or rescue outcome are depicted." },
};
const PORTRAIT_VARIANTS: Record<string, { speaker: string; src: string }> = {};
for (const id of ["memory_cross_exam", "memory_assurance", "memory_channel", "memory_model_test", "memory_sequence_result"]) PORTRAIT_VARIANTS[id] = { speaker: "Mara", src: "/art/mara-questioning.jpg" };
for (const id of ["memory_model_result", "memory_publication"]) PORTRAIT_VARIANTS[id] = { speaker: "Sister Lumen", src: "/art/lumen-challenging.jpg" };
export const PORTRAIT_STAGING = [
  { speaker: "Mara", asset: "/art/mara-boundary.jpg", scenes: ["act2_response_agenda", "act2_response_refusal", "act2_response_terms", "act2_response_dispatch", "act3_response_visit"], allFlags: ["response_public_refused"], reason: "Mara's actual refusal remains a boundary after a private reply; this expression grants no new permission." },
  { speaker: "Sister Lumen", asset: "/art/lumen-guarded.jpg", scenes: ["act2_lumen_quiet", "act3_lumen_boundary", "act3_chapel_return"], anyFlags: ["betrayed_lumen", "response_clinic_refused"], reason: "Recorded betrayal or refused clinic sponsorship informs guarded attention, without depicting forgiveness." },
  { speaker: "Kerr", asset: "/art/kerr-closed.jpg", scenes: ["act2_route_receipt", "act3_kerr_collection", "act3_kerr_collection_response", "act3_kerr_personal_question"], allFlags: ["kerr_route_private", "kerr_route_trace"], reason: "Broken private collection terms keep a closed expression even after an observed handover or acknowledgement." },
  { speaker: "Quill", asset: "/art/quill-waiting.jpg", scenes: ["act2_quill_introduction", "act3_quill_introduction"], allFlags: ["quill_refused"], reason: "The recorded postponed tab keeps Quill unsmiling; late repayment does not erase the earlier refusal." },
  { speaker: "Sera", asset: "/art/sera-listening.jpg", scenes: ["act3_arrival", "ending_witness"], allFlags: ["confirmed_leak"], reason: "An admitted leak calls for attentive listening; it is not absolution or permission to quote another witness." },
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
