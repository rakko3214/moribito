import type { InventorySystem } from "./InventorySystem.js";
import type { StateAccessor, StateChanged } from "./types.js";

export const COOKING_RECIPES = {
  simmered_daikon: { name: "大根の煮物", method: "heat", ingredients: [{ itemId: "item_daikon", quantity: 1 }], resultItemId: "food_simmered_daikon", effect: "護身札を1枚回復" },
  carrot_kinpira: { name: "人参のきんぴら", method: "heat", ingredients: [{ itemId: "item_carrot", quantity: 1 }], resultItemId: "food_carrot_kinpira", effect: "護身札を1枚回復" },
  cucumber_pickles: { name: "きゅうりの浅漬け", method: "heat", ingredients: [{ itemId: "item_cucumber", quantity: 1 }], resultItemId: "food_cucumber_pickles", effect: "護身札を1枚回復" },
  eggplant_miso: { name: "なすの味噌焼き", method: "heat", ingredients: [{ itemId: "item_eggplant", quantity: 1 }], resultItemId: "food_eggplant_miso", effect: "護身札を1枚回復" },
  simmered_pumpkin: { name: "かぼちゃの煮物", method: "heat", ingredients: [{ itemId: "item_pumpkin", quantity: 1 }], resultItemId: "food_simmered_pumpkin", effect: "護身札を1枚回復" },
  grilled_ayu: { name: "鮎の塩焼き", method: "heat", ingredients: [{ itemId: "fish_ayu", quantity: 1 }], resultItemId: "food_grilled_ayu", effect: "護身札を1枚回復" },
  herb_rice: { name: "よもぎ飯", method: "rice", ingredients: [{ itemId: "item_yomogi", quantity: 1 }], resultItemId: "food_herb_rice", effect: "護身札を1枚回復" },
  mixed_rice: { name: "人参の炊き込みご飯", method: "rice", ingredients: [{ itemId: "item_rice", quantity: 1 }, { itemId: "item_carrot", quantity: 1 }], resultItemId: "food_mixed_rice", effect: "護身札を1枚回復" },
} as const;
export type CookingRecipeId = keyof typeof COOKING_RECIPES;

export function cookedRecipeFlag(recipeId: CookingRecipeId) { return `cooking:completed:${recipeId}`; }

export class CookingSystem {
  constructor(private readonly _state: StateAccessor, private readonly changed: StateChanged, private readonly inventory: InventorySystem) {}
  canCook(recipeId: CookingRecipeId) { return COOKING_RECIPES[recipeId].ingredients.every((i) => this.inventory.quantity(i.itemId) >= i.quantity); }
  hasCompleted(recipeId: CookingRecipeId) { return this._state().events.flags.includes(cookedRecipeFlag(recipeId)); }
  cookAutomatically(recipeId: CookingRecipeId) {
    if (!this.hasCompleted(recipeId)) return false;
    return this.cook(recipeId);
  }
  cook(recipeId: CookingRecipeId, resultItemId?: string, outputQuantity = 1) {
    if (!Number.isInteger(outputQuantity) || outputQuantity <= 0) return false;
    const recipe = COOKING_RECIPES[recipeId];
    if (!this.canCook(recipeId)) return false;
    for (const ingredient of recipe.ingredients) this.inventory.remove(ingredient.itemId, ingredient.quantity);
    this.inventory.add(resultItemId ?? recipe.resultItemId, outputQuantity);
    if ((resultItemId === undefined || resultItemId === recipe.resultItemId) && !this.hasCompleted(recipeId)) {
      this._state().events.flags.push(cookedRecipeFlag(recipeId));
    }
    this.changed("cooking");
    return true;
  }
}
