"use client";
import { useState } from "react";
import { checkpointArt } from "@/lib/presentation-art";
import type { GameState } from "@/lib/types";
export function CheckpointArtwork({ state }: { state: GameState }) {
  const art = checkpointArt(state), [failed, setFailed] = useState<string>();
  if (!art || failed === art.small) return null;
  return <img className="checkpoint-art" src={art.small} key={art.small} width={600} height={400} alt={art.description} loading="lazy" decoding="async" onError={() => setFailed(art.small)} />;
}
