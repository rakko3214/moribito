import type { MapId } from "../../world/mapTypes.js";
import type { StateAccessor, StateChanged } from "./types.js";

const CHAPTER_TWO_COMPLETE = "chapter2_bakegaeru";
const COMPLETE_ID = "chapter3_yodomi_tree";
const REVISITED_POND = "chapter3:revisited_restored_pond";
const VISITED_FOREST = "chapter3:visited_forest";
const KODAMA_WITNESSED = "chapter3:kodama_protected_yota";
const TREE_CLEANSED = "chapter3:yodomi_tree_cleansed";
const REPORTED_TRUTH = "chapter3:reported_kodama_truth";
const READ_NOTEBOOK = "chapter3:read_grandfather_notebook";

export type ChapterThreeStep = "locked" | "revisit_old_pond" | "ask_yota" | "enter_forest" | "follow_clues" | "witness_kodama" | "fulfill_offering" | "purify_tree" | "report_to_shrine" | "read_notebook" | "kodama_departure" | "complete";

const OBJECTIVES: Record<ChapterThreeStep, string> = {
  locked: "第2章を進める", revisit_old_pond: "浄化後の古池を再訪する", ask_yota: "妖怪好きの少年・陽太について村で話を聞く", enter_forest: "村の東から迷いの森へ入る",
  follow_clues: "森で陽太の痕跡を3つ探す", witness_kodama: "森の奥で陽太を守る木霊を見つける", purify_tree: "妖怪ではない穢れ集合体・淀みの大樹を浄化する",
  fulfill_offering: "神社へ料理10品（4種類・魚料理1品・採取素材料理2品）を奉納する",
  report_to_shrine: "木霊が陽太を守っていた事実を神主へ報告する", read_notebook: "主人公宅で祖父の手帳を読む",
  kodama_departure: "後日、森で木霊の小さな歩み寄りを見届ける", complete: "First Playableを完了しました",
};
const STORY_BEATS: Record<ChapterThreeStep, string> = {
  locked: "水辺の事件を解決し、残された違和感と向き合おう。", revisit_old_pond: "浄化された古池には魚と植物が戻り、化け蛙も静かに暮らしている。", ask_yota: "妖怪好きの陽太が姿を消し、村では妖怪に連れ去られたという疑いが広がる。",
  enter_forest: "陽太は森の入口で遊んでいた。穢れで変わった森へ捜索に向かおう。", follow_clues: "足跡や木の実は、危険な道ではなく安全な迂回路へ続いている。",
  witness_kodama: "木霊は逃げず、自分の身体を使って陽太を穢れから守っていた。", purify_tree: "主人公は目の前の事実を信じ、木霊ではなく淀みの大樹へ神具を向ける。",
  fulfill_offering: "森の穢れへ向かう前に、日々の営みから得た料理を神社へ納めよう。",
  report_to_shrine: "神主は事実を否定しないが、妖怪の真意を決めつけないよう主人公へ警戒を促す。",
  read_notebook: "祖父の手帳に残された『見ることと、教えられることは違う』という言葉へ目が留まる。",
  kodama_departure: "木霊は以前より長く主人公を見つめ、木の実を一つ残して森へ消える。", complete: "すべての妖怪が悪いわけではない。その確信が人と妖怪を結ぶ物語を始める。",
};

export class ChapterThreeProgressionSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged, private readonly chapterThreeOfferingComplete: () => boolean = () => false) {}
  get step(): ChapterThreeStep {
    const state = this.state();
    if (state.quests.completedIds.includes(COMPLETE_ID)) return "complete";
    if (!state.quests.completedIds.includes(CHAPTER_TWO_COMPLETE)) return "locked";
    if (!state.events.flags.includes(REVISITED_POND)) return "revisit_old_pond";
    if ((state.npcs.states.yota?.friendship ?? 0) <= 0) return "ask_yota";
    if (!state.events.flags.includes(VISITED_FOREST)) return "enter_forest";
    const clueCount = (state.world.maps.map_forest_depths?.collectedObjects.length ?? 0) + (state.world.maps.map_forest?.collectedObjects.length ?? 0);
    if (clueCount < 3) return "follow_clues";
    if (!state.events.flags.includes(KODAMA_WITNESSED)) return "witness_kodama";
    if (!this.chapterThreeOfferingComplete()) return "fulfill_offering";
    if (!state.events.flags.includes(TREE_CLEANSED)) return "purify_tree";
    if (!state.events.flags.includes(REPORTED_TRUTH)) return "report_to_shrine";
    if (!state.events.flags.includes(READ_NOTEBOOK)) return "read_notebook";
    return "kodama_departure";
  }
  get objective() { return OBJECTIVES[this.step]; }
  get storyBeat() { return STORY_BEATS[this.step]; }
  get isComplete() { return this.step === "complete"; }
  recordVisit(mapId: MapId) {
    if (mapId === "map_old_pond" && this.step === "revisit_old_pond") return this.addFlag(REVISITED_POND);
    return mapId === "map_forest" ? this.addFlag(VISITED_FOREST) : false;
  }
  recordKodamaEncounter() { return this.addFlag(KODAMA_WITNESSED); }
  recordTreeCleansed() { return this.addFlag(TREE_CLEANSED); }
  recordShrineReport() { return this.step === "report_to_shrine" ? this.addFlag(REPORTED_TRUTH) : false; }
  recordNotebookRead() { return this.step === "read_notebook" ? this.addFlag(READ_NOTEBOOK) : false; }
  completeDeparture() {
    const state = this.state();
    if (this.step !== "kodama_departure" || state.quests.completedIds.includes(COMPLETE_ID)) return false;
    state.quests.completedIds.push(COMPLETE_ID); state.progression.chapter = Math.max(4, state.progression.chapter); state.progression.storyStep = "first_playable_complete";
    if (!state.progression.defeatedBosses.includes("boss_yodomi_tree")) state.progression.defeatedBosses.push("boss_yodomi_tree");
    this.changed("progression"); return true;
  }
  private addFlag(flag: string) { if (this.state().events.flags.includes(flag)) return false; this.state().events.flags.push(flag); this.changed("events"); return true; }
}
