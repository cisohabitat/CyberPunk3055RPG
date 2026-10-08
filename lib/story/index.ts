import type { Scene } from "../types";
import { ACT1_SCENES } from "./act1";
import { ACT2_SCENES } from "./act2";
import { ACT3_SCENES } from "./act3";
import { MEMORY_SCENES } from "./memory";
import { MISSION_SCENES } from "./missions";

export { vaultNext } from "./act1";
export { CODEX, endingCoda } from "./codas";

export const SCENES: Record<string, Scene> = {
  ...ACT1_SCENES,
  ...ACT2_SCENES,
  ...ACT3_SCENES,
  ...MEMORY_SCENES,
  ...MISSION_SCENES,
};
