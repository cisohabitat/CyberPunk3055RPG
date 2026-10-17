import { chapterPresentation } from "@/lib/chapter-presentation";

export function ChapterTransition({ sceneId }: { sceneId: string }) {
  const chapter = chapterPresentation(sceneId);
  if (!chapter) return null;
  return <section className="chapter-transition" data-chapter={chapter.tone} data-testid="chapter-transition" aria-labelledby="chapter-heading">
    <div>
      <p className="chapter-number">Chapter {chapter.number} of 03</p>
      <h2 id="chapter-heading">{chapter.title}</h2>
    </div>
    <div className="chapter-motif" aria-hidden="true"><span /><span /><span /></div>
  </section>;
}
