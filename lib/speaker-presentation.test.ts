import { reviewedDeliveryHash } from "../qa/production/delivery-history";
import assert from "node:assert/strict";
import witness from "../qa/media/witness-return.json";
import { it } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { spokenDialogueRange, visibleCampaignDialogue, type CampaignDialogue } from "./campaign-dialogue";
import { portraitArt } from "./art";
import { createCharacter, getScene, sceneText, presentChoices, commitChoice } from "./engine";
import type { ReplaySpec } from "./story-replay";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
import presentation from "../qa/media/speaker-presentation.json";
import decisions from "../qa/media/scene-art.json";
import mara from "../qa/media/mara-relationship.json";

const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const sha = (path: string) => createHash("sha256").update(readFileSync(new URL(`../${path}`, import.meta.url))).digest("hex");

it("anchors every audible part to its complete authored quotation, excluding custom addresses", () => {
  for (const raw of bindings) {
    const line = raw as CampaignDialogue;
    const quote = `${line.suffix ? "Custom 🎵 Runner. " : ""}${line.quote}`;
    const text = `Narration before. “${quote}” ${line.attribution ?? ""} Narration after.`;
    const range = spokenDialogueRange(text, line);
    assert.ok(range, line.key);
    assert.deepEqual(words(text.slice(range.start, range.end)), words(line.text), line.key);
    assert.equal(range.speaker, line.speaker);
    assert.ok(!text.slice(range.start, range.end).includes("Custom"));
    assert.equal(spokenDialogueRange(line.text, line), undefined, "Unquoted narration cannot light up");
    assert.equal(spokenDialogueRange(text, { ...line, text: "A different sentence." }), undefined);
  }
});

it("matches highlighted words to actual visible quotations throughout all complete authored routes", () => {
  for (const file of readdirSync(new URL("../qa/routes/", import.meta.url)).filter(file => file.endsWith(".json"))) {
    const spec = JSON.parse(readFileSync(new URL(`../qa/routes/${file}`, import.meta.url), "utf8")) as ReplaySpec;
    let state = createCharacter(spec.character);
    const review = () => {
      const scene = getScene(state.sceneId), text = sceneText(scene, state);
      for (const line of visibleCampaignDialogue(scene.id, scene.speaker, text)) {
        const range = spokenDialogueRange(text, line);
        assert.ok(range, `${file}/${scene.id}/${line.key}`);
        assert.deepEqual(words(text.slice(range.start, range.end)), words(line.text));
        assert.ok(portraitArt(line.speaker, scene.id, state.flags));
      }
    };
    review();
    for (const step of spec.steps) {
      const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled)!;
      state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
      review();
    }
  }
});

it("requires a reviewed portrait and exact scene list for every actor and keeps all voice files locked", () => {
  assert.equal(presentation.version, 1);
  assert.equal(new Set(presentation.speakers.map(entry => entry.speaker)).size, 15);
  const current = presentation.speakers.map(entry => ({ ...entry, scenes: [...entry.scenes, ...[...mara.portraitAdditions, ...witness.portraitAdditions].filter(a => a.speaker === entry.speaker).flatMap(a => a.scenes)] }));
  assert.deepEqual(decisions.speakingPortraits, current);
  for (const addition of mara.portraitAdditions) assert.equal(portraitArt(addition.speaker), addition.asset);
  assert.equal(presentation.bindingSha256, sha("qa/media/campaign-dialogue-bindings.json"));
  for (const entry of presentation.speakers) {
    assert.equal(portraitArt(entry.speaker), entry.asset);
    assert.deepEqual(entry.scenes, [...new Set(bindings.filter(binding => binding.speaker === entry.speaker).map(binding => binding.scene))].sort());
    assert.ok(readFileSync(new URL(`../public${entry.asset}`, import.meta.url)).length);
  }
  for (const binding of bindings) assert.ok(presentation.speakers.some(entry => entry.speaker === binding.speaker && entry.scenes.includes(binding.scene)));
  const ids = [...new Set(bindings.map(binding => binding.id))];
  assert.equal(ids.length, 294);
  assert.deepEqual(Object.keys(presentation.preservedVoiceSha256).sort(), ids.sort());
  for (const [id, hash] of Object.entries(presentation.preservedVoiceSha256)) assert.equal(reviewedDeliveryHash(`public/audio/${id}.${id.startsWith("voice-campaign-") ? "mp3" : "wav"}`, hash), hash);
});
