import type { SaveDataV1 } from "@moribito/shared";

export function saveSummary(save: SaveDataV1): string {
  const seasons: Record<string, string> = { spring: "春", summer: "夏", autumn: "秋", fall: "秋", winter: "冬" };
  const date = `${save.time.year}年目 ${seasons[save.time.season] ?? save.time.season} ${save.time.day}日`;
  return save.progression.storyStep === "first_playable_complete"
    ? `${date}・第3章クリア後の暮らしを再開できます`
    : `${date}・第${save.progression.chapter}章から再開できます`;
}
