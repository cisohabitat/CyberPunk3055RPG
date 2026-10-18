import type { Illustration } from "@/lib/art";
import { artAtmosphere } from "@/lib/art-atmosphere";
import { useEffect, useRef, useState } from "react";
import { ProgressiveArtwork } from "./ProgressiveArtwork";
import { useArtworkViewer } from "./ArtworkViewer";

export function SceneIllustration({ art, paired = false, reading = false }: { art: Illustration; paired?: boolean; reading?: boolean }) {
  const view = useArtworkViewer();
  const [failedSource, setFailedSource] = useState<string>();
  const atmosphere = artAtmosphere(art.src);
  const windowRef = useRef<HTMLDivElement>(null);
  const [loadedSource, setLoadedSource] = useState<string>();
  const [visibleSource, setVisibleSource] = useState<string>();
  useEffect(() => {
    if (!atmosphere || !windowRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisibleSource(art.src); observer.disconnect(); }
    }, { threshold: .15 });
    observer.observe(windowRef.current);
    return () => observer.disconnect();
  }, [art.src, atmosphere]);
  const failed = failedSource === art.src;
  const sizes = reading ? "(max-width: 700px) calc(42vw - 1.68rem), (max-width: 1100px) calc(100vw - 4rem), 760px" : paired ? "(min-width: 1101px) 330px, (min-width: 900px) calc(45vw - 2.5rem), calc(100vw - 4rem)"
    : "(max-width: 700px) calc(100vw - 4rem), (max-width: 1100px) calc(100vw - 4rem), 760px";
  return <figure className={`scene-illustration${reading ? " reading-art" : ""}`} data-testid="scene-illustration" data-layout={paired ? "paired" : "full"} data-reading={reading ? "true" : "false"} data-unavailable={failed ? "true" : "false"}>
    <div className="art-window" key={art.src} ref={windowRef}>
    {failed ? <p className="art-unavailable">{art.description}</p> : <ProgressiveArtwork key={art.src} art={art} sizes={sizes} lazy onReady={() => setLoadedSource(art.src)} onError={() => setFailedSource(art.src)} />}
    {!failed && loadedSource === art.src && visibleSource === art.src && atmosphere && <span className="art-atmosphere" data-testid="art-atmosphere" data-effect={atmosphere} aria-hidden="true" />}
    </div>
    <figcaption><span>{art.caption}</span>{view && !failed && <button className="ghost art-view" type="button" aria-label={`View artwork: ${art.caption}`} aria-haspopup="dialog" onClick={() => view(art)}>View artwork</button>}</figcaption>
  </figure>;
}
