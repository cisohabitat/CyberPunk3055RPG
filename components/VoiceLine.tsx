"use client";
import { useEffect, useRef, useState } from "react";
import { playVoice, type VoiceStatus } from "@/lib/sound";
import type { DialogueLine } from "@/lib/memory-media";

export function VoiceLine({ line, enabled }: { line: DialogueLine; enabled: boolean }) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!enabled) { cancel.current?.(); cancel.current = null; setStatus("idle"); }
    return () => { cancel.current?.(); cancel.current = null; };
  }, [enabled]);
  const active = status === "loading" || status === "playing";
  const name = line.speaker === "Sister Lumen" ? "Lumen" : line.speaker;
  return <aside className="voice-line" aria-label={`${name} selected dialogue`} data-testid="voice-line">
    <button type="button" className="ghost" disabled={!enabled} onClick={() => {
      if (active) { cancel.current?.(); cancel.current = null; setStatus("idle"); }
      else cancel.current = playVoice(line.id, setStatus);
    }}>{active ? "Stop line" : `Listen to ${name}`}</button>
    <p className="hint" role="status">{!enabled ? "Enable Sound and voice volume in Settings to listen." : status === "loading" ? "Loading selected dialogue…" : status === "unavailable" ? "Voice unavailable. The complete dialogue remains in the text." : status === "playing" ? "Playing selected dialogue · synthetic voice" : "Selected dialogue · synthetic voice"}</p>
    <details><summary>Voice transcript</summary><p>{line.text}</p></details>
  </aside>;
}
