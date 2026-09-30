import type { ChapterTwoStep } from "../runtime/systems/ChapterTwoProgressionSystem.js";
import type { ChapterThreeStep } from "../runtime/systems/ChapterThreeProgressionSystem.js";
import type { MapId } from "./mapTypes.js";

export type ProgressionGateState = { chapterTwoStep: ChapterTwoStep; chapterThreeStep: ChapterThreeStep };
export type MapAccess = { allowed: true } | { allowed: false; message: string };

const OLD_POND_STEPS: readonly ChapterTwoStep[] = ["purify_bakegaeru", "restored_pond", "complete"];
const FOREST_STEPS: readonly ChapterThreeStep[] = ["enter_forest", "follow_clues", "witness_kodama", "fulfill_offering", "purify_tree", "report_to_shrine", "read_notebook", "kodama_departure", "complete"];
const DEPTH_STEPS: readonly ChapterThreeStep[] = ["follow_clues", "witness_kodama", "fulfill_offering", "purify_tree", "report_to_shrine", "read_notebook", "kodama_departure", "complete"];
const GROVE_STEPS: readonly ChapterThreeStep[] = ["purify_tree", "report_to_shrine", "read_notebook", "kodama_departure", "complete"];

export function mapAccess(targetMap: MapId, state: ProgressionGateState): MapAccess {
  if (targetMap === "map_old_pond" && !OLD_POND_STEPS.includes(state.chapterTwoStep)) {
    return { allowed: false, message: "古池へ続く道は穢れが濃い。先に村人を助け、神社へ報告しよう。" };
  }
  if (targetMap === "map_forest" && !FOREST_STEPS.includes(state.chapterThreeStep)) {
    return { allowed: false, message: "今は森へ入る理由がない。第2章を終え、村で陽太の話を聞こう。" };
  }
  if (targetMap === "map_forest_depths" && !DEPTH_STEPS.includes(state.chapterThreeStep)) {
    return { allowed: false, message: "森の奥は危険だ。まず森の入口で状況を確かめよう。" };
  }
  if (targetMap === "map_yodomi_grove" && !GROVE_STEPS.includes(state.chapterThreeStep)) {
    return { allowed: false, message: "淀みが道を塞いでいる。陽太の痕跡を追い、木霊の真意を確かめよう。" };
  }
  return { allowed: true };
}
