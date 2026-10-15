/** Explicit, read-only shot direction. A frame never reveals text or commits a choice. */
export const PIVOTAL_SCENES: Readonly<Record<string, { label: string; kind: "recording" | "conversation" }>> = {
  memo: { label: "Mara · from the shard", kind: "recording" },
  mara_why: { label: "The recorded explanation · Mara", kind: "recording" },
  act2_witness_brief: { label: "Before the crossing · Nia", kind: "conversation" },
  act2_witness_support: { label: "The work of moving · Nia", kind: "conversation" },
  act2_witness_arrival: { label: "Before the account · Nia", kind: "conversation" },
};

export function pivotalScene(sceneId: string): (typeof PIVOTAL_SCENES)[string] | undefined {
  return Object.hasOwn(PIVOTAL_SCENES, sceneId) ? PIVOTAL_SCENES[sceneId] : undefined;
}

export type BedFocus = "normal" | "intimate" | "closing";
/** Multiplies the player's existing sliders and speech ducking, never the voice. */
export const BED_FOCUS = {
  normal: { music: 1, ambience: 1 },
  intimate: { music: 0.55, ambience: 0.75 },
  closing: { music: 0.65, ambience: 0.55 },
} as const;
