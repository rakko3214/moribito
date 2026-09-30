import type { SaveDataV1 } from "@moribito/shared";
import type { InventorySystem } from "./InventorySystem.js";
import { WORKBENCH_RECIPES, type WorkbenchRecipe } from "./WorkbenchSystem.js";
import { CONSTRUCTION_PROJECTS } from "./ConstructionSystem.js";
import { homeUpgradeProfile } from "./HomeUpgrade.js";
import type { StateAccessor, StateChanged } from "./types.js";

export type PlacementRotation = 0 | 90 | 180 | 270;
export type PlacedObject = NonNullable<SaveDataV1["world"]["maps"][string]>["placedObjects"] extends (infer T)[] | undefined ? T : never;
export type BlockedArea = { x: number; y: number; width: number; height: number };
const GRID = 42;
const MAP_BOUNDS: Record<string, BlockedArea> = {
  map_homestead: { x: 70, y: 300, width: 410, height: 300 },
};

export type PlaceableDefinition = Pick<WorkbenchRecipe, "name" | "placement" | "size"> & { resultItemId: string; category: WorkbenchRecipe["category"] | "building" };
const essentialHomePlaceables: readonly PlaceableDefinition[] = [
  { resultItemId: "furniture_bed", name: "寝床", placement: "indoor", size: [2, 2], category: "furniture" },
  { resultItemId: "furniture_workbench", name: "作業台", placement: "indoor", size: [2, 1], category: "furniture" },
];
const constructionPlaceables = Object.values(CONSTRUCTION_PROJECTS)
  .filter((project): project is Extract<(typeof CONSTRUCTION_PROJECTS)[keyof typeof CONSTRUCTION_PROJECTS], { kind: "placeable" }> => project.kind === "placeable")
  .map((project) => ({ ...project, placement: "outdoor" as const, category: "building" as const }));
export const PLACEABLE_DEFINITIONS: readonly PlaceableDefinition[] = [
  ...essentialHomePlaceables,
  ...Object.values(WORKBENCH_RECIPES),
  ...constructionPlaceables,
];
export const placeableDefinition = (itemId: string) => PLACEABLE_DEFINITIONS.find((definition) => definition.resultItemId === itemId);
const recipeForItem = placeableDefinition;
const snap = (value: number) => Math.round(value / GRID) * GRID;

export class PlacementSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  list(mapId: string): PlacedObject[] { return [...(this.state().world.maps[mapId]?.placedObjects ?? [])]; }
  snapPosition(x: number, y: number) { return { x: snap(x), y: snap(y) }; }
  canPlace(mapId: string, itemId: string, x: number, y: number, rotation: PlacementRotation, blocked: readonly BlockedArea[] = [], ignorePlacedId?: string) {
    const recipe = recipeForItem(itemId); const bounds = mapId === "map_home" ? homeUpgradeProfile(this.state().events.flags).placementBounds : MAP_BOUNDS[mapId];
    if (!recipe || !bounds) return false;
    if ((recipe.placement === "indoor" && mapId !== "map_home") || (recipe.placement === "outdoor" && mapId !== "map_homestead")) return false;
    if (mapId === "map_home" && !ignorePlacedId && this.list(mapId).length >= homeUpgradeProfile(this.state().events.flags).furnitureLimit) return false;
    const rect = this.rect(itemId, x, y, rotation);
    if (!rect || rect.x < bounds.x || rect.y < bounds.y || rect.x + rect.width > bounds.x + bounds.width || rect.y + rect.height > bounds.y + bounds.height) return false;
    const occupied = [...blocked, ...this.list(mapId).filter((placed) => placed.id !== ignorePlacedId).map((placed) => this.rect(placed.itemId, placed.x, placed.y, placed.rotation)).filter((value): value is BlockedArea => Boolean(value))];
    return !occupied.some((area) => this.overlaps(rect, area));
  }
  placementLimit(mapId: string) { return mapId === "map_home" ? homeUpgradeProfile(this.state().events.flags).furnitureLimit : undefined; }
  place(mapId: string, itemId: string, x: number, y: number, rotation: PlacementRotation, blocked: readonly BlockedArea[] = []) {
    const position = this.snapPosition(x, y);
    if (this.inventory.quantity(itemId) < 1 || !this.canPlace(mapId, itemId, position.x, position.y, rotation, blocked) || !this.inventory.remove(itemId, 1)) return undefined;
    const map = this.ensureMap(mapId); const id = `placed_${mapId}_${this.nextId()}`;
    const placed: PlacedObject = { id, itemId, x: position.x, y: position.y, rotation };
    (map.placedObjects ??= []).push(placed); this.changed("progression"); return placed;
  }
  move(mapId: string, id: string, x: number, y: number, rotation: PlacementRotation, blocked: readonly BlockedArea[] = []) {
    const placed = this.state().world.maps[mapId]?.placedObjects?.find((item) => item.id === id); if (!placed) return undefined;
    const position = this.snapPosition(x, y);
    if (!this.canPlace(mapId, placed.itemId, position.x, position.y, rotation, blocked, id)) return undefined;
    placed.x = position.x; placed.y = position.y; placed.rotation = rotation; this.changed("progression"); return placed;
  }
  rotate(rotation: PlacementRotation): PlacementRotation { return ((rotation + 90) % 360) as PlacementRotation; }
  recover(mapId: string, id: string) {
    const map = this.state().world.maps[mapId]; const index = map?.placedObjects?.findIndex((placed) => placed.id === id) ?? -1;
    if (!map?.placedObjects || index < 0) return false;
    const [placed] = map.placedObjects.splice(index, 1); if (!placed) return false;
    this.inventory.add(placed.itemId, 1); this.changed("progression"); return true;
  }
  updateState(mapId: string, id: string, update: { label?: string; active?: boolean }) {
    const placed = this.state().world.maps[mapId]?.placedObjects?.find((item) => item.id === id); if (!placed) return false;
    if (update.label !== undefined) placed.label = update.label.trim().slice(0, 30);
    if (update.active !== undefined) placed.active = update.active;
    this.changed("progression"); return true;
  }
  private rect(itemId: string, x: number, y: number, rotation: PlacementRotation): BlockedArea | undefined {
    const recipe = recipeForItem(itemId); if (!recipe) return undefined;
    const rotated = rotation === 90 || rotation === 270; const width = (rotated ? recipe.size[1] : recipe.size[0]) * GRID; const height = (rotated ? recipe.size[0] : recipe.size[1]) * GRID;
    return { x: x - width / 2, y: y - height / 2, width, height };
  }
  private overlaps(a: BlockedArea, b: BlockedArea) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
  private ensureMap(mapId: string) { return this.state().world.maps[mapId] ??= { collectedObjects: [], openedChests: [], destroyedObjects: [], flags: [], placedObjects: [] }; }
  private nextId() { return Object.values(this.state().world.maps).reduce((total, map) => total + (map.placedObjects?.length ?? 0), 0) + 1; }
}
