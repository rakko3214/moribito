import type { MapId } from "./mapTypes.js";
import { homeUpgradeStage } from "../runtime/systems/HomeUpgrade.js";

export type MapDecoration = {
  kind: "label" | "circle" | "rect";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: number;
  alpha?: number;
};

const LANDMARKS: Partial<Record<MapId, readonly MapDecoration[]>> = {
  map_homestead: [
    { kind: "label", x: 230, y: 350, text: "畑", color: 0xf4e2aa },
  ],
  map_village: [
    { kind: "circle", x: 640, y: 520, radius: 86, color: 0xb9a36a, alpha: 0.16 },
    { kind: "label", x: 640, y: 520, text: "結の広場", color: 0xf6e8b4 },
    { kind: "label", x: 245, y: 550, text: "診療所", color: 0xe6efcf },
    { kind: "label", x: 1035, y: 550, text: "村長宅", color: 0xe6efcf },
  ],
  map_river: [
    { kind: "rect", x: 480, y: 542, width: 780, height: 145, color: 0x4f91ad, alpha: 0.5 },
    { kind: "label", x: 560, y: 650, text: "釣り場", color: 0xd7eff4 },
  ],
  map_shrine_approach: [
    { kind: "rect", x: 480, y: 384, width: 150, height: 650, color: 0x9a876b, alpha: 0.16 },
    { kind: "label", x: 480, y: 170, text: "神社へ", color: 0xf1dfba },
  ],
  map_shrine: [
    { kind: "label", x: 384, y: 245, text: "拝殿", color: 0xf2d6bf },
  ],
  map_forest: [
    { kind: "label", x: 480, y: 100, text: "森の入口", color: 0xd8e7bc },
  ],
  map_forest_depths: [
    { kind: "label", x: 480, y: 100, text: "迷いの森", color: 0xd8e7bc },
    { kind: "label", x: 790, y: 650, text: "誰かの気配…", color: 0xe5d6a3 },
  ],
};

export function getMapDecorations(mapId: MapId, flags: readonly string[]): readonly MapDecoration[] {
  if (mapId === "map_home") {
    const stage = homeUpgradeStage(flags);
    const common: MapDecoration[] = [
      { kind: "rect", x: 320, y: 265, width: stage === 0 ? 420 : stage === 1 ? 500 : 560, height: stage === 0 ? 280 : stage === 1 ? 310 : 340, color: stage === 0 ? 0x8b6b47 : stage === 1 ? 0xa47c50 : 0xb18b5d, alpha: 0.58 },
      { kind: "label", x: 320, y: 55, text: stage === 0 ? "祖父の古家" : stage === 1 ? "修繕した家" : "結師の家", color: 0xf4e2bd },
    ];
    if (stage >= 1) {
      common.push(
        { kind: "rect", x: 445, y: 285, width: 2, height: 235, color: 0x59432f, alpha: 0.72 },
        { kind: "rect", x: 320, y: 415, width: 430, height: 24, color: 0xc49a63, alpha: 0.72 },
      );
    }
    if (stage >= 2) {
      common.push(
        { kind: "rect", x: 155, y: 290, width: 190, height: 145, color: 0xc3ad75, alpha: 0.45 },
        { kind: "rect", x: 155, y: 290, width: 2, height: 145, color: 0x6c5439, alpha: 0.7 },
        { kind: "label", x: 155, y: 290, text: "特別室", color: 0xf2e5c5 },
      );
    }
    return common;
  }
  if (mapId === "map_old_pond") {
    const cleansed = flags.includes("chapter2:bakegaeru_cleansed");
    return [
      { kind: "circle", x: 480, y: 350, radius: 210, color: cleansed ? 0x5d9ca4 : 0x59634e, alpha: 0.54 },
      { kind: "label", x: 480, y: 145, text: cleansed ? "澄んだ古池" : "穢れた古池", color: cleansed ? 0xd9f4ed : 0xe3cf9b },
    ];
  }
  if (mapId === "map_yodomi_grove") {
    const cleansed = flags.includes("chapter3:yodomi_tree_cleansed");
    return [
      { kind: "circle", x: 650, y: 400, radius: 170, color: cleansed ? 0x78a874 : 0x593e62, alpha: 0.42 },
      { kind: "label", x: 480, y: 115, text: cleansed ? "光の戻った木立" : "淀みの大樹", color: cleansed ? 0xe7f3bf : 0xead0e7 },
    ];
  }
  return LANDMARKS[mapId] ?? [];
}
