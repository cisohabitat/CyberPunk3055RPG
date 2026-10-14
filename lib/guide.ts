import { createCharacter, resolveCheck } from "./engine";
import type { Choice } from "./types";

export const GUIDE_LORE = [
  { title: "A city under glass", text: "It is 3055. Rain runs down the inside of Kite City’s dome. Helion’s towers stay dry above the walkways; below them, people keep stalls, clinics and households going with work the towers rarely see." },
  { title: "An hour you can hold", text: "Glass Chapel offers memory editing: pay to leave an hour behind. Its original survives in a sliver of glass called a shard. An hour can carry an argument, a regret or something someone wants kept out of circulation. Owning the glass and deciding whose words may leave it are different responsibilities." },
  { title: "You are a runner", text: "You carry parcels, open doors and find things people would rather lose. Tonight, Quill has called you to his noodle stall in Ward Four. You need work. You have not accepted his offer. The reasons you bring to the meeting are yours to choose." },
] as const;

export const GUIDE_CONTACTS = [
  { title: "Quill · the broker", text: "A stall, an advance and a job. Read the terms before treating a warm welcome as friendship." },
  { title: "Lumen · Glass Chapel", text: "The Chapel’s nurse works among chairs, patients and memory machinery. Care takes work; each person still gets to set their own terms." },
  { title: "Helion · the Spire", text: "The tower’s offices run on badges, contracts and records. An old clearance can open a door while leaving your name in a file." },
  { title: "The wards · your neighbors", text: "Families, couriers and repair crews live under the leaks. Their trust grows through what you actually do and remember." },
] as const;

// A fictional, read-only illustration. No roll, choice or save is committed.
const practiceState = { ...createCharacter({ handle: "Practice", givenName: "", origin: "spire", bonus: { chrome: 0, nerve: 1, face: 1, ghost: 0 } }), strain: 2 };
const practiceChoice: Choice = { id: "guide-practice", label: "Open a practice service hatch.", check: { stat: "nerve", dc: 8, label: "Practice service hatch" } };
export function guideCheck(roll: number) {
  return resolveCheck(practiceState, practiceChoice, roll);
}
