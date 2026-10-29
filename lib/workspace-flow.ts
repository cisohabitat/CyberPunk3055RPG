/** Spacing treatment only. Active comparisons, terms and canonical controls stay in place. */
export const WORKSPACE_FLOW_SCENES = [
  "act2_craft_archive", "act2_craft_archive_challenge", "act2_craft_archive_issuer", "act2_craft_archive_ledger",
  "act2_route_map", "act2_route_exit", "act2_route_review", "act2_route_crossing",
  "act3_testimony_review", "act3_testimony_consent", "act3_testimony_nia",
  "act3_testimony_hearing", "act3_testimony_correction", "act3_testimony_record",
] as const;
const scenes = new Set<string>(WORKSPACE_FLOW_SCENES);
export const workspaceFlowScene = (sceneId: string) => scenes.has(sceneId);
