import decisions from "../qa/media/scene-art.json";
import { placeArt, portraitArt, sceneIllustration, PORTRAIT_STAGING } from "./art";
import type { Scene } from "./types";

export type SceneArtDecision = {
  treatment: "illustration" | "portrait" | "background" | "text";
  reason: string;
  asset?: string;
};

/** Authoring/QA only: never silently assign art to a newly added scene. */
export function auditSceneArt(scenes: Record<string, Scene>, source: unknown = decisions): Record<string, SceneArtDecision> {
  const manifest = source as { version?: unknown; decisions?: unknown; variants?: unknown } | null;
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.decisions)) throw new Error("Invalid scene art manifest");
  const result: Record<string, SceneArtDecision> = {};
  for (const entry of manifest.decisions) {
    if (!entry || !["illustration", "portrait", "background", "text"].includes(entry.treatment)
      || typeof entry.reason !== "string" || entry.reason.trim().length < 20
      || !Array.isArray(entry.scenes) || !entry.scenes.length) throw new Error("Scene art decision needs a treatment, explicit scenes and a rationale");
    if (entry.treatment === "text" ? entry.asset !== undefined : typeof entry.asset !== "string" || !/^\/art\/[a-z0-9_-]+\.jpg$/.test(entry.asset)) throw new Error("Invalid scene art asset");
    for (const id of entry.scenes) {
      if (typeof id !== "string" || !Object.hasOwn(scenes, id)) throw new Error(`Unknown scene art decision: ${id}`);
      if (Object.hasOwn(result, id)) throw new Error(`Duplicate scene art decision: ${id}`);
      const scene = scenes[id];
      const illustration = sceneIllustration(id);
      const rendered = entry.treatment === "illustration" ? illustration?.src
        : entry.treatment === "portrait" ? portraitArt(scene.speaker, id)
        : entry.treatment === "background" ? placeArt(scene.location) : undefined;
      if (rendered !== entry.asset || entry.treatment !== "illustration" && illustration) throw new Error(`Scene art decision disagrees with rendered art: ${id}`);
      if (illustration && (!illustration.description.trim() || !illustration.caption.trim() || !/^\/art\/[a-z0-9_-]+\.jpg$/.test(illustration.small))) throw new Error(`Scene illustration needs a description, caption and responsive asset: ${id}`);
      result[id] = { treatment: entry.treatment, reason: entry.reason, ...(entry.asset ? { asset: entry.asset } : {}) };
    }
  }
  const missing = Object.keys(scenes).filter((id) => !Object.hasOwn(result, id));
  if (missing.length) throw new Error(`Missing scene art decision: ${missing.join(", ")}`);
  if (JSON.stringify(manifest.variants) !== JSON.stringify(PORTRAIT_STAGING)) throw new Error("Conditional portrait catalog disagrees with conduct staging");
  for (const rule of PORTRAIT_STAGING) for (const id of rule.scenes) {
    if (!scenes[id] || scenes[id].speaker !== rule.speaker) throw new Error(`Conditional portrait speaker mismatch: ${id}`);
    const flags = Object.fromEntries(("allFlags" in rule ? rule.allFlags : rule.anyFlags).map(flag => [flag, true]));
    if (portraitArt(rule.speaker, id, flags) !== rule.asset) throw new Error(`Conditional portrait selection mismatch: ${id}`);
  }
  return result;
}
