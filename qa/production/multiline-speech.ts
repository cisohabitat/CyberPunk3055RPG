/** Independent authoring audit: do not reuse the playback quotation regex. */
export function multilineSpeech(text: string): string[] {
  const pairs: Record<string, string> = { '"': '"', "“": "”", "‘": "’", "'": "'" };
  const word = (character: string | undefined) => Boolean(character && /[\p{L}\p{N}]/u.test(character));
  const quotes: string[] = [];
  let opening: string | undefined;
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (!opening) {
      if (!Object.hasOwn(pairs, character) || (character === "'" || character === "‘") && word(text[index - 1])) continue;
      opening = character; start = index + 1;
    } else if (character === pairs[opening]) {
      if ((character === "'" || character === "’") && word(text[index + 1])) continue;
      const quote = text.slice(start, index);
      if (quote.includes("\n")) quotes.push(quote);
      opening = undefined;
    }
  }
  return quotes;
}
