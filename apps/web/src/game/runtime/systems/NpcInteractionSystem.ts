import type { StateAccessor, StateChanged } from "./types.js";

export const NPC_NAMES = { shiki: "志希", kaede: "楓", genzo: "源三", tessai: "鉄斎", kannushi: "神主", yota: "陽太" } as const;
export type NpcId = keyof typeof NPC_NAMES;
const LINES: Record<NpcId, string[]> = {
  shiki: ["畑仕事は焦らず、一日ずつ続けていこう。", "採れた野菜、今度いっしょに食べようよ。"],
  kaede: ["素材の味を大切にすれば、きっとおいしくなるよ。", "料理は誰かと囲むと、もっと温かくなるの。"],
  genzo: ["川をよく見ろ。魚影が教えてくれる。", "川を大切にする者には、川も応えてくれるさ。"],
  tessai: ["道具は使う者の心を映す。", "受け継ぐのは道具じゃない。想いだ。"],
  kannushi: ["日々の営みを重ね、神社へ報告してください。", "穢れには近づきすぎぬよう、気をつけるのです。"],
  yota: ["森の入口で、きれいな木の実を見つけたんだ。", "小さな木の子が、ぼくを守ってくれたんだよ。"],
};

export class NpcInteractionSystem {
  constructor(private readonly state: StateAccessor, private readonly changed: StateChanged) {}
  talk(npcId: NpcId) {
    const state = this.state();
    const npc = state.npcs.states[npcId] ?? { friendship: 0, flags: [] };
    state.npcs.states[npcId] = npc;
    npc.friendship ??= 0; npc.flags ??= [];
    const dayFlag = `talked:${state.time.year}:${state.time.season}:${state.time.day}`;
    const gained = !npc.flags.includes(dayFlag);
    if (gained) { npc.flags.push(dayFlag); npc.friendship = Math.min(100, npc.friendship + 1); this.changed("npcs"); }
    const lines = LINES[npcId];
    const line = lines[(npc.friendship ?? 0) >= 3 ? 1 : 0] ?? lines[0];
    return { name: NPC_NAMES[npcId], line, friendship: npc.friendship ?? 0, friendshipGained: gained };
  }
  friendship(npcId: NpcId) { return this.state().npcs.states[npcId]?.friendship ?? 0; }
}
