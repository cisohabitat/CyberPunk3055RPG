import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createCharacter } from "./engine.ts";
import { loadPreferences, parsePreferences } from "./preferences.ts";
import {
  clearSave, emptyCodex, loadBackup, loadCodex, loadSave, loadSound, loadTextStep, usedBackup,
  rememberEnding, writeCodex, writeSave, writeSound, writeTextStep,
} from "./storage.ts";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const state = createCharacter({
  handle: "Rex", givenName: "", origin: "gutterwire",
  bonus: { chrome: 1, nerve: 1, face: 0, ghost: 0 }, complication: "debt",
});

function installWindow(value: object) {
  Object.defineProperty(globalThis, "window", { configurable: true, value });
}

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

function assertDefaultsAndFailedWrites() {
  assert.equal(loadSave(), null);
  assert.deepEqual(loadCodex(), emptyCodex());
  assert.equal(loadSound(), false);
  assert.equal(loadTextStep(), 0);
  assert.equal(writeSave(state), false);
  assert.equal(writeSound(true), false);
  assert.equal(writeTextStep(2), false);
  assert.equal(writeCodex(emptyCodex()), false);
  assert.equal(rememberEnding("ending_names", "Names"), false);
  assert.equal(clearSave(), false);
}

describe("browser storage failures", () => {
  it("shows whole scenes by default and preserves an explicit saved paragraph preference", () => {
    const values = new Map<string, string>();
    installWindow({ localStorage: { getItem(key: string) { return values.get(key) ?? null; } } });
    assert.equal(loadPreferences().reading, "all");
    for (const raw of [null, "{", "null", "{}", '{"reading":"invalid"}', '{"sound":false}']) assert.equal(parsePreferences(raw).reading, "all");
    values.set("saint-shard-preferences", '{"reading":"paragraph","motion":"reduce"}');
    assert.equal(loadPreferences().reading, "paragraph");
  });
  it("defaults new players to automatic voices while preserving legacy and current mute choices", () => {
    const values = new Map<string, string>();
    installWindow({ localStorage: { getItem(key: string) { return values.get(key) ?? null; } } });
    assert.equal(loadPreferences().sound, true); assert.equal(loadPreferences().autoVoices, true);
    values.set("saint-shard-sound", "off"); assert.equal(loadPreferences().sound, false);
    values.set("saint-shard-sound", "on"); assert.equal(loadPreferences().sound, true);
    values.set("saint-shard-preferences", JSON.stringify({ sound: false, voices: 0, autoVoices: false }));
    const muted = loadPreferences(); assert.equal(muted.sound, false); assert.equal(muted.voices, 0); assert.equal(muted.autoVoices, false);
    assert.equal(parsePreferences('{"autoVoices":"false"}').autoVoices, true);
  });
  it("recovers a corrupted autosave from the last valid backup and clears both", () => {
    const values = new Map<string, string>();
    installWindow({ localStorage: {
      getItem(key: string) { return values.get(key) ?? null; },
      setItem(key: string, value: string) { values.set(key, value); },
      removeItem(key: string) { values.delete(key); },
    } });
    assert.equal(writeSave(state), true);
    assert.equal(writeSave({ ...state, sceneId: "pay" }), true);
    assert.deepEqual(loadBackup(), state);
    values.set("saint-shard-3055-v1", "{");
    assert.equal(usedBackup(), true); assert.deepEqual(loadSave(), state);
    assert.equal(clearSave(), true); assert.equal(loadSave(), null); assert.equal(loadBackup(), null);
  });
  it("works without a browser window", () => {
    Reflect.deleteProperty(globalThis, "window");
    assertDefaultsAndFailedWrites();
  });

  it("handles a blocked localStorage getter", () => {
    installWindow({ get localStorage() { throw new DOMException("Blocked", "SecurityError"); } });
    assertDefaultsAndFailedWrites();
  });

  it("handles failures from every storage operation", () => {
    installWindow({ localStorage: {
      getItem() { throw new DOMException("Blocked", "SecurityError"); },
      setItem() { throw new DOMException("Full", "QuotaExceededError"); },
      removeItem() { throw new DOMException("Blocked", "SecurityError"); },
    } });
    assertDefaultsAndFailedWrites();
  });

  it("can still read an existing save when the storage quota is full", () => {
    installWindow({ localStorage: {
      getItem(key: string) { return key === "saint-shard-3055-v1" ? JSON.stringify(state) : null; },
      setItem() { throw new DOMException("Full", "QuotaExceededError"); },
    } });
    assert.deepEqual(loadSave(), state);
    assert.equal(writeSave({ ...state, creds: state.creds + 1 }), false);
    assert.deepEqual(loadSave(), state);
  });

  it("persists and clears saves and preferences when storage is available", () => {
    const values = new Map<string, string>();
    installWindow({ localStorage: {
      getItem(key: string) { return values.get(key) ?? null; },
      setItem(key: string, value: string) { values.set(key, value); },
      removeItem(key: string) { values.delete(key); },
    } });
    assert.equal(writeSave(state), true);
    assert.deepEqual(loadSave(), state);
    assert.equal(writeSound(true), true);
    assert.equal(loadSound(), true);
    assert.equal(writeTextStep(2), true);
    assert.equal(loadTextStep(), 2);
    assert.equal(rememberEnding("ending_names", "Names"), true);
    assert.deepEqual(loadCodex().seen, [{ id: "ending_names", title: "Names" }]);
    assert.equal(clearSave(), true);
    assert.equal(loadSave(), null);
  });
});
