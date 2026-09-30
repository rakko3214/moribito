import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAP_MANIFEST, MAP_MIGRATION_ORDER } from "./mapManifest.js";
import { LIFE_STATION_DEFINITIONS } from "./mapStationCatalog.js";
import { validateTiledMap, validateWorldMapSet, type RawTiledMap } from "./mapValidation.js";

describe("formal map migration manifest", () => {
  it("tracks all 16 maps in a deterministic replacement order", () => { expect(Object.keys(MAP_MANIFEST)).toHaveLength(16); expect(MAP_MIGRATION_ORDER).toHaveLength(16); expect(new Set(MAP_MIGRATION_ORDER).size).toBe(16); expect(MAP_MIGRATION_ORDER.slice(0, 3)).toEqual(["map_homestead", "map_home", "map_village"]); });
  it.each(Object.entries(MAP_MANIFEST))("validates %s Tiled structure", (_id, entry) => {
    const raw = JSON.parse(readFileSync(new URL(`../../../public/maps/${entry.file}`, import.meta.url), "utf8")) as RawTiledMap;
    expect(validateTiledMap(raw, entry.requiredObjectLayers)).toEqual([]);
  });
  it("keeps every spawn outside collisions and every transition destination valid", () => {
    const maps = Object.fromEntries(Object.entries(MAP_MANIFEST).map(([id, entry]) => [id, JSON.parse(readFileSync(new URL(`../../../public/maps/${entry.file}`, import.meta.url), "utf8")) as RawTiledMap]));
    expect(validateWorldMapSet(maps)).toEqual([]);
  });
  it("stores every life station exactly once in Tiled interactables", () => {
    const stationNames = Object.values(MAP_MANIFEST).flatMap((entry) => {
      const raw = JSON.parse(readFileSync(new URL(`../../../public/maps/${entry.file}`, import.meta.url), "utf8")) as RawTiledMap;
      return raw.layers?.find((layer) => layer.name === "interactables")?.objects?.map((object) => object.name).filter((name): name is string => typeof name === "string" && name in LIFE_STATION_DEFINITIONS) ?? [];
    });
    expect(stationNames.sort()).toEqual(Object.keys(LIFE_STATION_DEFINITIONS).sort());
  });
});
