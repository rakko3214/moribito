import type { SaveDataV1 } from "@moribito/shared";
import { describe, expect, it } from "vitest";
import { GameBridge } from "../bridge/GameBridge.js";
import { getMapDecorations } from "../world/mapPresentation.js";
import { mapWorldSprites } from "../world/mapTerrainPresentation.js";
import { GameRuntime } from "./GameRuntime.js";

describe("player home upgrade acceptance flow", () => {
  it("orders both upgrades in sequence and restores the final home from a save", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge); let saved: SaveDataV1 | undefined; let revision = 0;
    bridge.onReact((event) => {
      if (event.type !== "SAVE_REQUEST") return;
      saved = structuredClone(event.payload); revision += 1;
      bridge.toGame({ type: "SAVE_COMPLETED", payload: { revision, savedAt: new Date().toISOString() } });
    });
    bridge.toGame({ type: "START_NEW_GAME" });
    const state = runtime.getState(); state.player.money = 2000;
    state.inventory.items.push({ itemId: "item_wood", quantity: 65 }, { itemId: "item_stone", quantity: 35 });

    expect(runtime.construction.order("house_upgrade_2")).toBe(false);
    expect(runtime.construction.order("house_upgrade_1")).toBe(true);
    expect(runtime.construction.order("house_upgrade_2")).toBe(true);
    expect(runtime.construction.homeUpgradeStage()).toBe(2);
    expect(runtime.placement.placementLimit("map_home")).toBe(20);
    expect(mapWorldSprites("map_homestead", state.events.flags)[0]?.key).toBe("world-homestead-house-v1");
    expect(getMapDecorations("map_home", state.events.flags).find((item) => item.kind === "label")?.text).toBe("結師の家");

    bridge.toGame({ type: "REQUEST_SAVE" }); expect(saved).toBeDefined();
    const restoredBridge = new GameBridge(); const restored = new GameRuntime(restoredBridge); restoredBridge.toGame({ type: "LOAD_GAME", payload: saved! });
    expect(restored.construction.homeUpgradeStage()).toBe(2);
    expect(restored.getState().player.money).toBe(300);
    expect(restored.inventory.quantity("item_wood")).toBe(0);
    expect(restored.inventory.quantity("item_stone")).toBe(0);
    expect(restored.placement.placementLimit("map_home")).toBe(20);
    runtime.destroy(); restored.destroy();
  });
});
