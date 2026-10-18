"use client";

import { useEffect, useRef, useState } from "react";
import { ART_PREVIEWS } from "@/lib/art-previews";
import type { Illustration } from "@/lib/art";

/** One semantic image; a tiny delivery of the same painting fills its reserved frame. */
export function ProgressiveArtwork({ art, sizes, lazy = false, onReady, onError }: {
  art: Illustration; sizes?: string; lazy?: boolean; onReady?: () => void; onError: () => void;
}) {
  const [ready, setReady] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const preview = Object.hasOwn(ART_PREVIEWS, art.src) ? ART_PREVIEWS[art.src] : undefined;
  return <span className="progressive-art" data-ready={ready ? "true" : "false"}
    style={preview && !ready ? { backgroundImage: `url("${preview}")` } : undefined}>
    <img src={art.src} srcSet={sizes ? `${art.small} 600w, ${art.src} 1200w` : undefined} sizes={sizes}
      width={1200} height={800} alt={art.description} loading={lazy ? "lazy" : "eager"} decoding="async"
      onLoad={event => {
        const img = event.currentTarget;
        void img.decode().then(() => { if (alive.current) { setReady(true); onReady?.(); } }).catch(() => {
          if (!alive.current) return;
          if (img.naturalWidth) { setReady(true); onReady?.(); } else onError();
        });
      }} onError={onError} />
  </span>;
}
