"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { VoiceStatus } from "@/lib/sound";
import type { DialogueLine } from "@/lib/memory-media";
import type { CampaignDialogue } from "@/lib/campaign-dialogue";
import { DialoguePlayback } from "@/lib/dialogue-playback";

export function VoiceLine({ line, lines, enabled, automatic, paused = false, onSpeaking }: {
  line?: DialogueLine; lines: CampaignDialogue[]; enabled: boolean; automatic: boolean; paused?: boolean;
  onSpeaking?: (line: CampaignDialogue | null) => void;
}) {
  const [view, setView] = useState<{ status: VoiceStatus; key?: string }>({ status: "idle" });
  const selectId = useId();
  const playback = useRef<DialoguePlayback | null>(null);
  if (!playback.current) playback.current = new DialoguePlayback(setView);
  const preferred = lines.find(candidate => candidate.id === line?.id)?.key
    ?? lines.find(candidate => candidate.speaker === line?.speaker && candidate.text === line?.text)?.key
    ?? lines[0]?.key;
  const queueKey = lines.map(candidate => candidate.key).join("|");
  useEffect(() => {
    playback.current!.update(lines, enabled, automatic, preferred);
    // Immutable authored lines are identified by queueKey, not each render's array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueKey, enabled, automatic, preferred]);
  useEffect(() => () => playback.current?.dispose(), []);
  const selected = lines.find(candidate => candidate.key === view.key) ?? lines.find(candidate => candidate.key === preferred) ?? lines[0];
  const speaking = enabled && view.status === "playing" ? selected : undefined;
  useEffect(() => { onSpeaking?.(speaking ?? null); }, [onSpeaking, speaking]);
  useEffect(() => () => onSpeaking?.(null), [onSpeaking]);
  if (!selected) return null;
  const active = view.status === "loading" || view.status === "playing";
  const name = selected.speaker === "Sister Lumen" ? "Lumen" : selected.speaker;
  return <aside className="voice-line" aria-label={`${name} selected dialogue`} data-testid="voice-line" data-voice-id={selected.id}>
    <button type="button" className="ghost" disabled={!enabled} onClick={() => {
      if (active) playback.current!.stop();
      else playback.current!.listen(selected.key);
    }}>{active ? "Stop line" : `Listen to ${name}`}</button>
    {lines.length > 1 && <button type="button" className="ghost" disabled={!enabled || active} onClick={() => playback.current!.playAll()}>Play all dialogue</button>}
    <p className="hint" role="status">{paused ? "Resume sound to listen. Dialogue stays in the text." : !enabled ? "Enable Sound and voice volume in Settings to listen." : view.status === "loading" ? "Loading selected dialogue…" : view.status === "unavailable" ? "Voice unavailable. The complete dialogue remains in the text." : view.status === "playing" ? `Playing selected dialogue · ${name} · synthetic voice` : "Selected dialogue · synthetic voice"}</p>
    <details><summary>Voice transcript</summary>
      <ol>{lines.map(candidate => <li key={candidate.key} aria-current={view.status === "playing" && candidate.key === selected.key ? "true" : undefined}><strong>{candidate.speaker}:</strong> {candidate.text}</li>)}</ol>
      {lines.length > 1 && <div><label htmlFor={selectId}>Dialogue line</label><select id={selectId} value={selected.key} disabled={active} onChange={event => setView({ status: "idle", key: event.target.value })}>
        {lines.map((candidate, index) => <option key={candidate.key} value={candidate.key}>{index + 1}. {candidate.speaker} · {candidate.text.slice(0, 64)}</option>)}
      </select></div>}
    </details>
  </aside>;
}
