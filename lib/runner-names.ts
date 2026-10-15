const HANDLES = [
  "Afterglow", "Backbeat", "Blackcap", "Bluewire", "Brass", "Cinder", "Coil", "Copper",
  "Crossfade", "Deadbolt", "Drift", "Ember", "Flint", "Foxglove", "Glitch", "Hush",
  "Ink", "Lowlight", "Moth", "Neon", "Nocturne", "Patch", "Raincheck", "Rivet",
  "Rook", "Sideband", "Signal", "Silver", "Splice", "Static", "Switch", "Tin",
  "Torque", "Undertow", "Velvet", "Wire", "Zero",
] as const;
const GIVEN_NAMES = [
  "Amir", "Ari", "Dara", "Devi", "Ellis", "Esme", "Imani", "Iris", "Jae", "Jules",
  "Kai", "Kiran", "Leila", "Luca", "Mika", "Mina", "Nico", "Noor", "Oren", "Ravi",
  "Remy", "Rhea", "Robin", "Rowan", "Sami", "Sana", "Sasha", "Sol", "Tali", "Teo",
  "Tomas", "Val", "Yara", "Zoya",
] as const;

function pick(names: readonly string[], current: string) {
  const candidates = names.filter(name => name.toLowerCase() !== current.trim().toLowerCase());
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export const randomStreetHandle = (current = "") => pick(HANDLES, current);
export const randomGivenName = (current = "") => pick(GIVEN_NAMES, current);
