import { useState } from "react";
import { ordinaryDirection } from "@/lib/ordinary-direction";
import { SequenceArtwork } from "./SequenceArtwork";

/** Mounted after canonical decisions. Opening it neither advances reading nor interrupts speech. */
export function OrdinarySceneArtwork({ sceneId }: { sceneId: string }) {
  const [open, setOpen] = useState(false);
  const direction = ordinaryDirection(sceneId);
  if (!direction) return null;
  return <details className="ordinary-artwork" data-testid="ordinary-artwork" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Look closer · {direction.label}</summary>
    {open && <SequenceArtwork art={direction.scene} person={direction.person} detail={direction.detail} />}
  </details>;
}
