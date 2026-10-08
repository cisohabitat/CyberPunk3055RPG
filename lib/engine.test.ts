import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORIGINS, type OriginId } from "./character.ts";
import { PAY } from "./economy.ts";
import {
  commitChoice,
  createCharacter,
  getScene,
  presentChoices,
  previewCheck,
  sceneText,
} from "./engine.ts";
import { ITEMS } from "./items.ts";
import { parseSave } from "./storage.ts";
import { SCENES, vaultNext } from "./story.ts";
import type { Choice, GameState, StatId } from "./types.ts";

function bonusFor(origin: OriginId, seed: number): Record<StatId, number> {
  const bonus: Record<StatId, number> = { chrome: 0, nerve: 0, face: 0, ghost: 0 };
  const order: StatId[] = ["chrome", "nerve", "face", "ghost"];
  let left = 2;
  let cursor = seed;
  while (left > 0) {
    const stat = order[cursor % 4];
    cursor += 1;
    if (ORIGINS[origin].stats[stat] + bonus[stat] < 5) {
      bonus[stat] += 1;
      left -= 1;
    }
  }
  return bonus;
}

function make(origin: OriginId, points: Record<StatId, number>, handle = "Rex"): GameState {
  return createCharacter({ handle, givenName: "Ada", origin, bonus: points });
}

function step(state: GameState, id: string, roll?: number): GameState {
  const scene = getScene(state.sceneId);
  const choice = presentChoices(state, scene).find((option) => option.id === id);
  assert.ok(choice, `${state.sceneId} has no visible choice ${id}`);
  assert.equal(choice.enabled, true, `${state.sceneId}:${id} disabled (${choice.disabledReason ?? ""})`);
  const next = commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
  assert.ok(SCENES[next.sceneId], next.sceneId);
  assert.ok(next.strain >= 0 && next.strain <= 5);
  assert.ok(next.creds >= 0);
  for (const item of next.items) assert.ok(ITEMS[item], item);
  assert.ok(sceneText(getScene(next.sceneId), next).length > 20);
  return next;
}

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("story graph", () => {
  it("points every choice at a real scene", () => {
    const base = make("gutterwire", bonusFor("gutterwire", 1));
    const samples: GameState[] = [
      base,
      { ...base, strain: 0, flags: { quiet: true }, items: [] },
      {
        ...base,
        strain: 5,
        flags: {
          quiet: true,
          lumen_here: true,
          copied: true,
          slow: true,
          alert: true,
          watched: true,
          noisy: true,
        },
        items: ["shard", "sedative", "spoof-chip"],
      },
      { ...base, strain: 4, flags: {}, items: ["shard"] },
    ];

    for (const [key, scene] of Object.entries(SCENES)) {
      assert.equal(scene.id, key);
      const ids = new Set(scene.choices.map((choice) => choice.id));
      assert.equal(ids.size, scene.choices.length, `${key} has duplicate choice ids`);
      if (scene.ending) assert.equal(scene.choices.length, 0);
      else assert.ok(scene.choices.length > 0, key);

      for (const choice of scene.choices) {
        if (choice.check) {
          assert.ok(choice.nextSuccess, choice.id);
          assert.ok(choice.nextFail, choice.id);
          assert.ok(choice.check.dc >= 6 && choice.check.dc <= 10);
        } else {
          assert.ok(choice.next, choice.id);
        }
        for (const sample of samples) {
          for (const spec of [choice.next, choice.nextSuccess, choice.nextFail]) {
            if (!spec) continue;
            const id = typeof spec === "function" ? spec(sample) : spec;
            assert.ok(SCENES[id], `${choice.id} -> ${id}`);
          }
        }
        const specs = [choice.effects, choice.successEffects, choice.failEffects];
        for (const spec of specs) {
          const effect = typeof spec === "function" ? spec(samples[2]) : spec;
          for (const item of [...(effect?.itemsAdd ?? []), ...(effect?.itemsRemove ?? [])]) {
            assert.ok(ITEMS[item], `${choice.id} item ${item}`);
          }
        }
        for (const bonus of choice.check?.itemBonuses ?? []) assert.ok(ITEMS[bonus.item], bonus.item);
        for (const item of choice.consumeItems ?? []) assert.ok(ITEMS[item], item);
        if (choice.requireItem) assert.ok(ITEMS[choice.requireItem]);
      }
    }
  });

  it("keeps a quiet chapel quiet until you waste the minute", () => {
    const quiet = make("spire", { chrome: 0, nerve: 0, face: 2, ghost: 0 });
    quiet.flags = { quiet: true };
    assert.equal(vaultNext(quiet), "vault_quiet");
    quiet.flags.noisy = true;
    assert.equal(vaultNext(quiet), "kerr");
    const loud = make("dustline", { chrome: 0, nerve: 0, face: 0, ghost: 2 });
    assert.equal(vaultNext(loud), "kerr");
  });
});

