import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export const COOKING_RECIPES = {
  simmered_daikon: { ingredients: [{ itemId: "item_daikon", quantity: 1 }], resultItemId: "food_simmered_daikon" },
  herb_rice: { ingredients: [{ itemId: "item_yomogi", quantity: 1 }], resultItemId: "food_herb_rice" },
} as const;
export type CookingRecipeId = keyof typeof COOKING_RECIPES;

export class CookingSystem {
  constructor(private readonly _state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  canCook(recipeId: CookingRecipeId) { return COOKING_RECIPES[recipeId].ingredients.every((i) => this.inventory.quantity(i.itemId) >= i.quantity); }
  cook(recipeId: CookingRecipeId) {
    const recipe = COOKING_RECIPES[recipeId];
    if (!this.canCook(recipeId)) return false;
    for (const ingredient of recipe.ingredients) this.inventory.remove(ingredient.itemId, ingredient.quantity);
    this.inventory.add(recipe.resultItemId, 1);
    this.changed("cooking");
    return true;
  }
}
