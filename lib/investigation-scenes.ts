/** Fixed scene direction; frames grant no source, permission or outcome. */
export const INVESTIGATION_SCENES: Readonly<Record<string, { label: string; kind: "conversation" }>> = {
  act2_archive_brief: { label: "Access has terms · Edda", kind: "conversation" },
  act2_archive_challenge: { label: "A catalog is a lead · Edda", kind: "conversation" },
  act2_archive_custody: { label: "The source stays a person · Edda", kind: "conversation" },
  act2_witness_safe: { label: "Her words · Nia", kind: "conversation" },
  act3_testimony_review: { label: "Before the public account · Sera", kind: "conversation" },
  act3_testimony_consent: { label: "Whose words may leave · Sera", kind: "conversation" },
  act3_testimony_nia: { label: "Permission for this account · Nia", kind: "conversation" },
  act3_testimony_hearing: { label: "The source is questioned · Ives", kind: "conversation" },
  act3_testimony_correction: { label: "Keep the correction beside it · Sera", kind: "conversation" },
  act3_testimony_record: { label: "A draft, still yours to withdraw · Sera", kind: "conversation" },
};

export function investigationScene(id: string) {
  return Object.hasOwn(INVESTIGATION_SCENES, id) ? INVESTIGATION_SCENES[id] : undefined;
}
