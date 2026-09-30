import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CollisionArea, MapId } from "./mapTypes.js";
import { interiorRoomPresentation } from "./interiorRoomPresentation.js";
import { getScheduledNpcPlacements } from "../runtime/systems/NpcScheduleSystem.js";
import { npcCollisionFootprint } from "./worldCollision.js";

describe("facility room boundaries", () => {
  it.each(["nagomi", "shop", "forge", "clinic", "village_hall", "fishing_hut"])("matches %s walls without closing its entrance", (name) => {
    const data = JSON.parse(readFileSync(new URL(`../../../public/maps/${name.replaceAll("_", "-")}.json`, import.meta.url), "utf8"));
    const collisions: CollisionArea[] = data.layers.find((layer: { name: string }) => layer.name === "collisions").objects;
    const room = interiorRoomPresentation({ id: `map_${name}` as MapId, width: data.width * 32, height: data.height * 32, collisions });
    expect(room?.walls).toHaveLength(5);
    expect(room?.stoneFloor).toBe(name === "forge");
    for (let hour = 0; hour < 24; hour++) {
      for (const npc of getScheduledNpcPlacements(hour * 60).filter((npc) => npc.mapId === `map_${name}`)) {
        const footprint = npcCollisionFootprint(npc.x, npc.y);
        expect(collisions.some((wall) => footprint.x < wall.x + wall.width && footprint.x + footprint.width > wall.x && footprint.y < wall.y + wall.height && footprint.y + footprint.height > wall.y), `${npc.id} at ${hour}:00 intersects equipment`).toBe(false);
      }
    }
    const doors: CollisionArea[] = data.layers.find((layer: { name: string }) => layer.name === "transitions").objects;
    for (const door of doors) {
      const x = door.x + door.width / 2;
      const y = door.y + door.height / 2;
      expect(room?.walls.some((wall) => x > wall.x && x < wall.x + wall.width && y > wall.y && y < wall.y + wall.height)).toBe(false);
    }
  });
  it("does not change outdoor maps or the separately furnished home", () => {
    for (const id of ["map_home", "map_village"] as const) expect(interiorRoomPresentation({ id, width: 640, height: 480, collisions: [] })).toBeUndefined();
  });
});
