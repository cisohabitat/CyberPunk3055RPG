/** Presentation only: active terms and the existing thread stay near actions;
 * saved commitments, receipt and full action reference follow decisions. */
export const DECISION_FLOW_SCENES = [
  "act2_workshop", "act2_craft_archive", "act2_craft_archive_issuer",
  "act2_route_exit", "act3_testimony_review", "act3_testimony_hearing",
] as const;
const scenes = new Set<string>(DECISION_FLOW_SCENES);
export const decisionFlowScene = (sceneId: string) => scenes.has(sceneId);
