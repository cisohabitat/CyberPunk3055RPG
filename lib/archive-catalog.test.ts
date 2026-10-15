import assert from "node:assert/strict";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { commitChoice, getScene, presentChoices, stageCheck } from "./engine";
import { parseSave } from "./storage";
import { sourceReadiness } from "./source-ledger";
import { notebookSources } from "./investigation-notebook";
import { sceneInteractionCue } from "./scene-cues";
import { sceneIllustration } from "./art";
import { routeCheckpoint } from "../qa/production/route-checkpoint";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import type { GameState } from "./types";
import media from "../qa/media/archive-catalog.json";

const checkpoint = () => routeCheckpoint("kit-archive", "act2_archive_compare");
const choice = (s: GameState, id: string) => presentChoices(s, getScene(s.sceneId)).find(c => c.id === id);
const act = (s: GameState, id: string) => { const c = choice(s, id); assert.ok(c?.enabled, id); return commitChoice(s, c).state; };
const locate = (s = checkpoint()) => ["open-archive-catalog", "catalog-inspect-revision", "catalog-request-revision"].reduce(act, s);

it("requires the intact, briefed archive and inspected description before submitting a locator", () => {
  const base = checkpoint();
  for (const flag of ["memory_intact", "archive_briefed"]) {
    const s = { ...base, flags: { ...base.flags, [flag]: false } };
    assert.equal(choice(s, "open-archive-catalog"), undefined);
    assert.throws(() => commitChoice(s, { ...getScene(s.sceneId).choices.find(c => c.id === "open-archive-catalog")!, enabled: true }));
  }
  assert.equal(choice(base, "catalog-request-revision"), undefined);
  const open = act(base, "open-archive-catalog");
  assert.equal(choice(open, "catalog-request-revision"), undefined);
  const partial = { ...open, flags: { ...open.flags, archive_catalog_located: true } };
  assert.equal(choice(partial, "catalog-buy-extraction"), undefined);
});

it("inspection and closing/reopening persist knowledge without money, strain, dice, query or sound", () => {
  const base = checkpoint(); let s = act(base, "open-archive-catalog");
  for (const id of ["catalog-inspect-authorization", "catalog-inspect-service", "close-archive-catalog", "open-archive-catalog"]) {
    const next = act(s, id); assert.equal(sceneInteractionCue(s, id, next), undefined); s = parseSave(JSON.stringify(next))!;
  }
  assert.equal(s.creds, base.creds); assert.equal(s.strain, base.strain); assert.deepEqual(s.rolls, base.rolls); assert.deepEqual(s.factions, base.factions);
  assert.ok(s.flags.archive_catalog_read_authorization && s.flags.archive_catalog_read_service);
  assert.equal(s.flags.archive_flagged, undefined); assert.equal(s.flags.order_verified, undefined);
  assert.equal(choice(s, "catalog-inspect-service"), undefined);
});

it("mismatches leave one logged trace each, alert the reader and supply no independent source", () => {
  let s = act(checkpoint(), "open-archive-catalog");
  for (const id of ["authorization", "service"]) {
    s = act(s, `catalog-inspect-${id}`); const before = s; s = act(s, `catalog-request-${id}`);
    assert.equal(s.factions.helion, Math.min(5, before.factions.helion + 1)); assert.equal(s.creds, before.creds); assert.deepEqual(s.rolls, before.rolls);
    assert.equal(s.flags.archive_reader_alert, true); assert.equal(s.flags.order_verified, undefined); assert.equal(s.flags.archive_key_authenticated, undefined);
    assert.equal(sceneInteractionCue(before, `catalog-request-${id}`, s), "foley-reader");
    assert.equal(sceneInteractionCue(s, `catalog-request-${id}`, s), undefined);
    assert.equal(choice(s, `catalog-request-${id}`), undefined);
    assert.equal(notebookSources(s).find(row => row.id === `archive-catalog-${id}`)!.kind, "claim");
  }
  const before = s; s = act(s, "separate-source-tests");
  const trace = choice(s, "trace-receipt")!;
  assert.ok(trace.check!.flagBonuses!.some(b => b.flag === "archive_reader_alert" && b.amount === -1));
  assert.equal(s.creds, before.creds); assert.equal(sourceReadiness(s).cancellation, "Independent corroboration still needed");
});

it("a correct locator unlocks retrieval while evidence, authentication and all permissions remain unearned", () => {
  const base = checkpoint(), s = locate(base);
  assert.equal(s.flags.archive_catalog_located, true); assert.equal(s.flags.archive_compared, true);
  for (const flag of ["order_verified", "archive_key_authenticated", "archive_done", "archive_custody", "edda_public_consent", "witness_safe", "nia_public_consent"]) assert.equal(Boolean(s.flags[flag]), Boolean(base.flags[flag]), flag);
  assert.equal(s.creds, base.creds); assert.deepEqual(s.rolls, base.rolls);
  assert.equal(notebookSources(s).find(row => row.id === "archive-catalog")!.kind, "claim");
  assert.equal(choice(s, "catalog-request-revision"), undefined);
});

