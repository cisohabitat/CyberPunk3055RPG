import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORIGINS, type OriginId } from "./character.ts";
import { PAY } from "./economy.ts";
import {
  checkResourceCosts,
  commitChoice,
  createCharacter,
  effectPreview,
  getScene,
  presentChoices,
  previewCheck,
  runDelta,
  sceneText,
} from "./engine.ts";
import { aftermath } from "./evidence";
import { testimonyPacket } from "./testimony";
import { FIELD_KITS } from "./loadout";
import { ITEMS } from "./items.ts";
import { parseSave } from "./storage.ts";
import { journalTitle } from "./journal.ts";
import { metCast, speakerRole } from "./story/cast.ts";
import { GOAL_ARRIVE, GOAL_DECIDE, GOAL_LIFT, GOAL_WALL, GOAL_WEEK, actName, currentGoal } from "./story/goal.ts";
import { CODEX, SCENES, endingCoda, vaultNext } from "./story/index.ts";
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
      if (scene.finale) {
        assert.equal(scene.choices.length, 0, key);
        assert.ok(endingCoda(scene.id).length > 10, scene.id);
      } else if (scene.ending) {
        assert.ok(scene.choices.length > 0, key);
        assert.ok(endingCoda(scene.id).length > 10, scene.id);
      } else assert.ok(scene.choices.length > 0, key);

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

  it("names what a roll changed", () => {
    const state = make("gutterwire", { chrome: 0, nerve: 0, face: 2, ghost: 0 });
    const caught = commitChoice({ ...state, sceneId: "hatch" }, getScene("hatch").choices[0], { roll: 1 });
    assert.deepEqual(runDelta(state, caught.state), ["Strain +1"]);
    const quiet = commitChoice({ ...state, sceneId: "hatch" }, getScene("hatch").choices[0], { roll: 10 });
    assert.deepEqual(runDelta({ ...state, sceneId: "hatch" }, quiet.state), ["Gained Layout Scrap"]);
  });

  it("lets you leave a door and reuse a pass you already bought", () => {
    let state = make("spire", { chrome: 0, nerve: 0, face: 2, ghost: 0 });
    state = step(state, "accept");
    const before = state.creds;
    state = step(state, "pass");
    assert.equal(state.sceneId, "front");
    assert.equal(state.creds, before - PAY.pass);
    state = step(state, "retreat");
    assert.equal(state.sceneId, "route");
    assert.equal(state.creds, before - PAY.pass);
    const options = presentChoices(state, getScene("route"));
    assert.equal(options.some((choice) => choice.id === "pass"), false);
    assert.equal(options.find((choice) => choice.id === "use-pass")?.enabled, true);
    state = step(state, "use-pass");
    assert.equal(state.sceneId, "front");
    assert.equal(state.creds, before - PAY.pass);
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
    assert.equal(state.sceneId, "memo");
    state = step(state, "heard");
    state = step(state, "why-signed");
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
    assert.equal(state.sceneId, "memo");
    state = step(state, "heard");
    state = step(state, "why-signed");
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
    assert.equal(state.sceneId, "memo");
    state = step(state, "heard");
    state = step(state, "why-signed");
    state = step(state, "talk-leave", 8);
    state = step(state, "deliver-ash");
    assert.equal(state.sceneId, "ending_ash");
    assert.equal(state.creds, ORIGINS.spire.creds + PAY.base + PAY.ash);
    assert.equal(state.items.includes("shard"), false);
  });
});

