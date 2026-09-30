import { describe, expect, it } from "vitest";
import { applyWorldEvent } from "./gameState.js";
import { createNewSnapshot } from "./save.js";

describe("world event contract", () => {
  it("updates movement without mutating other game state", () => {
    const original = createNewSnapshot("14c045e8-905b-41d7-9e79-b64ccde056b0").state;
    const next = applyWorldEvent(original, {
      type: "player.moved",
      player: { ...original.player, x: 420, facing: "right" },
    });
    expect(next.player).toMatchObject({ x: 420, facing: "right" });
    expect(next.world).toEqual(original.world);
    expect(next.progression).toEqual(original.progression);
    expect(original.player.x).toBe(400);
  });
});
