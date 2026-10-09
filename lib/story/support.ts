import { FIELD_KITS } from "../loadout";
import type { GameState, Scene } from "../types";

const recover = (state: GameState, amount: number, method: string) => ({
  strain: -Math.min(amount, state.strain),
  flags: ["week_recovered", `recovery_${method}`],
  journal: [{ id: "week-recovery", text: `You took ${method === "clinic" ? "paid clinic care" : method === "favor" ? "a staffed rest using a clinic favor" : "a short rest beside the canal"}. Pressure eased. The visit moved no witness, authenticated no evidence, and erased no exposed record.`, kind: "fact" as const }],
});

export const SUPPORT_SCENES: Record<string, Scene> = {
  act2_workshop: {
    id: "act2_workshop", location: "District repair bench", speaker: "Quill",
    text: "Quill has laid four cases on the repair bench. None is an all-purpose answer. A probe belongs at a reader, a harness under a chair, a desk guide beside a form, and a shroud on a service route.\n\n'One case in this shipment for you,' he says. 'Keep enough for the person on the other end of the job.'\n\nAn unregistered clinic room for Nia costs ninety creds. Staffed recovery for you costs forty-five. Tools can improve a route; they reserve no room and buy no person's consent. You can leave the cases and come back before the week closes.",
    choices: [
      ...FIELD_KITS.map((kit) => ({ id: `buy-${kit.id}`, label: `Buy the ${kit.name}.`, detail: `${kit.price} creds. ${kit.uses} One field kit this week; it stays in your inventory.`, requireCreds: kit.price, hideIfFlag: "kit_bought", effects: { creds: -kit.price, itemsAdd: [kit.id], flags: ["kit_bought"], journal: [{ id: "field-kit", text: `Quill supplied a ${kit.name} for ${kit.price} creds from the district repair bench. Its uses are specific; it reserves no witness room.`, kind: "fact" as const }] }, next: "districts" })),
      { id: "leave-workshop", label: "Keep the care budget. Return to the district board.", next: "districts" },
    ],
  },
  act2_recovery: {
    id: "act2_recovery", location: "Glass Chapel", speaker: "Sister Lumen",
    text: "Lumen takes the chair away from the table and puts an ordinary seat beside the window. 'This one doesn't keep your hour.'\n\nYou can pay for a staffed rest, ask her to spend a clinic favor, or take a short pause beside the canal. There is one recovery visit before the week closes. It eases pressure without completing any promise you made outside this room. A registered or exposed witness location stays exposed.",
    choices: [
      { id: "pay-recovery", label: "Pay forty-five creds for staffed recovery.", detail: "Recover up to 3 strain. Keep clinic trust; spend money that could cover equipment or witness care.", requireCreds: 45, requireStrain: 1, hideIfFlag: "week_recovered", effects: (state) => ({ ...recover(state, 3, "clinic"), creds: -45 }), next: "act2_recovery_after" },
      { id: "favor-recovery", label: "Ask Lumen to cover a staffed rest.", detail: "Clinic standing 2 required. Spend one step of clinic trust; recover up to 2 strain.", requireFaction: { faction: "lumen", min: 2 }, requireStrain: 1, hideIfAnyFlag: ["week_recovered", "betrayed_lumen"], effects: (state) => ({ ...recover(state, 2, "favor"), factions: { lumen: -1 } }), next: "act2_recovery_after" },
      { id: "short-recovery", label: "Take a short rest on the canal steps.", detail: "Recover 1 strain without spending creds or a favor. This uses the week's recovery visit.", requireStrain: 1, hideIfFlag: "week_recovered", effects: (state) => recover(state, 1, "short"), next: "act2_recovery_after" },
      { id: "leave-recovery", label: "Return without using the recovery visit.", next: "act2_middle" },
    ],
  },
  act2_recovery_after: {
    id: "act2_recovery_after", location: "The dry canal", speaker: "Sister Lumen",
    text: (state) => `${state.flags.recovery_short ? "The canal steps are cold. You stay long enough to stop checking the stair every time a door closes. Lumen leaves a cup beside you and gives you the silence." : "The clinic gives you a chair, water, and someone who notices when you stop clenching your hands. Lumen puts the empty cup back on the shelf before opening the door."}\n\n'Now decide who needs what you have left,' she says.\n\n${state.flags.witness_lost ? "Nia's first registered room remains in the tower's records. Your rest did not remove that breach." : state.flags.witness_safe ? "Nia's safe room remains hers. Her recording and publication decisions remain separate from your recovery." : state.flags.memory_witness || state.flags.memory_redacted ? "Nia's transfer remains open. A private roster still needs a route and a room." : "The archive source still has its own limits. Rest supplied no authentication."}\n\nThe week is still waiting outside.`,
    choices: [{ id: "return-after-recovery", label: "Return to the unfinished work.", next: "act2_middle" }],
  },
};