describe("the week after", () => {
  const face: Record<StatId, number> = { chrome: 0, nerve: 0, face: 2, ghost: 0 };

  function toBoard(state: GameState) {
    const card = step(state, "week-after");
    assert.equal(card.sceneId, "card_week");
    const street = step(card, "into-week");
    assert.equal(street.sceneId, "street_after");
    return step(street, "read-board");
  }

  it("opens Act 2 from three different Act 1 endings", () => {
    const base = make("spire", face);
    const sold = toBoard({ ...base, sceneId: "ending_sold" });
    assert.equal(sold.sceneId, "districts");
    assert.equal(sold.flags.act1_sold, true);
    assert.equal(step(sold, "to-helion").sceneId, "act2_helion_door");
    assert.equal(step(step(sold, "to-helion"), "hear-ives").sceneId, "act2_helion");

    const burned = toBoard({ ...base, sceneId: "ending_burned" });
    assert.equal(step(step(burned, "to-lumen"), "hear-lumen").sceneId, "act2_lumen");

    const sainted = toBoard({ ...base, sceneId: "ending_sainted" });
    assert.equal(step(step(sainted, "to-kerr"), "hear-kerr").sceneId, "act2_kerr");
    const board = presentChoices(sainted, getScene("districts"));
    assert.equal(board.some((choice) => choice.id === "to-helion"), false);
    assert.equal(board.some((choice) => choice.id === "to-lumen"), false);
  });

  it("reaches Ward Nine and can contradict the sale", () => {
    let state = make("gutterwire", face);
    state = {
      ...state,
      sceneId: "ending_sold",
      journal: [{ id: "ward-nine", text: "Mara Voss signed the Ward Nine coolant dump." }],
    };
    state = toBoard(state);
    state = step(state, "to-helion");
    state = step(state, "hear-ives");
    state = step(state, "refuse-ives");
    assert.equal(state.sceneId, "act2_middle");
    state = step(state, "deal");
    assert.equal(state.sceneId, "ending_week_deal");
    assert.ok(state.chapters.includes("The Sale"));
    state = step(state, "back-to-board");
    assert.equal(state.sceneId, "card_wall");
    state = step(state, "to-the-wall");
    assert.equal(presentChoices(state, getScene("districts")).some((choice) => choice.id === "to-kerr"), false);
    state = step(state, "to-ward-nine");
    assert.equal(state.sceneId, "ward_wall");
    assert.match(sceneText(getScene(state.sceneId), state), /Ivo Pell/);
    state = step(state, "face-sera");
    assert.equal(state.sceneId, "act3_arrival");
    state = step(state, "read-names");
    assert.equal(state.sceneId, "ending_names");
    assert.equal(getScene(state.sceneId).finale, true);
    assert.ok(state.chapters.includes("The Quiet Contract"));
    assert.match(sceneText(getScene(state.sceneId), state), /sold the hour/);
    assert.ok(endingCoda("ending_names").length > 10);
  });

  it("hides a clue the journal does not carry", () => {
    const state = make("dustline", { chrome: 0, nerve: 0, face: 0, ghost: 2 });
    const options = presentChoices({ ...state, sceneId: "act3_arrival" }, getScene("act3_arrival"));
    assert.equal(options.some((choice) => choice.id === "read-names"), false);
    assert.equal(options.some((choice) => choice.id === "leave-wall"), true);
  });

  it("lets faction standing and a live optic change the math", () => {
    const state = make("spire", face);
    const check = SCENES.act2_helion.choices.find((choice) => choice.id === "convince-ives")?.check;
    assert.ok(check);
    const preview = previewCheck(state, check);
    assert.ok(preview.parts.some((part) => part.label === "Helion already has your name"));

    const optic = createCharacter({
      handle: "Rex",
      givenName: "Ada",
      origin: "spire",
      bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 },
      complication: "optic",
    });
    assert.equal(optic.strain, 1);
    assert.equal(optic.factions.lumen, 1);
    const copy = SCENES.vault_quiet.choices.find((choice) => choice.id === "copy")?.check;
    assert.ok(copy);
    assert.ok(previewCheck(optic, copy).parts.some((part) => part.label === "Live optic"));

    const debt = createCharacter({
      handle: "Rex",
      givenName: "Ada",
      origin: "dustline",
      bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 },
      complication: "debt",
    });
    assert.equal(debt.creds, 0);
    assert.equal(debt.factions.quill, 2);
  });

  it("sends a missed confession and an open folio to different rooms", () => {
    const base = make("gutterwire", face);
    const withClue = {
      ...base,
      sceneId: "act2_kerr",
      journal: [{ id: "ward-nine", text: "Mara Voss signed the Ward Nine coolant dump." }],
    };
    const told = step(withClue, "tell-kerr", 10);
    assert.equal(told.sceneId, "act2_middle");
    assert.equal(told.flags.kerr_told, true);
    const sold = step(withClue, "tell-kerr", 1);
    assert.equal(sold.sceneId, "act2_heat");
    assert.notEqual(told.sceneId, sold.sceneId);

    const helion = { ...base, sceneId: "act2_helion" };
    assert.equal(step(helion, "convince-ives", 10).sceneId, "act2_middle");
    assert.equal(step(helion, "convince-ives", 1).sceneId, "act2_folio");
  });

  it("hides Quill's tab unless the debt complication was chosen", () => {
    const clean = make("spire", face);
    assert.equal(
      presentChoices({ ...clean, sceneId: "act2_middle" }, getScene("act2_middle")).some((choice) => choice.id === "pay-tab"),
      false,
    );
    const owing = createCharacter({
      handle: "Rex",
      givenName: "Ada",
      origin: "dustline",
      bonus: { chrome: 0, nerve: 0, face: 2, ghost: 0 },
      complication: "debt",
    });
    const options = presentChoices({ ...owing, sceneId: "act2_middle", creds: 40 }, getScene("act2_middle"));
    assert.equal(options.find((choice) => choice.id === "pay-tab")?.enabled, true);
    const paid = step({ ...owing, sceneId: "act2_middle", creds: 40 }, "pay-tab");
    assert.equal(paid.flags.quill_collected, true);
    assert.equal(paid.creds, 0);
  });

  it("lets a live optic read Ward Nine without the chapel clue", () => {
    const optic = createCharacter({
      handle: "Rex",
      givenName: "Ada",
      origin: "spire",
      bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 },
      complication: "optic",
    });
    const wall = { ...optic, sceneId: "act3_arrival" };
    assert.equal(presentChoices(wall, getScene("act3_arrival")).some((choice) => choice.id === "read-wall"), true);
    const read = step(wall, "read-wall", 10);
    assert.equal(read.sceneId, "ending_names");
    assert.equal(read.journal.some((entry) => entry.id === "ward-nine"), true);
    assert.match(sceneText(getScene(read.sceneId), read), /optic/);
  });

  it("marks the Helion deal as a betrayal after walking with Lumen", () => {
    const state = make("spire", face);
    const dealt = step({ ...state, sceneId: "act2_middle", flags: { ...state.flags, walk_nine: true } }, "deal");
    assert.equal(dealt.sceneId, "ending_week_deal");
    assert.equal(dealt.flags.betrayed_lumen, true);
  });

  it("adds the knee note to Kerr's check", () => {
    const state = make("gutterwire", face);
    state.journal = [{ id: "kerr-knee", text: "The knee is bad." }];
    const check = SCENES.act2_kerr.choices.find((choice) => choice.id === "tell-kerr")?.check;
    assert.ok(check);
    assert.ok(previewCheck(state, check).parts.some((part) => part.label === "You know the knee"));
  });

  it("mentions a carried keepsake at the stall", () => {
    const state = createCharacter({
      handle: "Rex",
      givenName: "Ada",
      origin: "gutterwire",
      bonus: face,
      keepsake: "clinic-marker",
    });
    assert.match(sceneText(getScene("stall"), state), /Clinic Marker/);
  });

  it("keeps a different goal for the job, the truth, the week, and the wall", () => {
    const state = make("gutterwire", face);
    assert.equal(currentGoal(state), GOAL_LIFT);
    assert.match(currentGoal(state), /Mara Voss/);
    assert.match(currentGoal(state), /Glass Chapel/);
    const known = { ...state, journal: [{ id: "ward-nine", text: "The memo." }] };
    assert.equal(currentGoal(known), GOAL_DECIDE);
    assert.equal(currentGoal({ ...state, sceneId: "districts" }), GOAL_WEEK);
    assert.equal(currentGoal({ ...state, sceneId: "ward_wall" }), GOAL_WALL);
    assert.notEqual(GOAL_WEEK, GOAL_WALL);
  });

  it("plays the memo when the shard is taken without Lumen's honesty", () => {
    let state = make("spire", face);
    state = step(state, "accept");
    state = step(state, "side");
    state = step(state, "spoof-door", 8);
    state = step(state, "go");
    state = step(state, "brush");
    state = step(state, "go-chair");
    assert.equal(state.journal.some((entry) => entry.id === "ward-nine"), false);
    state = step(state, "take");
    assert.equal(state.sceneId, "memo");
    assert.match(sceneText(getScene("memo"), state), /Three hundred/);
    state = step(state, "heard");
    assert.equal(state.sceneId, "mara_why");
    assert.match(sceneText(getScene("mara_why"), state), /I signed because/);
    state = step(state, "why-signed");
    assert.equal(state.journal.some((entry) => entry.id === "ward-nine"), true);
    assert.equal(journalTitle(state.journal.find((entry) => entry.id === "ward-nine")!), "Ward Nine");
    assert.equal(currentGoal(state), GOAL_DECIDE);
    assert.ok(metCast(state, "Kerr").some((person) => person.name === "Mara Voss" && person.role === "The patient"));
    assert.equal(speakerRole("Quill"), "The broker");
    assert.equal(speakerRole("Mara"), "The patient");
    assert.equal(speakerRole("Kerr"), "Her shadow");
  });

  it("lets a believed lie and a failed copy change a later sentence", () => {
    const base = make("gutterwire", face);
    const believed = sceneText(getScene("after_kerr"), { ...base, sceneId: "after_kerr", flags: { she_believes: true }, items: ["shard"] });
    assert.match(believed, /believed the reason/);
    const failed = sceneText(getScene("after_kerr"), { ...base, sceneId: "after_kerr", flags: { copy_failed: true }, items: ["shard"] });
    assert.match(failed, /copy collapsed/);
  });

  it("colors the street with origin and the wall with standing", () => {
    const base = make("gutterwire", face);
    const street = sceneText(getScene("street_after"), { ...base, sceneId: "street_after" });
    assert.match(street, /grew up counting/);
    assert.equal(actName({ ...base, sceneId: "street_after" }), "The Week");
    assert.equal(actName(base), "The Hour");
    const wall = sceneText(getScene("ward_wall"), {
      ...base,
      sceneId: "ward_wall",
      factions: { ...base.factions, wards: 2 },
    });
    assert.match(wall, /Ivo Pell/);
    assert.match(wall, /Nia Pell/);
    assert.match(wall, /Ada/);
  });

  it("previews a faction shift and keeps a choice log", () => {
    const state = { ...make("gutterwire", face), sceneId: "act2_kerr", creds: 80 };
    const pay = getScene("act2_kerr").choices.find((choice) => choice.id === "pay-kerr");
    assert.ok(pay);
    const preview = effectPreview(state, pay);
    assert.ok(preview.some((line) => /wards/i.test(line)));
    const next = step(make("gutterwire", face), "ask-pay");
    assert.ok(next.log.includes("Ask what the job pays."));
  });

  it("shows the week in the street before the board", () => {
    const burned = { ...make("gutterwire", face), flags: { act1_burned: true, kerr_down: true }, sceneId: "street_after" };
    const text = sceneText(getScene("street_after"), burned);
    assert.match(text, /stall is dark/);
    assert.match(text, /limp/);
    const card = sceneText(getScene("card_week"), { ...burned, flags: { ...burned.flags, act1_done: true }, sceneId: "card_week" });
    assert.match(card, /The Week/);
    assert.ok(card.includes(GOAL_WEEK));
  });

  it("gives every codex ending a scene and a coda", () => {
    for (const entry of CODEX) {
      assert.equal(SCENES[entry.id]?.endingTitle, entry.title);
      assert.ok(endingCoda(entry.id).length > 10, entry.id);
      assert.ok(endingCoda(entry.id).split(". ").length >= 2, entry.id);
    }
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
        let retreats = 0;
        const path: string[] = [];
        let finished = false;
        for (let guard = 0; guard < 96; guard += 1) {
          const scene = getScene(state.sceneId);
          if (scene.finale || (scene.ending && rng() < 0.55)) {
            endings.add(scene.id);
            finished = true;
            break;
          }
          let options = presentChoices(state, scene).filter((choice) => choice.enabled);
          if (state.sceneId === "stall") {
            stalls += 1;
            if (stalls > 2) options = options.filter((choice) => choice.id === "accept");
          }
          const forward = options.filter((choice) => choice.id !== "retreat");
          if (retreats >= 1 && forward.length > 0) options = forward;
          assert.ok(options.length > 0, `softlock at ${state.sceneId} after ${path.join(" > ")}`);
          const choice = options[Math.floor(rng() * options.length)] as Choice;
          if (choice.id === "retreat") retreats += 1;
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
    assert.equal(parseSave(JSON.stringify({ version: 9 })), null);
    assert.equal(parseSave(JSON.stringify({ version: 2 })), null);
    const legacy = {
      version: 1,
      handle: "Rex",
      givenName: "Ada",
      origin: "gutterwire",
      stats: { chrome: 1, nerve: 3, face: 4, ghost: 2 },
      creds: 10,
      strain: 0,
      items: [],
      flags: {},
      journal: ["Mara Voss signed the Ward Nine coolant dump. Three hundred people, one memo."],
      rolls: [],
      sceneId: "stall",
    };
    const migrated = parseSave(JSON.stringify(legacy));
    assert.equal(migrated?.version, 2);
    assert.equal(migrated?.journal[0]?.id, "ward-nine");
    assert.equal(migrated?.complication, null);
    assert.equal(migrated?.factions.wards, 1);
    assert.deepEqual(migrated?.chapters, []);
    assert.deepEqual(migrated?.log, []);
    const state = make("gutterwire", { chrome: 0, nerve: 0, face: 0, ghost: 2 });
    assert.deepEqual(parseSave(JSON.stringify(state))?.handle, "Rex");
  });
});

