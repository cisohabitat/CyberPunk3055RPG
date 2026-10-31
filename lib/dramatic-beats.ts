import type { Choice, GameState } from './types';
import { CRAFT_QUOTES } from './encounter-craft';

export const DRAMATIC_QUOTES = {
  quill: 'Do not give me an easy yes. I need you to come back with the hour.',
  negotiate: 'The advance has to get you through the door. Ask for more if that is what the work needs.',
  agreed: 'Ninety when you take the job. I need that extra money to get you through the door, not just get me a yes.',
  refused: 'Fifty. That is the offer I can make. You can leave the number there without pretending you like it.',
  request: 'I want this request to have an edge. Something I can finish, then put down when my shift ends.',
  edda: 'A fee, an old number, a signature. Each leaves someone carrying this request. I want to know which part you are asking me to carry.',
  paid: 'You covered the fee. Let me decide about my name before this leaves the room.',
  badge: 'You put your old number on it. I know what it costs to leave a number they still recognize.',
  signed: 'You asked me to sign, and I did. Let that stay something I chose, not something you won from me.',
  return: 'I am still here. Ask me what I need, rather than deciding what my signature was worth.',
} as const;

/** Recognize the actual scoped extraction, never a request or imported method flag alone. */
export function dramaticArchiveMethod(s: GameState): 'paid' | 'badge' | 'signed' | undefined {
  if (!s.flags.dramatic_beats_enabled || !s.flags.craft_archive_attempted || !s.flags.order_verified || !s.flags.archive_done) return;
  const entry = s.journal.find(j => j.id === 'verified-order' && j.kind === 'fact');
  if (!entry || !entry.text.startsWith('A targeted staffed WN/SHIFT/REV extraction corroborated cancellation')) return;
  if (s.flags.archive_method_face && entry.text.includes('Edda agreed to countersign this bounded movement extraction')) return 'signed';
  if (s.flags.old_badge_traced && entry.text.includes("billed to the runner's old employee number")) return 'badge';
  if (!s.flags.archive_method_face && entry.text.includes('The logged search cost twenty-five creds.')) return 'paid';
}

export function dramaticBeatsText(s: GameState, id: string, text: string): string {
  if (!s.flags.dramatic_beats_enabled) return text;
  const q = DRAMATIC_QUOTES;
  if (id === 'stall' && !s.flags.met_quill && !s.flags.dramatic_quill_greeted && !s.flags.hired) return `${text}\n\nQuill turns the untouched bowl away from the edge. "${q.quill}"`;
  if (id === 'pay' && !s.flags.haggled && !s.flags.haggle_failed) return `${text}\n\nHe keeps his chip on his side of the counter. "${q.negotiate}"\n\nYou can risk the existing Face check for a larger advance, or leave the number alone. No advance transfers until you take the job.`;
  if (id === 'pay_yes' && s.flags.haggled) return `Quill moves his chip closer, then stops short of yours.\n\n"${q.agreed}"\n\nThe negotiation earned a ninety-creds advance. It is paid only if you accept the job. Two hundred remains due on delivery of the intact hour; Kerr and the dawn appointment remain.`;
  if (id === 'pay_no' && s.flags.haggle_failed) return `Quill leaves the chip where it was. The failed negotiation stays in the record.\n\n"${q.refused}"\n\nThe advance remains fifty, payable only on acceptance. Two hundred remains due on delivery of the intact hour. You can return to the offer without another negotiation.`;
  if (id === 'act2_craft_archive' && !s.flags.craft_scope_issuer && !s.flags.craft_scope_movement) return `${text}\n\nEdda leaves a blank space beneath the request heading. \"${q.request}\"`;
  if (id === 'act2_craft_archive_ledger' && text.includes(`"${CRAFT_QUOTES.ledger}"`)) return text.replace(`"${CRAFT_QUOTES.ledger}"`, `Edda smooths the request form once. Her hand stops above the signature line.\n\n"${q.edda}"\n\nShe can help carry this bounded record. The families stay out of the request.`);
  const method = dramaticArchiveMethod(s);
  if (id === 'act2_archive_custody' && method) return `${text}\n\nEdda keeps the request beside the retrieved reference. "${q[method]}"`;
  if (id === 'act3_edda_visit' && method === 'signed' && s.flags.archive_custody) return `${text}\n\nEdda leaves the signed request where both of you can see it. "${q.return}"`;
  return text;
}

/** A spoken exchange marks the new greeting once; read-only inspections do not. */
export function dramaticBeatsChoices(s: GameState, id: string, choices: Choice[]): Choice[] {
  if (!s.flags.dramatic_beats_enabled || s.flags.dramatic_quill_greeted || id !== 'stall') return choices;
  return choices.map(c => !['ask-pay', 'ask-why', 'ask-chapel', 'ask-owner', 'accept'].includes(c.id) ? c : {
    ...c, effects: state => {
      const effect = typeof c.effects === 'function' ? c.effects(state) : c.effects ?? {};
      return { ...effect, flags: [...(effect.flags ?? []), 'dramatic_quill_greeted'] };
    },
  });
}
