import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { NpcInteractionSystem } from "./NpcInteractionSystem.js";

describe("NpcInteractionSystem", () => {
  it("gains friendship only on the first conversation each day", () => {
    const state = createInitialState(); const npc = new NpcInteractionSystem(() => state, vi.fn());
    expect(npc.talk("kaede").friendshipGained).toBe(true);
    expect(npc.talk("kaede").friendshipGained).toBe(false);
    expect(npc.friendship("kaede")).toBe(1);
    state.time.day += 1;
    expect(npc.talk("kaede").friendshipGained).toBe(true);
    expect(npc.friendship("kaede")).toBe(2);
  });
  it("stores friendship independently for each villager", () => {
    const state = createInitialState(); const npc = new NpcInteractionSystem(() => state, vi.fn());
    npc.talk("shiki"); npc.talk("genzo"); npc.talk("genzo");
    expect(npc.friendship("shiki")).toBe(1); expect(npc.friendship("genzo")).toBe(1); expect(npc.friendship("tessai")).toBe(0);
  });
});
