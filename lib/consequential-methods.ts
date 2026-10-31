import { beginTechnique, canStartTechnique } from './build-techniques';
import { districtIntroductionAllowed, districtRemaining, districtSpend } from './district-response';
import type { Choice, Effect, GameState } from './types';

const RECORDS = {
  chrome: 'You used your owned Archive Probe to compare three workers with two recipients and observe the bounded heading-correction intake in one depot action. Two strain and a device-service trace were committed; the probe remains yours. A review reference confirms intake, not source authentication or a finding.',
  face: 'You signed and lodged your own public process-only declaration in one depot action. Helion exposure increased by two. Your signature remains; nobody co-signed or waived work for you. A review reference confirms intake, not source authentication or witness permission.',
} as const;
const exposureRecord = (amount: number) => `You signed and lodged your own public process-only declaration in one depot action. The filing committed Helion +2 subject to the existing cap; the actual exposure increase was ${amount}. Your signature remains; nobody co-signed or waived work for you. A review reference confirms intake, not source authentication or witness permission.`;
/** The measured amount is retained at commitment, not inferred from later standing. */
export function consequentialExposure(s: GameState): number | undefined {
  if (!s.flags.consequential_expansion_enabled) return;
  return [0, 1, 2].find(n => s.journal.some(j => j.id === 'consequential-procedure' && j.kind === 'fact' && j.text === exposureRecord(n)));
}

/** A method flag alone cannot supply an observed procedure or earned wage. */
export function consequentialMethod(s: GameState): 'chrome' | 'face' | undefined {
  if (!s.flags.consequential_methods_enabled || !s.flags.technique_complete || !s.flags.technique_review_reference) return;
  return (['chrome', 'face'] as const).find(k => s.flags[`consequential_${k}`] && s.flags[`technique_${k}`]
    && (s.journal.some(j => j.id === 'consequential-procedure' && j.kind === 'fact' && j.text === RECORDS[k])
      || k === 'face' && consequentialExposure(s) !== undefined));
}

function express(s: GameState, stat: 'chrome' | 'face'): Effect {
  const begun = beginTechnique(s, stat, stat === 'chrome' ? 'portable' : 'self');
  return { ...begun, ...(stat === 'chrome' ? { strain: 2 } : {}), factions: { wards: 1, ...(stat === 'face' ? { helion: 2 } : {}) },
    flags: [...begun.flags!, 'technique_complete', 'technique_review_reference', 'district_correction_carried', `consequential_${stat}`,
      stat === 'chrome' ? 'technique_portable_fault' : 'technique_filing_signed'],
    journal: [{ id: 'consequential-procedure', kind: 'fact', text: stat === 'face' && s.flags.consequential_expansion_enabled ? exposureRecord(Math.min(5, s.factions.helion + 2) - s.factions.helion) : RECORDS[stat] },
      { id: 'technique-review', kind: 'fact', text: 'Your bounded procedure obtained a depot review reference. Intake alone settles no correction, issuing key, employment inquiry or witness permission.' }],
  };
}