describe("staged archive source and custody", () => {
  const archiveRun = (): GameState => ({ ...make("spire", { chrome: 2, nerve: 0, face: 0, ghost: 0 }), sceneId: "act2_middle", flags: { memory_intact: true, memory_prepared: true } });
  it("plays preparation, corrects catalog certainty, authenticates and restores custody", () => {
    let state = step(archiveRun(), "trace-order");
    assert.equal(state.sceneId, "act2_archive_brief");
    state = step(state, "agree-archive-terms"); state = step(state, "index-archive", 10);
    state = step(state, "catalog-is-proof"); assert.equal(state.flags.order_verified, undefined);
    state = step(state, "revise-source-test");
    const choice = presentChoices(state, getScene(state.sceneId)).find((c) => c.id === "trace-receipt")!;
    assert.ok(previewCheck(state, choice.check!).parts.some((part) => part.label === "Index compared"));
    state = step(state, "trace-receipt", 10); assert.equal(state.sceneId, "act2_archive_custody");
    state = parseSave(JSON.stringify(state))!;
    assert.equal(state.flags.archive_key_authenticated, true);
    state = step(state, "withhold-technician"); state = step(state, "keep-chain");
    assert.equal(state.flags.archive_custody, true); assert.equal(state.flags.edda_exposed, undefined);
    assert.ok(metCast(state).some((person) => person.name === "Edda"));
  });
  it("keeps legacy archive retrieval direct and does not call an invoice key authentication", () => {
    let legacy = { ...archiveRun(), sceneId: "act2_archive_door", flags: { memory_intact: true } };
    const restored = parseSave(JSON.stringify({ ...legacy, pendingCheck: { sceneId: legacy.sceneId, choiceId: "trace-receipt", roll: 10 } }));
    assert.ok(restored); assert.equal(restored.pendingCheck?.roll, 10);
    assert.equal(step(restored, "trace-receipt", 10).sceneId, "act2_archive_verified");
    let state = step(archiveRun(), "trace-order"); state = step(state, "agree-archive-terms");
    state = step(state, "skip-archive-prep"); state = step(state, "separate-source-tests");
    state = { ...state, flags: { ...state.flags, perk_face: true } }; state = step(state, "request-invoice");
    assert.equal(state.flags.archive_key_authenticated, undefined);
    assert.match(sceneText(getScene(state.sceneId), state), /Do not describe a maintenance countersignature/);
    state = step(state, "withhold-technician"); state = { ...state, sceneId: "act3_edda_visit", creds: 100 };
    assert.match(sceneText(getScene(state.sceneId), state), /suspended pending a records review/);
    state = step(state, "bridge-edda-shift"); assert.equal(state.creds, 60);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((c) => c.id === "visit-edda"), false);
  });
  it("recovers a failed probe through a paid ledger and preserves attribution exposure", () => {
    let state = step(archiveRun(), "trace-order"); state = step(state, "agree-archive-terms");
    state = step(state, "watch-archive", 1); state = step(state, "separate-source-tests");
    state = step(state, "trace-receipt", 1); assert.equal(state.sceneId, "act2_archive_gap");
    state = { ...state, creds: 100 }; state = step(state, "buy-ledger");
    assert.equal(state.sceneId, "act2_archive_custody"); assert.equal(state.flags.archive_key_authenticated, undefined);
    state = step(state, "ask-named-source"); assert.equal(state.flags.edda_public_consent, true);
    assert.equal(state.flags.edda_exposed, true);
  });
});


