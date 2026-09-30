import type { SaveDataV1 } from "@moribito/shared";
import { describe, expect, it } from "vitest";
import { GameBridge } from "../bridge/GameBridge.js";
import { findRoute, objectiveDestination } from "../world/navigationGuide.js";
import { mapAccess } from "../world/progressionGate.js";
import { GameRuntime } from "./GameRuntime.js";

function growDaikon(runtime: GameRuntime, plotId: string) {
  expect(runtime.farming.act(plotId)).toBe("till");
  expect(runtime.farming.act(plotId)).toBe("plant");
  expect(runtime.farming.act(plotId)).toBe("water");
  for (let day = 0; day < 2; day += 1) {
    runtime.farming.advanceDay();
    expect(runtime.farming.act(plotId)).toBe("water");
  }
  runtime.farming.advanceDay();
  expect(runtime.farming.act(plotId)).toBe("harvest");
}

describe("First Playable acceptance flow", () => {
  it("runs from a new game through chapter three and resumes the completed save", () => {
    const bridge = new GameBridge();
    const runtime = new GameRuntime(bridge);
    let saved: SaveDataV1 | undefined;
    let revision = 0;
    bridge.onReact((event) => {
      if (event.type !== "SAVE_REQUEST") return;
      saved = structuredClone(event.payload);
      revision += 1;
      bridge.toGame({ type: "SAVE_COMPLETED", payload: { revision, savedAt: new Date().toISOString() } });
    });
    bridge.toGame({ type: "START_NEW_GAME" });

    expect(objectiveDestination(1, runtime.chapterOne.step)).toBe("map_homestead");
    expect(findRoute("map_home", "map_shrine")).toEqual(["map_home", "map_homestead", "map_village", "map_shrine_approach", "map_shrine"]);
    expect(mapAccess("map_old_pond", { chapterTwoStep: runtime.chapterTwo.step, chapterThreeStep: runtime.chapterThree.step }).allowed).toBe(false);

    runtime.npcs.talk("shiki");
    runtime.chapterOne.recordVisit("map_home");
    growDaikon(runtime, "acceptance_plot_1");
    growDaikon(runtime, "acceptance_plot_2");
    runtime.gathering.collect("map_homestead", "wood_acceptance", "item_wood", 2);
    runtime.gathering.collect("map_homestead", "herb_acceptance", "item_yomogi", 1);
    runtime.npcs.talk("kaede");
    runtime.npcs.talk("genzo");
    runtime.npcs.talk("tessai");
    expect(runtime.villagerRequests.deliverTo("kaede")).toBeDefined();
    expect(runtime.villagerRequests.deliverTo("tessai")).toBeDefined();
    runtime.chapterOne.recordVisit("map_shrine");
    runtime.combat.start();
    for (let hit = 0; hit < 5; hit += 1) runtime.combat.attack();
    expect(runtime.combat.cleanse()).toBe(true);

    expect(runtime.chapterOne.isComplete).toBe(true);
    expect(runtime.getState().progression.chapter).toBe(2);
    expect(objectiveDestination(2, runtime.chapterTwo.step)).toBe("map_river");
    expect(mapAccess("map_old_pond", { chapterTwoStep: runtime.chapterTwo.step, chapterThreeStep: runtime.chapterThree.step }).allowed).toBe(false);

    expect(runtime.fishing.cast()).toBe("fish_ayu");
    expect(runtime.cooking.cook("simmered_daikon")).toBe(true);
    expect(runtime.alchemy.craft()).toBe(true);
    expect(runtime.offering.offer("food_simmered_daikon")).toBe(true);
    expect(runtime.offering.offer("fish_ayu")).toBe(true);
    expect(runtime.offering.offer("medicine_healing")).toBe(true);
    runtime.npcs.talk("kannushi");
    expect(runtime.chapterTwo.step).toBe("purify_bakegaeru");
    expect(mapAccess("map_old_pond", { chapterTwoStep: runtime.chapterTwo.step, chapterThreeStep: runtime.chapterThree.step }).allowed).toBe(true);
    expect(findRoute("map_shrine", "map_old_pond")).toEqual(["map_shrine", "map_shrine_approach", "map_village", "map_river", "map_old_pond"]);
    runtime.bakegaeru.start();
    for (let hit = 0; hit < 12; hit += 1) runtime.bakegaeru.attack();
    expect(runtime.bakegaeru.cleanse()).toBe(true);
    expect(runtime.chapterTwo.recordBossCleansed()).toBe(true);

    expect(runtime.chapterTwo.isComplete).toBe(true);
    expect(runtime.getState().progression.chapter).toBe(3);
    expect(runtime.getState().yokai).toEqual({ equippedCardId: null, ownedCards: [] });
    expect(mapAccess("map_forest", { chapterTwoStep: runtime.chapterTwo.step, chapterThreeStep: runtime.chapterThree.step }).allowed).toBe(false);

    expect(runtime.chapterThree.step).toBe("revisit_old_pond");
    runtime.chapterThree.recordVisit("map_old_pond");
    runtime.npcs.talk("yota");
    expect(runtime.chapterThree.step).toBe("enter_forest");
    expect(mapAccess("map_forest", { chapterTwoStep: runtime.chapterTwo.step, chapterThreeStep: runtime.chapterThree.step }).allowed).toBe(true);
    runtime.chapterThree.recordVisit("map_forest");
    expect(mapAccess("map_forest_depths", { chapterTwoStep: runtime.chapterTwo.step, chapterThreeStep: runtime.chapterThree.step }).allowed).toBe(true);
    expect(mapAccess("map_yodomi_grove", { chapterTwoStep: runtime.chapterTwo.step, chapterThreeStep: runtime.chapterThree.step }).allowed).toBe(false);
    for (let clue = 1; clue <= 3; clue += 1) {
      runtime.gathering.collect("map_forest", `clue_${clue}`, `clue_yota_${clue}`);
    }
    runtime.chapterThree.recordKodamaEncounter();
    expect(runtime.chapterThree.step).toBe("fulfill_offering");
    // Gather and cook the required gathered-food offering instead of injecting
    // its finished dish: this catches mismatched ingredient IDs in recipes.
    expect(runtime.gathering.collect("map_homestead", "chapter_three_herbs", "item_yomogi", 2)).toBe(true);
    for (let count = 0; count < 2; count += 1) {
      expect(runtime.cooking.cook("herb_rice")).toBe(true);
      expect(runtime.offering.offerChapterThree("food_herb_rice")).toBe(true);
    }
    for (const [itemId, quantity] of [["food_simmered_daikon", 4], ["food_carrot_kinpira", 2], ["food_grilled_ayu", 2]] as const) {
      runtime.inventory.add(itemId, quantity);
      for (let count = 0; count < quantity; count += 1) expect(runtime.offering.offerChapterThree(itemId)).toBe(true);
    }
    expect(runtime.offering.chapterThreeProgress).toEqual({ total: 10, varieties: 4, fish: 2, gathered: 2 });
    expect(runtime.chapterThree.step).toBe("purify_tree");
    expect(mapAccess("map_yodomi_grove", { chapterTwoStep: runtime.chapterTwo.step, chapterThreeStep: runtime.chapterThree.step }).allowed).toBe(true);
    expect(findRoute("map_village", "map_yodomi_grove")).toEqual(["map_village", "map_forest", "map_forest_depths", "map_yodomi_grove"]);
    runtime.yodomiTree.start();
    for (let hit = 0; hit < 15; hit += 1) runtime.yodomiTree.attack();
    expect(runtime.yodomiTree.cleanse()).toBe(true);
    runtime.chapterThree.recordTreeCleansed();
    expect(runtime.chapterThree.recordShrineReport()).toBe(true);
    expect(runtime.chapterThree.recordNotebookRead()).toBe(true);
    expect(runtime.chapterThree.completeDeparture()).toBe(true);

    expect(runtime.chapterThree.isComplete).toBe(true);
    expect(runtime.getState().progression).toMatchObject({ chapter: 4, storyStep: "first_playable_complete" });
    bridge.toGame({ type: "REQUEST_SAVE" });
    expect(saved).toBeDefined();

    const restoredBridge = new GameBridge();
    const restored = new GameRuntime(restoredBridge);
    restoredBridge.toGame({ type: "LOAD_GAME", payload: saved! });
    expect(restored.chapterOne.isComplete).toBe(true);
    expect(restored.chapterTwo.isComplete).toBe(true);
    expect(restored.chapterThree.isComplete).toBe(true);
    expect(restored.getState().yokai).toEqual({ equippedCardId: null, ownedCards: [] });
    expect(restored.getState().progression).toMatchObject({ chapter: 4, storyStep: "first_playable_complete" });

    runtime.destroy();
    restored.destroy();
  });
});
