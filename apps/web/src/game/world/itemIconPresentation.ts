export const ITEM_ICON_ATLAS = {
  key: "item-icons-atlas-v1",
  path: "/assets/ui/item-icons-atlas-v1.png",
  frameWidth: 156,
  frameHeight: 156,
} as const;

const ITEM_ICON_FRAMES: Record<string, number> = {
  seed_daikon: 0, seed_carrot: 1, seed_cucumber: 2, seed_eggplant: 3, seed_pumpkin: 4, seed_rice: 5,
  item_daikon: 8, item_carrot: 9, item_cucumber: 10, item_eggplant: 11, item_pumpkin: 12, item_rice: 13,
  item_animal_feed: 14, item_egg: 15,
  item_yomogi: 16, item_wood: 17, item_stone: 18, item_mushroom: 19, item_mountain_greens: 20,
  item_river_algae: 21, item_spring_water: 22, item_spirit_acorn: 23,
  fish_ayu: 24, fish_crucian_carp: 25, fish_yamame: 26, fish_koi: 27, fish_catfish: 28, fish_eel: 29, item_milk: 30,
  food_simmered_daikon: 32, food_carrot_kinpira: 33, food_cucumber_pickles: 34, food_eggplant_miso: 35,
  food_simmered_pumpkin: 36, food_grilled_ayu: 37, food_herb_rice: 38, food_mixed_rice: 39,
  food_failed_dish: 40, medicine_healing: 41, medicine_purifying: 42, medicine_antidote: 43,
  medicine_corruption_guard: 44, medicine_spirit_tonic: 45, item_crude_product: 46, medicine_crude_healing: 46,
  material_purified_fragment: 48, material_purified_water: 49, material_purified_wood: 50, material_forest_light: 51,
  stone_power: 52, stone_range: 53, stone_homing: 54, stone_spread: 55, stone_piercing: 56, stone_rapid: 57,
};

export function itemIconFrame(itemId: string) {
  return ITEM_ICON_FRAMES[itemId];
}

export function hasItemIcon(itemId: string) {
  return itemIconFrame(itemId) !== undefined;
}
