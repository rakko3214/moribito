export const GATHERING_SPRITE_SHEET = {
  key: "world-field-gathering-nodes-v1",
  path: "/assets/world/field-gathering-nodes-v1.png",
  frameWidth: 362,
  frameHeight: 362,
} as const;

const GATHERING_FRAMES: Readonly<Record<string, number>> = {
  item_yomogi: 0,
  item_mushroom: 1,
  item_mountain_greens: 2,
  item_river_algae: 3,
  item_spring_water: 4,
  item_spirit_acorn: 5,
  clue_broken_branch: 6,
  clue_yota_footprint: 7,
  clue_guiding_nut: 8,
};

export const gatheringNodeFrame = (itemId: string) => GATHERING_FRAMES[itemId];
