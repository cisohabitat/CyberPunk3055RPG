import type { Choice, GameState } from './types';

export const SERA_SHIFT_SCENES = ['act3_sera_shift', 'act3_sera_carry', 'act3_sera_watch', 'act3_sera_reply'] as const;
export const SERA_QUOTES = {
  ask: 'I keep sending people to the wall. I would like to stand there myself for once. But I cannot leave this table open.',
  carry: 'Take the blank cards. Bring back the empty tray too. People should have somewhere to put a question when they find one.',
  watch: 'Stay on this side. If someone asks for a source, ask them to wait for me. You do not have to answer for anybody.',
  carried: 'You brought the tray back empty. That is all right. An empty place for a question is still worth keeping.',
  watched: 'I heard the voices from the wall instead of through this doorway. Thank you for staying.',
  recordCarry: 'Leave a space beside the account. Someone may come back with a question after we have gone.',
  recordWatch: 'I can take the table again. You do not have to stay here to make this account worth keeping.',
} as const;
export const SERA_RECORDS = {
  offered: 'Sera asked for help with the closed public records table and blank question cards so she could listen at the wall. Private records stayed closed; no source access or witness permission was offered.',
  carry: 'You carried blank question cards to the public wall and returned the empty tray. Sera kept custody of the closed records table. No question, testimony or source finding was invented.',
  watch: 'You watched the closed table from the visitor side while Sera listened at the wall, then waited for her return. No folder was opened and no source request was answered.',
} as const;
const has = (s: GameState, id: string, text: string) => s.journal.some(j => j.id === id && j.kind === 'fact' && j.text === text);
export function seraShiftRole(s: GameState): 'carry' | 'watch' | undefined {
  if (!s.flags.sera_shift_enabled || !s.flags.sera_shift_offered || !has(s, 'sera-shift-offer', SERA_RECORDS.offered)) return;
  if (Boolean(s.flags.sera_shift_carried) === Boolean(s.flags.sera_shift_watched)) return;
  const role = s.flags.sera_shift_carried ? 'carry' : 'watch';
  return has(s, 'sera-shift-task', SERA_RECORDS[role]) ? role : undefined;
}
export function seraShiftAvailable(s: GameState, id: string) {
  if (!s.flags.sera_shift_enabled || !s.flags.memory_prepared || s.flags.testimony_done || !s.flags.sera_shift_offered || !has(s, 'sera-shift-offer', SERA_RECORDS.offered)) return false;
  if (id === 'act3_sera_reply') return Boolean(seraShiftRole(s) && !s.flags.sera_shift_seen);
  if (s.flags.sera_shift_seen || seraShiftRole(s) || s.flags.sera_shift_declined) return false;
  return (SERA_SHIFT_SCENES as readonly string[]).includes(id);
}
/** Additive opt-in only; old factories, saves and existing authored cohorts stay exact. */
export function seraShiftChoices(s: GameState, id: string, choices: Choice[]): Choice[] {
  if ((SERA_SHIFT_SCENES as readonly string[]).includes(id)) return seraShiftAvailable(s, id) ? choices : [{ id: 'sera-unavailable', label: 'Return to the wall with the actual record unchanged.', next: 'act3_arrival' }];
  if (!s.flags.sera_shift_enabled || s.flags.sera_shift_seen || s.flags.sera_shift_declined || s.flags.testimony_done) return choices;
  return choices.map(c => c.id !== 'prepare-public-account' ? c : {
    ...c, next: seraShiftRole(s) ? 'act3_sera_reply' : 'act3_sera_shift',
    effects: { flags: ['sera_shift_offered'], journal: [{ id: 'sera-shift-offer', kind: 'fact', text: SERA_RECORDS.offered }] },
  });
}
export function seraShiftText(s: GameState, id: string, text: string) {
  const role = seraShiftRole(s);
  if (!role || !s.flags.sera_shift_seen || id !== 'act3_testimony_record') return text;
  return `${text}\n\nSera sets the question tray beside the public draft. "${role === 'carry' ? SERA_QUOTES.recordCarry : SERA_QUOTES.recordWatch}"`;
}