describe("public hearing source scope and witness permission", () => {
  const hearing = (flags: Record<string, boolean> = {}): GameState => ({ ...make("spire", { chrome: 2, nerve: 0, face: 0, ghost: 0 }), sceneId: "act3_arrival", flags: { memory_prepared: true, ...flags } });
  const begin = (state: GameState, scope: string) => step(step(state, "prepare-public-account"), scope);
  it("files an authenticated source without a private witness and keeps original endings", () => {
    let state = begin(hearing({ order_verified: true, archive_key_authenticated: true }), "scope-corroborated");
    assert.throws(() => step(state, "ask-public-permission"));
    state = step(state, "keep-recording-private"); state = step(state, "answer-authenticated-key");
    state = parseSave(JSON.stringify(state))!; state = step(state, "file-public-account");
    assert.equal(state.sceneId, "act3_arrival"); assert.equal(state.flags.testimony_published, true);
    assert.equal(state.flags.nia_public_consent, undefined);
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((c) => c.id === "prepare-public-account"), false);
    assert.equal(step(state, "leave-wall").sceneId, "ending_quiet");
    assert.match(aftermath(state).find((row) => row.title === "Ward Nine")!.text, /public account/);
  });
  it("corrects an unsupported key claim without turning corroboration into authentication", () => {
    let state = begin(hearing({ order_verified: true, memory_corrected: true }), "scope-corroborated");
    state = step(state, "keep-recording-private"); assert.throws(() => step(state, "answer-authenticated-key"));
    const standing = state.factions.wards; state = step(state, "claim-key-anyway");
    assert.equal(state.factions.wards, standing - 1); state = step(state, "correct-hearing");
    state = step(state, "file-public-account"); assert.equal(state.flags.archive_key_authenticated, undefined);
    assert.match(state.journal.find((entry) => entry.id === "wall-account")!.text, /correction remains attached/);
    assert.match(aftermath(state).find((row) => row.title === "The public packet")!.text, /obtained later/);
  });
  it("requires a safe approved recording and explicit public permission, preserved across reload", () => {
    let state = hearing({ order_verified: true, witness_safe: true, witness_consent: true });
    state.journal.push({ id: "nia-account", text: "Nia approved a private recording.", kind: "fact" });
    state = begin(state, "scope-corroborated"); state = step(state, "ask-public-permission");
    assert.equal(state.flags.nia_public_consent, undefined); state = step(state, "accept-public-permission");
    state = parseSave(JSON.stringify(state))!; state = step(state, "answer-corroboration");
    state = step(state, "file-public-account");
    assert.match(state.journal.find((entry) => entry.id === "wall-account")!.text, /Nia authorized quotation/);
    assert.match(testimonyPacket(state)[2].text, /address stays out/);
  });
  it("preserves refusal after a location breach, even following relocation", () => {
    let state = hearing({ order_verified: true, witness_lost: true, witness_relocated: true, witness_consent: true });
    state.journal.push({ id: "nia-account", text: "The clinic holds Nia’s account.", kind: "fact" });
    state = begin(state, "scope-corroborated"); assert.throws(() => step(state, "ask-public-permission"));
    assert.match(testimonyPacket(state)[2].text, /including after relocation/);
    state = step(state, "keep-recording-private"); state = step(state, "answer-corroboration"); state = step(state, "file-public-account");
    assert.equal(state.flags.nia_public_consent, undefined); assert.equal(state.flags.witness_lost, true);
  });
  it("can withdraw an authorized draft without publishing the recording or authenticating a key", () => {
    let state = hearing({ order_verified: true, witness_safe: true, witness_consent: true });
    state.journal.push({ id: "nia-account", text: "Nia approved a recording.", kind: "fact" });
    state = begin(state, "scope-corroborated"); state = step(state, "ask-public-permission");
    state = step(state, "accept-public-permission"); state = step(state, "answer-corroboration");
    state = step(state, "withdraw-public-account");
    assert.equal(state.flags.nia_public_consent, true); assert.equal(state.flags.testimony_published, undefined);
    assert.equal(state.flags.archive_key_authenticated, undefined);
    assert.match(aftermath(state).find((row) => row.title === "The public hearing")!.text, /not opened/);
  });
});


