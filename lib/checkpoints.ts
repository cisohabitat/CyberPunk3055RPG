import { getScene } from "./engine";
import { actName } from "./story/goal";
import type { GameState } from "./types";

export function checkpointLabel(state: GameState): string {
  const scene = getScene(state.sceneId);
  const act = actName(state), place = scene.endingTitle ?? scene.location;
  return place === act ? act : `${act} · ${place}`;
}