describe("economy and dice", () => {
  it("locks the penitent pass behind the creds you actually have", () => {
    let poor = make("dustline", { chrome: 0, nerve: 0, face: 2, ghost: 0 }, "Lowtide");
    poor = step(poor, "accept");
    assert.equal(poor.creds, ORIGINS.dustline.creds + PAY.base);
    const blocked = presentChoices(poor, getScene(poor.sceneId)).find((choice) => choice.id === "pass");
    assert.equal(blocked?.enabled, false);

    let rich = make("dustline", { chrome: 0, nerve: 0, face: 2, ghost: 0 });
    rich = step(rich, "ask-pay");
    rich = step(rich, "haggle", 10);
    assert.equal(rich.sceneId, "pay_yes");
    rich = step(rich, "pocket");
    rich = step(rich, "accept");
    assert.equal(rich.creds, ORIGINS.dustline.creds + PAY.haggled);
    const open = presentChoices(rich, getScene(rich.sceneId)).find((choice) => choice.id === "pass");
    assert.equal(open?.enabled, true);
  });

  it("adds the origin perk and carried gear to the roll", () => {
    const state = make("spire", { chrome: 2, nerve: 0, face: 0, ghost: 0 });
    state.items = ["spoof-chip"];
    const check = SCENES.vault_quiet.choices.find((choice) => choice.id === "copy")?.check;
    assert.ok(check);
    const preview = previewCheck(state, check);
    assert.deepEqual(
      preview.parts.map((part) => part.label),
      ["Chrome", "Old Clearance", "Spoof Chip"],
    );
    assert.equal(preview.bonus, 3 + 2 + 1 + 1);
  });

  it("eases strain on a ten and bites on a one", () => {
    const state = make("gutterwire", { chrome: 0, nerve: 0, face: 2, ghost: 0 });
    const hatch = getScene("hatch").choices[0];
    const inHatch = { ...state, sceneId: "hatch" };
    const eased = commitChoice({ ...inHatch, strain: 2 }, hatch, { roll: 10 });
    assert.equal(eased.check?.crit, "success");
    assert.equal(eased.state.strain, 1);
    assert.equal(eased.state.sceneId, "undercroft");

    const bitten = commitChoice(inHatch, hatch, { roll: 1 });
    assert.equal(bitten.check?.success, false);
    assert.equal(bitten.check?.crit, "fail");
    assert.equal(bitten.state.strain, 1);
    assert.equal(bitten.state.sceneId, "hatch_caught");
  });

  it("rejects a choice from the wrong room", () => {
    const state = make("spire", { chrome: 2, nerve: 0, face: 0, ghost: 0 });
    const haggle = getScene("pay").choices[0];
    assert.throws(() => commitChoice(state, haggle, { roll: 10 }));
  });
});

