import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { createCharacter, commitChoice, getScene, presentChoices, sceneText } from "./engine";
import { quotedSpeech, visibleCampaignDialogue, spokenDialogueRange } from "./campaign-dialogue";
import { SCENES } from "./story";
import { multilineSpeech } from "../qa/production/multiline-speech";
import { bindingsBeforeMultiline } from "../qa/production/binding-history";
import type { ReplaySpec } from "./story-replay";
import phase from "../qa/media/multiline-dialogue.json";
import deliveries from "../qa/media/campaign-dialogue-provenance.json";

const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const base = createCharacter({ handle: "Review", givenName: "Ada", origin: "spire", bonus: { chrome: 2, nerve: 0, face: 0, ghost: 0 } });

describe("dialogue across paragraphs", () => {
  it("recognizes all quotation styles across paragraphs without treating contractions as delimiters", () => {
    for (const [opening, closing] of [['"', '"'], ["“", "”"], ["‘", "’"], ["'", "'"]]) {
      const quote = "We’re here.\n\nIt’s still somewhere.";
      const source = `Rain. ${opening}${quote}${closing} More rain.`;
      assert.deepEqual(quotedSpeech(source), [{ text: quote, position: 6 }]);
      assert.deepEqual(multilineSpeech(source), [quote]);
      assert.deepEqual(quotedSpeech(source.slice(0, source.indexOf("\n\n"))), []);
    }
    assert.deepEqual(multilineSpeech("Mara's memory. It’s hers. No quoted speech."), []);
  });

  it("independently checks multiline quotations in every scene and full authored route", () => {
    const found = new Set<string>();
    const inspect = (state: typeof base) => {
      const scene = getScene(state.sceneId), text = sceneText(scene, state);
      for (const quote of multilineSpeech(text)) {
        found.add(scene.id);
        const queue = visibleCampaignDialogue(scene.id, scene.speaker, text).filter(line => line.quote === quote);
        assert.ok(queue.length, `Silent multiline speech: ${scene.id}`);
        assert.deepEqual(words(queue.map(line => line.text).join(" ")), words(quote));
        for (const line of queue) {
          assert.equal(line.speaker, scene.speaker);
          const range = spokenDialogueRange(text, line)!;
          assert.ok(range, line.key);
          assert.deepEqual(words(text.slice(range.start, range.end)), words(line.text));
        }
      }
    };
    for (const scene of Object.values(SCENES)) inspect({ ...base, sceneId: scene.id });
    for (const file of readdirSync("qa/routes").filter(file => file.endsWith(".json"))) {
      const route = JSON.parse(readFileSync(`qa/routes/${file}`, "utf8")) as ReplaySpec;
      let state = createCharacter(route.character); inspect(state);
      for (const step of route.steps) {
        const choice = presentChoices(state, getScene(state.sceneId)).find(choice => choice.id === step.choiceId && choice.enabled)!;
        state = commitChoice(state, choice, choice.check ? { roll: step.roll! } : undefined).state;
        inspect(state);
      }
    }
    assert.deepEqual([...found].sort(), ["chapel", "lumen_deal"]);
  });

  it("adds four exact-word clips without altering any preceding binding or voice bytes", () => {
    assert.equal(bindingsBeforeMultiline().length, 302);
    assert.equal(phase.additions.length, 4);
    for (const [id, expected] of Object.entries(phase.preservedVoiceSha256)) {
      const data = readFileSync(`public/audio/${id}.${id.startsWith("voice-campaign-") ? "mp3" : "wav"}`);
      assert.equal(createHash("sha256").update(data).digest("hex"), expected, id);
    }
    for (const binding of phase.additions) {
      const delivery = deliveries.lines.find(line => line.id === binding.id)!;
      assert.equal(delivery.text, binding.text);
      assert.equal(delivery.speaker, binding.speaker);
      assert.equal(delivery.voice, binding.speaker === "Quill" ? "am_michael" : "af_heart");
      assert.equal(phase.art.find(row => row.scene === binding.scene)?.existingDecision, "illustration");
    }
    const normalized = (text: string) => words(text.replace(/\b9\b/g, "Nine"));
    for (const performance of phase.performances) {
      assert.equal(performance.transcription.sha256, performance.sha256);
      assert.deepEqual(normalized(performance.transcription.text), normalized(performance.text), performance.id);
    }
  });
});
