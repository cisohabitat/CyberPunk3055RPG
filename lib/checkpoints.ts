import { getScene } from "./engine";
import { actName } from "./story/goal";
import type { GameState } from "./types";

export function checkpointLabel(state: GameState): string {
  const scene = getScene(state.sceneId);
  return `${actName(state)} · ${scene.endingTitle ?? scene.location}`;
}