describe("scripted jobs", () => {
  const face: Record<StatId, number> = { chrome: 0, nerve: 0, face: 2, ghost: 0 };

  function toChapel(state: GameState): GameState {
    let next = step(state, "ask-pay");
    next = step(next, "haggle", 10);
    next = step(next, "pocket");
    next = step(next, "accept");
    next = step(next, "side");
    return step(next, "spoof-door", 6);
  }

  it("can sell the truth and keep a copy loose", () => {
    let state = toChapel(make("spire", face));
    assert.equal(state.flags.quiet, true);
    assert.ok(state.items.includes("spoof-chip"));
    state = step(state, "slate", 5);
    state = step(state, "honest");
    state = step(state, "pact-copy");
    assert.equal(state.sceneId, "vault_quiet");
    const copy = presentChoices(state, getScene(state.sceneId)).find((choice) => choice.id === "copy");
    assert.ok(copy?.check);
    assert.ok(previewCheck(state, copy.check).hits >= 7);
    state = step(state, "copy", 7);
    state = step(state, "talk-leave", 5);
    state = step(state, "both");
    assert.equal(state.sceneId, "ending_both");
    assert.equal(getScene(state.sceneId).endingTitle, "Two Fires");
    assert.equal(state.creds, ORIGINS.spire.creds + PAY.haggled + PAY.delivery);
    assert.equal(state.items.includes("shard"), false);
    assert.match(sceneText(getScene(state.sceneId), state), /Ward Nine/);
  });

  it("breaks the shard with Lumen and keeps her marker", () => {
    let state = toChapel(make("spire", face));
    state = step(state, "go");
    state = step(state, "honest");
    state = step(state, "pact-break");
    state = step(state, "take");
    state = step(state, "talk-leave", 6);
    state = step(state, "destroy");
    assert.equal(state.sceneId, "ending_burned");
    assert.ok(state.items.includes("clinic-marker"));
    assert.equal(state.creds, ORIGINS.spire.creds + PAY.haggled);
  });

  it("saints a runner who keeps missing", () => {
    let state = make("gutterwire", face, "Cinder");
    state = step(state, "accept");
    state = step(state, "hatch");
    state = step(state, "slip-hatch", 2);
    assert.equal(state.sceneId, "hatch_caught");
    state = step(state, "drop-tech", 1);
    assert.equal(state.strain, 3);
    assert.equal(state.flags.alert, true);
    state = step(state, "go");
    state = step(state, "brush");
    state = step(state, "go-chair");
    assert.equal(state.sceneId, "kerr");
    state = step(state, "fight", 2);
    assert.equal(state.sceneId, "ending_sainted");
    assert.equal(state.strain, 5);
    assert.equal(state.items.includes("shard"), false);
    assert.match(sceneText(getScene(state.sceneId), state), /Ada|Cinder/);
  });

  it("pays half for a ruined hour", () => {
    let state = make("spire", face);
    state = step(state, "accept");
    state = step(state, "side");
    state = step(state, "spoof-door", 8);
    state = step(state, "go");
    state = step(state, "brush");
    state = step(state, "go-chair");
    assert.equal(state.sceneId, "vault_quiet");
    state = step(state, "fry", 8);
    assert.equal(state.flags.ash, true);
    state = step(state, "talk-leave", 8);
    state = step(state, "deliver-ash");
    assert.equal(state.sceneId, "ending_ash");
    assert.equal(state.creds, ORIGINS.spire.creds + PAY.base + PAY.ash);
    assert.equal(state.items.includes("shard"), false);
  });
});

describe("random runners", () => {
  it("always finishes a job", () => {
    const endings = new Set<string>();
    for (const origin of ["gutterwire", "spire", "dustline"] as OriginId[]) {
      for (let seed = 1; seed <= 24; seed += 1) {
        const rng = mulberry32(seed * 17 + origin.length);
        let state = make(origin, bonusFor(origin, seed), "Nova");
        let stalls = 0;
        const path: string[] = [];
        let finished = false;
        for (let guard = 0; guard < 48; guard += 1) {
          const scene = getScene(state.sceneId);
          if (scene.ending) {
            endings.add(scene.id);
            finished = true;
            break;
          }
          let options = presentChoices(state, scene).filter((choice) => choice.enabled);
          if (state.sceneId === "stall") {
            stalls += 1;
            if (stalls > 2) options = options.filter((choice) => choice.id === "accept");
          }
          assert.ok(options.length > 0, `softlock at ${state.sceneId} after ${path.join(" > ")}`);
          const choice = options[Math.floor(rng() * options.length)] as Choice;
          path.push(`${state.sceneId}:${choice.id}`);
          const roll = choice.check ? 1 + Math.floor(rng() * 10) : undefined;
          state = commitChoice(state, choice, roll === undefined ? undefined : { roll }).state;
        }
        assert.equal(finished, true, `loop ${path.join(" > ")}`);
      }
    }
    assert.ok(endings.size >= 3, `only saw ${[...endings].join(", ")}`);
  });
});

describe("saves", () => {
  it("rejects junk and accepts a real run", () => {
    assert.equal(parseSave(null), null);
    assert.equal(parseSave("{"), null);
    assert.equal(parseSave(JSON.stringify({ version: 2 })), null);
    const state = make("gutterwire", { chrome: 0, nerve: 0, face: 0, ghost: 2 });
    assert.deepEqual(parseSave(JSON.stringify(state))?.handle, "Rex");
  });
});
