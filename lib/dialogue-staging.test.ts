import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import staging from "../qa/media/dialogue-staging.json";
import bindings from "../qa/media/campaign-dialogue-bindings.json";
import authoring from "../qa/media/campaign-dialogue-lines.json";
import provenance from "../qa/media/campaign-dialogue-provenance.json";
import legacy from "../qa/media/voice-provenance.json";
import decisions from "../qa/media/scene-art.json";
import { portraitArt } from "./art";
const hash = (file: string) => createHash("sha256").update(readFileSync(new URL(`../${file}`, import.meta.url))).digest("hex");

it("revises exactly the reviewed performances without changing quotation, actor or preceding WAVs", () => {
  assert.equal(staging.performances.length, 14);
  assert.deepEqual(bindings, staging.precedingBindings.map(line => ({ ...line, id: staging.legacyReplacements[line.id as keyof typeof staging.legacyReplacements] ?? line.id })));
  for (const entry of staging.performances) {
    const line = authoring.find(line => line.id === entry.id)!;
    const delivery = provenance.lines.find(line => line.id === entry.id)!;
    assert.equal(line.text, entry.text); assert.equal(delivery.text, entry.text);
    assert.equal(line.speaker, entry.speaker); assert.equal(delivery.voice, entry.voice);
    assert.equal(line.segments!.map(part => part.text).join(" "), entry.text);
    assert.equal(hash(delivery.path), entry.sha256);
    assert.notEqual(delivery.sha256, entry.previousSha256);
  }
  for (const entry of legacy.lines) assert.equal(hash(entry.path), entry.sha256);
});

it("stages reviewed expressions only for the actual actor and keeps earned conduct expressions", () => {
  assert.deepEqual(decisions.expressionPortraits, staging.portraits);
  assert.equal(staging.portraits.length, 4);
  for (const entry of staging.portraits) for (const scene of entry.scenes) {
    assert.equal(portraitArt(entry.speaker, scene), entry.asset);
    assert.notEqual(portraitArt("Dispatcher", scene), entry.asset);
  }
  assert.equal(portraitArt("Sera", "act3_arrival", { confirmed_leak: true }), "/art/sera-listening.jpg");
  assert.equal(portraitArt("Sister Lumen", "act3_lumen_boundary", { betrayed_lumen: true }), "/art/lumen-guarded.jpg");
  assert.equal(portraitArt("Sera", "act2_shelter_brief"), "/art/sera.jpg");
});
