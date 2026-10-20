import { characterConduct } from "@/lib/relationships";
import { CAST } from "@/lib/story/cast";
import type { GameState } from "@/lib/types";

const RETURNS = new Set(["act3_edda_visit", "act3_spire_visit", "act3_shelter_visit", "act3_freight_visit", "act3_witness_visit", "act3_kerr_collection", "act3_quill_introduction", "act3_mara_followup", "act3_lumen_boundary"]);

export function ConversationContext({ state, speaker }: { state: GameState; speaker?: string }) {
  if (!RETURNS.has(state.sceneId)) return null;
  const person = CAST.find(person => person.speaker === speaker);
  if (!person) return null;
  const history = characterConduct(state, person.name);
  if (!history) return null;
  return <details className="conversation-context" data-testid="conversation-context">
    <summary>Your history with {person.name}</summary><p>{history}</p>
  </details>;
}
