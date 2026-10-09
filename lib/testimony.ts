import type { GameState } from "./types";

export function testimonyPacket(state: GameState): { title: string; text: string }[] {
  const account = state.journal.some((entry) => entry.id === "nia-account");
  return [
    { title: "What survives", text: "Mara’s authorization and the later evacuation cancellation are separate decisions. An explanation does not erase authorization." },
    { title: "Source strength", text: state.flags.archive_key_authenticated ? "An archive reader authenticated the cancellation’s digital issuing key." : state.flags.order_verified ? "An independent account or ledger corroborates the cancellation. This does not establish digital-key authentication." : "The exported receipt or remembered account is available; the cancellation has no independent corroborating source attached." },
    { title: "Witness permission", text: !account ? "No approved account from Nia is attached. A protected roster or safe room supplies no testimony." : state.flags.nia_public_consent ? "Nia authorized her approved words for this public account, through Sera. Her address stays out." : state.flags.witness_lost ? "Nia’s account is held by the clinic. After the location breach she withholds public quotation, including after relocation." : "Nia’s recording is held by Sera. Recording permission is separate from permission to quote her publicly." },
  ];
}
