const PLACES: { test: (location: string) => boolean; src: string }[] = [
  { test: (location) => /chapel|chair|stair/.test(location), src: "/art/chapel.jpg" },
  { test: (location) => /spire|helion/.test(location), src: "/art/spire.jpg" },
  { test: (location) => /canal/.test(location), src: "/art/canal.jpg" },
  { test: (location) => /ward nine|nine/.test(location), src: "/art/wardnine.jpg" },
];

export function placeArt(location: string): string {
  const value = location.toLowerCase();
  return PLACES.find((place) => place.test(value))?.src ?? "/art/stall.jpg";
}

export const DISTRICT_ART: Record<string, string> = {
  "to-kerr": "/art/stall.jpg",
  "to-lumen": "/art/chapel.jpg",
  "to-helion": "/art/spire.jpg",
  "to-ward-nine": "/art/wardnine.jpg",
};
