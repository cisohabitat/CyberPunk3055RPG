import type { Illustration } from "./art";
/** Direction is presentation only: no scene navigation, story state or saved preferences. */
const detail = (id: string, caption: string, description: string): Illustration => ({ src: `/art/${id}.jpg`, small: `/art/${id}-small.jpg`, caption, description });
export const CINEMATIC_SEQUENCES = [
  { id: "confession", label: "The recorded hour", kind: "recording", focus: "confession", sameSpeakerMs: 420, changedSpeakerMs: 620,
    scenes: ["memo", "mara_why"], detailScenes: ["memo", "mara_why"],
    detail: detail("recorded-hour-detail", "The recorded hour · glass and copper", "A narrow cyan memory shard rests in a worn copper reader cradle. No recorded face, signature or authentication is displayed."),
    intent: "Keep Mara's recorded admission and explanation distinct from present-day permission; leave room after the admission without withholding the words." },
  { id: "confrontation", label: "At the threshold", kind: "conversation", focus: "confrontation", sameSpeakerMs: 180, changedSpeakerMs: 360,
    scenes: ["kerr", "kerr_fight", "after_kerr"], detailScenes: ["kerr", "kerr_fight"],
    detail: detail("chapel-threshold-detail", "Glass Chapel · the threshold", "A worn metal latch and chair-room doorway face a rain-damp passage. No weapon, injury, defeated person or successful escape is shown."),
    intent: "Keep Kerr's boundary tight and intelligible. The reaction comes from the actual actor and outcome text, never a victory painting." },
  { id: "witness", label: "Her words, her decision", kind: "conversation", focus: "witness", sameSpeakerMs: 380, changedSpeakerMs: 640,
    scenes: ["act2_witness_brief", "act2_witness_plan", "act2_witness_support", "act2_witness_door", "act2_witness_arrival", "act2_witness_safe", "act2_witness_repair"], detailScenes: ["act2_witness_brief", "act2_witness_support", "act2_witness_arrival", "act2_witness_safe"],
    detail: detail("witness-choice-detail", "The account · a pause at the table", "A closed notebook and switched-off recorder sit beside a face-down plain form on a private room table. No address, signature, photograph or agreement is displayed."),
    intent: "Separate transport, recording and publication. Allow Nia's limits to settle; a detail view supplies no consent and never reveals a private address." },
  { id: "return", label: "Back among the names", kind: "conversation", focus: "return", sameSpeakerMs: 420, changedSpeakerMs: 680,
    scenes: ["act3_neighborhood", "ward_wall", "act3_arrival", "act3_district_return"], detailScenes: ["act3_neighborhood", "ward_wall", "act3_arrival"],
    detail: detail("memorial-pause-detail", "Ward Nine · the pencil and the rain", "A pencil lies on a dry lip of the rain-worn memorial stair. No legible name, new inscription, transferred paper or final choice is depicted."),
    intent: "Let the return settle before the public decision. Preserve actual earned district staging and keep the memorial detail out of Edda's archive return." },
] as const;
export function cinematicSequence(sceneId: string) { return CINEMATIC_SEQUENCES.find(sequence => sequence.scenes.some(id => id === sceneId)); }
export function cinematicDetail(sceneId: string) { const sequence = cinematicSequence(sceneId); return sequence?.detailScenes.some(id => id === sceneId) ? sequence.detail : undefined; }
export function dialoguePause(sceneId: string | undefined, previous?: string, next?: string): number {
  if (!previous || !next) return 0;
  const sequence = sceneId ? cinematicSequence(sceneId) : undefined;
  return previous === next ? sequence?.sameSpeakerMs ?? 120 : sequence?.changedSpeakerMs ?? 220;
}
