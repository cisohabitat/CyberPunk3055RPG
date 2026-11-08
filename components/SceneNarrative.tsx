import { spokenDialogueRange, type CampaignDialogue } from "@/lib/campaign-dialogue";
import { SpokenText } from "./SpokenText";

/** Preserve paragraph nodes, offsets and exact quoted words across voice handoffs. */
export function SceneNarrative({ sceneId, paragraphs, visibleCount, visibleText, dialogueQueue, playing, directed }: {
  sceneId: string;
  paragraphs: string[];
  visibleCount: number;
  visibleText: string;
  dialogueQueue: CampaignDialogue[];
  playing: CampaignDialogue | null;
  directed: boolean;
}) {
  const spokenRange = playing ? spokenDialogueRange(visibleText, playing) : undefined;
  let paragraphOffset = 0;
  const visibleParagraphs = paragraphs.slice(0, visibleCount).map(text => {
    const offset = paragraphOffset;
    paragraphOffset += text.length + 2;
    return { text, offset };
  });
  const quotedRanges = directed ? dialogueQueue.map(line => spokenDialogueRange(visibleText, line))
    .filter(range => range !== undefined) : [];
  return <div className="prose" data-testid="scene-text">
    {visibleParagraphs.map(({ text, offset }, index) => (
      <p key={`${sceneId}-${index}`} id={`reading-paragraph-${index}`} tabIndex={-1}
        className={quotedRanges.some(range => range.end > offset && range.start < offset + text.length) ? "pivotal-dialogue" : undefined}>
        <SpokenText text={text} offset={offset} range={spokenRange} />
      </p>
    ))}
  </div>;
}
