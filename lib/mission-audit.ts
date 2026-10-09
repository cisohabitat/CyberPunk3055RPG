import type { Scene } from "./types";

export type MissionAudit = { id: string; title: string; scenes: string[]; laterScenes: string[]; priority: string; finding: string; truth: string };

// Source-linked production findings, not an automatic craft grade.
export function auditMissions(scenes: Record<string, Scene>, missions: MissionAudit[], covered = new Set<string>()) {
  const ids = new Set<string>();
  const owned = new Set<string>();
  return missions.map((mission) => {
    if (!mission.id || ids.has(mission.id) || !mission.title || !mission.finding || !mission.truth || !["P1", "P2", "P3"].includes(mission.priority) || !mission.scenes?.length || !mission.laterScenes?.length) throw new Error(`Invalid mission audit: ${mission.id}`);
    ids.add(mission.id);
    for (const id of [...mission.scenes, ...mission.laterScenes]) if (!Object.hasOwn(scenes, id)) throw new Error(`${mission.id}: missing scene ${id}`);
    for (const id of mission.scenes) {
      if (owned.has(id)) throw new Error(`${id}: duplicate mission ownership`);
      owned.add(id);
    }
    const choices = mission.scenes.flatMap((id) => scenes[id].choices.map((choice) => ({ id: `${id}:${choice.id}`, check: Boolean(choice.check) })));
    return { ...mission, choices: choices.length, checks: choices.filter((choice) => choice.check).length, unplayedChoices: choices.filter((choice) => !covered.has(choice.id)).map((choice) => choice.id) };
  });
}
