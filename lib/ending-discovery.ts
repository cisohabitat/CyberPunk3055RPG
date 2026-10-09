import { CODEX } from "./story/codas";
import type { Codex } from "./types";

const WALL = new Set(["ending_names", "ending_quiet", "ending_witness", "ending_listed"]);
const WEEK = new Set(["ending_week_wards", "ending_week_deal", "ending_exposed"]);
export function endingGroups(codex: Codex) {
  const seen = new Set(codex.seen.map((entry) => entry.id));
  return [
    { title: "The Hour", hint: "Try a different decision about the hour, or a different response when the job goes wrong.", test: (id: string) => !WALL.has(id) && !WEEK.has(id) },
    { title: "The Week", hint: "Change whom you help or how you answer the city’s pressure.", test: (id: string) => WEEK.has(id) },
    { title: "The Wall", hint: "The sources you carry and the account you choose affect what can be said.", test: (id: string) => WALL.has(id) },
  ].map(({ title, hint, test }) => {
    const entries = CODEX.filter((entry) => test(entry.id)).map((entry) => ({ ...entry, seen: seen.has(entry.id) }));
    return { title, hint, entries, discovered: entries.filter((entry) => entry.seen).length };
  });
}
