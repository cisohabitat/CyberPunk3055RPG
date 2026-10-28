import { finaleScene } from "./finale-direction";
import type { GameState } from "./types";

/** Written afterword: connects recorded choices without granting a new outcome. */
export function endingPayoff(state: GameState): { title: string; text: string } | undefined {
  if (!finaleScene(state.sceneId)) return;
  const f = state.flags;
  const record = (id: string) => state.journal.some(row => row.id === id);
  const filed = record("wall-account") && f.testimony_published && !f.testimony_withdrawn;
  const withdrawn = record("wall-account") && f.testimony_withdrawn && !f.testimony_published;
  const silenceDeal = f.act2_deal && !f.act2_stand && !f.act2_exposed;

  switch (state.sceneId) {
    case "ending_names":
      if (!f.spoke_names || f.confirmed_leak || f.ives_took_list) return;
      return { title: "A voice with a history", text: silenceDeal
        ? "You said the names after taking Helion’s payment for a week of silence. The words at the wall are yours; accepting that earlier bargain remains yours too."
        : filed
          ? "You said the names beside the public account you filed. Your voice joins the memorial; the account still stands on the sources and permissions you brought to it."
          : withdrawn
            ? "You said the names while keeping the hearing draft withdrawn. Speaking here did not release that draft or open a private recording to public use."
            : "You gave the names your voice. Sera keeps writing beside what she has heard; saying them supplied no missing source or answer to the work you left unfinished." };
    case "ending_quiet":
      if (f.spoke_names || f.confirmed_leak || f.ives_took_list) return;
      return { title: "The record beside your silence", text: filed
        ? "You left without speaking the names. The public account you filed stays with Sera; leaving the wall quietly did not withdraw it."
        : withdrawn
          ? "You withdrew the hearing draft and left without speaking the names. The people at the hearing may remember what they heard; neither choice made them forget."
          : silenceDeal
            ? "You took Helion’s payment for the week and left the memorial without speaking. Sera kept the pencil. The bargain and your silence remain separate choices in the same history."
            : "You left the names to Sera and the rain. Your silence at the wall supplied no answer to the questions, promises or costs you brought there." };
    case "ending_witness":
      if (!f.confirmed_leak || f.spoke_names || f.ives_took_list) return;
      return { title: "An admission beside the account", text: filed
        ? f.testimony_corrected
          ? "You acknowledged the leak that was already loose. Your filed account still carries the unsupported claim and its correction; admitting the leak did not erase either sentence."
          : "You acknowledged the leak that was already loose. Your filed account stays with Sera on its stated sources and limits; the admission added no new corroboration or witness permission."
        : withdrawn
          ? "You acknowledged the earlier leak while keeping the hearing draft withdrawn. That admission did not publish the draft, open a private recording or undo what listeners already heard."
          : "You acknowledged the account already passing through the street. Sera keeps your admission beside it; arriving at the wall supplied no new corroboration or witness permission." };
    case "ending_listed":
      if (!f.ives_took_list || f.spoke_names || f.confirmed_leak) return;
      return { title: "The page you handed over", text: f.archive_custody && record("archive-custody")
        ? "You handed Ives the memorial page. The archive original remains with Sera under the custody terms you chose; his folio did not acquire that separately held source."
        : filed
          ? "You handed Ives the memorial page after filing your public account. Sera retains that account with its source limits; the folio opens no separately held source to Ives."
          : withdrawn
            ? "You handed Ives the memorial page while keeping the hearing draft withdrawn. Taking the page did not publish that draft or open a private recording."
            : "You handed Ives the memorial page. Sera kept the pencil and her private witness ledger; the page in his folio gives him no new ownership of separately held sources." };
  }
}
