import { existsSync, rmSync } from "node:fs";

if (process.argv.length > 2) throw new Error("clean accepts no paths or arguments.");

// Resolve from this script, never the caller's working directory. Keep this
// allowlist limited to ignored output that normal build/test commands recreate.
const outputs = [".next", "out", "playwright-report", "test-results", "tsconfig.tsbuildinfo"];
for (const output of outputs) {
  const target = new URL(`../${output}`, import.meta.url);
  if (!existsSync(target)) continue;
  rmSync(target, { recursive: true, force: true });
  console.log(`Removed ${output}`);
}
