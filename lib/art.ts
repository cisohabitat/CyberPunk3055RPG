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
export const OPENING_ART: Illustration = {
  src: "/art/opening.jpg", small: "/art/opening-small.jpg", caption: "Kite City · before midnight",
  description: "An amber noodle stall shelters a rainy walkway beneath the city's immense dome.",
};
const ENCOUNTERS: Record<string, Illustration> = {
  opening_city: OPENING_ART,
  memory_table: { src: "/art/memory-bench.jpg", small: "/art/memory-bench-small.jpg", caption: "Glass Chapel · the inspection bench", description: "Three luminous glass slivers stand in a worn copper viewer beside an empty clinic chair." },
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
export function sceneIllustration(sceneId: string): Illustration | undefined { return ENCOUNTERS[sceneId]; }

export const PORTRAIT_ART: Record<string, string> = {
  Quill: "/art/quill.jpg", Orderly: "/art/orderly.jpg", "Sister Lumen": "/art/lumen.jpg",
  Kerr: "/art/kerr.jpg", Mara: "/art/mara.jpg", Ives: "/art/ives.jpg", Sera: "/art/sera.jpg",
  "Nia Pell": "/art/nia.jpg", Edda: "/art/edda.jpg", Asa: "/art/asa.jpg",
};

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
