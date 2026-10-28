import { useState } from "react";
import type { Illustration } from "@/lib/art";
import { SceneIllustration } from "./SceneIllustration";
/** A local view choice, never a story choice or a voice/reading control. */
export function SequenceArtwork({ art, detail, person }: { art: Illustration; detail?: Illustration; person?: Illustration }) {
  const [view, setView] = useState<"scene" | "person" | "detail">("scene");
  const selectedView = view === "person" && person ? "person" : view === "detail" && detail ? "detail" : "scene";
  const selected = selectedView === "person" ? person! : selectedView === "detail" ? detail! : art;
  return <>
    <SceneIllustration art={selected} paired />
    {(detail || person) && <div className="sequence-shots" role="group" aria-label="Artwork view" data-testid="sequence-shots" data-view={selectedView}>
      <button className="ghost" type="button" aria-pressed={selectedView === "scene"} onClick={() => setView("scene")}>Scene</button>
      {person && <button className="ghost" type="button" aria-pressed={selectedView === "person"} onClick={() => setView("person")}>Person</button>}
      {detail && <button className="ghost" type="button" aria-pressed={selectedView === "detail"} onClick={() => setView("detail")}>Detail</button>}
    </div>}
  </>;
}
