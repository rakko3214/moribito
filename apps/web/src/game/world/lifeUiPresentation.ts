export type ItemStack = { itemId: string; quantity: number };
export type InventoryCategory = "all" | "materials" | "food" | "medicine" | "placeables";

export const LIFE_ITEM_LABELS: Record<string, string> = {
  seed_daikon: "大根の種", item_daikon: "大根", seed_carrot: "人参の種", item_carrot: "人参", seed_cucumber: "きゅうりの種", item_cucumber: "きゅうり",
  seed_eggplant: "なすの種", item_eggplant: "なす", seed_pumpkin: "かぼちゃの種", item_pumpkin: "かぼちゃ", seed_rice: "稲の種", item_rice: "米", item_yomogi: "よもぎ", item_wood: "木材", item_stone: "石材", item_mushroom: "森きのこ", item_mountain_greens: "山菜", item_river_algae: "川藻", item_spring_water: "清水", item_spirit_acorn: "霊木の実",
  fish_ayu: "鮎", fish_crucian_carp: "フナ", fish_yamame: "ヤマメ", fish_koi: "鯉", fish_catfish: "なまず", fish_eel: "うなぎ", food_simmered_daikon: "大根の煮物", food_carrot_kinpira: "人参のきんぴら", food_cucumber_pickles: "きゅうりの浅漬け", food_eggplant_miso: "なすの味噌焼き", food_simmered_pumpkin: "かぼちゃの煮物", food_grilled_ayu: "鮎の塩焼き", food_herb_rice: "よもぎ飯", food_mixed_rice: "人参の炊き込みご飯", food_failed_dish: "失敗料理",
  medicine_healing: "回復薬", medicine_purifying: "清め薬", medicine_antidote: "解毒薬", medicine_corruption_guard: "穢れ除け薬", medicine_spirit_tonic: "霊力薬", item_crude_product: "粗悪品", medicine_crude_healing: "粗悪品", material_purified_fragment: "浄化の欠片", material_purified_water: "清めの水",
  material_purified_wood: "清めの木材", material_forest_light: "森の光",
  stone_power: "剛力石", stone_range: "遠射石", stone_homing: "追尾石", stone_spread: "拡散石", stone_piercing: "貫通石", stone_rapid: "連射石",
  furniture_bed: "寝床", furniture_workbench: "作業台", furniture_wooden_chair: "木の椅子", furniture_wooden_table: "木の机", furniture_storage_box: "木の収納箱",
  placeable_livestock_fence: "家畜用の柵", placeable_fence_gate: "柵の扉", placeable_feed_trough: "餌箱", placeable_water_trough: "水飲み場", placeable_wooden_sign: "木製看板",
  building_chicken_coop: "鶏小屋", building_livestock_barn: "家畜小屋", building_greenhouse: "温室",
  item_animal_feed: "家畜の餌", item_egg: "卵", item_milk: "牛乳",
};

export function inventoryLines(items: readonly ItemStack[], emptyLabel = "持ち物はありません") {
  const visible = items.filter((item) => item.quantity > 0);
  if (visible.length === 0) return [emptyLabel];
  return visible.map((item) => `${LIFE_ITEM_LABELS[item.itemId] ?? item.itemId} ×${item.quantity}`);
}

export function inventoryCategoryLines(items: readonly ItemStack[], category: InventoryCategory, emptyLabel = "このカテゴリに品物はありません") {
  const matches = (itemId: string) => category === "all"
    || (category === "materials" && (itemId.startsWith("item_") || itemId.startsWith("material_") || itemId.startsWith("seed_")) && !["item_egg", "item_milk", "item_animal_feed"].includes(itemId))
    || (category === "food" && (itemId.startsWith("food_") || itemId.startsWith("fish_") || itemId === "item_egg" || itemId === "item_milk" || itemId === "item_animal_feed"))
    || (category === "medicine" && (itemId.startsWith("medicine_") || itemId.startsWith("stone_")))
    || (category === "placeables" && (itemId.startsWith("furniture_") || itemId.startsWith("placeable_") || itemId.startsWith("building_")));
  return inventoryLines(items.filter((item) => matches(item.itemId)), emptyLabel);
}

