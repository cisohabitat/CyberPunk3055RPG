export const APP_VERSION = "0.3.0";
type Incident = { time: string; code: "render-error" | "save-unavailable"; digest?: string };
const incidents: Incident[] = [];
export function recordIncident(code: Incident["code"], digest?: string) {
  incidents.push({ time: new Date().toISOString(), code, ...(digest ? { digest: digest.slice(0, 64) } : {}) });
  if (incidents.length > 10) incidents.shift();
}
export function diagnosticsReport(): string {
  return JSON.stringify({ game: "Saint Shard", version: APP_VERSION, incidents, note: "This report contains no character names, choices, save contents, or identifiers. Nothing is sent automatically." }, null, 2);
}