describe("field equipment and bounded recovery", () => {
  const support = (sceneId: string): GameState => ({ ...make("spire", { chrome: 2, nerve: 0, face: 0, ghost: 0 }), sceneId, creds: 300, strain: 4 });
  it("offers four distinct kits, charges once, and preserves their provenance across saves", () => {
    for (const kit of FIELD_KITS) {
      const before = support("act2_workshop"); let state = step(before, `buy-${kit.id}`);
      assert.deepEqual(state.stats, before.stats); assert.equal(state.creds, before.creds - kit.price);
      state = parseSave(JSON.stringify(state))!; assert.ok(state.items.includes(kit.id));
      assert.match(state.journal.find((entry) => entry.id === "field-kit")!.text, new RegExp(kit.name));
      assert.equal(presentChoices(state, getScene(state.sceneId)).some((c) => c.id === "visit-workshop"), false);
      assert.throws(() => step({ ...state, sceneId: "act2_workshop" }, `buy-${kit.id}`));
    }
  });
  it("blocks unaffordable purchases and leaves a poor witness runner a route forward", () => {
    let state = { ...support("act2_workshop"), creds: 150 };
    state = step(state, "buy-archive-probe"); assert.equal(state.creds, 10);
    state = { ...state, sceneId: "act2_witness_door" };
    assert.equal(presentChoices(state, getScene(state.sceneId)).find((c) => c.id === "pay-room")!.enabled, false);
    assert.equal(presentChoices(state, getScene(state.sceneId)).find((c) => c.id === "slip-witness")!.enabled, true);
    assert.equal(step(state, "leave-witness").sceneId, "act2_middle");
    assert.throws(() => step({ ...support("act2_workshop"), creds: 99 }, "buy-desk-guide"));
  });
  it("applies each kit only to its authored mission checks and retains legacy die outcomes", () => {
    for (const [item,scene,id] of [["archive-probe","act2_archive_door","trace-receipt"],["chair-harness","act2_witness_plan","steady-chair"],["desk-guide","act2_witness_checkpoint","argue-transfer"],["route-shroud","act2_witness_door","slip-witness"]]) {
      const state = support(scene); const choice = getScene(scene).choices.find((c) => c.id === id)!;
      const equipped = { ...state, items: [...state.items, item] };
      assert.equal(previewCheck(equipped, choice.check!).bonus, previewCheck(state, choice.check!).bonus + 2);
      const unrelated = getScene("pay").choices.find((c) => c.id === "haggle")!;
      assert.deepEqual(previewCheck(equipped, unrelated.check!), previewCheck(state, unrelated.check!));
    }
    const legacy = { ...support("act2_archive_door"), pendingCheck: { sceneId: "act2_archive_door", choiceId: "trace-receipt", roll: 1 } };
    const restored = parseSave(JSON.stringify(legacy))!;
    assert.equal(step(restored, "trace-receipt", 1).sceneId, "act2_archive_gap");
  });
  it("charges paid care once, shows actual bounded relief, and preserves exposure", () => {
    let state = { ...support("act2_recovery"), strain: 1, flags: { witness_lost: true } };
    const choice = getScene(state.sceneId).choices.find((c) => c.id === "pay-recovery")!;
    assert.ok(effectPreview(state, choice).includes("Strain -1"));
    state = step(state, "pay-recovery"); assert.equal(state.strain, 0); assert.equal(state.creds, 255);
    assert.equal(state.flags.witness_lost, true); assert.equal(state.flags.order_verified, undefined);
    state = parseSave(JSON.stringify(state))!; state = step(state, "return-after-recovery");
    assert.equal(presentChoices(state, getScene(state.sceneId)).some((c) => c.id === "take-recovery"), false);
    assert.throws(() => step({ ...state, sceneId: "act2_recovery", strain: 5 }, "pay-recovery"));
  });
  it("uses clinic trust as a real opportunity cost and keeps paid care after betrayal", () => {
    const before = { ...support("act2_recovery"), factions: { ...support("act2_recovery").factions, lumen: 2 } };
    const state = step(before, "favor-recovery"); assert.equal(state.factions.lumen, 1); assert.equal(state.strain, 2); assert.equal(state.creds, before.creds);
    const transfer = getScene("act2_witness_checkpoint").choices.find((c) => c.id === "argue-transfer")!.check!;
    assert.equal(previewCheck(before, transfer).bonus, previewCheck(state, transfer).bonus + 1);
    const betrayed = { ...before, flags: { betrayed_lumen: true } };
    assert.throws(() => step(betrayed, "favor-recovery")); assert.equal(step(betrayed, "pay-recovery").strain, 1);
  });
  it("allows free bounded relief without funds and rejects forged zero-strain care", () => {
    const before = { ...support("act2_recovery"), creds: 0 };
    const state = step(before, "short-recovery"); assert.equal(state.strain, 3); assert.equal(state.creds, 0);
    const rested = { ...before, strain: 0 }; const canonical = getScene(rested.sceneId).choices.find((c) => c.id === "short-recovery")!;
    assert.throws(() => commitChoice(rested, { ...canonical, requireStrain: undefined }));
    assert.equal(step(rested, "leave-recovery").sceneId, "act2_middle");
  });
});

