import type { GameState, Scene } from "../types";

const fileAccount = (state: GameState) => ({
  flags: ["testimony_done", "testimony_published"],
  factions: state.flags.testimony_source ? { wards: 1 } : {},
  journal: [{ id: "wall-account", kind: "fact" as const, text: `${state.flags.testimony_source ? state.flags.archive_key_authenticated ? "The public account identifies a reader-authenticated issuing key." : "The public account cites independent corroboration without claiming digital-key authentication." : "The public account preserves the cancellation as an unresolved question, without claiming independent corroboration."} ${state.flags.nia_public_consent ? "Nia authorized quotation of her approved account through Sera, with her address withheld." : "Nia's private recording was not quoted publicly."}${state.flags.testimony_corrected ? " The unsupported claim was corrected in the hearing; the correction remains attached." : ""}` }],
});

export const TESTIMONY_SCENES: Record<string, Scene> = {
  act3_testimony_review: {
    id: "act3_testimony_review", location: "Ward Nine records table", speaker: "Sera",
    text: "Sera has a recorder, an empty public cover sheet, and the sources you actually brought. 'The names can be spoken either way. This is a different promise: an account someone can question after you leave.'\n\nThe receipt, an independent ledger, and a person's approved words carry different limits. Decide the scope before choosing whose words to publish. No new source can be created by a convincing speech.",
    choices: [
      { id: "scope-corroborated", label: "Attach independent corroboration and state what it establishes.", requireFlag: "order_verified", effects: { flags: ["testimony_source"] }, next: "act3_testimony_consent" },
      { id: "scope-bounded", label: "Keep the cancellation as a question that still needs corroboration.", hideIfFlag: "order_verified", effects: { flags: ["testimony_bounded"] }, next: "act3_testimony_consent" },
      { id: "skip-testimony", label: "Return to the names without drafting a public account.", next: "act3_arrival" },
    ],
  },
  act3_testimony_consent: {
    id: "act3_testimony_consent", location: "Ward Nine records table", speaker: "Sera",
    text: (state) => state.journal.some((entry) => entry.id === "nia-account") ? state.flags.witness_lost ? "The clinic holds Nia's account, but the registered transfer exposed her room. Even if she moved again, she asks you not to quote her publicly now. Her words remain available for private inspection through the clinic. Other sources can carry the public inquiry." : "Sera holds Nia's approved recording. 'She agreed to record it. That wasn't permission for every public use.' You can ask through the clinic relay, or keep her words out of the hearing. A safe room bought no quotation rights." : "There is no approved recording from Nia to quote. Sera keeps the roster and any private location out of the cover sheet. You can still bring the sources you have, with their limits attached.",
    choices: [
      { id: "ask-public-permission", label: "Ask Nia whether her approved words can enter this public account.", requireAllFlags: ["witness_safe", "witness_consent"], requireJournal: "nia-account", hideIfFlag: "witness_lost", next: "act3_testimony_nia" },
      { id: "keep-recording-private", label: "Keep Nia's words private; describe only the source status.", effects: { flags: ["testimony_no_quote"] }, next: "act3_testimony_hearing" },
    ],
  },
  act3_testimony_nia: {
    id: "act3_testimony_nia", location: "Witness room, Ward Nine", speaker: "Nia Pell",
    text: "Nia listens to the proposed cover sheet through Sera's relay. 'Use the words I approved. You can name me as the source through Sera. No address, no new story about how brave I was, and no sentence saying the room made me owe you this.'\n\nShe authorizes this account. You can accept those limits or leave the recording private. The recording will not be opened to public circulation until the hearing is filed.",
    choices: [
      { id: "accept-public-permission", label: "Accept Nia's terms for this account.", requireAllFlags: ["witness_safe", "witness_consent"], requireJournal: "nia-account", hideIfFlag: "witness_lost", effects: { flags: ["nia_public_consent"] }, next: "act3_testimony_hearing" },
      { id: "decline-public-quote", label: "Keep her recording private instead.", effects: { flags: ["testimony_no_quote"] }, next: "act3_testimony_hearing" },
    ],
  },
  act3_testimony_hearing: {
    id: "act3_testimony_hearing", location: "Ward Nine records table", speaker: "Ives",
    text: "Ives opens his folio while a mechanic checks the cover sheet. 'A maintenance signature isn't an issuing key. A witness isn't a server. What exactly are you asking people to believe?'\n\nSera leaves the recorder on. You can identify what your source establishes, without giving Helion the only copy or exposing a witness's address. This is a question about evidence, not a contest won by a high die roll.",
    choices: [
      { id: "answer-authenticated-key", label: "Identify the reader-authenticated issuing key and retain the original.", requireAllFlags: ["testimony_source", "archive_key_authenticated"], effects: { flags: ["testimony_answered"] }, next: "act3_testimony_record" },
      { id: "answer-corroboration", label: "Identify independent corroboration, without calling it key authentication.", requireAllFlags: ["testimony_source", "order_verified"], hideIfFlag: "archive_key_authenticated", effects: { flags: ["testimony_answered"] }, next: "act3_testimony_record" },
      { id: "answer-open-question", label: "State the cancellation as an open question and preserve the source limits.", requireFlag: "testimony_bounded", effects: { flags: ["testimony_answered"] }, next: "act3_testimony_record" },
      { id: "claim-key-anyway", label: "Call the issuing key authenticated without a successful key match.", hideIfFlag: "archive_key_authenticated", detail: "The mechanic will challenge the claim. Ward trust −1; Helion scrutiny +1.", effects: { flags: ["testimony_overreach"], factions: { wards: -1, helion: 1 } }, next: "act3_testimony_correction" },
    ],
  },
  act3_testimony_correction: {
    id: "act3_testimony_correction", location: "Ward Nine records table", speaker: "Sera",
    text: (state) => `${state.flags.order_verified ? "The mechanic points to the corroborating source. It supports the cancellation, but it does not perform a digital-key match." : "The mechanic points to the missing independent source. Repeating the receipt cannot authenticate its issuer."}\n\nSera keeps the first sentence on the recording. 'Correct it here. A correction belongs beside what people already heard.' Neither the inquiry nor the names have to be abandoned.`,
    choices: [{ id: "correct-hearing", label: "Correct the certainty and keep the earlier sentence attached.", effects: { flags: ["testimony_corrected", "testimony_answered"] }, next: "act3_testimony_record" }],
  },
  act3_testimony_record: {
    id: "act3_testimony_record", location: "Ward Nine records table", speaker: "Sera",
    text: (state) => `The hearing now has an answer with its limits. ${state.flags.nia_public_consent ? "Nia's approved words can enter this account under the terms she set, with no address." : "Nia's recording remains private; the public account quotes none of her words."}\n\n${state.flags.testimony_corrected ? "The unsupported key claim and its correction stay together. The correction supplies no new evidence." : "The source description stays attached to the account."}\n\nSera asks whether to file this public record or withdraw it. Either choice leaves you free to speak the names, confirm the earlier leak, or leave the wall.`,
    choices: [
      { id: "file-public-account", label: "File the public account with its sources and limits.", detail: "A corroborated source earns one step of ward trust. No witness address enters the record.", effects: fileAccount, next: "act3_arrival" },
      { id: "withdraw-public-account", label: "Withdraw the draft and keep the sources in private custody.", effects: { flags: ["testimony_done", "testimony_withdrawn"], journal: [{ id: "wall-account", text: "The public-account draft was withdrawn. The hearing may have been heard by attendees, but Nia's recording was not opened to public circulation.", kind: "fact" }] }, next: "act3_arrival" },
    ],
  },
};
