import assert from "node:assert/strict";
import { describe, it } from "node:test";
import gates from "../qa/production/acceptance.json";
import { acceptanceSummary, budgetViolations, type AcceptanceGate } from "./production";
describe("production acceptance evidence", () => {
  it("keeps all six independent acceptance gates open", () => {
    const report = acceptanceSummary(gates as AcceptanceGate[]);
    assert.equal(report.ready, false); assert.equal(report.pending.length, 6);
  });
  it("rejects unsupported pass claims, duplicate gates and incomplete phase coverage", () => {
    const source = gates as AcceptanceGate[];
    assert.throws(() => acceptanceSummary(source.map((gate) => ({ ...gate, status: "passed" }))), /Invalid acceptance evidence/);
    assert.throws(() => acceptanceSummary([...source,source[0]]), /Invalid acceptance/);
    assert.throws(() => acceptanceSummary(source.slice(1)), /all six phases/);
    assert.equal(acceptanceSummary(source.map((gate) => ({ ...gate,status:"passed",evidence:["review-record.json"] }))).ready,true);
  });
  it("fails oversized individual media and aggregate compressed scripts", () => {
    const budgets={artwork:100,audio:200,scriptsGzip:80,stylesGzip:40};
    const assets=[{path:"a.jpg",group:"artwork",bytes:101,gzipBytes:90},{path:"b.wav",group:"audio",bytes:201,gzipBytes:100},{path:"c.js",group:"scripts",bytes:100,gzipBytes:45},{path:"d.js",group:"scripts",bytes:100,gzipBytes:45}];
    assert.equal(budgetViolations(assets,budgets).length,3);
    assert.throws(()=>budgetViolations(assets,{...budgets,artwork:0}),/Invalid asset budget/);
    assert.throws(()=>budgetViolations(assets,{...budgets,audio:NaN}),/Invalid asset budget/);
    assert.deepEqual(budgetViolations(assets.map((asset)=>({...asset,bytes:50,gzipBytes:20})),budgets),[]);
    assert.throws(()=>budgetViolations([{...assets[0],bytes:NaN}],budgets),/Invalid asset size/);
  });
});
