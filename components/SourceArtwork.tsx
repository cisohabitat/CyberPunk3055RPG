"use client";
import { useState, type ReactNode } from "react";
import { SOURCE_ART } from "@/lib/art";

export function SourceArtwork({ id, artwork, compact = false }: { id: string; artwork: boolean; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const art = SOURCE_ART[id];
  if (!artwork || !art) return null;
  return <figure className={`source-art${compact ? " compact" : ""}`}>
    {failed ? <div className="source-art-missing">Illustration unavailable · source text remains below.</div>
      : <img src={art.small} {...(!compact ? { srcSet: `${art.small} 450w, ${art.src} 900w`, sizes: "(max-width: 700px) calc(100vw - 80px), 450px" } : {})} width={450} height={300} alt={art.description} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    {!compact && <figcaption>{art.caption}</figcaption>}
  </figure>;
}

// Mount optional media only when the player opens the native source disclosure.
export function SourceDetails({ id, summaryId, summary, artwork, initialOpen = false, children }: { id: string; summaryId: string; summary: string; artwork: boolean; initialOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initialOpen);
  return <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary id={summaryId}>{summary}</summary>
    {open && <SourceArtwork id={id} artwork={artwork} />}{children}
  </details>;
}
