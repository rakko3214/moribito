import type { MapId } from "../../world/mapTypes.js";
import type { StateAccessor, StateChanged } from "./types.js";

const COMPLETE_ID = "chapter1_onboarding";
const VISITED_HOME = "chapter1:visited_home";
const VISITED_SHRINE = "chapter1:visited_shrine";
const VILLAGE_NPCS = ["shiki", "kaede", "genzo", "tessai"] as const;

export type ChapterOneStep =
  | "meet_shiki"
  | "visit_home"
  | "try_farming"
  | "gather_material"
  | "first_delivery"
  | "greet_villagers"
  | "visit_shrine"
  | "first_purification"
  | "complete";

const OBJECTIVES: Record<ChapterOneStep, string> = {
  meet_shiki: "志希に話しかける",
  visit_home: "村の南にある祖父の家へ行く",
  try_farming: "畑を1区画耕す",
  gather_material: "村で素材を1つ採取する",
  first_delivery: "楓か鉄斎の依頼品を納品する",
  greet_villagers: "村の志希・楓・源三・鉄斎に挨拶する",
  visit_shrine: "村の北にある神社へ向かう",
  first_purification: "神社の穢れ妖怪を浄化する",
  complete: "第1章を完了しました",
};

const STORY_BEATS: Record<ChapterOneStep, string> = {
  meet_shiki: "都会から守人村へ帰郷した主人公。幼なじみの志希が待っている。",
  visit_home: "志希と再会し、祖父が遺した家で暮らしを始めることになった。",
  try_farming: "荒れた畑を手入れし、村での新しい生活を始めよう。",
  gather_material: "村を歩き、暮らしに必要な自然の恵みを集めよう。",
  first_delivery: "集めた品を届け、人とのつながりを取り戻していこう。",
  greet_villagers: "帰郷を村人へ知らせ、変わった村と変わらない人々を知ろう。",
  visit_shrine: "神社に人影がない。帰り道の森には不穏な気配が漂っている。",
  first_purification: "初めて見る穢れ妖怪。神主と村長の助けを受け、浄化に挑もう。",
  complete: "初浄化を終え、主人公は守人村の結師代理を引き受けた。",
};

export class ChapterOneProgressionSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}

  get step(): ChapterOneStep {
    const state = this.state();
    if (state.quests.completedIds.includes(COMPLETE_ID)) return "complete";
    if ((state.npcs.states.shiki?.friendship ?? 0) <= 0) return "meet_shiki";
    if (!state.events.flags.includes(VISITED_HOME)) return "visit_home";
    if (state.farming.plots.length === 0) return "try_farming";
    if (!Object.values(state.world.maps).some((map) => map.collectedObjects.length > 0)) return "gather_material";
    if (!state.quests.completedIds.some((id) => id.startsWith("request_"))) return "first_delivery";
    if (!VILLAGE_NPCS.every((id) => (state.npcs.states[id]?.friendship ?? 0) > 0)) return "greet_villagers";
    if (!state.events.flags.includes(VISITED_SHRINE)) return "visit_shrine";
    if (!state.inventory.items.some((item) => item.itemId === "material_purified_fragment" && item.quantity > 0)) return "first_purification";
    return "complete";
  }

  get objective() { return OBJECTIVES[this.step]; }
  get storyBeat() { return STORY_BEATS[this.step]; }
  get isComplete() { return this.step === "complete"; }

  recordVisit(mapId: MapId) {
    const flag = mapId === "map_home" ? VISITED_HOME : mapId === "map_shrine" ? VISITED_SHRINE : undefined;
    if (!flag || this.state().events.flags.includes(flag)) return false;
    this.state().events.flags.push(flag);
    this.changed("events");
    return true;
  }

  sync() {
    const state = this.state();
    if (this.step !== "complete" || state.quests.completedIds.includes(COMPLETE_ID)) return false;
    state.quests.completedIds.push(COMPLETE_ID);
    state.progression.chapter = Math.max(2, state.progression.chapter);
    if (state.progression.storyStep === "prologue_start") state.progression.storyStep = "chapter2_start";
    this.changed("progression");
    return true;
  }
}
