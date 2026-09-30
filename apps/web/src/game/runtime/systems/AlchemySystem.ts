import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export const ALCHEMY_RECIPES = {
  healing: { name: "回復薬", difficulty: "normal", ingredients: [{ itemId: "item_yomogi", quantity: 1 }], resultItemId: "medicine_healing" },
  purification: { name: "清め薬", difficulty: "hard", ingredients: [{ itemId: "item_yomogi", quantity: 1 }, { itemId: "item_spring_water", quantity: 1 }], resultItemId: "medicine_purifying" },
  antidote: { name: "解毒薬", difficulty: "normal", ingredients: [{ itemId: "item_mushroom", quantity: 1 }, { itemId: "item_cucumber", quantity: 1 }], resultItemId: "medicine_antidote" },
  corruption_guard: { name: "穢れ除け薬", difficulty: "hard", ingredients: [{ itemId: "item_river_algae", quantity: 1 }, { itemId: "material_purified_fragment", quantity: 1 }], resultItemId: "medicine_corruption_guard" },
  spirit_tonic: { name: "霊力薬", difficulty: "expert", ingredients: [{ itemId: "item_spirit_acorn", quantity: 1 }, { itemId: "item_carrot", quantity: 1 }], resultItemId: "medicine_spirit_tonic" },
} as const;
export type AlchemyRecipeId = keyof typeof ALCHEMY_RECIPES;

export class AlchemySystem {
  constructor(private readonly _state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  canCraft(recipeId: AlchemyRecipeId = "healing") { return ALCHEMY_RECIPES[recipeId].ingredients.every((item) => this.inventory.quantity(item.itemId) >= item.quantity); }
  craft(outputQuantity = 1, resultItemId?: string, recipeId: AlchemyRecipeId = "healing") {
    if (!Number.isSafeInteger(outputQuantity) || outputQuantity <= 0) return false;
    const recipe = ALCHEMY_RECIPES[recipeId];
    const output = resultItemId ?? recipe.resultItemId;
    if (!Number.isSafeInteger(this.inventory.quantity(output) + outputQuantity)) return false;
    if (!this.canCraft(recipeId)) return false;
    for (const ingredient of recipe.ingredients) this.inventory.remove(ingredient.itemId, ingredient.quantity);
    this.inventory.add(output, outputQuantity); this.changed("alchemy"); return true;
  }
}