function live(s: GameState) { return s.flags.district_query_sent && !s.flags.district_window_closed && !s.flags.act2_done; }
export function consequentialChoices(s: GameState, id: string, choices: Choice[]): Choice[] {
  if (!s.flags.consequential_methods_enabled) return choices;
  let result = choices;
  if (canStartTechnique(s) && id === 'act2_technique_chrome') result = [...result, {
    id: 'consequential-probe-intake', label: 'Compare both fields with the Archive Probe and observe immediate intake.',
    detail: 'One depot action; Strain +2; Wards +1. Keep the probe. Device-service trace remains; no source authentication. Requires two available actions to start this bench procedure.',
    requireFlag: 'perk_chrome', requireItem: 'archive-probe', maxStrain: 3,
    effects: state => express(state, 'chrome'), next: 'act2_technique_result',
  }];
  if (canStartTechnique(s) && id === 'act2_technique_face' && s.flags.district_public_review) result = [...result, {
    id: 'consequential-public-intake', label: 'Sign and lodge your own public process-only declaration now.',
    detail: 'One depot action; Helion +2 exposure; Wards +1. Your public signature remains. No co-sign or work waiver; no source certification. Requires the public review and trained Face.',
    requireFlag: 'perk_face', effects: state => express(state, 'face'), next: 'act2_technique_result',
  }];
  if (id === 'act2_district_canal' && consequentialMethod(s) && live(s) && districtRemaining(s) >= 1
      && s.flags.district_public_review && s.flags.district_kerr_introduced && districtIntroductionAllowed(s)
      && !s.flags.technique_work_waived && !s.flags.district_work_registered && !s.flags.district_work_paid && !s.flags.consequential_short_shift) result = [...result, {
    id: 'consequential-short-shift', label: 'Use the remaining action to sort one public dispatch tray.',
    detail: 'One depot action; Strain +1; earn eight creds once. Your worker handle is recorded. This is a short task, not the twenty-creds full sorting shift. Kerr stays out of the recipient field.',
    maxStrain: 4, effects: state => ({ ...districtSpend(state), strain: 1, creds: 8,
      flags: [...districtSpend(state).flags!, 'consequential_short_shift'],
      journal: [{ id: 'consequential-short-shift', kind: 'fact', text: 'After your observed bounded intake, you spent one depot action sorting a single public dispatch tray under your own worker handle. Eight creds were paid once for that short task and one strain was spent. No full sorting wage, recipient registration, source finding or witness permission was supplied.' }],
    }), next: 'act2_district_canal',
  }];
  return result;
}

export function consequentialText(s: GameState, id: string, text: string): string {
  if (!s.flags.consequential_methods_enabled) return text;
  if (id === 'act2_technique_chrome') return `${text}\n\nYou can instead use your Archive Probe for an immediate comparison and observed intake: one action and two strain. The probe still compares three workers with two recipients; speed changes handling effort, not either population. The device-service trace remains. Keeping an action only opens the eight-creds short task if the public review and an eligible introduction are already in place.`;
  if (id === 'act2_technique_face') return `${text}\n\nUnder a public review, trained Face can lodge your own process-only declaration immediately. One action replaces the two-step filing at the cost of two additional Helion exposure and a public signature. Nobody else's signature or time is offered. The private two-step filing remains available. With an eligible introduction, the saved action can fund an eight-creds short sorting task instead of the twenty-creds full shift.`;
  const method = consequentialMethod(s);
  const paid = s.flags.consequential_short_shift && s.journal.some(j => j.id === 'consequential-short-shift');
  if (method && id === 'act2_technique_result') return `${text}\n\n${method === 'chrome' ? 'The probe is back in its sleeve. Two strain bought an observed one-action intake; the device-service trace remains.' : consequentialExposure(s) !== undefined ? `The public docket carries your own signature. The filing committed Helion +2; its actual exposure increase was ${consequentialExposure(s)} after the cap. Nobody co-signed or waived work.` : 'The public docket carries your own signature. The one-action intake added two Helion exposure, subject to the existing cap; nobody co-signed or waived work.'} The reference confirms review intake only.`;
  if (method && id === 'act2_district_canal') return `${text}\n\n${paid ? 'The single dispatch tray is empty. Its eight-creds short-task wage is paid; the full sorting shift was not worked.' : `${districtRemaining(s)} depot actions remain after the immediate intake. No short-task wage is due until you actually sort a tray under an eligible introduction.`}`;
  if (method && id === 'act3_district_return') return `${text}\n\n${method === 'chrome' ? 'Your probe came home; its service trace stayed at the depot.' : 'Your public declaration still carries your signature, without a co-signer.'} ${paid ? 'The separate short dispatch task paid eight creds; it was not the full sorting shift.' : 'You left without a short-task wage.'}`;
  return text;
}
