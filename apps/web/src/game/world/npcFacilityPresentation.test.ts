import { describe, expect, it } from "vitest";
import { npcFacilityAction, npcFacilityOption } from "./npcFacilityPresentation.js";

describe("NPC facility presentation", () => {
  it.each([
    ["kaede", "cooking"], ["sogen", "alchemy"], ["tessai", "smithing"], ["genzo", "fishing"],
  ] as const)("routes %s to %s", (npcId, action) => {
    const option = npcFacilityOption(npcId);
    expect(option?.enabled).toBe(true);
    expect(npcFacilityAction(option?.id ?? "")).toBe(action);
  });

  it("does not attach facility actions to unrelated villagers", () => {
    expect(npcFacilityOption("shiki")).toBeUndefined();
    expect(npcFacilityAction("side:event")).toBeUndefined();
  });
});
