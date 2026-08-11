import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type MapObject = { name: string; properties?: Array<{ name: string; value: string }> };
type MapLayer = { name: string; objects: MapObject[] };
type TiledMap = { width: number; height: number; layers: MapLayer[] };

describe("Phase 1 Tiled maps", () => {
  it.each(["village", "home", "shrine", "forest"])("%s has collision, spawn and transition layers", (name) => {
    const map = JSON.parse(readFileSync(new URL(`../../../public/maps/${name}.json`, import.meta.url), "utf8")) as TiledMap;
    expect(map.width).toBeGreaterThan(0);
    expect(map.height).toBeGreaterThan(0);
    expect(map.layers.find((layer) => layer.name === "collisions")?.objects.length).toBeGreaterThan(0);
    expect(map.layers.find((layer) => layer.name === "spawns")?.objects.length).toBeGreaterThan(0);
    const transitions = map.layers.find((layer) => layer.name === "transitions")?.objects ?? [];
    expect(transitions.length).toBeGreaterThan(0);
    expect(transitions[0]?.properties?.some((item) => item.name === "targetMap")).toBe(true);
  });

  it("points every transition at an existing destination spawn", () => {
    const names = ["village", "home", "shrine", "forest"];
    const maps = Object.fromEntries(names.map((name) => [
      `map_${name}`,
      JSON.parse(readFileSync(new URL(`../../../public/maps/${name}.json`, import.meta.url), "utf8")) as TiledMap,
    ]));
    for (const map of Object.values(maps)) {
      for (const transition of map.layers.find((layer) => layer.name === "transitions")?.objects ?? []) {
        const targetMap = transition.properties?.find((property) => property.name === "targetMap")?.value;
        const targetSpawn = transition.properties?.find((property) => property.name === "targetSpawn")?.value;
        expect(targetMap, `${transition.name} target map`).toBeTruthy();
        expect(targetSpawn, `${transition.name} target spawn`).toBeTruthy();
        expect(maps[targetMap!]?.layers.find((layer) => layer.name === "spawns")?.objects.some((spawn) => spawn.name === targetSpawn), `${transition.name} destination`).toBe(true);
      }
    }
  });
});
