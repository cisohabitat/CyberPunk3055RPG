"use client";
import { useState } from "react";
import { inventoryArt } from "@/lib/inventory-art";
import { ArtworkImage, useArtworkViewer } from "./ArtworkViewer";

export function InventoryIllustration({ id, name, damaged }: { id: string; name: string; damaged: boolean }) {
  const art = inventoryArt(id, damaged), view = useArtworkViewer();
  const [failed, setFailed] = useState(false);
  if (!art || failed) return null;
  return <button type="button" className="inventory-art" aria-label={`View artwork: ${name}`} aria-haspopup="dialog" disabled={!view}
    onClick={() => view?.({ ...art, caption: name })}>
    <ArtworkImage art={art} thumbnail onError={() => setFailed(true)} />
  </button>;
}
