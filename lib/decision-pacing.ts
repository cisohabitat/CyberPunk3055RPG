/** Ordinary hubs/conversations: saved context follows choices, never active task controls. */
export const DECISION_FIRST_SCENES = [
  "act2_middle", "act3_arrival",
  "act2_mara_account", "act2_mara_account_told", "act2_mara_account_owned", "act2_mara_account_deflected", "act2_mara_account_distance",
  "act3_mara_account_return", "act3_mara_account_question", "act3_mara_account_repair",
  "act2_witness_return_private", "act2_witness_return_registered", "act2_witness_return_relocated", "act3_witness_shift_return",
  "act2_response_terms", "act2_mara_quiet", "act2_mara_company", "act2_mara_company_kept", "act2_lumen_quiet",
  "act3_mara_followup", "act3_lumen_boundary", "act3_kerr_personal_question",
  "act3_witness_visit", "act3_edda_visit", "act3_spire_visit", "act3_shelter_visit", "act3_freight_visit", "act3_kerr_collection", "act3_quill_introduction",
] as const;
const scenes = new Set<string>(DECISION_FIRST_SCENES);
export const decisionFirstScene = (sceneId: string) => scenes.has(sceneId);
