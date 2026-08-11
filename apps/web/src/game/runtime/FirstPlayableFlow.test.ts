import type { SaveDataV1 } from "@moribito/shared";
import { describe, expect, it } from "vitest";
import { GameBridge } from "../bridge/GameBridge.js";
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

    runtime.npcs.talk("shiki");
    runtime.chapterOne.recordVisit("map_home");
    growDaikon(runtime, "acceptance_plot_1");
    growDaikon(runtime, "acceptance_plot_2");
    runtime.gathering.collect("map_village", "wood_acceptance", "item_wood", 2);
    runtime.gathering.collect("map_village", "herb_acceptance", "item_yomogi", 1);
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

    expect(runtime.fishing.cast()).toBe("fish_ayu");
    expect(runtime.cooking.cook("simmered_daikon")).toBe(true);
    expect(runtime.alchemy.craft()).toBe(true);
    expect(runtime.offering.offer("food_simmered_daikon")).toBe(true);
    expect(runtime.offering.offer("fish_ayu")).toBe(true);
    expect(runtime.offering.offer("medicine_healing")).toBe(true);
    runtime.npcs.talk("kannushi");
    runtime.bakegaeru.start();
    for (let hit = 0; hit < 12; hit += 1) runtime.bakegaeru.attack();
    expect(runtime.bakegaeru.cleanse()).toBe(true);
    expect(runtime.chapterTwo.recordBossCleansed()).toBe(true);

    expect(runtime.chapterTwo.isComplete).toBe(true);
    expect(runtime.getState().progression.chapter).toBe(3);

    runtime.npcs.talk("yota");
    runtime.chapterThree.recordVisit("map_forest");
    for (let clue = 1; clue <= 3; clue += 1) {
      runtime.gathering.collect("map_forest", `clue_${clue}`, `clue_yota_${clue}`);
    }
    runtime.chapterThree.recordKodamaEncounter();
    runtime.yodomiTree.start();
    for (let hit = 0; hit < 15; hit += 1) runtime.yodomiTree.attack();
    expect(runtime.yodomiTree.cleanse()).toBe(true);
    runtime.chapterThree.recordTreeCleansed();
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
    expect(restored.getState().progression).toMatchObject({ chapter: 4, storyStep: "first_playable_complete" });

    runtime.destroy();
    restored.destroy();
  });
});
