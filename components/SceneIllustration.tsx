import type { Illustration } from "@/lib/art";
import { useState } from "react";

export function SceneIllustration({ art }: { art: Illustration }) {
  const [failedSource, setFailedSource] = useState<string>();
  return <figure className="scene-illustration" data-testid="scene-illustration">
    {failedSource === art.src ? <p className="art-unavailable">{art.description}</p> : <img src={art.src} srcSet={`${art.small} 600w, ${art.src} 1200w`} sizes="(max-width: 700px) calc(100vw - 4rem), 760px" width={1200} height={800} alt={art.description} loading="lazy" decoding="async" onError={() => setFailedSource(art.src)} />}
    <figcaption>{art.caption}</figcaption>
  </figure>;
}
