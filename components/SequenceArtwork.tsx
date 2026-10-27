import { useState } from "react";
import type { Illustration } from "@/lib/art";
import { SceneIllustration } from "./SceneIllustration";
/** A local view choice, never a story choice or a voice/reading control. */
export function SequenceArtwork({ art, detail }: { art: Illustration; detail?: Illustration }) {
  const [close, setClose] = useState(false);
  return <>
    <SceneIllustration art={close && detail ? detail : art} paired />
    {detail && <div className="sequence-shots" role="group" aria-label="Artwork view" data-testid="sequence-shots">
      <button className="ghost" type="button" aria-pressed={!close} onClick={() => setClose(false)}>Scene</button>
      <button className="ghost" type="button" aria-pressed={close} onClick={() => setClose(true)}>Detail</button>
    </div>}
  </>;
}
