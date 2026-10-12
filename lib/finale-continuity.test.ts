import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { aftermath } from "./evidence";
import { sceneText, getScene } from "./engine";
import { replayCampaign, type ReplaySpec } from "./story-replay";
import { exportRun, importRun } from "./vault";

const run = (name: string) => replayCampaign(JSON.parse(readFileSync(`qa/routes/finale-${name}.json`, "utf8")) as ReplaySpec).state;
const wall = (state: ReturnType<typeof run>) => aftermath(state).find(row => row.title === "Ward Nine")!.text;
describe("memorial choices retain source and hearing boundaries", () => {
  it("speaking names after a paused failed query files no account or source", () => {
    const state = run("names-paused");
    assert.match(wall(state), /spoke the memorial names/);
    assert.match(wall(state), /No final hearing account was filed/);
    assert.equal(state.flags.archive_key_authenticated, undefined);
    assert.equal(state.flags.order_verified, undefined);
    assert.match(aftermath(state).find(row => row.title === "Archive search")!.text, /No ledger was retrieved/);
  });
  it("approved quotation for a withdrawn draft is not published by speaking names", () => {
    const state = importRun(exportRun(run("names-consent-withdrawn")));
    assert.equal(state.flags.nia_public_consent, true);
    assert.equal(state.flags.testimony_published, undefined);
    assert.match(wall(state), /withdrew the hearing draft/);
    assert.match(aftermath(state).find(row => row.title === "The public hearing")!.text, /not opened to public circulation/);
  });
  it("quiet departure retains a corrected, withdrawn hearing and the original witness breach", () => {
    const state = run("quiet-withdrawn");
    assert.match(wall(state), /left without speaking/);
    assert.match(wall(state), /attendees may remember/);
    assert.doesNotMatch(wall(state), /unchallenged|without your testimony/);
    assert.equal(state.flags.testimony_corrected, true);
    assert.equal(state.flags.witness_lost, true);
    assert.equal(state.flags.witness_relocated, true);
    assert.equal(state.flags.archive_key_authenticated, undefined);
  });
  it("acknowledging the earlier leak retains the bounded filed account and its correction", () => {
    const state = run("witness-corrected");
    assert.match(wall(state), /earlier leak/);
    assert.match(wall(state), /no new corroboration or witness permission/);
    assert.match(wall(state), /filed public account with its source limits/);
    assert.match(aftermath(state).find(row => row.title === "The public hearing")!.text, /unsupported claim and its correction remain attached/);
    assert.equal(state.flags.order_verified, undefined);
    assert.equal(state.flags.archive_key_authenticated, undefined);
  });
  for (const route of ["listed-private", "listed-interrupted"]) it(`${route} hands over only the memorial page across a save round trip`, () => {
    const state = importRun(exportRun(run(route)));
    const prose = sceneText(getScene(state.sceneId), state);
    assert.match(prose, /private witness ledger stays/);
    assert.match(prose, /recording stays outside public circulation/);
    assert.match(prose, /opens no separately held source to Ives/);
    assert.match(wall(state), /withdrew the hearing draft/);
    assert.equal(state.flags.testimony_published, undefined);
    assert.equal(state.flags.nia_public_consent, undefined);
    assert.equal(state.flags.witness_lost, true);
  });
  it("the memorial folio does not transfer the archived original or erase authentication", () => {
    const state = run("listed-archive");
    assert.match(sceneText(getScene(state.sceneId), state), /archive original stays with Sera/);
    assert.equal(state.flags.archive_key_authenticated, true);
    assert.equal(state.flags.edda_name_withheld, true);
    assert.match(wall(state), /existing custody and publication terms/);
  });
});
