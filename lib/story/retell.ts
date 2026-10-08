import type { GameState } from "../types";

export function nightRetell(state: GameState): string[] {
  const chapel = state.flags.act1_sold
    ? "You left the chapel by selling Mara's hour."
    : state.flags.act1_both
      ? "You left the chapel with the hour sold and a copy loose."
      : state.flags.act1_burned
        ? "You left the chapel after breaking the shard where Lumen could see it."
        : state.flags.act1_smashed
          ? "You left the chapel with the shard broken and the proof kept to yourself."
          : state.flags.act1_ash
            ? "You left the chapel carrying a damaged hour."
            : state.flags.act1_walk
              ? "You left the chapel with empty hands."
              : state.flags.act1_taken
                ? "You left the chapel because Kerr took the job."
                : state.flags.act1_sainted
                  ? "You left the chapel in the chair, and came back without the reason you walked in."
                  : "You left the chapel with the hour still undecided.";
  const week = state.flags.act2_exposed
    ? "The week got upstairs before you finished saying it."
    : state.flags.act2_deal
      ? "You sold the week to Helion."
      : state.flags.act2_stand
        ? "You put the week in the street and let the wards carry it."
        : "The week ended before the street or the tower could price it.";
  const wall = state.flags.spoke_names
    ? "At the wall you said the names."
    : state.flags.confirmed_leak
      ? "At the wall you confirmed the leak."
      : state.flags.ives_took_list
        ? "At the wall Ives took the list."
        : "At the wall you left the names to the rain.";
  return [chapel, week, wall];
}
