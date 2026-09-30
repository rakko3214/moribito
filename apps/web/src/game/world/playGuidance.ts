import type { ChapterOneStep } from "../runtime/systems/ChapterOneProgressionSystem.js";
import type { ChapterTwoStep } from "../runtime/systems/ChapterTwoProgressionSystem.js";
import type { ChapterThreeStep } from "../runtime/systems/ChapterThreeProgressionSystem.js";

const CHAPTER_ONE_GUIDANCE: Record<ChapterOneStep, string> = {
  meet_shiki: "「志」の印へ近づき、話すを押す",
  visit_home: "光る出口をたどり、家の入口へ入る",
  try_farming: "畑で道具から鍬を選び、耕すを押す",
  gather_material: "木や石へ近づき、対応する道具で採取する",
  first_delivery: "依頼品を持って楓か鉄斎へ話しかける",
  greet_villagers: "地図で居場所を確認し、4人へ話しかける",
  visit_shrine: "目的地表示の光る出口をたどって神社へ向かう",
  first_purification: "参道の穢れへ近づき、攻撃と結界で浄化する",
  complete: "川方面へ進むと第2章が始まる",
};

const CHAPTER_TWO_GUIDANCE: Record<ChapterTwoStep, string> = {
  locked: "第1章の目的を進める",
  investigate_water: "川の釣り場へ近づき、釣るを押す",
  help_villagers: "依頼画面で必要品を確認し、楓と鉄斎へ届ける",
  fulfill_offering: "料理・鮎・回復薬を持って神社の奉納台を調べる",
  report_to_shrine: "神社で「神」の印へ近づき、話すを押す",
  purify_bakegaeru: "古池で予兆を避け、疲労中に穢れを浄化する",
  restored_pond: "古池の光る清めの水を採取する",
  complete: "村へ戻ると第3章の捜索が始まる",
};

const CHAPTER_THREE_GUIDANCE: Record<ChapterThreeStep, string> = {
  locked: "第2章の目的を進める",
  revisit_old_pond: "川から古池へ戻り、澄んだ水と化け蛙の様子を確かめる",
  ask_yota: "村で「陽」の印へ近づき、話すを押す",
  enter_forest: "村東側の目的地表示から森へ入る",
  follow_clues: "森と森深部で光る痕跡を3つ調べる",
  witness_kodama: "森深部の木霊へ近づき、様子を見る",
  fulfill_offering: "料理10品を用意し、神社の奉納台へ納める",
  purify_tree: "淀みの大樹で根を壊し、穢れ本体を浄化する",
  report_to_shrine: "結守神社で神主へ、木霊が陽太を守っていた事実を話す",
  read_notebook: "主人公宅の手帳台を調べ、祖父の言葉を読む",
  kodama_departure: "森深部へ戻り、木陰にいる木霊を見つける",
  complete: "第3章完了。生活と探索はそのまま続けられる",
};

export function actionGuidance(chapter: 1 | 2 | 3, step: ChapterOneStep | ChapterTwoStep | ChapterThreeStep) {
  if (chapter === 1) return CHAPTER_ONE_GUIDANCE[step as ChapterOneStep];
  if (chapter === 2) return CHAPTER_TWO_GUIDANCE[step as ChapterTwoStep];
  return CHAPTER_THREE_GUIDANCE[step as ChapterThreeStep];
}

export type CompletionStats = { day: number; completed: number; bosses: number; friendship: number; money: number };

export function completionSummary(stats: CompletionStats) {
  return [
    "木霊は陽太の無事を確かめ、森へ帰っていった。",
    "人と妖怪を結び直す物語は、ここから始まる。",
    "",
    `到達日: 春 ${stats.day}日`,
    `完了した物語・依頼: ${stats.completed}件`,
    `浄化したボス: ${stats.bosses}体`,
    `村人との友情合計: ${stats.friendship}`,
    `所持金: ${stats.money}文`,
    "",
    "この後も農業・料理・釣り・調合・建築・探索を続けられます。",
  ].join("\n");
}
