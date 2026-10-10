import { FRAGMENTS } from "./evidence";
import type { GameState } from "./types";

export const TIMELINE_FLAGS = ["memory_sequence_ready", ...FRAGMENTS.flatMap(({ id }) => [
  `memory_placed_${id}`, ...[1, 2, 3].map((slot) => `memory_slot_${slot}_${id}`),
])];
export function memorySequence(state: GameState) {
  return [1, 2, 3].map((slot) => FRAGMENTS.find(({ id }) => state.flags[`memory_slot_${slot}_${id}`]));
}
export function sequenceCorrect(state: GameState) {
  return memorySequence(state).every((fragment, index) => fragment?.id === FRAGMENTS[index].id);
}
export function modelVerdict(state: GameState): "supported" | "contradicted" | "unresolved" {
  return state.flags.memory_model_absolution ? "contradicted" : state.flags.memory_model_issuer ? "unresolved" : "supported";
}
export function modelClaim(state: GameState) {
  return state.flags.memory_model_absolution ? "The later cancellation erases Mara's authorization."
    : state.flags.memory_model_issuer ? "The exported command receipt independently authenticates Helion as its issuer."
      : "Mara's authorization and the later evacuation cancellation are separate recorded decisions.";
}
export function modelFeedback(state: GameState) {
  return state.flags.memory_model_absolution ? "Her signature remains in the hour. A later instruction does not erase her authorization. The claim is contradicted."
    : state.flags.memory_model_issuer ? "The receipt contains a cancellation, but its issuing key has not been independently checked. The issuer claim remains unresolved; lack of authentication does not prove forgery."
      : "The signature records authorization; the later receipt cancels evacuation while retaining the flush. Together they support two separate decisions. They do not establish prior knowledge, authenticate the issuer, or grant witness permission.";
}
export function modelConsequence(state: GameState) {
  if (!state.flags.memory_model_tested) return "";
  return state.flags.memory_model_corrected ? "Your correction stays beside the disputed bench interpretation. The source limits remain visible."
    : state.flags.memory_model_repeated ? "You repeated a disputed bench interpretation. One neighbor withheld their name from the packet; the original sources remain available."
      : state.flags.memory_model_contested ? "Your bench interpretation remains disputed. The reader can see your verdict beside the source challenge."
        : "Your tested account distinguishes the two decisions from the issuer and knowledge still unknown. Testing supplied no independent authentication or witness permission.";
}
