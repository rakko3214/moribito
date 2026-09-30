export type StoryDialogueLine = { speaker: string; text: string };

export const STORY_DIALOGUES = {
  bakegaeruIntro: [
    { speaker: "主人公", text: "化け蛙そのものではなく、身体を覆う穢れを削るんだ。" },
    { speaker: "戦闘指南", text: "白・青の予兆は移動回避か結界。黒紫の予兆は結界を貫通するため、範囲から離れてください。" },
    { speaker: "戦闘指南", text: "濁流大波は回避できません。結界で防ぎ、疲労した隙に攻撃してください。" },
  ],
  bakegaeruCleansed: [
    { speaker: "主人公", text: "穢れの外殻が剥がれた……。" },
    { speaker: "語り", text: "本来の姿へ戻った化け蛙は、主人公を恐れるように後ずさり、そのまま古池へ逃げていった。" },
    { speaker: "主人公", text: "あの妖怪は、本当に村を苦しめていたのだろうか。" },
  ],
  kodamaEncounter: [
    { speaker: "陽太", text: "あの小さな木の子が、ずっとぼくを守ってくれたんだ。" },
    { speaker: "語り", text: "木霊は逃げず、自分の身体を盾にして陽太を穢れから守っている。" },
    { speaker: "主人公", text: "攻撃すべき相手は木霊じゃない。森を覆う穢れだ。" },
  ],
  yodomiTreeIntro: [
    { speaker: "主人公", text: "これは妖怪ではない。森に蓄積した穢れが、大樹を侵食している。" },
    { speaker: "戦闘指南", text: "根の包囲では大樹ではなく周囲の根を攻撃し、脱出してください。" },
    { speaker: "戦闘指南", text: "穢れ胞子は結界で防げません。予告された安全地帯へ移動してください。" },
  ],
  grandfatherNotebook: [
    { speaker: "祖父の手帳", text: "見ることと、教えられることは違う。" },
    { speaker: "祖父の手帳", text: "結師は名や言い伝えだけで裁かず、その者が何をしたのかを自分の目で確かめなければならない。" },
    { speaker: "主人公", text: "祖父も、妖怪をひとまとめにして考えてはいなかったんだ。" },
  ],
  kodamaDeparture: [
    { speaker: "語り", text: "後日。木陰の木霊は、以前よりも長く主人公を見つめている。" },
    { speaker: "語り", text: "主人公が近づくと姿を消し、その場所には木の実が一つだけ残されていた。" },
    { speaker: "主人公", text: "すべての妖怪が悪いわけじゃない。自分の目で見たことを信じよう。" },
  ],
} as const satisfies Record<string, readonly StoryDialogueLine[]>;
