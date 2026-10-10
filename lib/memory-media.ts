import lines from "../qa/media/voice-lines.json";
import type { GameState } from "./types";

export type DialogueLine = typeof lines[number];
export function visibleDialogue(sceneId: string, speaker: string | undefined, visibleText: string): DialogueLine | undefined {
  return lines.find((line) => line.scene === sceneId && line.speaker === speaker && visibleText.includes(line.text));
}
export function memoryInteractionCue(before: GameState, choiceId: string, after: GameState): string | undefined {
  if (before.sceneId === "memory_sequence" && choiceId.startsWith("place-")) return "memory-place";
  if (["reset-timeline", "rebuild-timeline"].includes(choiceId)) return "memory-reset";
  if (after.sceneId === "memory_sequence_result") return after.flags.memory_sequence_checked ? "memory-align" : "memory-mismatch";
  if (after.sceneId === "memory_model_result" && after.flags.memory_model_mismatch) return "memory-mismatch";
  if (["revise-model", "correct-bench-model"].includes(choiceId)) return "memory-correction";
}
