import type { Illustration } from "@/lib/art";

export function SceneIllustration({ art }: { art: Illustration }) {
  return <figure className="scene-illustration" data-testid="scene-illustration">
    <img src={art.src} srcSet={`${art.small} 600w, ${art.src} 1200w`} sizes="(max-width: 700px) calc(100vw - 4rem), 760px" width={1200} height={800} alt={art.description} loading="lazy" decoding="async" />
    <figcaption>{art.caption}</figcaption>
  </figure>;
}
