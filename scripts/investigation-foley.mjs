// Original physical textures, authored offline; no sampled or modelled recordings.
export const INVESTIGATION_RATE = 22050;
export function renderInvestigationFoley() {
  function texture(kind, seconds, seed) {
    const result = new Float32Array(Math.round(seconds * INVESTIGATION_RATE));
    let random = seed >>> 0, low = 0, slower = 0;
    for (let i = 0; i < result.length; i++) {
      random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
      const noise = (random >>> 0) / 4294967296 * 2 - 1, t = i / INVESTIGATION_RATE;
      low += .18 * (noise - low); slower += .025 * (noise - slower);
      let value = 0;
      if (kind === 'paper') {
        // Two brushed surfaces, then a small settled edge. No completion chime.
        for (const [start, duration, level] of [[.04,.44,.14],[.42,.58,.11]]) {
          const age = (t - start) / duration;
          if (age >= 0 && age < 1) value += (noise - low) * Math.sin(Math.PI * age) ** 2 * level;
        }
        if(t>.93) value += low * .12 * Math.exp(-(t-.93)*45);
      } else if (kind === 'chair') {
        // Dull lever contacts and a short restrained rubber/metal rub.
        for (const at of [.08,.48]) if(t>=at) value += low * .35 * Math.exp(-(t-at)*52);
        const age=(t-.17)/.34;
        if(age>=0&&age<1) value += (low-slower)*.15*Math.sin(Math.PI*age)**2 + Math.sin(2*Math.PI*(190*t+35*t*t))*.012*Math.sin(Math.PI*age)**2;
      } else {
        // Soft cover movement and a single subdued closed-folio contact.
        const age=(t-.04)/.44;
        if(age>=0&&age<1) value += low*.17*Math.sin(Math.PI*age)**2;
        if(t>=.45) value += (Math.sin(2*Math.PI*83*(t-.45))*.065 + low*.2)*Math.exp(-(t-.45)*27);
      }
      const edge = Math.min(1,i/(INVESTIGATION_RATE*.01),(result.length-1-i)/(INVESTIGATION_RATE*.035));
      result[i] = value * Math.max(0,edge);
    }
    return result;
  }
  return {'foley-paper':texture('paper',1.16,305571),'foley-chair':texture('chair',.86,305572),'foley-folio':texture('folio',.94,305573)};
}
