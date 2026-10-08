export const CODEX: { id: string; title: string }[] = [
  { id: "ending_sold", title: "The Sale" },
  { id: "ending_both", title: "Two Fires" },
  { id: "ending_burned", title: "Unedited" },
  { id: "ending_smashed", title: "No Witness" },
  { id: "ending_ash", title: "Half a Scream" },
  { id: "ending_walk", title: "Empty Hands" },
  { id: "ending_taken", title: "Collateral" },
  { id: "ending_sainted", title: "Sainted" },
  { id: "ending_week_wards", title: "Open Street" },
  { id: "ending_week_deal", title: "The Quiet Contract" },
  { id: "ending_names", title: "Said Aloud" },
  { id: "ending_quiet", title: "Left to the Rain" },
  { id: "ending_witness", title: "Already Loose" },
];

const CODAS: Record<string, string> = {
  ending_sold: "Helion bought the last clean copy of its own crime.",
  ending_both: "The wards have the file. So does the tower that paid you.",
  ending_burned: "Lumen kept the memory. The shard is gone.",
  ending_smashed: "You broke the hour alone. Proof went with it.",
  ending_ash: "A damaged hour changed hands, and then the week ended.",
  ending_walk: "The chair still happens at dawn.",
  ending_taken: "Kerr kept the glass. You kept your name.",
  ending_sainted: "The chapel kept the reason you walked in.",
  ending_week_wards: "The wards got a clumsy, public version of the week.",
  ending_week_deal: "Helion paid for a quieter mouth.",
  ending_names: "You said the names, even if an earlier title sold them.",
  ending_quiet: "The wall kept the names. You kept your silence.",
  ending_witness: "The leak was already walking. You arrived in time to admit it.",
};

export function endingCoda(sceneId: string): string {
  return CODAS[sceneId] ?? "";
}
