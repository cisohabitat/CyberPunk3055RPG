"use client";

import { useEffect, useRef, useState } from "react";
import type { Preferences } from "@/lib/preferences";

/** Paragraph progress is local presentation state; it never changes the saved run. */
export function useSceneReading(sceneId: string, prose: string, reading: Preferences["reading"]) {
  const [shown, setShown] = useState<{ sceneId: string; prose: string; count: number } | null>(null);
  const readingFocus = useRef<{ sceneId: string; index: number } | null>(null);
  const paragraphs = prose.split(/\n\n+/).filter(paragraph => paragraph.length > 0);
  const visibleCount = reading === "all" ? paragraphs.length : Math.min(
    shown?.sceneId === sceneId && shown.prose === prose ? shown.count : 1, paragraphs.length,
  );
  const visibleText = paragraphs.slice(0, visibleCount).join("\n\n");

  useEffect(() => {
    const target = readingFocus.current;
    if (!target) return;
    readingFocus.current = null;
    if (target.sceneId === sceneId) document.getElementById(`reading-paragraph-${target.index}`)?.focus();
  }, [visibleCount, sceneId]);

  useEffect(() => {
    setShown(null);
  }, [sceneId, prose]);

  function revealParagraphs(count: number) {
    readingFocus.current = { sceneId, index: visibleCount };
    setShown({ sceneId, prose, count });
  }

  return { paragraphs, visibleCount, visibleText, revealParagraphs };
}
