import { FIELD_KITS } from "./loadout";

export type ItemDef = { name: string; blurb: string };

export const ITEMS: Record<string, ItemDef> = {
  ...Object.fromEntries(FIELD_KITS.map((kit) => [kit.id, { name: kit.name, blurb: kit.uses }])),
  "signal-baffle": { name: "Signal Baffle", blurb: "A shielded receiver. Adds +1 to tracing a tower receipt. Quiet machines still leave paper." },
  "burner-route": { name: "Burner Route", blurb: "A one-use freight clearance. Move a witness without a checkpoint roll; the clearance burns afterward." },
  "witness-token": { name: "Shelter Token", blurb: "A room reserved by the wards. Grants a safe witness transfer without spending creds. The room is spent when used." },
  "counterfeit-pass": {
    name: "Counterfeit Pass",
    blurb: "A penitent appointment that scans often enough. The basin likes it more than people do.",
  },
  "layout-scrap": {
    name: "Layout Scrap",
    blurb: "Service veins sketched on thermal paper. The chapel's back is less mysterious now.",
  },
  "spoof-chip": {
    name: "Spoof Chip",
    blurb: "An old Helion handshake, still rude enough to open what pride locked.",
  },
  "mono-knife": {
    name: "Mono-Knife",
    blurb: "A vibrating edge with a ministry stamp scratched off. Illegal in every ward that can spell illegal.",
  },
  sedative: {
    name: "Sedative",
    blurb: "Chapel stock. One breath and the lights go polite.",
  },
  shard: {
    name: "Saint Shard",
    blurb: "Mara Voss's unedited hour, warm as a coin left on an engine.",
  },
  "clinic-marker": {
    name: "Clinic Marker",
    blurb: "Sister Lumen's debt, stamped in pale glass. A cheaper edit, if you live long enough to need one.",
  },
};
