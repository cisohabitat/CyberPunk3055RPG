import type { Illustration } from "@/lib/art";
import { useState } from "react";

export function SceneIllustration({ art, paired = false }: { art: Illustration; paired?: boolean }) {
  const [failedSource, setFailedSource] = useState<string>();
  const sizes = paired ? "(min-width: 1101px) 330px, (min-width: 900px) calc(45vw - 2.5rem), calc(100vw - 4rem)"
    : "(max-width: 700px) calc(100vw - 4rem), (max-width: 1100px) calc(100vw - 4rem), 760px";
  return <figure className="scene-illustration" data-testid="scene-illustration" data-layout={paired ? "paired" : "full"}>
    {failedSource === art.src ? <p className="art-unavailable">{art.description}</p> : <img src={art.src} srcSet={`${art.small} 600w, ${art.src} 1200w`} sizes={sizes} width={1200} height={800} alt={art.description} loading="lazy" decoding="async" onError={() => setFailedSource(art.src)} />}
    <figcaption>{art.caption}</figcaption>
  </figure>;
}
