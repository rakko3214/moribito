import { describe, expect, it } from "vitest";
import { saveDataV1Schema } from "@moribito/shared";
import { GameBridge } from "../bridge/GameBridge.js";
import { createDeveloperPreset, DEVELOPER_PRESETS } from "./DeveloperPresets.js";
import { GameRuntime } from "./GameRuntime.js";

describe("developer presets", () => {
  it("creates schema-valid states for every sandbox", () => {
    for (const id of Object.keys(DEVELOPER_PRESETS) as Array<keyof typeof DEVELOPER_PRESETS>) {
      expect(saveDataV1Schema.safeParse(createDeveloperPreset(id)).success).toBe(true);
    }
  });

  it("opens the chapter two boss at the old pond", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge);
    bridge.toGame({ type: "LOAD_GAME", payload: createDeveloperPreset("chapter2Boss") });
    expect(runtime.getState().player.mapId).toBe("map_old_pond"); expect(runtime.chapterTwo.step).toBe("purify_bakegaeru"); runtime.destroy();
  });

  it("opens the chapter three boss after the Kodama encounter", () => {
    const bridge = new GameBridge(); const runtime = new GameRuntime(bridge);
    bridge.toGame({ type: "LOAD_GAME", payload: createDeveloperPreset("chapter3Boss") });
    expect(runtime.getState().player.mapId).toBe("map_yodomi_grove"); expect(runtime.chapterThree.step).toBe("purify_tree"); runtime.destroy();
  });

  it.each([
    ["cooking", "map_nagomi", 10 * 60],
    ["alchemy", "map_clinic", 10 * 60],
    ["forge", "map_forge", 10 * 60],
    ["fishing", "map_river", 7 * 60],
  ] as const)("places %s near its available instructor", (id, mapId, minutes) => {
    const state = createDeveloperPreset(id);
    expect(state.player.mapId).toBe(mapId);
    expect(state.time.minutes).toBe(minutes);
  });

  it("places the cooking test in front of the preparation counter", () => {
    expect(createDeveloperPreset("cooking").player).toMatchObject({ mapId: "map_nagomi", x: 410, y: 400 });
  });
});
