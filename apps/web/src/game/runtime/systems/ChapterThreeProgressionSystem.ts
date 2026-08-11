import type { MapId } from "../../world/mapTypes.js";
import type { StateAccessor, StateChanged } from "./types.js";

const CHAPTER_TWO_COMPLETE = "chapter2_bakegaeru";
const COMPLETE_ID = "chapter3_yodomi_tree";
const VISITED_FOREST = "chapter3:visited_forest";
const KODAMA_WITNESSED = "chapter3:kodama_protected_yota";
const TREE_CLEANSED = "chapter3:yodomi_tree_cleansed";

export type ChapterThreeStep = "locked" | "ask_yota" | "enter_forest" | "follow_clues" | "witness_kodama" | "purify_tree" | "kodama_departure" | "complete";

const OBJECTIVES: Record<ChapterThreeStep, string> = {
  locked: "第2章を進める", ask_yota: "妖怪好きの少年・陽太について村で話を聞く", enter_forest: "村の東から迷いの森へ入る",
  follow_clues: "森で陽太の痕跡を3つ探す", witness_kodama: "森の奥で陽太を守る木霊を見つける", purify_tree: "妖怪ではない穢れ集合体・淀みの大樹を浄化する",
  kodama_departure: "陽太の安全を確認する木霊を見送る", complete: "First Playableを完了しました",
};
const STORY_BEATS: Record<ChapterThreeStep, string> = {
  locked: "水辺の事件を解決し、残された違和感と向き合おう。", ask_yota: "妖怪好きの陽太が姿を消し、村では妖怪に連れ去られたという疑いが広がる。",
  enter_forest: "陽太は森の入口で遊んでいた。穢れで変わった森へ捜索に向かおう。", follow_clues: "足跡や木の実は、危険な道ではなく安全な迂回路へ続いている。",
  witness_kodama: "木霊は逃げず、自分の身体を使って陽太を穢れから守っていた。", purify_tree: "主人公は目の前の事実を信じ、木霊ではなく淀みの大樹へ神具を向ける。",
  kodama_departure: "木霊は陽太の無事を確かめ、一度だけ主人公を振り返って森へ去る。", complete: "すべての妖怪が悪いわけではない。その確信が人と妖怪を結ぶ物語を始める。",
};

export class ChapterThreeProgressionSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}
  get step(): ChapterThreeStep {
    const state = this.state();
    if (state.quests.completedIds.includes(COMPLETE_ID)) return "complete";
    if (!state.quests.completedIds.includes(CHAPTER_TWO_COMPLETE)) return "locked";
    if ((state.npcs.states.yota?.friendship ?? 0) <= 0) return "ask_yota";
    if (!state.events.flags.includes(VISITED_FOREST)) return "enter_forest";
    if ((state.world.maps.map_forest?.collectedObjects.length ?? 0) < 3) return "follow_clues";
    if (!state.events.flags.includes(KODAMA_WITNESSED)) return "witness_kodama";
    if (!state.events.flags.includes(TREE_CLEANSED)) return "purify_tree";
    return "kodama_departure";
  }
  get objective() { return OBJECTIVES[this.step]; }
  get storyBeat() { return STORY_BEATS[this.step]; }
  get isComplete() { return this.step === "complete"; }
  recordVisit(mapId: MapId) { return mapId === "map_forest" ? this.addFlag(VISITED_FOREST) : false; }
  recordKodamaEncounter() { return this.addFlag(KODAMA_WITNESSED); }
  recordTreeCleansed() { return this.addFlag(TREE_CLEANSED); }
  completeDeparture() {
    const state = this.state();
    if (this.step !== "kodama_departure" || state.quests.completedIds.includes(COMPLETE_ID)) return false;
    state.quests.completedIds.push(COMPLETE_ID); state.progression.chapter = Math.max(4, state.progression.chapter); state.progression.storyStep = "first_playable_complete";
    if (!state.progression.defeatedBosses.includes("boss_yodomi_tree")) state.progression.defeatedBosses.push("boss_yodomi_tree");
    this.changed("progression"); return true;
  }
  private addFlag(flag: string) { if (this.state().events.flags.includes(flag)) return false; this.state().events.flags.push(flag); this.changed("events"); return true; }
}
