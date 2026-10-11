import type { GameState } from "./types";

// Resume the saved task; revisiting the canal never resets its costs or beats.
export function depotResume(s: GameState): string {
  if (s.flags.depot_chrome) return s.flags.depot_buffer || s.flags.depot_disconnect ? "act2_depot_return" : "act2_depot_relay";
  if (s.flags.depot_ghost) return s.flags.depot_return_pass ? "act2_depot_return_pass" : s.flags.depot_cart_pass ? "act2_depot_cart_pass" : "act2_depot_outer_pass";
  if (s.flags.depot_nerve) return s.flags.depot_cradle || s.flags.depot_direct ? "act2_depot_load" : "act2_depot_carry";
  if (s.flags.depot_face) return s.flags.depot_own_liability ? "act2_depot_contract" : "act2_depot_liability";
  return "act2_route_crossing";
}

export function depotOutcome(s: GameState): string {
  if (!s.flags.depot_started) return "";
  const spent = s.flags.depot_buffer ? " The ten-creds buffer fee remains spent." : s.flags.depot_disconnect ? " The disconnect effort and machine service fault remain." : s.flags.depot_cradle ? " The five-creds cradle rental and carrying effort remain spent." : s.flags.depot_direct ? " The direct-carry effort remains spent." : s.flags.depot_return_pass ? " The strain from waiting remains." : "";
  if (s.flags.depot_failed) return `Your trained depot attempt left the case held.${s.flags.kerr_route_courier ? " A later registered courier supplied the collection." : ""}${spent} Its failure remains on your record.`;
  if (!s.flags.depot_complete) return `Your trained depot task remains unfinished; its saved progress remains.${spent}`;
  if (s.flags.depot_buffer) return "You spent ten creds on a disposable release buffer and preserved the depot return address. No service fault was left.";
  if (s.flags.depot_disconnect) return "You isolated the recipient relay with one strain and preserved the depot return address. The depot retains a service fault, separate from any recipient register.";
  if (s.flags.depot_ghost) return "You waited through the cart pass for the patrol's return, adding one strain. The crossing made no new recipient entry.";
  if (s.flags.depot_cradle) return "You paid five creds for a landing cradle and carried the closed case low, adding one strain beyond the planned journey.";
  if (s.flags.depot_direct) return "You carried the closed case low without renting a cradle, adding two strain beyond the planned journey.";
  if (s.flags.depot_shift_owed) return s.flags.depot_shift_kept ? "You kept the depot return shift you offered in your own name. Kerr owed none of that work." : "You owe the depot one return shift in your own name. Kerr owes no work; the promise is still open.";
  if (s.flags.depot_cash_liability) return "You paid fifteen creds for the steward to accept release liability. No return shift is owed.";
  if (s.flags.depot_registered_contract) return "You accepted a release contract recording your handle and Kerr as recipient. Any private-collection promise was broken.";
  return "";
}
