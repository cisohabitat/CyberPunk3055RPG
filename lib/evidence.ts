import type { GameState } from "./types";

export const FRAGMENTS = [
  { id: "signature", flag: "memory_signature", time: "02:13", title: "The signature", source: "Mara's recorded testimony", kind: "claim", text: "Mara authorizes the flush. She says the tower promised an evacuation. The signature proves authorization; her explanation still needs corroboration." },
  { id: "order", flag: "memory_order", time: "02:16", title: "The counter-order", source: "Helion command receipt", kind: "fact", text: "An authenticated tower instruction cancels evacuation while retaining the flush. Mara's account has corroboration. Helion's command chain is attached." },
  { id: "roster", flag: "memory_roster", time: "02:19", title: "The living witness", source: "Shift roster and exit log", kind: "fact", text: "Ivo Pell and Junie Calder were on shift. Nia Pell signed the housing slip and reached a service exit. She can corroborate the receipt, but a public roster would expose where she sleeps." },
] as const;
export function memoryDisposition(state: GameState): string {
  if (state.flags.memory_intact) return "Complete archive";
  if (state.flags.memory_redacted) return "Protected roster";
  if (state.flags.memory_witness) return "Witness chain";
  return "Unexamined hour";
}
export function aftermath(state: GameState): { title: string; text: string }[] {
  const rows = [
    { title: "Ward Nine", text: state.flags.spoke_names ? "Sera places your testimony beside the names. Neighbors have a public account to challenge the maintenance report." : state.flags.confirmed_leak ? "Sera records where the leak began. The wards can trace a source beyond the tower's account." : state.flags.ives_took_list ? "Helion controls the paper list. Sera begins another from the people still willing to visit." : "Sera keeps restoring the names without your testimony. The maintenance report remains unchallenged by you." },
    { title: "Mara", text: state.flags.memory_intact || state.flags.order_verified ? "Her signature and Helion's counter-order survive together. An investigator can distinguish her decision from the tower's later instruction." : state.flags.memory_redacted ? "Her signature survives with the worker locations withheld. The public account protects people and leaves a gap an investigator must explain." : "Her reason survives in your account. The tower's command chain still needs independent corroboration." },
  ];
  if (state.flags.witness_safe) rows.push({ title: "Nia Pell", text: "Nia reaches a room outside Helion's tenancy register. She leaves a recorded account with Sera and chooses when it becomes public." });
  else if (state.flags.witness_lost) rows.push({ title: "Nia Pell", text: "The checkpoint closes her service route. Lumen keeps her account, but Nia's location is now in the tower's records." });
  else if (state.flags.memory_witness || state.flags.memory_redacted) rows.push({ title: "Nia Pell", text: "You kept her location out of the archive. Her route remains unresolved; protecting an identity did not move the person." });
  if (state.flags.betrayed_lumen) rows.push({ title: "Lumen", text: "She stops using your marker as a promise. The clinic remains open; the next person must ask without your name." });
  if (state.flags.origin_helped) rows.push({ title: "Your old streets", text: "Your origin contact remembers that you returned the favor. A route, receipt, or shelter survives beyond this job." });
  return rows;
}
