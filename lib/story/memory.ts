import { FRAGMENTS } from "../evidence";
import { TIMELINE_FLAGS, memorySequence, sequenceCorrect, modelClaim, modelFeedback, modelVerdict } from "../memory-model";
import type { GameState, Scene } from "../types";

const ALL = FRAGMENTS.map((fragment) => fragment.flag);
const PREPARED = [...ALL, "memory_prepared"];
const leave = (state: GameState) => state.flags.kerr_down || state.flags.kerr_slipped || state.flags.kerr_talked ? "after_kerr" : "kerr";

export const MEMORY_SCENES: Record<string, Scene> = {
  memory_table: {
    id: "memory_table", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: (state) => `The plinth separates the hour into three fragments. A signature, a command receipt, a shift roster. The chair would have kept the first and cut away everything that explained it.\n\n${state.flags.memory_prepared ? `${state.flags.memory_public_claim ? "Your packet names Helion as the issuer before its key has been authenticated. Expect a challenge." : "Your packet separates what the hour contains from what an independent source must still prove."} Preserving the roster exposes Nia's location. Redacting it keeps her home private. A witness chain means finding her next week. Choose what leaves this room.` : ALL.every((flag) => state.flags[flag]) ? "The fragments are open. Now compare the decisions: what did Mara authorize, what changed afterward, and what can this hour actually prove?" : "Inspect each fragment. A claim needs a source, and a source can put a living person in danger."}`,
    choices: [
      ...FRAGMENTS.map((fragment) => ({ id: `inspect-${fragment.id}`, label: `Inspect ${fragment.title.toLowerCase()}.`, hideIfFlag: fragment.flag, effects: { flags: [fragment.flag], journal: [{ id: `memory-${fragment.id}`, text: fragment.text, kind: fragment.kind }] }, next: "memory_table" })),
      { id: "reconstruct", label: "Compare the signature with the later order.", detail: "Build an account from the sources. No roll decides what is true.", requireAllFlags: ALL, hideIfFlag: "memory_prepared", next: "memory_reconstruction" },
      { id: "seal-full", label: "Preserve the complete archive.", detail: "Keep the counter-order and roster together. Helion can trace the export; the strain is yours. An archive investigation opens next week.", requireAllFlags: PREPARED, effects: { strain: 1, flags: ["memory_intact"], factions: { helion: 1 }, journal: [{ id: "archive-promise", text: "Trace the tower receipt to corroborate Mara's hour.", kind: "promise" }] }, next: leave },
      { id: "seal-redacted", label: "Redact worker locations. Keep the order.", detail: "Nia's location stays private. The wards lose a public source. A protected-witness route opens next week.", requireAllFlags: PREPARED, effects: { flags: ["memory_redacted"], factions: { wards: -1 }, journal: [{ id: "witness-promise", text: "Nia's location is protected. Get her account without exposing her home.", kind: "promise" }] }, next: leave },
      { id: "seal-witness", label: "Carry Nia's account through a witness chain.", detail: "Lumen holds the roster privately. You promise to move Nia before her location becomes evidence.", requireAllFlags: PREPARED, effects: { flags: ["memory_witness"], factions: { lumen: 1 }, journal: [{ id: "witness-promise", text: "Move Nia Pell to safety before publishing her account.", kind: "promise" }] }, next: leave },
    ],
  },
  memory_reconstruction: {
    id: "memory_reconstruction", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: "The viewer lets you arrange the three inspected fragments and test an account before labeling it. You can also ask Mara about her assurance, or carry a direct interpretation.\n\nMara says she expected the workers to be moved. Her signature is visible. The receipt's issuing key is not independently authenticated. The exit log tells you who may be able to speak; it does not tell you what she will say.\n\nWhich account will you carry out?",
    choices: [
      { id: "assemble-timeline", label: "Reconstruct the hour on the timeline.", detail: "Arrange the inspected fragments, then test a claim against its source. Your draft survives a save.", requireAllFlags: ALL, hideIfFlag: "memory_model_tested", next: "memory_sequence" },
      { id: "question-mara", label: "Ask Mara what she actually knew before signing.", detail: "Question her assurance and its source. Testimony does not authenticate the later order.", hideIfFlag: "memory_examined", next: "memory_cross_exam" },
      { id: "separate-decisions", label: "Keep Mara's authorization and the later counter-order separate.", detail: "Neither decision cancels the other. The issuer still needs corroboration.", effects: { flags: ["memory_reconstructed"], journal: [{ id: "memory-analysis", text: "Mara authorized the flush before the recorded evacuation cancellation. The receipt's issuer needs independent corroboration; her explanation is not absolution.", kind: "claim" }] }, next: "memory_publication" },
      { id: "clear-mara", label: "The later order clears Mara of responsibility.", detail: "Test that interpretation against her signature.", effects: { flags: ["memory_theory_cleared"] }, next: "memory_challenge" },
      { id: "ignore-order", label: "Her signature is enough. Leave the counter-order out.", detail: "Test whether the account explains the canceled evacuation.", effects: { flags: ["memory_theory_omitted"] }, next: "memory_challenge" },
    ],
  },
  memory_sequence: {
    id: "memory_sequence", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: "The slivers lie outside the viewer. Set down the earliest event first, then the next, then the last. Open a source card if you need its timestamp.\n\nThe viewer checks the order you build, not who is guilty. Resetting changes only your draft. A correct timeline cannot authenticate the receipt or speak for Nia.",
    choices: [
      ...[FRAGMENTS[1], FRAGMENTS[2], FRAGMENTS[0]].map((fragment) => ({
        id: `place-${fragment.id}`, label: `Place ${fragment.title.toLowerCase()} in the next slot.`,
        requireAllFlags: ALL, hideIfFlag: `memory_placed_${fragment.id}`,
        effects: (state: GameState) => {
          const count = memorySequence(state).filter(Boolean).length;
          return { flags: [`memory_placed_${fragment.id}`, `memory_slot_${count + 1}_${fragment.id}`, ...(count === 2 ? ["memory_sequence_ready"] : [])] };
        }, next: "memory_sequence",
      })),
      { id: "reset-timeline", label: "Clear the draft timeline.", requireAnyFlag: FRAGMENTS.map(({ id }) => `memory_placed_${id}`), effects: { flagsOff: TIMELINE_FLAGS }, next: "memory_sequence" },
      { id: "test-timeline", label: "Check this chronology against the timestamps.", requireAllFlags: [...ALL, "memory_sequence_ready"], effects: (state) => ({ flags: [sequenceCorrect(state) ? "memory_sequence_checked" : "memory_sequence_error"], flagsOff: sequenceCorrect(state) ? ["memory_sequence_unresolved"] : ["memory_sequence_checked"], journal: sequenceCorrect(state) ? [{ id: "timeline-checked", text: "The runner checked the draft chronology against the inspected timestamps: authorization, cancellation, exit. This ordering authenticates no issuer and supplies no witness permission.", kind: "claim" }] : state.journal.some((entry) => entry.id === "timeline-mismatch") ? [] : [{ id: "timeline-mismatch", text: `The first mismatched draft was ${memorySequence(state).map((fragment) => `${fragment?.title} (${fragment?.time})`).join(" → ")}. The viewer found a timestamp running backward. This preserves the attempt, not a historical finding.`, kind: "claim" }] }), next: "memory_sequence_result" },
      { id: "leave-timeline", label: "Return to the account without testing a draft.", next: "memory_reconstruction" },
    ],
  },
  memory_sequence_result: {
    id: "memory_sequence_result", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: (state) => sequenceCorrect(state)
      ? "The three timestamps align: authorization, cancellation, exit. The ordering shows separate decisions, not an acquittal.\n\nMara watches the empty chair. 'Now ask what your sentence claims. The hour can't answer every question you put to it.'"
      : "The viewer marks a timestamp that runs backward. Your arrangement changes when a worker's exit appears to happen; the sources have not changed.\n\nYou can rebuild it, or record the chronology as unresolved. The mistaken draft stays in your history. No die roll can repair an inference.",
    choices: [
      { id: "rebuild-timeline", label: "Clear the slots and rebuild from the sources.", hideIfFlag: "memory_sequence_checked", effects: { flagsOff: TIMELINE_FLAGS }, next: "memory_sequence" },
      { id: "choose-model", label: "Choose a claim to test.", requireFlag: "memory_sequence_checked", next: "memory_model" },
      { id: "leave-sequence-open", label: "Record the chronology as unresolved. Test a claim separately.", hideIfFlag: "memory_sequence_checked", effects: { flags: ["memory_sequence_unresolved"], journal: [{ id: "timeline-limit", text: "The runner left the draft chronology unresolved after a timestamp mismatch. The source timestamps remain available.", kind: "claim" }] }, next: "memory_model" },
    ],
  },
  memory_model: {
    id: "memory_model", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: "Pick a sentence to stress-test. The next screen puts its relevant source beside it; decide whether that source supports, contradicts, or leaves the sentence unresolved.\n\nTesting an overreach is safe. Carrying a verdict that the source cannot support leaves a challenge attached to your account.",
    choices: [
      { id: "model-absolution", label: "Test whether the later order erases Mara's authorization.", effects: { flags: ["memory_model_absolution"] }, next: "memory_model_test" },
      { id: "model-issuer", label: "Test whether the receipt independently authenticates its issuer.", effects: { flags: ["memory_model_issuer"] }, next: "memory_model_test" },
      { id: "model-bounded", label: "Test whether the hour records two separate decisions.", effects: { flags: ["memory_model_bounded"] }, next: "memory_model_test" },
    ],
  },
  memory_model_test: {
    id: "memory_model_test", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: (state) => `Your claim: ${modelClaim(state)}\n\n${state.flags.memory_model_absolution ? FRAGMENTS[0].text : state.flags.memory_model_issuer ? FRAGMENTS[1].text : `${FRAGMENTS[0].text} ${FRAGMENTS[1].text}`}\n\nChoose a verdict for this claim. Unresolved means the available source cannot establish it; it does not mean the claim is false.`,
    choices: ["supported", "contradicted", "unresolved"].map((verdict) => ({
      id: `verdict-${verdict}`, label: `The claim is ${verdict}.`,
      effects: (state: GameState) => ({ flags: ["memory_model_tested", `memory_verdict_${verdict}`, ...(modelVerdict(state) === verdict ? ["memory_model_sound"] : ["memory_model_mismatch"])], journal: [{ id: "bench-verdict", text: `The runner tested: ${modelClaim(state)} Their verdict was ${verdict}. This is an interpretation, not independent evidence.`, kind: "claim" as const }] }), next: "memory_model_result",
    })),
  },
  memory_model_result: {
    id: "memory_model_result", location: "Memory bench, Glass Chapel", speaker: "Sister Lumen", memory: true,
    text: (state) => `${modelFeedback(state)}\n\n${state.flags.memory_model_sound ? 'Your verdict matches what the available sources can establish. Lumen keeps the limits beside the sentence.' : 'Your verdict does not match the source. Lumen will attach that challenge if you carry it forward. Revising keeps both the first verdict and the correction.'}\n\nNia has still given no account or permission. The next step chooses a packet label, then custody.`,
    choices: [
      { id: "record-tested-account", label: "Carry a bounded account with its source limits.", requireFlag: "memory_model_sound", effects: { flags: ["memory_reconstructed"], journal: [{ id: "memory-analysis", text: "The tested account keeps authorization and cancellation separate, with prior knowledge, issuer authentication and witness permission unresolved.", kind: "claim" }] }, next: "memory_publication" },
      { id: "revise-model", label: "Revise the verdict. Keep the first attempt beside the correction.", requireFlag: "memory_model_mismatch", effects: { flags: ["memory_reconstructed", "memory_model_corrected"], journal: [{ id: "bench-correction", text: "The runner corrected the bench verdict: authorization and cancellation remain separate; issuer authentication and witness permission require other sources. The first verdict is retained.", kind: "claim" }] }, next: "memory_publication" },
      { id: "carry-disputed-model", label: "Carry my verdict with Lumen's challenge attached.", detail: "The district will ask you to answer the disputed interpretation. No evidence is authenticated.", requireFlag: "memory_model_mismatch", effects: { flags: ["memory_reconstructed", "memory_model_contested", "memory_model_pending"], journal: [{ id: "bench-challenge", text: "Lumen disputed the runner's verdict. The challenge travels beside the original interpretation and does not change the sources.", kind: "claim" }] }, next: "memory_publication" },
    ],
  },
  memory_challenge: {
    id: "memory_challenge", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: (state) => state.flags.memory_theory_cleared
      ? "Mara puts a finger under her signature. \"That is mine. I signed it. Don't make the tower's next decision erase the one I made.\"\n\nThe later instruction explains why the promised evacuation did not happen. It does not establish what Mara knew beforehand, and it does not remove her authorization."
      : "The receipt stays lit beside the signature. Someone canceled evacuation after Mara authorized the flush. An account that omits that instruction leaves the workers' last chance unexplained.\n\nMara's signature remains hers. Keeping the later instruction does not mean accepting her explanation as fact.",
    choices: [{ id: "keep-both-decisions", label: "Keep both decisions. Mark what remains unknown.", effects: { flags: ["memory_reconstructed"], journal: [{ id: "memory-analysis", text: "The signature and the later evacuation cancellation are separate decisions. Mara's prior knowledge and the receipt's issuer remain questions, not acquittals.", kind: "claim" }] }, next: "memory_publication" }],
  },
  memory_cross_exam: {
    id: "memory_cross_exam", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: (state) => `Mara pulls the chair away from the plinth. The hour keeps playing without her. "Ask me while I'm still here. They bought the hour so I wouldn't have to answer twice."\n\n${state.flags.memory_assurance_heard ? "Her account of the promise is recorded as testimony. There is no evacuation confirmation attached." : "She says the workers were supposed to leave. The signature contains no confirmation that they did."}\n\n${state.flags.memory_channel_heard ? "She identifies the channel she trusted, not a person whose issuing key you have verified." : "The later receipt names a channel. Ask whether she knew who stood behind it."}`,
    choices: [
      { id: "ask-evacuation-assurance", label: "What made you believe the workers were out?", hideIfFlag: "memory_assurance_heard", next: "memory_assurance" },
      { id: "ask-command-contact", label: "Whose word did you trust on that channel?", hideIfFlag: "memory_channel_heard", next: "memory_channel" },
      { id: "close-cross-exam", label: "Keep her answers attributed. Return to the two decisions.", detail: "No new source or authentication. Her signature remains her responsibility.", effects: { flags: ["memory_examined"] }, next: "memory_reconstruction" },
    ],
  },
  memory_assurance: {
    id: "memory_assurance", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: "'A green light on the dispatch channel. It meant the evacuation crew had been assigned. I let it mean they'd finished.'\n\nMara watches the signature complete again. 'I could have waited for the exit count. Waiting would have put my name on the delay. I told myself a crew assignment was enough.'\n\nThe hour contains her explanation, not a dispatch log confirming it. The roster records Nia leaving later. Neither establishes what every worker was told before the flush.",
    choices: [{ id: "record-assurance-limit", label: "Record what she says, and the confirmation she never obtained.", effects: { flags: ["memory_assurance_heard"], journal: [{ id: "mara-assurance", text: "Mara says she treated an evacuation crew assignment as completion and did not wait for an exit count. This is her testimony; no independent dispatch confirmation is attached.", kind: "claim" }] }, next: "memory_cross_exam" }],
  },
  memory_channel: {
    id: "memory_channel", location: "Memory bench, Glass Chapel", speaker: "Mara", memory: true,
    text: "'Dispatch spoke through a shift relay. No face. I knew the channel had authority to assign crews; I didn't know who was on it.'\n\nShe turns the receipt toward you. 'Don't put a person in that blank because I was too willing to leave it blank myself.'\n\nHer answer explains whom she trusted. It cannot authenticate the later cancellation or identify its individual author. An independent record is still necessary.",
    choices: [{ id: "record-channel-limit", label: "Keep the channel identified and the individual issuer unknown.", effects: { flags: ["memory_channel_heard"], journal: [{ id: "mara-channel", text: "Mara identifies a shift relay as the source of her assurance. She names no individual dispatcher. Her testimony does not authenticate the later issuing key.", kind: "claim" }] }, next: "memory_cross_exam" }],
  },
  memory_publication: {
    id: "memory_publication", location: "Memory bench, Glass Chapel", speaker: "Sister Lumen", memory: true,
    text: "Lumen asks for the sentence that will accompany the file.\n\n\"People will repeat the sentence before they inspect the source. You can say what the receipt contains and what still needs checking. Or you can name the tower now and accept what happens when it challenges your proof.\"\n\nThe next choice labels the account. It does not move Nia, conceal her address, or authenticate a key. You will decide custody afterward.",
    choices: [
      { id: "label-unverified", label: "Describe the cancellation. Mark the issuing key unverified.", detail: "A bounded account. Independent corroboration remains necessary.", effects: { flags: ["memory_prepared"], journal: [{ id: "public-packet", text: "The packet reports an evacuation cancellation after Mara's signature and explicitly marks the issuing key unverified.", kind: "claim" }] }, next: "memory_table" },
      { id: "name-tower", label: "Accuse Helion publicly before authenticating the key.", detail: "The wards hear the allegation sooner. Helion will challenge its source. This does not verify the order.", effects: { flags: ["memory_prepared", "memory_public_claim"], factions: { wards: 1, helion: 1 }, journal: [{ id: "public-packet", text: "The packet accuses Helion of canceling evacuation before the issuing key is authenticated. The allegation is not independent proof.", kind: "claim" }] }, next: "memory_table" },
    ],
  },
};
