import { testimonyPacket } from "@/lib/testimony";
import type { GameState } from "@/lib/types";

export function TestimonyBrief({ state }: { state: GameState }) {
  if (!state.sceneId.startsWith("act3_testimony_")) return null;
  return <aside className="transfer-brief" aria-label="Public account sources and permission" data-testid="testimony-brief">
    <dl className="testimony-sources">
      {testimonyPacket(state).map((row) => <div key={row.title}><dt>{row.title}</dt><dd>{row.text}</dd></div>)}
    </dl>
  </aside>;
}
