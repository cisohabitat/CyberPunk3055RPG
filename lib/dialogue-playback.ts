import { playVoice, type VoiceStatus } from "./sound";

type Line = { key: string; id: string; speaker?: string };
type View = { status: VoiceStatus; key?: string };
type Player = typeof playVoice;

/** One scene's revealed dialogue. Cancellation and natural completion are
 * distinct: a dismissed queue never resumes when a modal closes. */
export class DialoguePlayback {
  private lines: Line[] = [];
  private consumed = new Set<string>();
  private enabled = false;
  private automatic = false;
  private preferred?: string;
  private current?: string;
  private cancel?: () => void;
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private busy = false;
  private replay: string[] | null = null;
  private previousSpeaker?: string;

  constructor(private report: (view: View) => void, private player: Player = playVoice) {}

  update(lines: Line[], enabled: boolean, automatic: boolean, preferred?: string) {
    const wasAutomatic = this.automatic;
    this.lines = lines; this.preferred = preferred ?? lines[0]?.key;
    this.enabled = enabled; this.automatic = automatic;
    if (!enabled || wasAutomatic && !automatic || this.current && !lines.some(line => line.key === this.current)) {
      this.stop(); return;
    }
    if (!this.busy && automatic) this.schedule();
  }

  private schedule(afterNaturalEnd = false) {
    if (!this.enabled || this.busy) return;
    const next = this.replay ? this.replay.shift() : this.automatic ? this.lines.find(line => !this.consumed.has(line.key))?.key : undefined;
    if (!next) { this.replay = null; return; }
    this.busy = true;
    this.current = next;
    const generation = this.generation;
    const speaker = this.lines.find(line => line.key === next)?.speaker;
    const pause = afterNaturalEnd && speaker && this.previousSpeaker
      ? speaker === this.previousSpeaker ? 120 : 220 : 0;
    // Keep Stop available during the breath between lines, without claiming an
    // actor is audible. Cancellation consumes this pending start like a load.
    if (pause) this.report({ status: "loading", key: next });
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (generation === this.generation && this.enabled) this.start(next, true);
    }, pause);
  }

  private start(key: string, sequence: boolean) {
    const line = this.lines.find(line => line.key === key);
    if (!line || !this.enabled) { this.busy = false; return; }
    this.current = key; this.busy = true; this.consumed.add(key);
    const generation = this.generation;
    this.cancel = this.player(line.id, status => {
      if (generation === this.generation) this.report({ status, key });
    }, outcome => {
      if (generation !== this.generation) return;
      this.cancel = undefined; this.busy = false; this.current = undefined;
      this.previousSpeaker = line.speaker;
      this.report({ status: outcome === "unavailable" ? "unavailable" : "idle", key: sequence ? this.preferred : key });
      if (sequence) this.schedule(outcome === "ended");
    });
  }

  /** Stop consumes everything currently revealed, including queued late loads. */
  stop() {
    ++this.generation; clearTimeout(this.timer); this.timer = undefined;
    this.cancel?.(); this.cancel = undefined; this.current = undefined;
    this.busy = false; this.replay = null;
    this.previousSpeaker = undefined;
    for (const line of this.lines) this.consumed.add(line.key);
    this.report({ status: "idle", key: this.preferred });
  }

  listen(key: string) {
    this.stop(); if (this.enabled) this.start(key, false);
  }

  playAll() {
    this.stop(); if (!this.enabled) return;
    this.replay = this.lines.map(line => line.key); this.schedule();
  }

  dispose() {
    ++this.generation; clearTimeout(this.timer); this.cancel?.();
    this.cancel = undefined; this.busy = false; this.replay = null;
    this.previousSpeaker = undefined;
  }
}
