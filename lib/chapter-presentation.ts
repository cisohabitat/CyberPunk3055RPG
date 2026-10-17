/** Written chapter furniture; it reveals no extra story and changes no state. */
export const CHAPTER_PRESENTATIONS = {
  opening_city: { number: "01", title: "The Hour", tone: "hour" },
  card_week: { number: "02", title: "The Week", tone: "week" },
  card_wall: { number: "03", title: "The Wall", tone: "wall" },
} as const;

export function chapterPresentation(sceneId: string) {
  return Object.hasOwn(CHAPTER_PRESENTATIONS, sceneId)
    ? CHAPTER_PRESENTATIONS[sceneId as keyof typeof CHAPTER_PRESENTATIONS] : undefined;
}
