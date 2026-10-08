import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STATS } from "./character.ts";
import { STAT_VOICE, statVoice } from "./story/voices.ts";

describe("stat voices", () => {
  it("gives each stat one line and does not change the roll", () => {
    const seen = new Set<string>();
    for (const stat of STATS) {
      const line = statVoice(stat);
      assert.equal(line, STAT_VOICE[stat]);
      assert.ok(line.length > 20, stat);
      seen.add(line);
    }
    assert.equal(seen.size, 4);
  });
});
