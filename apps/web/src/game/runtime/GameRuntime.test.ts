import { describe, expect, it } from "vitest";
import { GameBridge } from "../bridge/GameBridge.js";
import { GameRuntime } from "./GameRuntime.js";

describe("GameRuntime save loop", () => {
  it("freezes village time behind a modal and resumes without catch-up", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge);
    bridge.toGame({ type: "START_NEW_GAME" });
    const before = { ...runtime.getState().time };
    runtime.update(60000, true);
    expect(runtime.getState().time).toEqual(before);
    bridge.toGame({ type: "SAVE_COMPLETED", payload: { revision: 1, savedAt: new Date().toISOString() } });
    runtime.update(1000);
    expect(runtime.getState().time.minutes).toBeGreaterThanOrEqual(before.minutes);
    expect(runtime.getState().time.minutes - before.minutes).toBeLessThan(5);
    runtime.destroy();
  });
  it("still permits saving while a world modal is open", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge);
    let requests = 0;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") requests++; });
    bridge.toGame({ type: "START_NEW_GAME" });
    runtime.update(16, true);
    bridge.toGame({ type: "REQUEST_SAVE" });
    expect(requests).toBe(1);
    runtime.destroy();
  });
  it("starts a new game at the grandfather's homestead", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    bridge.toGame({ type: "START_NEW_GAME" });
    expect(runtime.getState().player).toMatchObject({ mapId: "map_homestead", x: 400, y: 360, equippedToolId: "tool_hoe" });
    expect(runtime.getState().world.maps.map_home?.placedObjects).toEqual(expect.arrayContaining([
      expect.objectContaining({ itemId: "furniture_bed" }),
      expect.objectContaining({ itemId: "furniture_workbench" }),
      expect.objectContaining({ itemId: "furniture_storage_box" }),
    ]));
    runtime.destroy();
  });

  it("persists the selected homestead tool", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge);
    bridge.toGame({ type: "START_NEW_GAME" });
    runtime.equipTool("tool_pickaxe");
    expect(runtime.getState().player.equippedToolId).toBe("tool_pickaxe");
  });

  it("creates, mutates and requests a validated save", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    let requestedRevision: number | undefined;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") requestedRevision = event.payload.revision; });
    bridge.toGame({ type: "START_NEW_GAME" });
    runtime.updatePlayer("map_village", 700, 640, "right");
    bridge.toGame({ type: "REQUEST_SAVE" });
    expect(requestedRevision).toBe(0);
    expect(runtime.getState().player).toMatchObject({ x: 700, y: 640, direction: "right" });
  });

  it("keeps dirty state when movement occurs during a save", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    const statuses: string[] = [];
    bridge.onReact((event) => { if (event.type === "SAVE_STATE_CHANGED") statuses.push(event.payload.status); });
    bridge.toGame({ type: "START_NEW_GAME" });
    bridge.toGame({ type: "REQUEST_SAVE" });
    runtime.updatePlayer("map_village", 680, 650, "right");
    bridge.toGame({ type: "SAVE_COMPLETED", payload: { revision: 1, savedAt: new Date().toISOString() } });
    expect(statuses.at(-1)).toBe("dirty");
  });

  it("unsubscribes from the bridge when destroyed", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    let saveRequests = 0;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") saveRequests += 1; });
    bridge.toGame({ type: "START_NEW_GAME" });
    runtime.destroy();
    bridge.toGame({ type: "REQUEST_SAVE" });
    expect(saveRequests).toBe(0);
  });

  it("defers a save during a boss battle until rewards are fully applied", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge); const payloads: Array<ReturnType<GameRuntime["getState"]>> = [];
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") payloads.push(event.payload); });
    bridge.toGame({ type: "START_NEW_GAME" }); runtime.bakegaeru.start(); bridge.toGame({ type: "REQUEST_SAVE" });
    expect(payloads).toHaveLength(0);
    for (let i = 0; i < 12; i += 1) runtime.bakegaeru.attack();
    runtime.bakegaeru.cleanse();
    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.inventory.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ itemId: "material_purified_water", quantity: 1 }),
      expect.objectContaining({ itemId: "material_yuishi_fragment", quantity: 1 }),
    ]));
  });

  it("round-trips a forest save with chapter three progress", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge); let saved: ReturnType<GameRuntime["getState"]> | undefined;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") saved = event.payload; });
    bridge.toGame({ type: "START_NEW_GAME" }); runtime.updatePlayer("map_forest", 260, 600, "right");
    runtime.gathering.collect("map_forest", "clue_1", "clue_yota_footprint"); bridge.toGame({ type: "REQUEST_SAVE" });
    expect(saved?.player.mapId).toBe("map_forest");
    const secondBridge = new GameBridge(); const restored = new GameRuntime(secondBridge); secondBridge.toGame({ type: "LOAD_GAME", payload: saved! });
    expect(restored.getState().player.mapId).toBe("map_forest");
    expect(restored.getState().world.maps.map_forest?.collectedObjects).toContain("clue_1");
  });

  it("restores a yokai card granted by a later friendship event", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge);
    bridge.toGame({ type: "START_NEW_GAME" });
    runtime.yokaiCards.unlock("kappa");
    expect(runtime.getState().yokai).toMatchObject({ equippedCardId: "kappa", ownedCards: [expect.objectContaining({ id: "kappa", rank: 1 })] });
    let saved: ReturnType<GameRuntime["getState"]> | undefined;
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") saved = event.payload; });
    bridge.toGame({ type: "REQUEST_SAVE" });
    expect(saved?.yokai?.equippedCardId).toBe("kappa");
    const restoredBridge = new GameBridge(); const restored = new GameRuntime(restoredBridge);
    restoredBridge.toGame({ type: "LOAD_GAME", payload: saved! });
    expect(restored.yokaiCards.equippedId).toBe("kappa");
  });

  it("immediately saves completed story progression", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    const payloads: Array<ReturnType<GameRuntime["getState"]>> = [];
    bridge.onReact((event) => { if (event.type === "SAVE_REQUEST") payloads.push(event.payload); });
    bridge.toGame({ type: "START_NEW_GAME" });
    const state = runtime.getState();
    state.quests.completedIds.push("chapter2_bakegaeru");
    state.npcs.states.yota = { friendship: 1, flags: [] };
    state.events.flags.push("chapter3:revisited_restored_pond", "chapter3:visited_forest", "chapter3:kodama_protected_yota", "chapter3:yodomi_tree_cleansed", "chapter3:reported_kodama_truth", "chapter3:read_grandfather_notebook");
    state.world.maps.map_forest = {
      collectedObjects: ["clue_1", "clue_2", "clue_3"],
      openedChests: [],
      destroyedObjects: [],
      flags: [],
    };
    for (const [itemId, quantity] of [["food_simmered_daikon", 5], ["food_carrot_kinpira", 2], ["food_grilled_ayu", 1], ["food_herb_rice", 2]] as const) {
      runtime.inventory.add(itemId, quantity);
      for (let count = 0; count < quantity; count += 1) runtime.offering.offerChapterThree(itemId);
    }

    expect(runtime.chapterThree.completeDeparture()).toBe(true);
    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.progression).toMatchObject({ chapter: 4, storyStep: "first_playable_complete" });
    expect(payloads[0]?.quests.completedIds).toContain("chapter3_yodomi_tree");
  });
});