describe("clinic coolant emergency", () => {
  const pump = (sceneId = "act2_middle"): GameState => ({ ...make("spire", { chrome: 0, nerve: 0, face: 2, ghost: 0 }), sceneId, creds: 100, strain: 0, flags: { memory_prepared: true } });
  it("offers four distinct single attempts and keeps field-kit bonuses out of maintenance", () => {
    for (const id of ["isolate-pump", "dispatch-pump", "route-pump", "brace-pump"]) {
      let state = step(step(pump(), "help-clinic-pump"), "work-pump");
      const check = getScene(state.sceneId).choices.find((c) => c.id === id)!.check!;
      assert.deepEqual(previewCheck({ ...state, items: FIELD_KITS.map((kit) => kit.id) }, check), previewCheck(state, check));
      state = step(state, id, 9); assert.equal(state.flags.pump_restored, true);
      assert.throws(() => step({ ...state, sceneId: "act2_pump_methods" }, id, 9));
      state = step(state, "keep-pump-local");
      assert.equal(state.creds, 100); assert.equal(state.flags.order_verified, undefined);
      assert.throws(() => step({ ...state, sceneId: "act2_pump_report" }, "keep-pump-local"));
    }
  });
  it("uses earned Kerr help, refuses help after betrayal, and restores a pending die", () => {
    const brief = step({ ...pump(), flags: { memory_prepared: true, kerr_told: true } }, "help-clinic-pump");
    assert.throws(() => step({ ...brief, flags: { ...brief.flags, kerr_sold_you: true } }, "ask-kerr-pump"));
    const helped = step(brief, "ask-kerr-pump");
    const check = getScene(helped.sceneId).choices[0].check!;
    assert.equal(previewCheck(helped, check).bonus, previewCheck({ ...helped, flags: {} }, check).bonus + 1);
    const pending = parseSave(JSON.stringify({ ...helped, pendingCheck: { sceneId: helped.sceneId, choiceId: "isolate-pump", roll: 9 } }))!;
    assert.throws(() => step(pending, "isolate-pump", 1));
    const repaired = step(pending, "isolate-pump", 9);
    const filed = step(repaired, "file-pump-rebate"); assert.equal(filed.creds, 140);
    assert.equal(filed.flags.order_verified, undefined); assert.equal(filed.flags.witness_safe, undefined);
    const visit = { ...filed, sceneId: "act3_pump_visit" };
    assert.match(sceneText(getScene(visit.sceneId), visit), /kept a door open/);
    assert.match(aftermath(visit).find((row) => row.title === "The clinic coolant")!.text, /without patient names/);
  });
  it("fails into affordable care, physical fallback, or an explicitly unobserved outcome", () => {
    let failed = step(step(step(pump(), "help-clinic-pump"), "work-pump"), "route-pump", 1);
    assert.equal(failed.sceneId, "act2_pump_triage"); assert.equal(failed.strain, 2);
    failed = parseSave(JSON.stringify(failed))!;
    assert.throws(() => step({ ...failed, creds: 34 }, "fund-cold-transfer"));
    for (const id of ["fund-cold-transfer", "carry-cold-transfer", "leave-cold-transfer"]) {
      const state = step(failed, id); assert.equal(state.flags.pump_restored, undefined); assert.equal(state.flags.pump_done, true);
      assert.equal(state.flags.order_verified, undefined);
      assert.throws(() => step({ ...state, sceneId: "act2_pump_triage" }, id));
      assert.equal(presentChoices(state, getScene(state.sceneId)).some((c) => c.id === "help-clinic-pump"), false);
      if (id === "fund-cold-transfer") assert.equal(state.creds, 65);
      if (id === "carry-cold-transfer") assert.equal(state.strain, 4);
      if (id === "leave-cold-transfer") assert.match(aftermath(state).at(-1)!.text, /not observed/);
    }
  });
  it("retains legacy routes and permits leaving before committing an attempt", () => {
    assert.throws(() => step({ ...pump(), flags: {} }, "help-clinic-pump"));
    const state = step(step(pump(), "help-clinic-pump"), "leave-pump-brief");
    assert.equal(state.flags.pump_done, undefined); assert.equal(step(state, "help-clinic-pump").sceneId, "act2_pump_brief");
    const finished = { ...pump(), flags: { memory_prepared: true, pump_done: true }, sceneId: "act3_neighborhood" };
    const visited = step(step(finished, "visit-pump"), "leave-pump-visit");
    assert.equal(visited.sceneId, "act3_neighborhood"); assert.throws(() => step(visited, "visit-pump"));
  });
});

