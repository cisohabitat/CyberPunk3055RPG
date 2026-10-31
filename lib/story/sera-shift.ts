import type { Choice, Scene } from '../types';
import { SERA_QUOTES as Q, SERA_RECORDS as R, seraShiftAvailable, seraShiftRole } from '../sera-shift';

const stop: Choice = { id: 'sera-decline', label: 'Leave the table with Sera. Prepare only the account.', detail: 'Free. No task, payment, trust or source permission is claimed.', effects: { flags: ['sera_shift_declined'] }, next: 'act3_testimony_review' };
const pause: Choice = { id: 'sera-pause', label: 'Step back to the wall before doing this.', detail: 'Free. No task is completed. Return through Prepare an account to resume the conversation.', next: 'act3_arrival' };
const scene = (id: string, text: Scene['text'], choices: Choice[]): Scene => ({ id, location: 'Ward Nine records table', speaker: 'Sera', text: s => seraShiftAvailable(s, id) ? typeof text === 'function' ? text(s) : text : 'There is no supported unfinished task here. The records keep their actual custody and permissions.', choices });
export const SERA_SHIFT_STORY: Record<string, Scene> = {
  act3_sera_shift: scene('act3_sera_shift', `Sera has a hand on the back of her chair. From the doorway, the wall is only a strip of wet light. A tray of blank question cards waits on the visitor side; the source folders are closed behind her.\n\n"${Q.ask}"\n\nYou can carry the cards to the wall while she keeps custody here, or watch the closed table while she listens. Either task takes you away from drafting for a moment. Neither earns money or standing.`, [
    { id: 'sera-choose-carry', label: 'Carry the blank question cards. Let Sera keep the table.', detail: 'Take the public tray to the wall and return it. The account waits; Sera stays with the sources.', next: 'act3_sera_carry' },
    { id: 'sera-choose-watch', label: 'Watch the closed table so Sera can listen at the wall.', detail: 'Wait on the visitor side for her return. The account waits; no private record can be opened.', next: 'act3_sera_watch' }, stop, pause,
  ]),
  act3_sera_carry: scene('act3_sera_carry', `Sera slides the tray across the visitor side. The cards are blank; none is a source or an approved witness account.\n\n"${Q.carry}"\n\nThe wall is a short walk from the table. You can make that trip, choose the other task, or leave this work with Sera.`, [
    { id: 'sera-carry-cards', label: 'Set out the blank cards at the wall. Bring back the empty tray.', detail: 'Complete this short task. No question is supplied, no testimony is collected and no resource changes.', effects: { flags: ['sera_shift_carried'], journal: [{ id: 'sera-shift-task', kind: 'fact', text: R.carry }] }, next: 'act3_sera_reply' },
    { id: 'sera-switch-watch', label: 'Offer to watch the closed table instead.', next: 'act3_sera_watch' }, stop, pause,
  ]),
  act3_sera_watch: scene('act3_sera_watch', `Sera closes the tray drawer. The folders remain on her side of the table. She waits until you have taken a place facing the doorway.\n\n"${Q.watch}"\n\nYou are keeping a place, not taking custody of the sources. Wait for her return, choose the other task, or leave the table with her.`, [
    { id: 'sera-watch-table', label: 'Wait on the visitor side until Sera returns from the wall.', detail: 'Complete this short task. Open no folder and answer no source request. No resource changes.', effects: { flags: ['sera_shift_watched'], journal: [{ id: 'sera-shift-task', kind: 'fact', text: R.watch }] }, next: 'act3_sera_reply' },
    { id: 'sera-switch-carry', label: 'Offer to carry the blank cards instead.', next: 'act3_sera_carry' }, stop, pause,
  ]),
  act3_sera_reply: scene('act3_sera_reply', s => seraShiftRole(s) === 'carry' ? `The cards stay at the wall. Back at the table, you set down the empty tray. Sera moves her pencil out of its way.\n\n"${Q.carried}"\n\nShe draws the blank cover sheet toward you. Now there is room for the account, if you still want to prepare it.` : `Sera comes back through the doorway and takes her place on the source side. You have left the closed folders where they were.\n\n"${Q.watched}"\n\nShe draws the blank cover sheet toward you. The account is still yours to prepare or leave.`, [
    { id: 'sera-return-to-account', label: 'Let Sera take the table. Review the public account.', detail: 'Keep the completed task in the journal. Source strength, quotation permission and filing remain separate decisions.', effects: { flags: ['sera_shift_seen'] }, next: 'act3_testimony_review' },
  ]),
};
