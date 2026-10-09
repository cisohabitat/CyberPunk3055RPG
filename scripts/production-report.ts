import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { createCharacter, commitChoice, getScene, sceneText } from "../lib/engine";
import { SCENES } from "../lib/story";
import { storyReport } from "../lib/story-report";
import { replayCampaign, type ReplaySpec } from "../lib/story-replay";
import { acceptanceSummary, budgetViolations, type AcceptanceGate } from "../lib/production";
import notice from "../content/notice.json";
import authored from "../content/community.json";
import budgets from "../qa/production/budgets.json";
import missions from "../qa/production/mission-audit.json";
import { auditMissions } from "../lib/mission-audit";

const directory = resolve(process.argv.find((arg) => arg.startsWith("--out="))?.slice(6) ?? "qa/production/reports");
const release = process.argv.includes("--release");
const graph = storyReport();
if (graph.missing.length) throw new Error("Story graph has missing destinations");
const variants = new Map<string, Set<string>>();
const add = (id: string, text: string) => { const set = variants.get(id) ?? new Set<string>(); set.add(text); variants.set(id, set); };
const coveredChoices = new Set<string>();
const routes = readdirSync("qa/routes").filter((file) => file.endsWith(".json")).sort().map((file) => {
  const spec: ReplaySpec = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8"));
  const result = replayCampaign(spec);
  let state = createCharacter(spec.character);
  for (const step of spec.steps) {
    const scene = getScene(state.sceneId); add(scene.id, sceneText(scene, state));
    const choice = scene.choices.find((entry) => entry.id === step.choiceId)!;
    coveredChoices.add(`${scene.id}:${choice.id}`);
    state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
  }
  add(state.sceneId, sceneText(getScene(state.sceneId), state));
  return { file, steps: result.transcript.length, finale: result.state.sceneId, restoredCheckpoints: result.transcript.filter((step) => step.restored).length };
});
const catalog = graph.nodes.map((node) => ({ ...node, choiceDefinitions: JSON.parse(JSON.stringify(SCENES[node.id].choices, (_key, value) => typeof value === "function" ? "[dynamic authored function; inspect source and observed routes]" : value)), observedText: [...(variants.get(node.id) ?? [])], unplayedByFixtures: !variants.has(node.id) }));
const assets: { path: string; group: string; bytes: number; gzipBytes: number; sha256: string }[] = [];
function inventory(directory: string, group: string) {
  if (!existsSync(directory)) throw new Error(`Missing ${directory}; generate audio and build before reporting`);
  for (const file of readdirSync(directory).sort()) {
    const path = `${directory}/${file}`;
    if (statSync(path).isDirectory()) inventory(path, group);
    else {
      const bytes = readFileSync(path);
      const category = group === "build" ? path.endsWith(".js") ? "scripts" : path.endsWith(".css") ? "styles" : "other-build" : group;
      assets.push({ path, group: category, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: createHash("sha256").update(bytes).digest("hex") });
    }
  }
}
for (const source of ["lib/art.ts", "components/Portrait.tsx"]) {
  for (const match of readFileSync(source, "utf8").matchAll(/\/art\/[a-z0-9_-]+\.jpg/g)) if (!existsSync(`public${match[0]}`)) throw new Error(`Missing referenced artwork ${match[0]}`);
}
inventory("public/art", "artwork"); inventory("public/audio", "audio"); inventory(".next/static", "build");
const violations = budgetViolations(assets, budgets);
const gates: AcceptanceGate[] = JSON.parse(readFileSync("qa/production/acceptance.json", "utf8"));
const acceptance = acceptanceSummary(gates);
for (const gate of gates) for (const reference of gate.evidence) if (!existsSync(reference)) throw new Error(`Missing acceptance evidence ${reference}`);
const report = {
  revision: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  dirty: Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()),
  graph: { scenes: graph.sceneCount, choices: graph.choiceCount, missing: graph.missing },
  authoring: { sources: ["content/community.json", "content/notice.json"], scenes: authored.scenes.length + notice.scenes.length, choiceCount: [...authored.scenes, ...notice.scenes].reduce((sum, scene) => sum + scene.choices.length, 0) },
  replayCoverage: { routes, scenes: variants.size, choices: coveredChoices.size, unplayedScenes: catalog.filter((scene) => scene.unplayedByFixtures).map((scene) => scene.id), unplayedChoices: graph.nodes.flatMap((scene) => scene.choices.filter((choice) => !coveredChoices.has(`${scene.id}:${choice.id}`)).map((choice) => `${scene.id}:${choice.id}`)) },
  budgets, violations, assets, acceptance,
  missionAudit: auditMissions(SCENES, missions, coveredChoices),
  limitations: ["Repository fixtures are directed internal QA, not fresh-player research.", "Static asset envelopes are regression limits, not LCP, INP, CLS, memory or physical-device measurements.", "Asset hashes identify supplied files; they do not establish copyright or license rights.", "Pending acceptance gates prevent commercial release acceptance; demo hosting retains its existing CI gate."]
};
mkdirSync(directory, { recursive: true });
writeFileSync(`${directory}/production.json`, JSON.stringify(report, null, 2) + "\n");
writeFileSync(`${directory}/story-catalog.json`, JSON.stringify({ catalog, authoredSource: authored, authoredMissions: [{ source: "content/community.json", data: authored }, { source: "content/notice.json", data: notice }] }, null, 2) + "\n");
const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]!));
const cards = catalog.map((scene) => `<article><h2>${escape(scene.id)}</h2><p>${escape(scene.location)}</p><details><summary>${scene.choices.length} choices; ${scene.observedText.length} observed prose variants</summary>${scene.observedText.map((text) => `<pre>${escape(text)}</pre>`).join("")}${scene.unplayedByFixtures ? "<p>Not observed by the fixture set. Review source and add a route before accepting coverage.</p>" : ""}<ul>${scene.choices.map((choice) => `<li><code>${escape(choice.id)}</code> ${escape(choice.label)}${choice.check ? ` · ${escape(choice.check)}` : ""}</li>`).join("")}</ul><p>Destinations: ${scene.destinations.map(escape).join(", ")}</p></details></article>`).join("");
writeFileSync(`${directory}/review.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Saint Shard production review</title><style>body{font:18px system-ui;max-width:70rem;margin:auto;padding:1.5rem;background:#101019;color:#eee}article{border:1px solid #58616a;padding:1rem;margin:1rem 0}pre{white-space:pre-wrap;font:inherit;line-height:1.6}input{font:inherit;padding:.6rem;width:85%;background:#fff;color:#111}code{color:#7efaff}</style><body><main><h1>Saint Shard production review</h1><p>Internal QA source catalog. Contains full story spoilers. ${graph.sceneCount} scenes, ${graph.choiceCount} choices. Pending independent acceptance gates: ${acceptance.pending.length}.</p><label>Find a scene or choice <input id="search" type="search"></label>${cards}</main><script>document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('article').forEach(a=>a.hidden=!a.textContent.toLowerCase().includes(q))})</script></body></html>`);
console.log(JSON.stringify({ output: relative(process.cwd(), directory), scenes: graph.sceneCount, choices: graph.choiceCount, routes: routes.length, coveredScenes: variants.size, coveredChoices: coveredChoices.size, assets: assets.length, budgetViolations: violations, commercialAcceptanceReady: acceptance.ready, pendingGates: acceptance.pending.length }));
if (violations.length || (release && !acceptance.ready)) process.exitCode = 1;
