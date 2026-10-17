/** Test-only reconciliation of an explicitly reviewed replacement with retained bytes. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import phase from "../media/archive-hearing.json";
import clarity from "../media/speech-clarity.json";
const hash = (path: string) => createHash("sha256").update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest("hex");
export function reviewedDeliveryHash(path: string, expected: string): string {
  const current = hash(path);
  if (current === expected) return current;
  const revision = [...phase.performances, ...clarity.performances].find(row => row.path === path && row.previousSha256 === expected);
  if (!revision || current !== revision.sha256) throw new Error(`Unreviewed delivery change: ${path}`);
  const preceding = hash(revision.previousDeliveryCopy);
  if (preceding !== expected) throw new Error(`Corrupted preceding delivery: ${path}`);
  return preceding;
}
