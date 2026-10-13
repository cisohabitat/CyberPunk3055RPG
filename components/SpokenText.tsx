import type { SpokenRange } from "@/lib/campaign-dialogue";

/** Keep the source text and paragraph node intact; no focus or scroll changes. */
export function SpokenText({ text, range, offset = 0 }: { text: string; range?: SpokenRange; offset?: number }) {
  if (!range || range.end <= offset || range.start >= offset + text.length) return text;
  const start = Math.max(0, range.start - offset), end = Math.min(text.length, range.end - offset);
  return <>{text.slice(0, start)}<mark className="spoken-quote" aria-current="true" data-testid="spoken-quote" data-speaker={range.speaker}>{text.slice(start, end)}</mark>{text.slice(end)}</>;
}
