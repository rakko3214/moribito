export const LIFE_STATION_DEFINITIONS = {
  cooking: { label: "料理", marker: "鍋", color: 0xc98255 },
  fishing: { label: "釣り", marker: "魚", color: 0x5d91aa },
  alchemy: { label: "調合", marker: "薬", color: 0x7c8f62 },
  smithing: { label: "結晶石を作る", marker: "鍛", color: 0x9b6547 },
  shop: { label: "種を買う 20文", marker: "店", color: 0xb68a51 },
  offering: { label: "奉納", marker: "祈", color: 0xa66b65 },
  combat: { label: "戦闘開始", marker: "穢", color: 0x704955 },
  boss: { label: "化け蛙戦", marker: "蛙", color: 0x456f62 },
  kodama: { label: "木霊と陽太", marker: "木", color: 0x699064 },
  tree: { label: "淀みの大樹", marker: "樹", color: 0x68435f },
  construction: { label: "樹へ建築を依頼", marker: "建", color: 0x8d6748 },
  livestock: { label: "家畜を世話する", marker: "飼", color: 0x9b8054 },
  notebook: { label: "祖父の手帳を読む", marker: "帳", color: 0x8a7456 },
} as const;

export type LifeStationId = keyof typeof LIFE_STATION_DEFINITIONS;
export const isLifeStationId = (value: string): value is LifeStationId => value in LIFE_STATION_DEFINITIONS;
