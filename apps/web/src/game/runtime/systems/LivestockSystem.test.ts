import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "../initialState.js";
import { InventorySystem } from "./InventorySystem.js";
import { LivestockSystem } from "./LivestockSystem.js";

const setup = () => { const state = createInitialState(); const changed = vi.fn(); const inventory = new InventorySystem(() => state, changed); return { state, inventory, system: new LivestockSystem(() => state, changed, inventory) }; };
describe("LivestockSystem", () => {
  it("requires a placed species building and enforces its capacity", () => {
    const { state, system } = setup(); state.player.money = 2000;
    expect(system.buy("chicken")).toBeUndefined();
    state.world.maps.map_homestead = { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [], placedObjects: [{ id: "coop", itemId: "building_chicken_coop", x: 200, y: 400, rotation: 0 }] };
    for (let index = 0; index < 4; index += 1) expect(system.buy("chicken")).toBeDefined();
    expect(system.buy("chicken")).toBeUndefined(); expect(system.animals).toHaveLength(4);
  });
  it("feeds, grows and produces an egg after reaching maturity", () => {
    const { state, inventory, system } = setup(); state.player.money = 1000;
    state.world.maps.map_homestead = { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [], placedObjects: [{ id: "coop", itemId: "building_chicken_coop", x: 200, y: 400, rotation: 0 }] };
    const chicken = system.buy("chicken")!; expect(system.buyFeed(3)).toBe(true);
    for (let day = 0; day < 3; day += 1) { expect(system.feed(chicken.id)).toBe(true); system.advanceDay(); }
    expect(system.animals[0]).toMatchObject({ ageDays: 3, friendship: 15, productReady: true });
    expect(system.collect(chicken.id)).toBe(true); expect(inventory.quantity("item_egg")).toBe(1);
  });
});
