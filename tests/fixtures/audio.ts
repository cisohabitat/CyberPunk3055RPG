import type { Page } from "@playwright/test";

export async function observeVoices(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true, autoVoices: false, reading: "paragraph" }));
    const review = window as unknown as { voiceReview: { decoded: number; started: number; stopped: number; gains: number[]; scheduled: { value: number; settling: number }[] } };
    review.voiceReview = { decoded: 0, started: 0, stopped: 0, gains: [], scheduled: [] };
    const voices = new WeakSet<AudioBuffer>();
    const names = new WeakMap<ArrayBuffer, string>();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = function() {
      const name = this.url.split("/").at(-1) ?? "";
      return arrayBuffer.call(this).then(data => { names.set(data, name); return data; });
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function(data: ArrayBuffer) {
      const voice = names.get(data)?.startsWith("voice-") ?? false;
      return decode.call(this, data).then((buffer) => { if (voice) { voices.add(buffer); review.voiceReview.decoded++; } return buffer; });
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args: Parameters<typeof start>) { if (this.buffer && voices.has(this.buffer)) review.voiceReview.started++; return start.apply(this, args); };
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop = function(...args: Parameters<typeof stop>) { if (this.buffer && voices.has(this.buffer)) review.voiceReview.stopped++; return stop.apply(this, args); };
    const target = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function(...args: Parameters<typeof target>) { review.voiceReview.gains.push(args[0]); review.voiceReview.scheduled.push({ value: args[0], settling: args[2] }); return target.apply(this, args); };
  });
}

export const voiceReview = (page: Page) => page.evaluate(() => (window as unknown as { voiceReview: { decoded: number; started: number; stopped: number; gains: number[]; scheduled: { value: number; settling: number }[] } }).voiceReview);

export async function observeBeds(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("saint-shard-preferences", JSON.stringify({ sound: true, autoVoices: false, reading: "all", motion: "reduce" }));
    const review = window as unknown as { bedReview: { decoded: string[]; started: string[] } };
    review.bedReview = { decoded: [], started: [] };
    const dataNames = new WeakMap<ArrayBuffer, string>(); const bufferNames = new WeakMap<AudioBuffer, string>();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = function() { const name = this.url.split("/").at(-1)!; return arrayBuffer.call(this).then(data => { dataNames.set(data, name); return data; }); };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function(data: ArrayBuffer) { const name = dataNames.get(data)!; return decode.call(this, data).then(buffer => { bufferNames.set(buffer, name); review.bedReview.decoded.push(name); return buffer; }); };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args: Parameters<typeof start>) { if (this.loop && this.buffer) review.bedReview.started.push(bufferNames.get(this.buffer)!); return start.apply(this, args); };
  });
}

export const bedReview = (page: Page) => page.evaluate(() => (window as unknown as { bedReview: { decoded: string[]; started: string[] } }).bedReview);
