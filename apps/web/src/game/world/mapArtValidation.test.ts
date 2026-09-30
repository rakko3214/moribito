import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateWorldSpriteCollisions } from "./mapArtValidation.js";
import { MAP_MANIFEST } from "./mapManifest.js";
import { mapWorldSprites } from "./mapTerrainPresentation.js";
import type { RawTiledMap } from "./mapValidation.js";
import type { MapId } from "./mapTypes.js";

describe("world art collision alignment", () => {
  it.each(Object.entries(MAP_MANIFEST))("keeps authored sprite feet aligned on %s", (mapId, entry) => {
    const raw = JSON.parse(readFileSync(new URL(`../../../public/maps/${entry.file}`, import.meta.url), "utf8")) as RawTiledMap;
    expect(validateWorldSpriteCollisions(mapId, raw, mapWorldSprites(mapId as MapId, []))).toEqual([]);
  });

  it("reports missing, undersized and vertically shifted collision art", () => {
    const raw: RawTiledMap = { layers: [{ name: "collisions", objects: [{ name: "wall", x: 48, y: 30, width: 4, height: 20 }] }] };
    const issues = validateWorldSpriteCollisions("map_test", raw, [
      { key: "house", path: "house.png", x: 50, y: 100, width: 100, height: 80, originY: 1, depth: 2, collisionNames: ["wall", "missing"] },
    ]);
    expect(issues).toEqual(["map_test house is missing collision missing"]);
  });
});
