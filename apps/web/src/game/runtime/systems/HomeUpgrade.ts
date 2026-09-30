export type HomeUpgradeStage = 0 | 1 | 2;

export type HomeUpgradeProfile = {
  stage: HomeUpgradeStage;
  name: string;
  furnitureLimit: number;
  placementBounds: { x: number; y: number; width: number; height: number };
  features: readonly string[];
};

export const HOME_UPGRADE_PROFILES: Record<HomeUpgradeStage, HomeUpgradeProfile> = {
  0: { stage: 0, name: "祖父の古家", furnitureLimit: 6, placementBounds: { x: 80, y: 90, width: 480, height: 260 }, features: ["寝床", "基本倉庫", "作業台"] },
  1: { stage: 1, name: "修繕した家", furnitureLimit: 12, placementBounds: { x: 59, y: 69, width: 522, height: 281 }, features: ["一部屋増築", "縁側", "家具配置枠12個"] },
  2: { stage: 2, name: "結師の家", furnitureLimit: 20, placementBounds: { x: 42, y: 48, width: 556, height: 302 }, features: ["最終住宅", "特別設備用空間", "家具配置枠20個"] },
};

export function homeUpgradeStage(flags: readonly string[]): HomeUpgradeStage {
  if (flags.includes("construction:ordered:house_upgrade_2")) return 2;
  if (flags.includes("construction:ordered:house_upgrade_1") || flags.includes("construction:ordered:house_expansion")) return 1;
  return 0;
}

export function homeUpgradeProfile(flags: readonly string[]) {
  return HOME_UPGRADE_PROFILES[homeUpgradeStage(flags)];
}
