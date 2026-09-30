import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export type WorkbenchCategory = "furniture" | "fence" | "livestock" | "decor";
export type WorkbenchRecipeId = keyof typeof WORKBENCH_RECIPES;
export type WorkbenchRecipe = { name: string; category: WorkbenchCategory; ingredients: readonly { itemId: string; quantity: number }[]; resultItemId: string; placement: "indoor" | "outdoor" | "both"; size: readonly [number, number] };
export type RecipePurchaseBlockReason = "unlocked" | "prerequisite" | "money";

export const WORKBENCH_RECIPES = {
  wooden_chair: { name: "木の椅子", category: "furniture", ingredients: [{ itemId: "item_wood", quantity: 3 }], resultItemId: "furniture_wooden_chair", placement: "indoor", size: [1, 1] },
  wooden_table: { name: "木の机", category: "furniture", ingredients: [{ itemId: "item_wood", quantity: 5 }], resultItemId: "furniture_wooden_table", placement: "indoor", size: [2, 1] },
  storage_box: { name: "木の収納箱", category: "furniture", ingredients: [{ itemId: "item_wood", quantity: 6 }, { itemId: "item_stone", quantity: 1 }], resultItemId: "furniture_storage_box", placement: "both", size: [1, 1] },
  livestock_fence: { name: "家畜用の柵", category: "fence", ingredients: [{ itemId: "item_wood", quantity: 2 }], resultItemId: "placeable_livestock_fence", placement: "outdoor", size: [1, 1] },
  fence_gate: { name: "柵の扉", category: "fence", ingredients: [{ itemId: "item_wood", quantity: 4 }], resultItemId: "placeable_fence_gate", placement: "outdoor", size: [1, 1] },
  feed_trough: { name: "餌箱", category: "livestock", ingredients: [{ itemId: "item_wood", quantity: 5 }], resultItemId: "placeable_feed_trough", placement: "outdoor", size: [2, 1] },
  water_trough: { name: "水飲み場", category: "livestock", ingredients: [{ itemId: "item_stone", quantity: 5 }], resultItemId: "placeable_water_trough", placement: "outdoor", size: [2, 1] },
  wooden_sign: { name: "木製看板", category: "decor", ingredients: [{ itemId: "item_wood", quantity: 2 }], resultItemId: "placeable_wooden_sign", placement: "outdoor", size: [1, 1] },
} as const satisfies Record<string, WorkbenchRecipe>;

export const WORKBENCH_RECIPE_SHOP = {
  wooden_table: { price: 120 },
  storage_box: { price: 180 },
  feed_trough: { price: 140, prerequisite: "livestock_building" },
  water_trough: { price: 160, prerequisite: "livestock_building" },
} as const satisfies Partial<Record<WorkbenchRecipeId, { price: number; prerequisite?: "livestock_building" }>>;
export type PurchasableWorkbenchRecipeId = keyof typeof WORKBENCH_RECIPE_SHOP;

const MATERIAL_NAMES: Record<string, string> = { item_wood: "木材", item_stone: "石材" };

export class WorkbenchSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  isUnlocked(id: WorkbenchRecipeId) { return this.state().events.flags.includes(`recipe:workbench:${id}`); }
  unlock(id: WorkbenchRecipeId) { if (this.isUnlocked(id)) return false; this.state().events.flags.push(`recipe:workbench:${id}`); this.changed("progression"); return true; }
  recipePurchaseAvailability(id: PurchasableWorkbenchRecipeId): { canPurchase: true } | { canPurchase: false; reason: RecipePurchaseBlockReason } {
    if (this.isUnlocked(id)) return { canPurchase: false, reason: "unlocked" };
    const offer = WORKBENCH_RECIPE_SHOP[id];
    if ("prerequisite" in offer && offer.prerequisite === "livestock_building" && !["chicken_coop", "livestock_barn"].some((building) => this.state().events.flags.includes(`construction:ordered:${building}`))) return { canPurchase: false, reason: "prerequisite" };
    if (this.state().player.money < offer.price) return { canPurchase: false, reason: "money" };
    return { canPurchase: true };
  }
  purchaseRecipe(id: PurchasableWorkbenchRecipeId) {
    if (!this.recipePurchaseAvailability(id).canPurchase) return false;
    this.state().player.money -= WORKBENCH_RECIPE_SHOP[id].price;
    this.state().events.flags.push(`recipe:workbench:${id}`); this.changed("progression"); return true;
  }
  canCraft(id: WorkbenchRecipeId) { return this.isUnlocked(id) && WORKBENCH_RECIPES[id].ingredients.every((item) => this.inventory.quantity(item.itemId) >= item.quantity); }
  craft(id: WorkbenchRecipeId, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity <= 0 || !this.isUnlocked(id)) return false;
    const recipe = WORKBENCH_RECIPES[id];
    if (!recipe.ingredients.every((item) => this.inventory.quantity(item.itemId) >= item.quantity * quantity)) return false;
    recipe.ingredients.forEach((item) => this.inventory.remove(item.itemId, item.quantity * quantity));
    this.inventory.add(recipe.resultItemId, quantity); this.changed("progression"); return true;
  }
  list(options: { category?: WorkbenchCategory; query?: string; craftableOnly?: boolean } = {}) {
    const query = options.query?.trim().toLocaleLowerCase("ja") ?? "";
    return (Object.entries(WORKBENCH_RECIPES) as [WorkbenchRecipeId, WorkbenchRecipe][]).filter(([id]) => this.isUnlocked(id))
      .filter(([, recipe]) => !options.category || recipe.category === options.category)
      .filter(([id]) => !options.craftableOnly || this.canCraft(id))
      .filter(([, recipe]) => !query || `${recipe.name} ${recipe.ingredients.map((item) => MATERIAL_NAMES[item.itemId] ?? item.itemId).join(" ")}`.toLocaleLowerCase("ja").includes(query));
  }
}
