import source from "../qa/media/campaign-dialogue-bindings.json";

export type CampaignDialogue = {
  key: string; id: string; scene: string; sceneSpeaker: string | null;
  speaker: string; quote: string; text: string; part: number;
  suffix?: boolean; attribution?: string;
};
const byScene = new Map<string, CampaignDialogue[]>();
for (const line of source as CampaignDialogue[]) {
  const group = byScene.get(line.scene) ?? [];
  group.push(line); byScene.set(line.scene, group);
}

/** Quote delimiters exclude apostrophes within words. Written quotes need no
 * voice unless explicitly cast in the reviewed authoring catalog. */
export function quotedSpeech(text: string): { text: string; position: number }[] {
  const pattern = /“([^“”]+)”|(?<!\w)‘(.+?)’(?!\w)|"([^"\n]+)"|(?<!\w)'(.+?)'(?!\w)/g;
  return [...text.matchAll(pattern)].map(match => ({
    text: match.slice(1).find(value => value !== undefined)!, position: match.index!,
  }));
}

/** Actual actor, full revealed quotation and explicit secondary attribution.
 * A custom address may precede a fixed suffix; that address is never spoken. */
export function visibleCampaignDialogue(scene: string, speaker: string | undefined, visibleText: string): CampaignDialogue[] {
  const candidates = byScene.get(scene);
  if (!candidates) return [];
  const quotes = quotedSpeech(visibleText);
  return candidates.flatMap(line => {
    if (line.sceneSpeaker !== (speaker ?? null) || line.attribution && !visibleText.includes(line.attribution)) return [];
    const quote = quotes.find(quote => line.suffix ? quote.text.endsWith(line.quote) : quote.text === line.quote);
    return quote ? [{ line, position: quote.position }] : [];
  }).sort((a, b) => a.position - b.position || a.line.part - b.line.part).map(({ line }) => line);
}
