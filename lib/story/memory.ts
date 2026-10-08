import { FRAGMENTS } from "../evidence";
import type { GameState, Scene } from "../types";

const ALL = FRAGMENTS.map((fragment) => fragment.flag);
const leave = (state: GameState) => state.flags.kerr_down || state.flags.kerr_slipped || state.flags.kerr_talked ? "after_kerr" : "kerr";

export const MEMORY_SCENES: Record<string, Scene> = {
  memory_table: {
    id: "memory_table", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: (state) => `The plinth separates the hour into three fragments. A signature, a command receipt, a shift roster. The chair would have kept the first and cut away everything that explained it.\n\n${ALL.every((flag) => state.flags[flag]) ? "You have the sequence. Preserving it exposes Nia's location; redacting it protects her but weakens the public chain. Keeping a witness requires finding her next week. Choose what leaves this room." : "Inspect each fragment. A claim needs a source, and a source can put a living person in danger."}`,
    choices: [
      ...FRAGMENTS.map((fragment) => ({ id: `inspect-${fragment.id}`, label: `Inspect ${fragment.title.toLowerCase()}.`, hideIfFlag: fragment.flag, effects: { flags: [fragment.flag], journal: [{ id: `memory-${fragment.id}`, text: fragment.text, kind: fragment.kind }] }, next: "memory_table" })),
      { id: "seal-full", label: "Preserve the complete archive.", detail: "Keep the counter-order and roster together. Helion can trace the export; the strain is yours. An archive investigation opens next week.", requireAllFlags: ALL, effects: { strain: 1, flags: ["memory_intact"], factions: { helion: 1 }, journal: [{ id: "archive-promise", text: "Trace the tower receipt to corroborate Mara's hour.", kind: "promise" }] }, next: leave },
      { id: "seal-redacted", label: "Redact worker locations. Keep the order.", detail: "Nia's location stays private. The wards lose a public source. A protected-witness route opens next week.", requireAllFlags: ALL, effects: { flags: ["memory_redacted"], factions: { wards: -1 }, journal: [{ id: "witness-promise", text: "Nia's location is protected. Get her account without exposing her home.", kind: "promise" }] }, next: leave },
      { id: "seal-witness", label: "Carry Nia's account through a witness chain.", detail: "Lumen holds the roster privately. You promise to move Nia before her location becomes evidence.", requireAllFlags: ALL, effects: { flags: ["memory_witness"], factions: { lumen: 1 }, journal: [{ id: "witness-promise", text: "Move Nia Pell to safety before publishing her account.", kind: "promise" }] }, next: leave },
    ],
  },
};
