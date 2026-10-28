import { ENCOUNTER_CRAFT_SCENES } from "./encounter-craft";
import { INTEGRATION_SCENES } from "./campaign-integration";
import { WITNESS_RETURN_SCENES } from "./witness-return";
import { ALLOCATION_SCENES } from "./notice-allocation";
import { WINDOW_SCENES } from "./chapel-window";
import { METHOD_SCENES } from "./encounter-methods";
import { DEPOT_SCENES } from "./depot-methods";
import { CHARACTER_ARC_SCENES } from "./character-arcs";
import { SPIRE_SCENES } from "./spire";
import { SHELTER_SCENES } from "./shelter";
import { FREIGHT_SCENES } from "./freight";
import { OPENING_SCENES } from "./opening";
import { NOTICE_SCENES } from "./notice";
import { mergeScenes } from "../authoring";
import { EMPLOYMENT_SCENES } from "./employment";
import { COMMUNITY_SCENES } from "./community";
import { SUPPORT_SCENES } from "./support";
import { TESTIMONY_SCENES } from "./testimony";
import { ARCHIVE_SCENES } from "./archive";
import type { Scene } from "../types";
import { ACT1_SCENES } from "./act1";
import { ACT2_SCENES } from "./act2";
import { ACT3_SCENES } from "./act3";
import { MEMORY_SCENES } from "./memory";
import { MISSION_SCENES } from "./missions";
import { OPERATION_SCENES } from "./operations";
import { RELATIONSHIP_SCENES } from "./relationships";
import { DISTRICT_SCENES } from "./district-response";
import { TECHNIQUE_SCENES } from "./build-techniques";
import { KERR_TERMS_SCENES } from "./kerr-terms";
import { MARA_ACCOUNT_SCENES } from "./mara-account";

export { vaultNext } from "./act1";
export { CODEX, endingCoda } from "./codas";

export const SCENES: Record<string, Scene> = mergeScenes(
  ENCOUNTER_CRAFT_SCENES,
  WITNESS_RETURN_SCENES,
  MARA_ACCOUNT_SCENES,
  KERR_TERMS_SCENES,
  TECHNIQUE_SCENES,
  DISTRICT_SCENES,
  INTEGRATION_SCENES,
  SPIRE_SCENES,
  SHELTER_SCENES,
  FREIGHT_SCENES,
  OPENING_SCENES,
  ACT1_SCENES,
  ACT2_SCENES,
  ACT3_SCENES,
  TESTIMONY_SCENES,
  MEMORY_SCENES,
  MISSION_SCENES,
  SUPPORT_SCENES,
  COMMUNITY_SCENES,
  NOTICE_SCENES,
  EMPLOYMENT_SCENES,
  ARCHIVE_SCENES,
  OPERATION_SCENES,
  RELATIONSHIP_SCENES,
  CHARACTER_ARC_SCENES,
  METHOD_SCENES,
  DEPOT_SCENES,
  WINDOW_SCENES,
  ALLOCATION_SCENES,
);
