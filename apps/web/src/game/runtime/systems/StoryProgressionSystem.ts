import type { StateAccessor, StateChanged } from "./types.js";

const QUEST_ID = "main_first_playable";
export type StoryStep = "learn_life" | "fulfill_offering" | "purify_enemy" | "complete";

export class StoryProgressionSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}
  get step(): StoryStep {
    if (this.state().quests.completedIds.includes(QUEST_ID)) return "complete";
    return (this.state().quests.active.find((quest) => quest.id === QUEST_ID)?.step as StoryStep | undefined) ?? "learn_life";
  }
  get objective() {
    return ({ learn_life: "料理・釣り・調合を1回ずつ体験する", fulfill_offering: "神社で料理・魚・薬を奉納する", purify_enemy: "神社の穢れ妖怪を浄化する", complete: "第3章への準備が整いました" } as const)[this.step];
  }
  sync() {
    const state = this.state();
    let quest = state.quests.active.find((item) => item.id === QUEST_ID);
    let created = false;
    if (!quest && !state.quests.completedIds.includes(QUEST_ID)) {
      quest = { id: QUEST_ID, step: "learn_life", value: 0 };
      state.quests.active.push(quest);
      created = true;
    }
    if (!quest) return false;
    let next = quest.step as StoryStep;
    if (next === "learn_life" && this.lifeExperienced()) next = "fulfill_offering";
    if (next === "fulfill_offering" && ["food_simmered_daikon", "fish_ayu", "medicine_healing"].every((id) => state.events.flags.includes(`offering:${id}`))) next = "purify_enemy";
    if (next === "purify_enemy" && state.inventory.items.some((item) => item.itemId === "material_purified_fragment" && item.quantity > 0)) next = "complete";
    if (next === quest.step) {
      if (created) this.changed("progression");
      return created;
    }
    if (next === "complete") {
      state.quests.active.splice(state.quests.active.indexOf(quest), 1);
      state.quests.completedIds.push(QUEST_ID);
    } else quest.step = next;
    this.changed("progression");
    return true;
  }
  private lifeExperienced() {
    const state = this.state();
    const has = (ids: string[]) => ids.some((id) => state.inventory.items.some((item) => item.itemId === id && item.quantity > 0) || state.events.flags.includes(`offering:${id}`));
    return has(["food_simmered_daikon", "food_herb_rice"]) && has(["fish_ayu", "fish_crucian_carp"]) && has(["medicine_healing"]);
  }
}
