import type { GameState } from "../types";

export function weekRetell(state: GameState): string {
  if (state.flags.act2_exposed) return "Helion filed its version of your failed attempt to speak in the street.";
  if (state.flags.act2_deal) {
    const price = state.flags.ives_open || state.flags.kerr_sold_you ? "forty" : "eighty";
    return `You took Helion's ${price}-creds offer for a week of silence.`;
  }
  if (state.flags.act2_stand) return "You spoke Mara's name and Ward Nine in the street. The wards began repeating your account.";
  return "The week's choice between speaking in the street and taking Helion's silence money remains unresolved.";
}

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
  const week = weekRetell(state);
  const wall = state.flags.spoke_names
    ? "At the wall you said the names."
    : state.flags.confirmed_leak
      ? "At the wall you confirmed the leak."
      : state.flags.ives_took_list
        ? "At the wall Ives took the list."
        : "At the wall you left the names to the rain.";
  return [chapel, week, wall];
}
