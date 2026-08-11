import type { StateAccessor, StateChanged } from "./types.js";

const CHAPTER_ONE_COMPLETE = "chapter1_onboarding";
const COMPLETE_ID = "chapter2_bakegaeru";
const BOSS_CLEANSED = "chapter2:bakegaeru_cleansed";
const REQUIRED_OFFERINGS = ["food_simmered_daikon", "fish_ayu", "medicine_healing"] as const;

export type ChapterTwoStep =
  | "locked"
  | "investigate_water"
  | "help_villagers"
  | "fulfill_offering"
  | "report_to_shrine"
  | "purify_bakegaeru"
  | "restored_pond"
  | "complete";

const OBJECTIVES: Record<ChapterTwoStep, string> = {
  locked: "第1章を進める",
  investigate_water: "川で釣りをして水辺の異変を調べる",
  help_villagers: "楓と鉄斎の村人依頼を完了する",
  fulfill_offering: "神社へ料理・魚・薬を奉納する",
  report_to_shrine: "神主に水辺の異変を報告する",
  purify_bakegaeru: "化け蛙を倒さず、身体を覆う穢れを浄化する",
  restored_pond: "浄化された水系素材を確認する",
  complete: "第2章を完了しました",
};

const STORY_BEATS: Record<ChapterTwoStep, string> = {
  locked: "結師代理として歩み始める準備を整えよう。",
  investigate_water: "川の魚が減り、水路にも濁りが広がっている。原因を調べよう。",
  help_villagers: "異変の中でも村の暮らしは続く。困っている人を助けよう。",
  fulfill_offering: "生活で得た品を神社へ納め、浄化へ向かう支度を整えよう。",
  report_to_shrine: "神主は古池に棲む妖怪が穢れを広げていると考えている。",
  purify_bakegaeru: "化け蛙そのものではなく、身体を覆う穢れだけを削り取ろう。",
  restored_pond: "穢れの外殻を失った化け蛙は、主人公を恐れて池へ逃げていった。",
  complete: "水辺は静けさを取り戻したが、妖怪が本当に原因だったのか疑問が残る。",
};

export class ChapterTwoProgressionSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}

  get step(): ChapterTwoStep {
    const state = this.state();
    if (state.quests.completedIds.includes(COMPLETE_ID)) return "complete";
    if (!state.quests.completedIds.includes(CHAPTER_ONE_COMPLETE)) return "locked";
    if (!state.events.flags.some((flag) => flag.startsWith("fishing_cast_count:"))) return "investigate_water";
    if (!["request_kaede_daikon", "request_tessai_wood"].every((id) => state.quests.completedIds.includes(id))) return "help_villagers";
    if (!REQUIRED_OFFERINGS.every((id) => state.events.flags.includes(`offering:${id}`))) return "fulfill_offering";
    if ((state.npcs.states.kannushi?.friendship ?? 0) <= 0) return "report_to_shrine";
    if (!state.events.flags.includes(BOSS_CLEANSED)) return "purify_bakegaeru";
    if (!state.inventory.items.some((item) => item.itemId === "material_purified_water" && item.quantity > 0)) return "restored_pond";
    return "complete";
  }

  get objective() { return OBJECTIVES[this.step]; }
  get storyBeat() { return STORY_BEATS[this.step]; }
  get isUnlocked() { return this.step !== "locked"; }
  get isComplete() { return this.step === "complete"; }

  recordBossCleansed() {
    if (this.state().events.flags.includes(BOSS_CLEANSED)) return false;
    this.state().events.flags.push(BOSS_CLEANSED);
    this.changed("events");
    return true;
  }

  sync() {
    const state = this.state();
    if (this.step !== "complete" || state.quests.completedIds.includes(COMPLETE_ID)) return false;
    state.quests.completedIds.push(COMPLETE_ID);
    state.progression.chapter = Math.max(3, state.progression.chapter);
    state.progression.storyStep = "chapter3_start";
    if (!state.progression.defeatedBosses.includes("boss_bakegaeru")) state.progression.defeatedBosses.push("boss_bakegaeru");
    this.changed("progression");
    return true;
  }
}
