import source from "../qa/media/campaign-dialogue-bindings.json";

export type CampaignDialogue = {
  key: string; id: string; scene: string; sceneSpeaker: string | null;
  speaker: string; quote: string; text: string; part: number;
  suffix?: boolean; attribution?: string;
  choiceId?: string; outcome?: string;
};
const byScene = new Map<string, CampaignDialogue[]>();
for (const line of source as CampaignDialogue[]) {
  const group = byScene.get(line.scene) ?? [];
  group.push(line); byScene.set(line.scene, group);
}

/** Quote delimiters exclude apostrophes within words. Written quotes need no
 * voice unless explicitly cast in the reviewed authoring catalog. */
export function quotedSpeech(text: string): { text: string; position: number }[] {
  const pattern = /“([^“”]+)”|(?<!\w)‘([\s\S]+?)’(?!\w)|"([^"]+)"|(?<!\w)'([\s\S]+?)'(?!\w)/g;
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
    if (line.choiceId || line.sceneSpeaker !== (speaker ?? null) || line.attribution && !visibleText.includes(line.attribution)) return [];
    const quote = quotes.find(quote => line.suffix ? quote.text.endsWith(line.quote) : quote.text === line.quote);
    return quote ? [{ line, position: quote.position }] : [];
  }).sort((a, b) => a.position - b.position || a.line.part - b.line.part).map(({ line }) => line);
}

/** A check's quotation is available only after the actual outcome is revealed. */
export function visibleCheckDialogue(scene: string, choiceId: string, speaker: string | undefined, success: boolean, flavor: string): CampaignDialogue[] {
  const quotes = quotedSpeech(flavor);
  return (byScene.get(scene) ?? []).filter(line => line.choiceId === choiceId
    && line.sceneSpeaker === (speaker ?? null) && line.outcome === (success ? "success" : "miss")
    && (!line.attribution || flavor.includes(line.attribution)) && quotes.some(quote => quote.text === line.quote));
}

export type SpokenRange = { start: number; end: number; speaker: string };
const wordTokens = (text: string) => [...text.matchAll(/[\p{L}\p{N}]+/gu)].map(match => ({ value: match[0].toLowerCase(), start: match.index! }));

/** Anchor an audible part inside its exact revealed quotation. Token boundaries
 * tolerate the retained deliveries' typographic punctuation, never different
 * words, narration, attribution or a custom player address. */
export function spokenDialogueRange(visibleText: string, line: CampaignDialogue): SpokenRange | undefined {
  const authored = (byScene.get(line.scene) ?? []).find(candidate => candidate.key === line.key);
  if (!authored || authored.id !== line.id || authored.speaker !== line.speaker || authored.text !== line.text
    || authored.quote !== line.quote || authored.part !== line.part || line.attribution && !visibleText.includes(line.attribution)) return undefined;
  const quote = quotedSpeech(visibleText).find(candidate => line.suffix ? candidate.text.endsWith(line.quote) : candidate.text === line.quote);
  if (!quote) return undefined;
  const parts = (byScene.get(line.scene) ?? []).filter(candidate => candidate.quote === line.quote
    && candidate.speaker === line.speaker && candidate.choiceId === line.choiceId && candidate.outcome === line.outcome).sort((a, b) => a.part - b.part);
  const tokens = wordTokens(line.quote), expected = parts.flatMap(part => wordTokens(part.text).map(token => token.value));
  if (tokens.length !== expected.length || tokens.some((token, index) => token.value !== expected[index])) return undefined;
  const before = parts.filter(part => part.part < line.part).reduce((count, part) => count + wordTokens(part.text).length, 0);
  const count = wordTokens(line.text).length;
  if (!count || !tokens[before]) return undefined;
  const start = before ? tokens[before].start : 0;
  const boundary = tokens[before + count]?.start ?? line.quote.length;
  const end = start + line.quote.slice(start, boundary).trimEnd().length;
  const offset = quote.position + 1 + (line.suffix ? quote.text.length - line.quote.length : 0);
  return { start: offset + start, end: offset + end, speaker: line.speaker };
}
