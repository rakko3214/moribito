import { saveDataV1Schema, type SaveDataV1 } from "@moribito/shared";
import { createInitialState } from "./initialState.js";

export const DEVELOPER_PRESETS = {
  chapter1: { label: "第1章・帰郷", description: "主人公宅から生活導線を最初から確認" },
  life: { label: "農業・建築・家畜", description: "主人公宅敷地で資材を使って生活機能を確認" },
  cooking: { label: "料理", description: "なごみ食堂の調理ミニゲームを確認" },
  fishing: { label: "釣り", description: "川で投擲から捕獲までを確認" },
  alchemy: { label: "調合", description: "診療所で回転操作と品質を確認" },
  forge: { label: "鍛冶", description: "鉄火堂で結晶石制作と装着を確認" },
  combat: { label: "通常戦闘", description: "神社参道で浄化戦闘を確認" },
  chapter2Boss: { label: "第2章・化け蛙", description: "古池のボス直前から確認" },
  chapter3Boss: { label: "第3章・淀みの大樹", description: "森最深部のボス直前から確認" },
} as const;

export type DeveloperPresetId = keyof typeof DEVELOPER_PRESETS;

const resources: SaveDataV1["inventory"]["items"] = [
  { itemId: "seed_daikon", quantity: 20 }, { itemId: "item_daikon", quantity: 20 }, { itemId: "item_yomogi", quantity: 20 },
  { itemId: "item_wood", quantity: 80 }, { itemId: "item_stone", quantity: 80 }, { itemId: "item_iron_ore", quantity: 30 },
  { itemId: "fish_ayu", quantity: 10 }, { itemId: "food_simmered_daikon", quantity: 5 }, { itemId: "medicine_healing", quantity: 5 },
];

function richState(now: Date) {
  const state = createInitialState(now);
  state.player.money = 50_000;
  state.inventory.items = structuredClone(resources);
  state.progression.unlockedSystems = ["movement", "farming", "gathering", "cooking", "fishing", "alchemy", "combat", "workbench", "construction", "livestock", "smithing"];
  return state;
}

function completeChapterOne(state: SaveDataV1) {
  state.quests.completedIds.push("chapter1_onboarding", "request_kaede_daikon", "request_tessai_wood");
  state.progression.chapter = 2; state.progression.storyStep = "chapter2_start";
}

function completeChapterTwo(state: SaveDataV1) {
  completeChapterOne(state); state.quests.completedIds.push("chapter2_bakegaeru");
  state.progression.chapter = 3; state.progression.storyStep = "chapter3_start"; state.progression.defeatedBosses.push("boss_bakegaeru");
}

export function createDeveloperPreset(id: DeveloperPresetId, now = new Date()): SaveDataV1 {
  const state = id === "chapter1" ? createInitialState(now) : richState(now);
  const locations: Partial<Record<DeveloperPresetId, { mapId: string; x: number; y: number }>> = {
    life: { mapId: "map_homestead", x: 470, y: 560 }, cooking: { mapId: "map_nagomi", x: 410, y: 400 },
    fishing: { mapId: "map_river", x: 480, y: 380 }, alchemy: { mapId: "map_clinic", x: 265, y: 215 },
    forge: { mapId: "map_forge", x: 375, y: 245 }, combat: { mapId: "map_shrine_approach", x: 480, y: 480 },
    chapter2Boss: { mapId: "map_old_pond", x: 480, y: 500 }, chapter3Boss: { mapId: "map_yodomi_grove", x: 650, y: 500 },
  };
  const location = locations[id];
  if (location) Object.assign(state.player, location);
  if (["cooking", "alchemy", "forge"].includes(id)) state.time.minutes = 10 * 60;
  if (id === "fishing") state.time.minutes = 7 * 60;
  if (id === "chapter2Boss") {
    completeChapterOne(state); state.events.flags.push("fishing_cast_count:1", "offering:food_simmered_daikon", "offering:fish_ayu", "offering:medicine_healing");
    state.npcs.states.kannushi = { friendship: 1 };
  }
  if (id === "chapter3Boss") {
    completeChapterTwo(state); state.npcs.states.yota = { friendship: 1 };
    state.events.flags.push("chapter3:revisited_restored_pond", "chapter3:visited_forest", "chapter3:kodama_protected_yota");
    const offerings = ["food_simmered_daikon", "food_simmered_daikon", "food_simmered_daikon", "food_simmered_daikon", "food_simmered_daikon", "food_carrot_kinpira", "food_carrot_kinpira", "food_grilled_ayu", "food_herb_rice", "food_herb_rice"];
    offerings.forEach((itemId, index) => state.events.flags.push(`chapter3:offering:${index + 1}:${itemId}`));
    state.world.maps.map_forest = { collectedObjects: ["clue_1", "clue_2", "clue_3"], openedChests: [], destroyedObjects: [], flags: [] };
  }
  return saveDataV1Schema.parse(state);
}
