import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createCharacter, getScene, stageCheck } from "./engine";
import { journalEntry, journalTitle } from "./journal";
import { DEFAULT_PREFERENCES, parsePreferences } from "./preferences";
import { MAX_SAVE_LENGTH, emptyCodex, parseCodex, parseSave } from "./storage";
import { exportRun, importRun, loadSlot } from "./vault";

const state = createCharacter({ handle: "Security", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

describe("untrusted local JSON", () => {
  it("rejects collection amplification below the existing file-size limit", () => {
    const raw = JSON.stringify({ ...state, journal: Array(50_000).fill("legacy") });
    assert.ok(raw.length < MAX_SAVE_LENGTH);
    assert.equal(parseSave(raw), null);
    assert.throws(() => importRun(raw), /too complex/);
    const codex = JSON.stringify({ seen: Array.from({ length: 10_000 }, () => ({ id: "ending_names", title: "Names" })) });
    assert.ok(codex.length < MAX_SAVE_LENGTH);
    assert.deepEqual(parseCodex(codex), emptyCodex());
  });

  it("rejects deeply nested metadata before snapshot serialization can overflow", () => {
    const deep = "[".repeat(12_000) + "0" + "]".repeat(12_000);
    const raw = JSON.stringify(state).slice(0, -1) + ',"extra":' + deep + "}";
    assert.equal(parseSave(raw), null);
    assert.throws(() => importRun(raw), /too complex/);
    const envelope = '{"format":"saint-shard-save","schema":1,"checksum":"00000000","state":' + raw + "}";
    assert.throws(() => importRun(envelope), /too complex/);
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: () => envelope } } });
    assert.equal(loadSlot(1), null);
    const preferences = '{"music":1,"extra":' + "[".repeat(100) + "0" + "]".repeat(100) + "}";
    assert.deepEqual(parsePreferences(preferences), DEFAULT_PREFERENCES);
  });

  it("does not count braces, commas, escaped quotes or backslashes inside saved text as structure", () => {
    const text = '[{"note":"a \\ path and quoted words"}],'.repeat(1_000);
    const saved = { ...state, journal: [{ id: "legacy-note", text }] };
    assert.deepEqual(importRun(JSON.stringify(saved)), saved);
    assert.deepEqual(importRun(exportRun(saved)), saved);
  });

  it("renders reserved journal ids and markup as text instead of inherited objects", () => {
    for (const id of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      const restored = importRun(JSON.stringify({ ...state, journal: [{ id, text: "<img src=x onerror=alert(1)>" }] }));
      const title = journalTitle(restored.journal[0]);
      assert.equal(typeof title, "string");
      const html = renderToStaticMarkup(createElement("strong", null, title));
      assert.ok(html.includes("&lt;img"));
      assert.ok(!html.includes("<img"));
      assert.equal(typeof journalEntry(id).id, "string");
    }
  });

  it("discards unrecognized nested metadata and reserved flags without changing legitimate state", () => {
    const raw = JSON.stringify(state);
    const input = JSON.parse(raw);
    input.stats.extra = { retained: "no" };
    input.factions.extra = { retained: "no" };
    input.flags = JSON.parse('{"__proto__":true,"constructor":true,"prototype":true,"quiet":true}');
    input.journal = [{ id: "custom", text: "A legacy note", kind: "claim", extra: { retained: "no" } }];
    input.rolls = [{ label: "Legacy roll", roll: 1, total: 4, dc: 8, success: false, extra: { retained: "no" } }];
    const restored = importRun(JSON.stringify(input));
    assert.deepEqual(restored.stats, state.stats);
    assert.deepEqual(restored.factions, state.factions);
    assert.deepEqual(restored.flags, { quiet: true });
    assert.deepEqual(restored.journal, [{ id: "custom", text: "A legacy note", kind: "claim" }]);
    assert.deepEqual(restored.rolls, [{ label: "Legacy roll", roll: 1, total: 4, dc: 8, success: false }]);
    assert.equal(Object.getPrototypeOf(restored.flags), Object.prototype);
    assert.equal(Object.hasOwn(Object.prototype, "quiet"), false);
  });

  it("limits every persisted JSON reader before parsing oversized input", () => {
    const oversized = " ".repeat(MAX_SAVE_LENGTH + 1);
    assert.equal(parseSave(oversized), null);
    assert.deepEqual(parseCodex(oversized), emptyCodex());
    assert.deepEqual(parsePreferences(" ".repeat(16_385)), DEFAULT_PREFERENCES);
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: () => oversized } } });
    assert.equal(loadSlot(1), null);
    assert.throws(() => importRun(oversized), /too large/);
  });

  it("does not treat inherited dictionary members as items or scenes", () => {
    for (const id of ["__proto__", "constructor", "toString"]) {
      assert.deepEqual(parseCodex(JSON.stringify({ seen: [], keepsakes: [id, "mono-knife"] })).keepsakes, ["mono-knife"]);
      assert.equal(parseSave(JSON.stringify({ ...state, items: [id] })), null);
      assert.equal(parseSave(JSON.stringify({ ...state, sceneId: id })), null);
      assert.throws(() => getScene(id), /Missing scene/);
      assert.deepEqual(createCharacter({ handle: "Review", givenName: "Ada", origin: "gutterwire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 }, keepsake: id }).items, []);
    }
    assert.deepEqual(parseCodex('{"seen":[{"id":"ending_names","title":"Names","extra":{"retained":"no"}}]}').seen, [{ id: "ending_names", title: "Names" }]);
  });

  it("rejects malformed envelopes without exposing internal exception messages", () => {
    for (const value of [undefined, null, [], "not a state", 1]) {
      assert.throws(() => importRun(JSON.stringify({ format: "saint-shard-save", schema: 1, checksum: "00000000", state: value })), /^Error: The save failed its integrity check/);
    }
    for (const field of ["stats", "items", "journal", "rolls"]) {
      assert.equal(parseSave(JSON.stringify({ ...state, [field]: {} })), null);
    }
    assert.equal(parseSave(JSON.stringify({ ...state, flags: [] })), null);
  });

  it("preserves legacy names, version 1 migration, snapshots and held dice", () => {
    assert.deepEqual(importRun(exportRun(state)), state);
    assert.deepEqual(importRun(JSON.stringify({ ...state, version: 1 })), state);
    const held = stageCheck({ ...state, sceneId: "pay" }, "haggle", 1);
    assert.deepEqual(importRun(exportRun(held)), held);
    const snapshot = JSON.parse(exportRun(held));
    snapshot.extra = { retained: "no" };
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: () => JSON.stringify(snapshot) } } });
    const loaded = loadSlot(1)!;
    assert.deepEqual(loaded.state, held);
    assert.equal(Object.hasOwn(loaded, "extra"), false);
  });
});

describe("CI supply chain boundary", () => {
  it("pins actions, drops checkout credentials, and requires the dependency audit before source tests", () => {
    const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
    const actions = [...workflow.matchAll(/uses:\s*(\S+)/g)].map(match => match[1]);
    assert.ok(actions.length > 0);
    for (const action of actions) assert.match(action, /^actions\/[a-z-]+@[0-9a-f]{40}$/);
    assert.equal((workflow.match(/actions\/checkout@/g) ?? []).length, (workflow.match(/persist-credentials: false/g) ?? []).length);
    assert.match(workflow, /permissions:\s+contents: read/);
    assert.doesNotMatch(workflow, /pull_request_target|permissions: write-all/);
    assert.match(workflow, /name: Audit dependency vulnerabilities\s+run: npm run security:audit/);
    assert.ok(workflow.indexOf("run: npm run security:audit") < workflow.indexOf("run: npm test"));
  });
});
