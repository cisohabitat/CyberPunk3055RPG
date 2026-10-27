import type { ReactNode } from "react";
import type { Illustration } from "@/lib/art";
import type { PIVOTAL_SCENES } from "@/lib/pivotal-scenes";
import { SequenceArtwork } from "./SequenceArtwork";

export function PivotalScene({ direction, art, children, finale = false, investigation = false, sceneId, detail }: {
  direction: (typeof PIVOTAL_SCENES)[string]; art?: Illustration; children: ReactNode; finale?: boolean; investigation?: boolean; sceneId?: string; detail?: Illustration;
}) {
  return <section className={`pivotal-stage${art ? " with-art" : ""}${finale ? " finale-stage" : ""}`} aria-label={direction.label}
    data-testid={finale ? "finale-scene" : investigation ? "investigation-scene" : "pivotal-scene"} data-kind={direction.kind}>
    <div className="pivotal-copy">
      <p className="pivotal-label">{direction.label}</p>
      {children}
    </div>
    {art && <div className="pivotal-art"><SequenceArtwork key={sceneId ?? art.src} art={art} detail={detail} /></div>}
  </section>;
}
