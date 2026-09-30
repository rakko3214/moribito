import type { SaveDataV1 } from "@moribito/shared";
import { describe, expect, it } from "vitest";
import { GameBridge } from "../bridge/GameBridge.js";
import { GameRuntime } from "./GameRuntime.js";

describe("homestead life acceptance loop", () => {
  it("runs gathering, construction, placement, livestock production and save restore", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge); let saved: SaveDataV1 | undefined; let revision = 0;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") { saved = structuredClone(event.payload); revision += 1; bridge.toGame({ type: "SAVE_COMPLETED", payload: { revision, savedAt: new Date().toISOString() } }); } });
    bridge.toGame({ type: "START_NEW_GAME" });

    expect(runtime.gathering.destroy("map_homestead", "wood_1", "item_wood", 8)).toBe(true);
    expect(runtime.gathering.destroy("map_homestead", "wood_2", "item_wood", 8)).toBe(true);
    expect(runtime.gathering.destroy("map_homestead", "stone_1", "item_stone", 4)).toBe(true);
    expect(runtime.gathering.destroy("map_homestead", "stone_2", "item_stone", 4)).toBe(true);
    expect(runtime.construction.order("chicken_coop")).toBe(true);
    expect(runtime.placement.place("map_homestead", "building_chicken_coop", 294, 462, 0)).toBeDefined();

    const chicken = runtime.livestock.buy("chicken"); expect(chicken).toBeDefined();
    expect(runtime.livestock.buyFeed(3)).toBe(true);
    for (let day = 0; day < 3; day += 1) { expect(runtime.livestock.feed(chicken!.id)).toBe(true); runtime.sleepUntilMorning(); }
    expect(runtime.livestock.collect(chicken!.id)).toBe(true);
    expect(runtime.inventory.quantity("item_egg")).toBe(1);
    expect(runtime.getState().player.money).toBe(105);

    bridge.toGame({ type: "REQUEST_SAVE" }); expect(saved).toBeDefined();
    const restoredBridge = new GameBridge(); const restored = new GameRuntime(restoredBridge); restoredBridge.toGame({ type: "LOAD_GAME", payload: saved! });
    expect({ animals: restored.livestock.animals.length, eggs: restored.inventory.quantity("item_egg"), coopPlaced: restored.placement.list("map_homestead").some((item) => item.itemId === "building_chicken_coop") }).toEqual({ animals: 1, eggs: 1, coopPlaced: true });
    runtime.destroy(); restored.destroy();
  });
});
