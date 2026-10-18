/** Interface symbols are decorative; the neighbouring text supplies their meaning. */
const PATHS = {
  chrome: "M8 3h8v4h4v10h-4v4H8v-4H4V7h4z M9 9h6v6H9z",
  nerve: "M12 3l7 4v6c0 4-7 8-7 8s-7-4-7-8V7z M9 12l2 2 4-5",
  face: "M4 5h16v11h-6l-5 4v-4H4z M8 9h8 M8 12h5",
  ghost: "M5 19V9a7 7 0 0114 0v10l-4-2-3 3-3-3z M9 9v2 M15 9v2",
  quill: "M5 20l3-8L19 3l2 2-9 11z M8 16l-3 4 M9 13l3 3",
  lumen: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
  helion: "M5 21V9h5V3h4v6h5v12 M9 21v-5h6v5 M10 12h4",
  wards: "M3 11l9-7 9 7 M5 10v11h14V10 M10 21v-7h4v7",
  money: "M4 7l8-4 8 4v10l-8 4-8-4z M4 7l8 4 8-4 M12 11v10",
  strain: "M13 2L5 13h6l-1 9 9-12h-6z",
  fact: "M6 3h9l4 4v14H6z M14 3v5h5 M9 13l2 2 5-5",
  claim: "M4 4h16v13h-6l-5 4v-4H4z M10 8a2 2 0 014 0c0 2-2 2-2 4 M12 14v1",
  promise: "M5 7h14v14H5z M8 3v7 M16 3v7 M8 14h8 M8 17h5",
  permission: "M5 11h14v10H5z M8 11V7a4 4 0 018 0v4 M12 15v3",
  location: "M12 22S4 14 4 9a8 8 0 0116 0c0 5-8 13-8 13z M9 9a3 3 0 106 0 3 3 0 10-6 0",
  memory: "M8 3l9 3-2 15-9-3z M10 8l4 2 M9 13l4 2",
  archive: "M3 4h18v5H3z M5 9v12h14V9 M9 13h6",
  witness: "M8 7a4 4 0 108 0 4 4 0 10-8 0 M4 21v-3a8 8 0 0116 0v3",
} as const;
export type SymbolName = keyof typeof PATHS;
export function Symbol({ name }: { name: SymbolName }) {
  return <svg className="ui-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={PATHS[name]} /></svg>;
}
