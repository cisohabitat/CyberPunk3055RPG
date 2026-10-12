/** Browser instrumentation for explicit QA only; never imported by the game. */
export type AudioReview = {
  sourcesCreated: number; sourcesDisposed: number; buffersCleared: number;
  liveSources: number; peakLiveSources: number; starts: number; stops: number;
  started: string[]; decoded: string[]; disposed: string[]; cleared: string[];
};
export function installAudioReview({ suppressEnded = false }: { suppressEnded?: boolean } = {}) {
  const review: AudioReview = { sourcesCreated: 0, sourcesDisposed: 0, buffersCleared: 0, liveSources: 0, peakLiveSources: 0, starts: 0, stops: 0, started: [], decoded: [], disposed: [], cleared: [] };
  (window as unknown as { audioReview: AudioReview }).audioReview = review;
  const ids = new WeakMap<AudioBufferSourceNode, number>(), live = new Set<number>();
  const dataNames = new WeakMap<ArrayBuffer, string>(), bufferNames = new WeakMap<AudioBuffer, string>();
  const remember = (rows: string[], name: string) => { rows.push(name); if (rows.length > 128) rows.shift(); };
  const arrayBuffer = Response.prototype.arrayBuffer;
  Response.prototype.arrayBuffer = function() {
    const name = this.url.split("/").at(-1) ?? "unnamed";
    return arrayBuffer.call(this).then(data => { dataNames.set(data, name); return data; });
  };
  const decode = AudioContext.prototype.decodeAudioData;
  AudioContext.prototype.decodeAudioData = function(data: ArrayBuffer) {
    return decode.call(this, data).then(buffer => { const name = dataNames.get(data) ?? "unnamed"; bufferNames.set(buffer, name); remember(review.decoded, name); return buffer; });
  };
  const create = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function() {
    const node = create.call(this), id = ++review.sourcesCreated;
    ids.set(node, id); live.add(id); review.liveSources = live.size;
    review.peakLiveSources = Math.max(review.peakLiveSources, live.size);
    return node;
  };
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function(...args: Parameters<typeof start>) {
    review.starts++; remember(review.started, this.buffer ? bufferNames.get(this.buffer) ?? "unnamed" : "empty");
    return start.apply(this, args);
  };
  const stop = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.stop = function(...args: Parameters<typeof stop>) { review.stops++; return stop.apply(this, args); };
  const disconnect = AudioBufferSourceNode.prototype.disconnect;
  AudioBufferSourceNode.prototype.disconnect = function() {
    const id = ids.get(this); if (id !== undefined && live.delete(id)) {
      review.sourcesDisposed++; remember(review.disposed, this.buffer ? bufferNames.get(this.buffer) ?? "unnamed" : "empty");
    }
    review.liveSources = live.size; return (disconnect as () => void).call(this);
  };
  const buffer = Object.getOwnPropertyDescriptor(AudioBufferSourceNode.prototype, "buffer");
  if (buffer?.set && buffer.get) Object.defineProperty(AudioBufferSourceNode.prototype, "buffer", { configurable: true, get: buffer.get, set(value: AudioBuffer | null) {
    const previous = buffer.get!.call(this) as AudioBuffer | null;
    if (value === null && previous) { review.buffersCleared++; remember(review.cleared, bufferNames.get(previous) ?? "unnamed"); }
    buffer.set!.call(this, value);
  } });
  if (suppressEnded) {
    const handlers = new WeakMap<AudioBufferSourceNode, EventListener>();
    Object.defineProperty(AudioBufferSourceNode.prototype, "onended", { configurable: true, get() { return handlers.get(this) ?? null; }, set(value: EventListener | null) { if (value) handlers.set(this, value); else handlers.delete(this); } });
  }
}
