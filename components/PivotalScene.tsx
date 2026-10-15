import type { ReactNode } from "react";
import type { Illustration } from "@/lib/art";
import type { PIVOTAL_SCENES } from "@/lib/pivotal-scenes";
import { SceneIllustration } from "./SceneIllustration";

export function PivotalScene({ direction, art, children, finale = false }: {
  direction: (typeof PIVOTAL_SCENES)[string]; art?: Illustration; children: ReactNode; finale?: boolean;
}) {
  return <section className={`pivotal-stage${art ? " with-art" : ""}${finale ? " finale-stage" : ""}`} aria-label={direction.label}
    data-testid={finale ? "finale-scene" : "pivotal-scene"} data-kind={direction.kind}>
    <div className="pivotal-copy">
      <p className="pivotal-label">{direction.label}</p>
      {children}
    </div>
    {art && <div className="pivotal-art"><SceneIllustration art={art} /></div>}
  </section>;
}
