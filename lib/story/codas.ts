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
  { id: "ending_exposed", title: "Exposed" },
  { id: "ending_names", title: "Said Aloud" },
  { id: "ending_quiet", title: "Left to the Rain" },
  { id: "ending_witness", title: "Already Loose" },
  { id: "ending_listed", title: "On the Folio" },
];

const CODAS: Record<string, string> = {
  ending_sold: "Helion bought the last clean copy of its own crime. The creds spend. The memo does not.",
  ending_both: "The wards have the file. So does the tower that paid you. Two fires, and you fed both.",
  ending_burned: "Lumen kept the memory. The shard is gone. What she remembers is weaker than glass and still a fire.",
  ending_smashed: "You broke the hour alone. Proof went with it. The chair still has dawn on its schedule.",
  ending_ash: "A damaged hour changed hands, and then the week ended. Quill hated the price and paid it anyway.",
  ending_walk: "The chair still happens at dawn. You left with empty hands and the hour still in her mouth.",
  ending_taken: "Kerr kept the glass. You kept your name. Helion got the hour without your receipt.",
  ending_sainted: "The chapel kept the reason you walked in. The chart has your given name, and the chair has the rest.",
  ending_exposed: "The week got upstairs before you finished saying it. Ward Nine already knows a version you did not approve.",
  ending_week_wards: "The wards got a clumsy, public version of the week. Half right is more than the plinth ever offered.",
  ending_week_deal: "Helion paid for a quieter mouth. The receipt does not spend well where the names are.",
  ending_names: "You said the names, even if an earlier title sold them. The pencil kept the ones the rain had not eaten.",
  ending_quiet: "The wall kept the names. You kept your silence. Sera did not chase you up the stair.",
  ending_witness: "The leak was already walking. You arrived in time to admit it. Late is still a voice.",
  ending_listed: "Ives took the list. The wall kept the rain. Resolved, in the tower's mouth, means owned.",
};

export function endingCoda(sceneId: string): string {
  return CODAS[sceneId] ?? "";
}
