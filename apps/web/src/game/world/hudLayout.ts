export type HudLayout = { compact: boolean; contentWidth: number; detailsDefaultVisible: boolean; questWidth: number; actionRowY: number; weatherY: number; helpY: number; questY: number };
export function hudLayout(width: number): HudLayout {
  const compact = width < 760;
  const availableWidth = Math.max(220, width - 32);
  return { compact, contentWidth: availableWidth, detailsDefaultVisible: false, questWidth: compact ? Math.min(358, availableWidth) : 310, actionRowY: 14, weatherY: 48, helpY: 0, questY: 78 };
}
