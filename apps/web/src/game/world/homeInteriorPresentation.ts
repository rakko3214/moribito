import { homeUpgradeStage } from "../runtime/systems/HomeUpgrade.js";

export const HOME_INTERIOR_SPRITE_SHEET = { key: "world-home-interior-stages-v1", path: "/assets/world/home-interior-stages-v1.png", frameWidth: 724, frameHeight: 724 } as const;
export const homeInteriorFrame = (flags: readonly string[]) => homeUpgradeStage(flags);
