import type { ReactNode } from "react";
import type { Illustration } from "@/lib/art";
import type { PIVOTAL_SCENES } from "@/lib/pivotal-scenes";
import { SceneIllustration } from "./SceneIllustration";

export function PivotalScene({ direction, art, children }: {
  direction: (typeof PIVOTAL_SCENES)[string]; art?: Illustration; children: ReactNode;
}) {
  return <section className={`pivotal-stage${art ? " with-art" : ""}`} aria-label={direction.label}
    data-testid="pivotal-scene" data-kind={direction.kind}>
    <div className="pivotal-copy">
      <p className="pivotal-label">{direction.label}</p>
      {children}
    </div>
    {art && <div className="pivotal-art"><SceneIllustration art={art} /></div>}
  </section>;
}