describe("Edda's private employment request", () => {
  const applicant = (sceneId = "act3_edda_visit"): GameState => ({ ...make("spire", { chrome: 2, nerve: 0, face: 0, ghost: 0 }), sceneId, creds: 150, strain: 0, flags: { archive_custody: true, edda_exposed: true, edda_name_withheld: true, order_verified: true } });
  it("requires a suspended source and separate private authorization", () => {
    assert.throws(() => step({ ...applicant(), flags: { archive_custody: true } }, "review-edda-shift"));
    const terms = step(applicant(), "review-edda-shift");
    const declined = step(terms, "decline-shift-request");
    assert.equal(declined.flags.edda_shift_consent, undefined); assert.equal(declined.flags.edda_shift_done, true);
    assert.throws(() => step(declined, "return-edda-payroll"));
    const signed = step(terms, "authorize-shift-request");
    assert.equal(signed.flags.edda_shift_consent, true); assert.equal(signed.flags.edda_public_consent, undefined);
    assert.equal(signed.flags.edda_name_withheld, true); assert.equal(signed.journal.at(-1)!.kind, "promise");
    assert.throws(() => step({ ...signed, flags: { archive_custody: true } }, "fund-worker-representative"));
  });
  it("allows an earlier paid bridge and a consented follow-up without refunding it", () => {
    const supported = step(applicant(), "bridge-edda-shift"); assert.equal(supported.creds, 110);
    const terms = step(parseSave(JSON.stringify(supported))!, "return-edda-payroll");
    const methods = step(terms, "authorize-shift-request");
    const represented = step(methods, "fund-worker-representative"); assert.equal(represented.creds, 50);
    const done = step(represented, "record-shift-response");
    assert.equal(done.flags.edda_supported, true); assert.equal(done.flags.edda_shift_paid, undefined);
    assert.match(done.journal.at(-1)!.text, /No shift has been restored/);
    assert.throws(() => step({ ...done, sceneId: "act3_edda_methods" }, "fund-worker-representative"));
  });
  it("limits the earned key-closure method to the successful Spire favor", () => {
    const methods = step(step(applicant(), "review-edda-shift"), "authorize-shift-request");
    assert.throws(() => step(methods, "submit-key-closure"));
    assert.throws(() => step({ ...methods, origin: "dustline", flags: { ...methods.flags, origin_helped: true } }, "submit-key-closure"));
    const reply = step({ ...methods, flags: { ...methods.flags, origin_helped: true } }, "submit-key-closure");
    const done = step(reply, "record-shift-response"); assert.equal(done.creds, methods.creds);
    assert.equal(done.flags.edda_shift_paid, true); assert.equal(done.flags.edda_exposed, true);
    assert.match(done.journal.at(-1)!.text, /archive access remains suspended/);
    assert.match(aftermath(done).find((row) => row.title === "Edda’s payroll request")!.text, /neither clears her name/);
  });
  it("restores a saved negotiation die and records paid work without changing evidence", () => {
    const methods = step(step(applicant(), "review-edda-shift"), "authorize-shift-request");
    const saved = parseSave(JSON.stringify({ ...methods, pendingCheck: { sceneId: methods.sceneId, choiceId: "negotiate-bench-shift", roll: 9 } }))!;
    assert.throws(() => step(saved, "negotiate-bench-shift", 1));
    const reply = step(saved, "negotiate-bench-shift", 9);
    const done = step(reply, "record-shift-response");
    assert.equal(done.flags.order_verified, true); assert.equal(done.flags.archive_key_authenticated, undefined);
    assert.equal(done.flags.edda_public_consent, undefined);
    assert.throws(() => step({ ...done, sceneId: "act3_edda_methods" }, "negotiate-bench-shift", 9));
    assert.throws(() => step({ ...done, sceneId: "act3_edda_reply" }, "record-shift-response"));
  });
  it("keeps a failed attempt pending and preserves an affordable non-check route", () => {
    const methods = step(step(applicant(), "review-edda-shift"), "authorize-shift-request");
    assert.throws(() => step({ ...methods, creds: 59 }, "fund-worker-representative"));
    const failed = step(methods, "reconcile-shift-ledger", 1); assert.equal(failed.strain, 2);
    assert.equal(failed.flags.edda_shift_paid, undefined);
    const done = step(parseSave(JSON.stringify(failed))!, "record-shift-response");
    assert.equal(done.creds, 150); assert.match(done.journal.at(-1)!.text, /without offering an assignment/);
    const poor = step({ ...methods, creds: 0 }, "leave-shift-pending"); assert.equal(poor.sceneId, "act3_edda_reply");
  });
});

describe("coolant maintenance appointment", () => {
  const repaired = (): GameState => ({ ...make("spire", {chrome:2,nerve:0,face:0,ghost:0}), sceneId:"act3_pump_visit",creds:30,flags:{pump_done:true,pump_restored:true} });
  it("charges one future appointment, preserves cooling and survives a reload", () => {
    const scheduled=step(step(repaired(),"book-pump-inspection"),"pay-pump-inspection");
    const restored=parseSave(JSON.stringify(scheduled))!;
    assert.equal(restored.creds,10); assert.equal(restored.flags.pump_inspection_booked,true);
    assert.equal(restored.flags.order_verified,undefined);
    assert.match(restored.journal.at(-1)!.text,/has not yet occurred/);
    assert.throws(()=>step({...restored,sceneId:"act3_pump_schedule"},"pay-pump-inspection"));
    assert.match(aftermath(restored).find(row=>row.title==="The clinic coolant")!.text,/has not happened yet/);
  });
  it("spends real neighborhood standing and blocks unfunded or unrepaired appointments", () => {
    const state={...repaired(),factions:{...repaired().factions,wards:2}};
    const done=step(step(state,"book-pump-inspection"),"wards-pump-inspection");
    assert.equal(done.factions.wards,1); assert.equal(done.creds,30);
    assert.throws(()=>step({...repaired(),flags:{pump_done:true,pump_failed:true}},"book-pump-inspection"));
    const scheduled=step(repaired(),"book-pump-inspection");
    assert.throws(()=>step({...scheduled,creds:19},"pay-pump-inspection"));
    assert.equal(step(scheduled,"leave-pump-schedule").flags.pump_inspection_booked,undefined);
  });
});