export type LifeMenuOption = { id: string; label: string; enabled: boolean; detail: string };

export function cookingMenu(recipes: Readonly<Record<string, { name: string; ingredients: readonly { itemId: string; quantity: number }[] }>>, canCook: (id: string) => boolean): LifeMenuOption[] {
  return Object.entries(recipes).map(([id, recipe]) => ({ id, label: `${recipe.name}を作る`, enabled: canCook(id), detail: recipe.ingredients.map((item) => `${LIFE_ITEM_LABELS[item.itemId] ?? item.itemId} ×${item.quantity}`).join("  ") }));
}

export function stationDescription(station: "fishing" | "alchemy") {
  return station === "fishing"
    ? { title: "釣り", description: "魚影へ竿を投げ、アタリに合わせて魚を追うスマホ向けミニゲームです。", action: "釣りを始める" }
    : { title: "調合", description: "よもぎ1個を使って回復薬を調合します。", action: "回復薬を調合" };
}

export function offeringMenu(quantity: (itemId: string) => number, completed: (itemId: string) => boolean): LifeMenuOption[] {
  return ["food_simmered_daikon", "fish_ayu", "medicine_healing"].map((id) => ({
    id, label: `${LIFE_ITEM_LABELS[id]}を奉納`, enabled: quantity(id) > 0 && !completed(id),
    detail: completed(id) ? "奉納済み" : `所持 ×${quantity(id)}`,
  }));
}

export function chapterThreeOfferingMenu(items: readonly ItemStack[]): LifeMenuOption[] {
  return items.filter((item) => item.quantity > 0 && item.itemId.startsWith("food_") && item.itemId !== "food_failed_dish")
    .map((item) => ({ id: item.itemId, label: `${LIFE_ITEM_LABELS[item.itemId] ?? item.itemId}を奉納`, enabled: true, detail: `所持 ×${item.quantity}` }));
}

export function shopMenu(money: number): LifeMenuOption[] {
  const seeds = [
    ["seed_daikon", "大根", 20], ["seed_carrot", "人参", 25], ["seed_cucumber", "きゅうり", 30],
    ["seed_eggplant", "なす", 35], ["seed_pumpkin", "かぼちゃ", 55], ["seed_rice", "稲", 45],
  ] as const;
  return seeds.map(([itemId, name, price]) => ({ id: `${itemId}:1`, label: `${name}の種 ×1`, enabled: money >= price, detail: `${price}文` }));
}

export function journalText(chapter: number, objective: string, storyBeat: string, requestSummary: string, completedCount: number) {
  return `【第${chapter}章の目的】\n${objective}\n\n${storyBeat}\n\n【村人依頼】\n${requestSummary}\n\n完了した依頼・物語: ${completedCount}`;
}

export function npcDialogueText(line: string, friendship: number, delivery?: { title: string; reward: number }) {
  const deliveryText = delivery ? `\n\n依頼達成「${delivery.title}」\n報酬 ${delivery.reward}文` : "";
  return `友情 ${friendship}/100\n\n「${line}」${deliveryText}`;
}

export type LifeActionKind = "cooking" | "alchemy" | "fishing_wait" | "fishing_hook";
export function lifeActionText(kind: LifeActionKind) {
  return ({
    cooking: { title: "料理中", body: "鍋を火にかけています…\n焦がさないよう、少し待ちましょう。" },
    alchemy: { title: "調合中", body: "薬草をすり潰し、効能を引き出しています…" },
    fishing_wait: { title: "釣り", body: "浮きをよく見て待ちましょう…\n魚が食いつくまで竿を動かさないでください。" },
    fishing_hook: { title: "アタリ！", body: "今です。魚が逃げる前に引き上げてください！" },
  } as const)[kind];
}
