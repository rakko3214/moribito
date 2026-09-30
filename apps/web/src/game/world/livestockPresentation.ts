export const LIVESTOCK_SPRITE_SHEET = { key: "world-livestock-states-v1", path: "/assets/world/livestock-states-v1.png", frameWidth: 384, frameHeight: 512 } as const;

export type LivestockVisualState = { species: "chicken" | "cow"; ageDays: number; fedToday: boolean; productReady: boolean };

export const livestockSpriteFrame = (animal: LivestockVisualState) => {
  const row = animal.species === "cow" ? 4 : 0;
  const maturity = animal.species === "cow" ? 5 : 3;
  if (animal.ageDays < maturity) return row;
  if (animal.productReady) return row + 3;
  if (animal.fedToday) return row + 2;
  return row + 1;
};

export const livestockBuildingId = (species: LivestockVisualState["species"]) => species === "cow" ? "building_livestock_barn" : "building_chicken_coop";