describe("playtest narrative and cost corrections", () => {
  const base = make("gutterwire", { chrome: 0, nerve: 2, face: 0, ghost: 0 });
  it("Lumen offers but does not hand over an absent marker", () => {
    const state = { ...base, sceneId: "act2_lumen_door", items: [], flags: { act1_sold: true } };
    assert.match(sceneText(getScene(state.sceneId), state), /offers a clinic marker/);
    const heard = step(state, "hear-lumen");
    assert.match(sceneText(getScene(heard.sceneId), heard), /still on her palm/);
    assert.deepEqual(heard.items, []);
    assert.deepEqual(step(state, "refuse-marker").items, []);
    assert.deepEqual(step(state, "leave-lumen").items, []);
  });
  it("an existing marker stays with the runner after hearing or refusal", () => {
    const state = { ...base, sceneId: "act2_lumen_door", items: ["clinic-marker"] };
    assert.match(sceneText(getScene(state.sceneId), state), /debt the clinic marker represents/);
    assert.deepEqual(step(state, "hear-lumen").items, state.items);
    assert.deepEqual(step(state, "refuse-marker").items, state.items);
  });
  it("a recorded clinic debt does not imply Lumen physically holds a marker", () => {
    const state = { ...base, sceneId: "act2_lumen_door", items: [], journal: [{ id: "clinic-debt", text: "Clinic debt", kind: "promise" as const }] };
    assert.match(sceneText(getScene(state.sceneId), state), /answer the debt/);
    const heard = step(state, "hear-lumen");
    assert.match(sceneText(getScene(heard.sceneId), heard), /clinic debt still/);
    assert.doesNotMatch(sceneText(getScene(heard.sceneId), heard), /still on her palm|turns it over/);
    assert.deepEqual(heard.items, []);
  });
  it("only an unfulfilled copying promise reports the closed window", () => {
    for (const [pact, copied, closed] of [[true, false, true], [true, true, false], [false, false, false]]) {
      const state = { ...base, sceneId: "after_kerr", flags: { pact_copy: pact, copied } };
      assert.equal(sceneText(getScene(state.sceneId), state).includes("copying window is closed"), closed);
    }
  });
  it("Fight Kerr previews both bounded costs without changing state or critical rules", () => {
    const state = { ...base, sceneId: "kerr", strain: 0 };
    const choice = getScene("kerr").choices.find((entry) => entry.id === "fight")!;
    const before = JSON.stringify(state);
    assert.deepEqual(checkResourceCosts(state, choice), ["Success: Strain +1 (before critical adjustment)", "Miss: Strain +2 (before critical adjustment)"]);
    assert.equal(JSON.stringify(state), before);
    assert.equal(commitChoice(state, choice, { roll: 8 }).state.strain, 1);
    assert.equal(commitChoice(state, choice, { roll: 10 }).state.strain, 0);
    assert.equal(commitChoice(state, choice, { roll: 1 }).state.strain, 3);
    assert.match(checkResourceCosts({ ...state, strain: 4 }, choice)[1], /Strain \+1/);
    assert.deepEqual(checkResourceCosts({ ...state, strain: 5 }, choice), []);
    assert.deepEqual(checkResourceCosts(state, getScene("stall").choices[0]), []);
  });
});


describe("playable opening", () => {
  const character = (origin: OriginId, complication: "debt" | "optic" | "on-file") => createCharacter({ handle: "Rex", givenName: "Ada", origin, bonus: { chrome: 1, nerve: 1, face: 0, ghost: 0 }, complication, startWithPrologue: true });
  it("introduces the city and the runner before revealing the job", () => {
    const state = character("gutterwire", "debt");
    assert.equal(state.sceneId, "opening_city");
    assert.equal(currentGoal(state), GOAL_ARRIVE);
    assert.match(sceneText(getScene(state.sceneId), state), /People call you a runner/);
    assert.match(sceneText(getScene(state.sceneId), state), /sliver of glass called a shard/);
    assert.doesNotMatch(sceneText(getScene(state.sceneId), state) + currentGoal(state), /Mara|Kerr|three hundred|coolant dump/i);
  });
  it("makes every origin and complication personal without giving free resources", () => {
    for (const origin of Object.keys(ORIGINS) as OriginId[]) for (const complication of ["debt", "optic", "on-file"] as const) for (const motive of ["opening-survival", "opening-identity", "opening-exit"]) {
      const initial = character(origin, complication);
      let state = step(initial, "begin-opening");
      const personal = sceneText(getScene(state.sceneId), state);
      assert.match(personal, new RegExp(`${initial.creds} creds`));
      if (origin === "gutterwire") assert.match(personal, /grew up below these pipes/);
      if (origin === "spire") assert.match(personal, /clearance stopped working/);
      if (origin === "dustline") assert.match(personal, /carried parcels across the flats/);
      if (complication === "debt") assert.match(personal, /debt still carries his name/);
      if (complication === "optic") assert.match(personal, /still owe the clinic/);
      if (complication === "on-file") assert.match(personal, /keeps a file under your old name/);
      state = step(state, motive); state = step(state, "hear-stallholder");
      const restored = parseSave(JSON.stringify(state)); assert.ok(restored);
      state = step(restored, "take-the-stool");
      assert.equal(state.sceneId, "stall"); assert.equal(state.flags.opening_complete, true);
      assert.equal(state.flags.opening_neighbor_heard, true);
      assert.equal(Object.keys(state.flags).filter((flag) => ["opening_survival", "opening_identity", "opening_exit"].includes(flag)).length, 1);
      for (const key of ["creds", "strain", "items", "stats", "factions", "journal", "rolls"] as const) assert.deepEqual(state[key], initial[key]);
      assert.match(sceneText(getScene(state.sceneId), state), /stallholder’s story stays with you/);
      assert.equal(currentGoal(state), GOAL_LIFT);
    }
  });
  it("allows a shorter approach or a complete skip without assigning a reason", () => {
    const initial = character("dustline", "on-file");
    const skipped = step(initial, "skip-opening");
    assert.equal(skipped.sceneId, "stall"); assert.equal(skipped.flags.opening_skipped, true);
    assert.equal(skipped.flags.opening_identity, undefined);
    const direct = step(step(step(initial, "begin-opening"), "opening-exit"), "meet-quill");
    assert.equal(direct.sceneId, "stall"); assert.equal(direct.flags.opening_neighbor_heard, undefined);
    assert.match(sceneText(getScene(direct.sceneId), direct), /buy yourself a way/);
  });
  it("preserves the opening state on import while old job checkpoints stay at the job", () => {
    const opening = character("spire", "optic");
    assert.equal(parseSave(JSON.stringify(opening))?.sceneId, "opening_city");
    const old = { ...opening, sceneId: "stall" };
    assert.equal(parseSave(JSON.stringify(old))?.sceneId, "stall");
  });
});
