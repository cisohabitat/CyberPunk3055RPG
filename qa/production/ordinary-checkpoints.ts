/** Authored legal checkpoints for the one ordinary Kerr sequence; QA only. */
export const ORDINARY_CHECKPOINTS = [
  { id: 'entry', route: 'district-public-work', scene: 'act2_district_kerr', choice: 'district-tell-kerr' },
  { id: 'shared-breach', route: 'district-public-work', scene: 'act2_district_kerr_reply', choice: 'district-kerr-acknowledge' },
  { id: 'acknowledged', route: 'district-public-work', scene: 'act2_district_kerr_reply', choice: 'district-kerr-introduce' },
  { id: 'private', route: 'district-private-rest', scene: 'act2_district_kerr_reply', choice: 'district-kerr-introduce' },
  { id: 'known-breach', route: 'district-breach-denied', scene: 'act2_district_kerr_reply', choice: 'district-kerr-deny' },
  { id: 'refused', route: 'district-breach-denied', scene: 'act2_district_kerr_reply', choice: 'district-leave-kerr' },
] as const;
