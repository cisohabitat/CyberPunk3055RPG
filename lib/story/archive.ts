import { kitBonuses } from "../loadout";
import type { GameState, Scene } from "../types";

// Existing pending rolls retain their old destination unless the new briefing was played.
export const archiveArrival = (state: GameState) => state.flags.archive_briefed ? "act2_archive_custody" : "act2_archive_verified";

export const ARCHIVE_SCENES: Record<string, Scene> = {
  act2_archive_brief: {
    id: "act2_archive_brief", location: "Helion service archive", speaker: "Edda",
    text: "Edda opens the desk before Ives arrives.\n\n‘Your export records a cancellation. My ledger can show whether it reached the shift. Compare them. I have to work here tomorrow.’\n\nShe offers access, not public use of her name. A signed extraction can identify her to her employer even when you withhold her name from circulation. Custody comes after retrieval.",
    choices: [
      { id: "agree-archive-terms", label: "Agree to compare sources and decide custody afterward.", effects: { flags: ["archive_briefed"] }, next: "act2_archive_prep" },
      { id: "defer-archive", label: "Leave the search open for another day.", next: "act2_middle" },
    ],
  },
  act2_archive_prep: {
    id: "act2_archive_prep", location: "Helion service archive", speaker: "Edda",
    text: "There is time to prepare one route before the shift changes. A failed probe alerts the reader; it does not make the receipt false. You can still use a staffed ledger search if retrieval fails.",
    choices: [
      { id: "index-archive", label: "Compare the index against the receipt number.", check: { itemBonuses: kitBonuses("chrome"), stat: "chrome", dc: 7, label: "Map the command index" }, successEffects: { flags: ["archive_indexed"] }, failEffects: { flags: ["archive_reader_alert"], strain: 1 }, resultSuccess: "The revision index identifies the issuing-key record. Authentication gets +2.", resultFail: "The reader notices the repeated lookup. Authentication and carbon retrieval get −1.", nextSuccess: "act2_archive_compare", nextFail: "act2_archive_compare" },
      { id: "watch-archive", label: "Watch the carbon slot through a service interval.", check: { itemBonuses: kitBonuses("ghost"), stat: "ghost", dc: 7, label: "Map the service interval" }, successEffects: { flags: ["archive_patrol"] }, failEffects: { flags: ["archive_reader_alert"], strain: 1 }, resultSuccess: "You mark the unstaffed interval. Carbon retrieval gets +2.", resultFail: "The guard records your wait. Authentication and carbon retrieval get −1.", nextSuccess: "act2_archive_compare", nextFail: "act2_archive_compare" },
      { id: "brace-archive", label: "Test and brace the inspection hatch.", check: { itemBonuses: kitBonuses("nerve"), stat: "nerve", dc: 7, label: "Brace the archive hatch" }, successEffects: { flags: ["archive_hatch"] }, failEffects: { flags: ["archive_reader_alert"], strain: 1 }, resultSuccess: "The stop holds. Physical inspection gets +2.", resultFail: "The lock trips its warning. The staffed search remains available.", nextSuccess: "act2_archive_compare", nextFail: "act2_archive_compare" },
      { id: "skip-archive-prep", label: "Use the records without a preparation bonus.", next: "act2_archive_compare" },
    ],
  },
  act2_archive_compare: {
    id: "act2_archive_compare", location: "Helion service archive", speaker: "Edda",
    text: "The search desk displays the export beside the catalog description of the shift ledger. You have not retrieved the ledger yet.\n\nExport: Mara's authorization precedes a receipt recording cancellation of evacuation.\n\nLedger catalog: a maintenance shift processed an evacuation revision. The catalog has a record number, not an authenticated command signature.\n\nWhat would retrieving this second source establish?",
    choices: [
      { id: "separate-source-tests", label: "Corroborate the cancellation; authenticate the issuer only with a key match.", effects: { flags: ["archive_compared"], journal: [{ id: "archive-method", text: "The catalog identifies an independent ledger. Retrieving it can corroborate the cancellation; a countersignature alone cannot authenticate a digital issuing key.", kind: "claim" }] }, next: "act2_archive_door" },
      { id: "catalog-is-proof", label: "The catalog alone proves who issued the command.", next: "act2_archive_challenge" },
    ],
  },
  act2_archive_challenge: {
    id: "act2_archive_challenge", location: "Helion service archive", speaker: "Edda",
    text: "Edda taps the catalog. ‘This tells us where to look. It isn't the record. My countersignature isn't the command's issuing key either.’\n\nThe record number remains useful. Retrieve its source before calling it proof.",
    choices: [{ id: "revise-source-test", label: "Keep the distinction and retrieve the actual record.", effects: { flags: ["archive_compared"] }, next: "act2_archive_door" }],
  },
  act2_archive_custody: {
    id: "act2_archive_custody", location: "Helion service archive", speaker: "Edda",
    text: (state) => `${state.flags.archive_method_face || state.flags.archive_method_nerve ? "Edda's signature is on the extraction. Her employer can trace that record even if the public copy omits her name." : "The retrieved record has its ledger reference attached. Edda's name need not enter the public packet."}\n\n${state.flags.archive_key_authenticated ? "The reader authenticated the issuing key." : "The independent ledger corroborates the cancellation. Do not describe a maintenance countersignature as digital-key authentication."}\n\nEdda asks you to keep the original with Sera. She will authorize a named public copy if you ask, but wants the employment risk stated. Withholding a name does not erase a signed extraction already in the archive.`,
    choices: [
      { id: "withhold-technician", label: "Keep the original with Sera; circulate a copy without Edda's name.", effects: { flags: ["archive_custody", "edda_name_withheld"], journal: [{ id: "archive-custody", text: "Sera holds the source original and ledger reference. The circulating copy withholds Edda's name; any employer trace on the extraction remains.", kind: "fact" }] }, next: "act2_archive_verified" },
      { id: "ask-named-source", label: "Ask Edda to authorize a named copy and record the risk.", detail: "She agrees. Helion can link the circulating source to her shifts.", effects: { flags: ["archive_custody", "edda_public_consent", "edda_exposed"], factions: { helion: 1 }, journal: [{ id: "archive-custody", text: "Edda authorized a named public source copy, knowing her employer could link it to her shifts. Sera retains the original.", kind: "fact" }] }, next: "act2_archive_verified" },
    ],
  },
  act3_edda_visit: {
    id: "act3_edda_visit", location: "Ward Nine records table", speaker: "Edda",
    text: (state) => `${state.flags.edda_exposed || state.flags.archive_method_face || state.flags.archive_method_nerve ? "Edda's next shift has been suspended pending a records review. The source still stands; publishing or signing it left a person the tower could question." : "Edda sends a message through Sera. Her shifts are still posted. The public copy has no technician's name, and she wants to keep it that way."}\n\n'You can record what happened without turning it into another accusation you can't support,' she says. 'A review isn't proof of dismissal. Help me bridge the lost shift if you can. Keep the original available either way.'`,
    choices: [
      { id: "review-edda-shift", label: "Ask whether Edda wants help requesting paid work during the review.", requireFlag: "archive_custody", requireAnyFlag: ["edda_exposed", "archive_method_face", "archive_method_nerve"], hideIfFlag: "edda_shift_done", next: "act3_edda_terms" },
      { id: "bridge-edda-shift", label: "Contribute forty creds to the suspended shift.", requireCreds: 40, requireAnyFlag: ["edda_exposed", "archive_method_face", "archive_method_nerve"], effects: { creds: -40, flags: ["visited_edda", "edda_supported"], journal: [{ id: "edda-review", text: "Edda reported a suspended shift pending records review. You contributed forty creds; the review and original exposure remain unresolved.", kind: "fact" }] }, next: "act3_neighborhood" },
      { id: "respect-edda-source", label: "Record her limits and leave the employment review unresolved.", effects: { flags: ["visited_edda"] }, next: "act3_neighborhood" },
    ],
  },
};
