import type { ChapterTwoStep } from "../runtime/systems/ChapterTwoProgressionSystem.js";
import type { ChapterThreeStep } from "../runtime/systems/ChapterThreeProgressionSystem.js";
import type { MapId } from "./mapTypes.js";

export type DangerEntryConfirmation = { title: string; message: string };

export function dangerEntryConfirmation(target: MapId, chapterTwoStep: ChapterTwoStep, chapterThreeStep: ChapterThreeStep): DangerEntryConfirmation | undefined {
  if (target === "map_old_pond" && chapterTwoStep === "purify_bakegaeru") return {
    title: "古池へ進みますか？",
    message: "この先で穢れ化・化け蛙との戦闘が始まります。料理、護身札、神具を確認してから進んでください。",
  };
  if (target === "map_yodomi_grove" && chapterThreeStep === "purify_tree") return {
    title: "淀みの大樹へ進みますか？",
    message: "この先は第3章のボスエリアです。料理と護身札を確認し、根の包囲と安全地帯へ備えてください。",
  };
  return undefined;
}
