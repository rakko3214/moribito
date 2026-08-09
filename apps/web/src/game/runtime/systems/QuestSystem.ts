import type { StateAccessor, StateChanged } from "./types.js";

export class QuestSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}
  start(id: string, step = "start") {
    const quests = this.state().quests;
    if (quests.completedIds.includes(id) || quests.active.some((quest) => quest.id === id)) return false;
    quests.active.push({ id, step, value: 0 });
    this.changed("quests");
    return true;
  }
  advance(id: string, step: string, value = 0) {
    const quest = this.state().quests.active.find((item) => item.id === id);
    if (!quest) return false;
    quest.step = step;
    quest.value = value;
    this.changed("quests");
    return true;
  }
  complete(id: string) {
    const quests = this.state().quests;
    const index = quests.active.findIndex((quest) => quest.id === id);
    if (index < 0) return false;
    quests.active.splice(index, 1);
    if (!quests.completedIds.includes(id)) quests.completedIds.push(id);
    this.changed("quests");
    return true;
  }
}
