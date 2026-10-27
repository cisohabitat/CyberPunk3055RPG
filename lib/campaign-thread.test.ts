import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { campaignThread, campaignThreadLeads, hasCampaignThread } from "./campaign-thread";
import { campaignContract } from "../qa/production/campaign-contract";
import { integratedArchive, closeIntegratedWeek, takeIntegrated } from "../qa/production/integrated-campaign";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { createCharacter, getScene, presentChoices, stageCheck } from "./engine";
import { commitCaseAction } from "./case-file";
import { exportRun, importRun } from "./vault";

const final = (file: string) => replayCampaign(JSON.parse(readFileSync(`qa/routes/${file}.json`, "utf8")) as ReplaySpec).state;
const row = (state: ReturnType<typeof final>, id: string) => campaignThread(state).find(r => r.id === id)!;
it("preserves the independently captured full 164-route state/choice/script/actor/art contract", () => {
  assert.deepEqual(campaignContract(), { routes: 164, visits: 11924, sha256: "9e00acca95f3234b5721a55f05ab68af1937ff26be95d653e6068e6de173d7cc" });
});
it("scopes the thread to explicit checkpoints and all four unchanged finales", () => {
  for (const id of ["card_week", "act2_middle", "card_wall", "act3_neighborhood", "act3_arrival", "ending_names", "ending_quiet", "ending_witness", "ending_listed"]) assert.ok(hasCampaignThread(id));
  for (const id of ["memo", "act2_archive_door", "ending_new", "__proto__", "constructor", "unknown"]) assert.equal(hasCampaignThread(id), false);
  assert.deepEqual(campaignThread(createCharacter({ handle: "New", givenName: "Ada", complication: null, origin: "gutterwire", bonus: { chrome: 2, face: 0, ghost: 0, nerve: 0 } })), []);
});
for (const variant of ["reader", "carbon", "withdraw", "paused"] as const) it(`connects a challenged/corrected case to a zero-creds ${variant} campaign through legal plans and reloads`, () => {
  const { checkpoint, final: state } = integratedArchive(variant);
  assert.equal(state.sceneId, "ending_quiet"); assert.equal(state.creds, 0);
  assert.deepEqual(state.caseFile!.history.map(h => h.verdict), ["challenged", "bounded"]);
  assert.match(row(state, "case").limit, /challenged → bounded/);
  assert.match(row(state, "case").consequence, /Current source test: bounded/);
  assert.deepEqual(importRun(exportRun(state)), state);
  const before = JSON.stringify(state); campaignThread(state); campaignThreadLeads(presentChoices(state, getScene(state.sceneId))); assert.equal(JSON.stringify(state), before);
  assert.equal(Boolean(state.flags.archive_key_authenticated), variant === "reader");
  assert.equal(state.archivePlan!.stage, variant === "paused" ? "failed" : variant === "withdraw" ? "withdrawn" : "retrieved");
  if (variant === "paused") { assert.match(row(checkpoint, "plan").consequence, /staffed recovery/); assert.match(row(state, "plan").consequence, /week closed/); assert.match(row(state, "account").consequence, /still needed/); }
  if (variant === "carbon") { assert.equal(row(state, "account").consequence, "Independently corroborated; key not authenticated"); assert.match(row(state, "plan").limit, /service interval cost one strain/); }
  else assert.match(row(state, "plan").limit, /signed a priority reader request/);
  if (variant === "withdraw") { assert.equal(state.strain, 5); assert.match(row(state, "plan").consequence, /gap unresolved/); }
});
it("shows a changed untested case without presenting a saved verdict as current evidence", () => {
  let state = routeCheckpoint("scarce-archive-open", "act2_archive_compare");
  state = commitCaseAction(state, { type: "link", source: "memory-order", relation: "supports" });
  state = commitCaseAction(state, { type: "test" });
  state = commitCaseAction(state, { type: "claim", claim: "issuer" });
  assert.match(row(state, "case").consequence, /not been tested since its last edit/);
  assert.match(row(state, "case").limit, /Saved reviews: bounded/);
  const choice = presentChoices(state, getScene(state.sceneId)).find(c => c.id === "case-pursue-archive"); assert.equal(choice, undefined);
});
it("keeps deferred recording and an unfinished specialist task unresolved when the week closes", () => {
  const deferred = routeCheckpoint("witness-permission", "act2_middle", "return-witness");
  const closed = closeIntegratedWeek(deferred);
  assert.match(row(closed, "witness").limit, /week closed without an approved account/);
  assert.equal(row(closed, "witness").consequence, "No approved witness account");
  const unfinished = routeCheckpoint("technique-chrome-counter-label", "act2_technique_chrome_submit");
  let state = takeIntegrated(unfinished, "abandon-technique");
  state = takeIntegrated(state, "district-pause");
  const ended = closeIntegratedWeek(state);
  assert.match(row(ended, "build").consequence, /set aside; no completion claimed/);
  assert.equal(Boolean(ended.flags.technique_review_reference), false);
});
it("retains successful, failed and waived work consequences without implying a finding", () => {
  const success = final("technique-face-cosign-process");
  assert.match(row(success, "build").consequence, /paid sorting opportunity was waived/);
  assert.match(row(success, "build").limit, /does not approve the correction/);
  assert.match(row(final("technique-chrome-counter-invent"), "build").consequence, /Packet held; no review reference/);
  assert.match(row(final("district-breach-denied"), "district").limit, /Withheld this depot introduction/);
});
it("separates the approved public account from private recordings and memorial speech", () => {
  assert.equal(row(final("witness-permission"), "witness").consequence, "Quotation authorized for this account");
  assert.match(row(final("finale-names-consent-withdrawn"), "hearing").limit, /Speaking memorial names grants no new evidence/);
});
it("only links already enabled decisions and preserves held rolls and export bytes", () => {
  const state = routeCheckpoint("scarce-archive-open", "act2_archive_door");
  const held = stageCheck(state, "trace-receipt", 1), before = JSON.stringify(held);
  campaignThread(held); assert.equal(JSON.stringify(held), before); assert.deepEqual(importRun(exportRun(held)), held);
  assert.deepEqual(campaignThreadLeads([{ id: "trace-order", label: "Trace", enabled: false }, { id: "prepare-public-account", label: "Prepare", enabled: true }, { id: "new-future-choice", label: "Unknown", enabled: true }]), [{ id: "prepare-public-account", label: "Prepare" }]);
});
it("reads every legacy campaign without mutating saves, sources, permission, or dice", () => {
  for (const file of readdirSync("qa/routes").filter(f => f.endsWith(".json"))) {
    const state = final(file.slice(0, -5)), saved = JSON.stringify(state), rows = campaignThread(state);
    assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
    assert.ok(rows.length <= 7); assert.equal(JSON.stringify(state), saved); assert.deepEqual(importRun(exportRun(state)), state);
  }
});
