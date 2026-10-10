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

export { vaultNext } from "./act1";
export { CODEX, endingCoda } from "./codas";

export const SCENES: Record<string, Scene> = mergeScenes(
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
);
