import { FRAGMENTS } from "../evidence";
import type { GameState, Scene } from "../types";

const ALL = FRAGMENTS.map((fragment) => fragment.flag);
const PREPARED = [...ALL, "memory_prepared"];
const leave = (state: GameState) => state.flags.kerr_down || state.flags.kerr_slipped || state.flags.kerr_talked ? "after_kerr" : "kerr";

export const MEMORY_SCENES: Record<string, Scene> = {
  memory_table: {
    id: "memory_table", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: (state) => `The plinth separates the hour into three fragments. A signature, a command receipt, a shift roster. The chair would have kept the first and cut away everything that explained it.\n\n${state.flags.memory_prepared ? `${state.flags.memory_public_claim ? "Your packet names Helion as the issuer before its key has been authenticated. Expect a challenge." : "Your packet separates what the hour contains from what an independent source must still prove."} Preserving the roster exposes Nia's location. Redacting it keeps her home private. A witness chain means finding her next week. Choose what leaves this room.` : ALL.every((flag) => state.flags[flag]) ? "The fragments are open. Now compare the decisions: what did Mara authorize, what changed afterward, and what can this hour actually prove?" : "Inspect each fragment. A claim needs a source, and a source can put a living person in danger."}`,
    choices: [
      ...FRAGMENTS.map((fragment) => ({ id: `inspect-${fragment.id}`, label: `Inspect ${fragment.title.toLowerCase()}.`, hideIfFlag: fragment.flag, effects: { flags: [fragment.flag], journal: [{ id: `memory-${fragment.id}`, text: fragment.text, kind: fragment.kind }] }, next: "memory_table" })),
      { id: "reconstruct", label: "Compare the signature with the later order.", detail: "Build an account from the sources. No roll decides what is true.", requireAllFlags: ALL, hideIfFlag: "memory_prepared", next: "memory_reconstruction" },
      { id: "seal-full", label: "Preserve the complete archive.", detail: "Keep the counter-order and roster together. Helion can trace the export; the strain is yours. An archive investigation opens next week.", requireAllFlags: PREPARED, effects: { strain: 1, flags: ["memory_intact"], factions: { helion: 1 }, journal: [{ id: "archive-promise", text: "Trace the tower receipt to corroborate Mara's hour.", kind: "promise" }] }, next: leave },
      { id: "seal-redacted", label: "Redact worker locations. Keep the order.", detail: "Nia's location stays private. The wards lose a public source. A protected-witness route opens next week.", requireAllFlags: PREPARED, effects: { flags: ["memory_redacted"], factions: { wards: -1 }, journal: [{ id: "witness-promise", text: "Nia's location is protected. Get her account without exposing her home.", kind: "promise" }] }, next: leave },
      { id: "seal-witness", label: "Carry Nia's account through a witness chain.", detail: "Lumen holds the roster privately. You promise to move Nia before her location becomes evidence.", requireAllFlags: PREPARED, effects: { flags: ["memory_witness"], factions: { lumen: 1 }, journal: [{ id: "witness-promise", text: "Move Nia Pell to safety before publishing her account.", kind: "promise" }] }, next: leave },
    ],
  },
  memory_reconstruction: {
    id: "memory_reconstruction", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: "02:13: Mara signs the flush. 02:16: the exported receipt cancels evacuation, retaining that flush. 02:19: the exit log records Nia leaving.\n\nMara says she expected the workers to be moved. Her signature is visible. The receipt's issuing key is not independently authenticated. The exit log tells you who may be able to speak; it does not tell you what she will say.\n\nWhich account will you carry out?",
    choices: [
      { id: "separate-decisions", label: "Keep Mara's authorization and the later counter-order separate.", detail: "Neither decision cancels the other. The issuer still needs corroboration.", effects: { flags: ["memory_reconstructed"], journal: [{ id: "memory-analysis", text: "Mara authorized the flush before the recorded evacuation cancellation. The receipt's issuer needs independent corroboration; her explanation is not absolution.", kind: "claim" }] }, next: "memory_publication" },
      { id: "clear-mara", label: "The later order clears Mara of responsibility.", detail: "Test that interpretation against her signature.", effects: { flags: ["memory_theory_cleared"] }, next: "memory_challenge" },
      { id: "ignore-order", label: "Her signature is enough. Leave the counter-order out.", detail: "Test whether the account explains the canceled evacuation.", effects: { flags: ["memory_theory_omitted"] }, next: "memory_challenge" },
    ],
  },
  memory_challenge: {
    id: "memory_challenge", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: (state) => state.flags.memory_theory_cleared
      ? "Mara puts a finger under her signature. \"That is mine. I signed it. Don't make the tower's next decision erase the one I made.\"\n\nThe later instruction explains why the promised evacuation did not happen. It does not establish what Mara knew beforehand, and it does not remove her authorization."
      : "The receipt stays lit beside the signature. Someone canceled evacuation after Mara authorized the flush. An account that omits that instruction leaves the workers' last chance unexplained.\n\nMara's signature remains hers. Keeping the later instruction does not mean accepting her explanation as fact.",
    choices: [{ id: "keep-both-decisions", label: "Keep both decisions. Mark what remains unknown.", effects: { flags: ["memory_reconstructed"], journal: [{ id: "memory-analysis", text: "The signature and the later evacuation cancellation are separate decisions. Mara's prior knowledge and the receipt's issuer remain questions, not acquittals.", kind: "claim" }] }, next: "memory_publication" }],
  },
  memory_publication: {
    id: "memory_publication", location: "Memory bench, Glass Chapel", speaker: "Sister Lumen", memory: true,
    text: "Lumen asks for the sentence that will accompany the file.\n\n\"People will repeat the sentence before they inspect the source. You can say what the receipt contains and what still needs checking. Or you can name the tower now and accept what happens when it challenges your proof.\"\n\nThe next choice labels the account. It does not move Nia, conceal her address, or authenticate a key. You will decide custody afterward.",
    choices: [
      { id: "label-unverified", label: "Describe the cancellation. Mark the issuing key unverified.", detail: "A bounded account. Independent corroboration remains necessary.", effects: { flags: ["memory_prepared"], journal: [{ id: "public-packet", text: "The packet reports an evacuation cancellation after Mara's signature and explicitly marks the issuing key unverified.", kind: "claim" }] }, next: "memory_table" },
      { id: "name-tower", label: "Accuse Helion publicly before authenticating the key.", detail: "The wards hear the allegation sooner. Helion will challenge its source. This does not verify the order.", effects: { flags: ["memory_prepared", "memory_public_claim"], factions: { wards: 1, helion: 1 }, journal: [{ id: "public-packet", text: "The packet accuses Helion of canceling evacuation before the issuing key is authenticated. The allegation is not independent proof.", kind: "claim" }] }, next: "memory_table" },
    ],
  },
};
