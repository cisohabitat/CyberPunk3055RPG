export type AcceptanceGate = { id: string; phase: number; requirement: string; status: "pending" | "passed"; evidence: string[] };
export function acceptanceSummary(gates: AcceptanceGate[]) {
  const ids = new Set<string>();
  for (const gate of gates) {
    if (!gate.id || ids.has(gate.id) || !Number.isInteger(gate.phase) || gate.phase < 1 || gate.phase > 6 || !gate.requirement || !["pending", "passed"].includes(gate.status) || !Array.isArray(gate.evidence) || gate.evidence.some((entry) => typeof entry !== "string" || !entry.trim()) || (gate.status === "passed" && !gate.evidence.length)) throw new Error(`Invalid acceptance evidence: ${gate.id}`);
    ids.add(gate.id);
  }
  if (!gates.length || new Set(gates.map((gate) => gate.phase)).size !== 6) throw new Error("Acceptance gates must cover all six phases");
  return { ready: gates.every((gate) => gate.status === "passed"), pending: gates.filter((gate) => gate.status !== "passed").map((gate) => ({ id: gate.id, phase: gate.phase, requirement: gate.requirement })) };
}
export function budgetViolations(assets: { path: string; bytes: number; gzipBytes: number; group: string }[], budgets: { artwork: number; audio: number; scriptsGzip: number; stylesGzip: number }) {
  for (const key of ["artwork", "audio", "scriptsGzip", "stylesGzip"] as const) if (!Number.isSafeInteger(budgets[key]) || budgets[key] <= 0) throw new Error(`Invalid asset budget: ${key}`);
  const errors: string[] = [];
  for (const asset of assets) {
    if (!Number.isSafeInteger(asset.bytes) || asset.bytes < 0 || !Number.isSafeInteger(asset.gzipBytes) || asset.gzipBytes < 0) throw new Error(`Invalid asset size: ${asset.path}`);
    const limit = asset.group === "artwork" ? budgets.artwork : asset.group === "audio" ? budgets.audio : undefined;
    if (limit !== undefined && asset.bytes > limit) errors.push(`${asset.path}: ${asset.bytes} bytes exceeds ${limit}`);
  }
  for (const [group, limit] of [["scripts", budgets.scriptsGzip], ["styles", budgets.stylesGzip]] as const) {
    const total = assets.filter((asset) => asset.group === group).reduce((sum, asset) => sum + asset.gzipBytes, 0);
    if (total > limit) errors.push(`${group}: ${total} gzip bytes exceeds ${limit}`);
  }
  return errors;
}
