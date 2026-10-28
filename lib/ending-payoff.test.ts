import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { it } from "node:test";
import { endingPayoff } from "./ending-payoff";
import { finaleCommitments } from "./finale-commitments";
import { finaleScene } from "./finale-direction";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { exportRun, importRun } from "./vault";
import type { GameState } from "./types";

const run = (name: string) => replayCampaign(JSON.parse(readFileSync(`qa/routes/${name}.json`, "utf8")) as ReplaySpec).state;
it("connects all authored finale routes to recorded actions without changing their saves", () => {
  for (const file of readdirSync("qa/routes").filter(file => file.endsWith(".json"))) {
    const state = run(file.slice(0, -5)), before = JSON.stringify(state), echo = endingPayoff(state);
    if (finaleScene(state.sceneId)) {
      assert.ok(echo, file);
      assert.ok(echo.text.length < 350, file);
      assert.deepEqual(endingPayoff(importRun(exportRun(state))), echo, file);
    } else assert.equal(echo, undefined, file);
    assert.equal(JSON.stringify(state), before, file);
  }
});
it("keeps withdrawal, consent, corrections, custody and unfinished searches distinct", () => {
  assert.match(endingPayoff(run("finale-names-consent-withdrawn"))!.text, /keeping the hearing draft withdrawn/);
  assert.match(endingPayoff(run("finale-quiet-withdrawn"))!.text, /may remember what they heard/);
  assert.match(endingPayoff(run("finale-witness-corrected"))!.text, /unsupported claim and its correction/);
  assert.match(endingPayoff(run("finale-listed-archive"))!.text, /original remains with Sera/);
  assert.match(endingPayoff(run("finale-names-paused"))!.text, /no missing source|supplied no missing source/);
  const state = run("finale-names-consent-withdrawn");
  const change = (flags: GameState["flags"], journal = state.journal) => endingPayoff({ ...state, flags: { ...state.flags, ...flags }, journal })!.text;
  assert.match(change({ testimony_published: true, testimony_withdrawn: false }), /public account you filed/);
  assert.doesNotMatch(change({ testimony_published: true, testimony_withdrawn: true }), /public account you filed|keeping the hearing draft withdrawn/);
  assert.doesNotMatch(change({ testimony_published: true, testimony_withdrawn: false }, []), /public account you filed/);
  assert.match(change({ act2_deal: true, act2_stand: false, act2_exposed: false }), /accepting that earlier bargain remains/);
  assert.equal(endingPayoff({ ...state, flags: { ...state.flags, confirmed_leak: true } }), undefined);
});
it("only surfaces a recorded unfinished commitment and preserves the full ledger", () => {
  const breached = finaleCommitments(run("finale-quiet-withdrawn"))!;
  assert.equal(breached.priority!.status, "Compromised");
  assert.ok(breached.rows.includes(breached.priority!));
  const paused = finaleCommitments(run("finale-names-paused"))!;
  assert.equal(paused.priority!.status, "Unresolved");
  const finished = finaleCommitments(run("finale-listed-archive"));
  assert.equal(finished?.priority, undefined);
  assert.equal(finaleCommitments({ ...run("finale-names-paused"), sceneId: "act3_arrival" }), null);
});