it("paid extraction costs exactly 25 once and survives custody without inventing digital authentication", () => {
  const located = locate();
  const poor = { ...located, creds: 24 };
  assert.equal(choice(poor, "catalog-buy-extraction")!.enabled, false);
  assert.throws(() => commitChoice(poor, { ...choice(poor, "catalog-buy-extraction")!, enabled: true }));
  assert.equal(choice(located, "catalog-bill-employee"), undefined);
  let s = act(located, "catalog-buy-extraction");
  assert.equal(s.creds, located.creds - 25); assert.equal(s.strain, located.strain); assert.deepEqual(s.rolls, located.rolls);
  assert.equal(s.sceneId, "act2_archive_custody"); assert.equal(s.flags.order_verified, true); assert.equal(s.flags.archive_key_authenticated, undefined);
  assert.deepEqual(parseSave(JSON.stringify(s)), s);
  assert.throws(() => commitChoice(s, { ...choice(located, "catalog-buy-extraction")!, enabled: true }));
  s = act(s, "withhold-technician"); s = act(s, "keep-chain");
  assert.equal(s.creds, located.creds - 25); assert.equal(s.flags.edda_public_consent, undefined); assert.equal(s.flags.nia_public_consent, undefined);
  assert.equal(notebookSources(s).find(row => row.id === "archive-catalog-extraction")!.kind, "fact");
  assert.equal(sourceReadiness(s).cancellation, "Independently corroborated; key not authenticated");
});

it("Spire billing trades an additional badge trace for the search fee", () => {
  const located = locate(routeCheckpoint("shift-key", "act2_archive_compare")), s = act(located, "catalog-bill-employee");
  assert.equal(s.creds, located.creds); assert.equal(s.factions.helion, Math.min(5, located.factions.helion + 1));
  assert.ok(s.flags.old_badge_traced && s.flags.archive_catalog_badge && s.flags.order_verified);
  assert.equal(s.flags.archive_key_authenticated, undefined); assert.deepEqual(s.rolls, located.rolls);
});

it("existing reader methods and their held dice remain available after optional catalog work", () => {
  const baseline = act(checkpoint(), "separate-source-tests"), catalog = act(locate(), "separate-source-tests");
  assert.deepEqual(choice(catalog, "trace-receipt")!.check, choice(baseline, "trace-receipt")!.check);
  const held = stageCheck(catalog, "trace-receipt", 5), restored = parseSave(JSON.stringify(held))!;
  assert.deepEqual(restored.pendingCheck, { sceneId: "act2_archive_door", choiceId: "trace-receipt", roll: 5 });
  const resolved = commitChoice(restored, choice(restored, "trace-receipt")!, { roll: 5 }).state;
  assert.ok(resolved.flags.archive_key_authenticated); assert.equal(resolved.rolls[0].roll, 5);
});

it("complete authored alternatives retain their actual cost and honest hearing answer", () => {
  for (const [name, cash, key] of [["catalog-paid", 165, false], ["catalog-badge", 390, false], ["catalog-reader", 390, true], ["catalog-scarce-mismatch", 35, false]] as const) {
    const spec = JSON.parse(readFileSync(`qa/routes/${name}.json`, "utf8")) as ReplaySpec;
    const { state } = replayCampaign(spec);
    assert.equal(state.creds, cash); assert.equal(Boolean(state.flags.archive_key_authenticated), key);
    assert.equal(Boolean(state.flags.nia_public_consent), false);
    if (name === "catalog-scarce-mismatch") {
      assert.equal(state.flags.testimony_published, undefined);
      assert.ok(state.flags.archive_flagged);
      assert.ok(state.journal.some(row => row.id === "archive-gap" && row.kind === "claim"));
    } else {
      assert.ok(state.flags.testimony_published);
      assert.ok(spec.steps.some(step => step.choiceId === (key ? "answer-authenticated-key" : "answer-corroboration")));
    }
  }
});

it("keeps the existing complete painting and every dialogue binding aligned with the catalog's written records", () => {
  assert.equal(sceneIllustration(media.scene)!.src, media.illustration);
  assert.equal(createHash("sha256").update(readFileSync("qa/media/campaign-dialogue-bindings.json")).digest("hex"), media.preservedBindingsSha256);
  assert.ok(media.artDecision.length > 100 && media.voiceDecision.includes("unquoted"));
});
