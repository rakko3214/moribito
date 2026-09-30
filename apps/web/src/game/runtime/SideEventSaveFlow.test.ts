import { describe, expect, it } from "vitest";
import { GameBridge } from "../bridge/GameBridge.js";
import { GameRuntime } from "./GameRuntime.js";

describe("side event save flow", () => {
  it("restores completion, reward and friendship without duplicating them", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge); let saved: ReturnType<GameRuntime["getState"]> | undefined;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") saved = event.payload; });
    bridge.toGame({ type: "START_NEW_GAME" }); runtime.inventory.add("item_daikon", 1);
    expect(runtime.sideEvents.complete("side_shiki_first_harvest")?.title).toBe("最初の収穫");
    bridge.toGame({ type: "REQUEST_SAVE" });
    expect(saved?.events.completedEventIds).toContain("side_shiki_first_harvest");
    expect(saved?.npcs.states.shiki?.friendship).toBe(3); expect(saved?.player.money).toBe(580);

    const restoredBridge = new GameBridge(); const restored = new GameRuntime(restoredBridge);
    restoredBridge.toGame({ type: "LOAD_GAME", payload: saved! });
    expect(restored.sideEvents.completedCount).toBe(1);
    expect(restored.sideEvents.forNpc("shiki")).toHaveLength(0);
    expect(restored.sideEvents.complete("side_shiki_first_harvest")).toBeUndefined();
    expect(restored.getState().player.money).toBe(580);
  });
});
