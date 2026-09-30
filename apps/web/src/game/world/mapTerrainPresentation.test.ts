import { describe, expect, it } from "vitest";
import { gatheringSprite, mapTerrainTexture, mapWorldSprites, terrainTextures, worldSpriteTextures } from "./mapTerrainPresentation.js";

describe("map terrain presentation", () => {
  it("registers the first formal homestead terrain asset", () => {
    expect(mapTerrainTexture("map_homestead")).toEqual({ key: "terrain-homestead-grass-v1", path: "/assets/terrain/homestead-grass-v1.png", tileScale: 0.35 });
    expect(terrainTextures()).toHaveLength(6);
  });

  it("registers village, interior, and shrine terrain families", () => {
    expect(mapTerrainTexture("map_village")?.key).toBe("terrain-village-grass-v1");
    expect(mapTerrainTexture("map_home")?.key).toBe("terrain-interior-tatami-v1");
    expect(mapTerrainTexture("map_nagomi")?.key).toBe("terrain-interior-tatami-v1");
    expect(mapTerrainTexture("map_shrine_approach")?.key).toBe("terrain-shrine-stone-v1");
    expect(mapTerrainTexture("map_shrine")?.key).toBe("terrain-shrine-stone-v1");
    expect(mapTerrainTexture("map_river")?.key).toBe("terrain-river-water-v1");
    expect(mapTerrainTexture("map_forest_depths")?.key).toBe("terrain-forest-floor-v1");
  });

  it("registers homestead world and gathering sprites", () => {
    expect(mapWorldSprites("map_homestead")[0]).toMatchObject({ key: "world-homestead-house-stage1-v1", x: 400, y: 270 });
    expect(mapWorldSprites("map_homestead", ["construction:ordered:house_upgrade_1"])[0]?.key).toBe("world-homestead-house-stage2-v1");
    expect(mapWorldSprites("map_homestead", ["construction:ordered:house_upgrade_2"])[0]?.key).toBe("world-homestead-house-v1");
    expect(gatheringSprite("tool_axe")?.key).toBe("world-harvest-tree-v1");
    expect(gatheringSprite("tool_pickaxe")?.key).toBe("world-field-rock-v1");
    expect(mapWorldSprites("map_river")[0]?.key).toBe("yokai-kappa-field-v1");
    expect(mapWorldSprites("map_forest_depths")[0]?.key).toBe("yokai-kodama-field-v1");
    expect(mapWorldSprites("map_village")).toHaveLength(5);
    expect(mapWorldSprites("map_shrine")[0]?.key).toBe("world-shrine-main-hall-v1");
    expect(mapWorldSprites("map_forge")[0]?.key).toBe("world-interior-forge-v1");
    expect(mapWorldSprites("map_clinic")[0]?.key).toBe("world-interior-clinic-v1");
    expect(mapWorldSprites("map_shrine_approach")).toHaveLength(2);
    expect(mapWorldSprites("map_river").some((sprite) => sprite.key === "world-river-bank-v1")).toBe(true);
    expect(mapWorldSprites("map_forest")).toHaveLength(3);
    expect(worldSpriteTextures()).toHaveLength(25);
  });
});
