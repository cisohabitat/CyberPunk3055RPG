"use client";

import { createContext, useContext, useId, useRef, useState } from "react";
import type { ViewableArt } from "@/lib/art";
export type { ViewableArt } from "@/lib/art";
import { ProgressiveArtwork } from "./ProgressiveArtwork";
import { DialogFrame } from "./DialogFrame";

export const ArtworkContext = createContext<((art: ViewableArt) => void) | undefined>(undefined);
export const useArtworkViewer = () => useContext(ArtworkContext);

/** A generated atlas is clipped in CSS, never recomposed or edited into new artwork. */
export function ArtworkImage({ art, onError, thumbnail = false }: { art: ViewableArt; onError: () => void; thumbnail?: boolean }) {
  if (art.tile !== undefined) return <span className="equipment-tile" data-tile={art.tile}>
    <img src={thumbnail ? art.small : art.src} alt={art.description} width={1600} height={1600}
      loading={thumbnail ? "lazy" : "eager"} decoding="async" onError={onError}
      style={{ left: `${-(art.tile % 4) * 100}%`, top: `${-Math.floor(art.tile / 4) * 100}%` }} />
  </span>;
  return <ProgressiveArtwork key={art.src} art={art} onError={onError} />;
}

export function ArtworkViewer({ art, onClose }: { art: ViewableArt; onClose: () => void }) {
  const titleId = useId(), helpId = useId();
  const [zoom, setZoom] = useState(100), [failed, setFailed] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  function resize(next: number) {
    setZoom(Math.max(100, Math.min(300, next)));
    if (next <= 100) viewport.current?.scrollTo({ left: 0, top: 0 });
  }
  return <DialogFrame titleId={titleId} className="artwork-dialog" onEscape={onClose}>
    <div className="artwork-controls" onKeyDown={event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Tab") {
        const targets = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')];
        const first = targets[0], last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        return;
      }
      if (event.key === "+" || event.key === "=") { event.preventDefault(); resize(zoom + 50); }
      else if (event.key === "-" || event.key === "−") { event.preventDefault(); resize(zoom - 50); }
      else if (event.key === "0") { event.preventDefault(); resize(100); }
    }}>
      <div className="artwork-heading"><h2 id={titleId}>{art.caption}</h2>
        <button className="ghost" type="button" data-dialog-initial-focus onClick={onClose}>Close artwork</button></div>
      <p id={helpId} className="hint">Use Zoom in and Zoom out, or + and −. Press 0 to fit. Scroll to explore; arrow keys work when the artwork is focused. Escape returns you to where you were.</p>
      <div className="actions"><button className="ghost" type="button" onClick={() => resize(zoom - 50)} disabled={zoom === 100}>Zoom out</button>
        <output aria-live="polite" aria-label="Artwork zoom">{zoom}%</output>
        <button className="ghost" type="button" onClick={() => resize(zoom + 50)} disabled={zoom === 300}>Zoom in</button>
        <button className="ghost" type="button" onClick={() => resize(100)}>Fit artwork</button></div>
      <div className="artwork-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Artwork detail" aria-describedby={helpId}>
        {failed ? <p className="art-unavailable">Artwork unavailable. {art.description}</p>
          : <div className={`artwork-canvas${art.tile !== undefined ? " equipment-canvas" : ""}`} style={{ width: `calc(min(100%, calc((60dvh - 2px) * ${art.tile !== undefined ? 1 : 1.5})) * ${zoom / 100})` }}>
            <ArtworkImage art={art} onError={() => setFailed(true)} />
          </div>}
      </div>
    </div>
    <p className="hint">{art.description}</p>
  </DialogFrame>;
}
