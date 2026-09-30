export type CookingGameLayout = {
  panelLeft: number;
  panelTop: number;
  panelWidth: number;
  adviceX: number;
  adviceY: number;
  adviceWidth: number;
  potX: number;
  gaugeX: number;
  centerY: number;
  trackHeight: number;
  footerY: number;
};

export function cookingGameLayout(viewportWidth: number, viewportHeight: number): CookingGameLayout {
  const panelWidth = Math.min(430, viewportWidth - 24);
  const panelHeight = Math.min(520, Math.max(330, viewportHeight - 48));
  const panelLeft = viewportWidth / 2 - panelWidth / 2;
  const panelTop = Math.max(24, viewportHeight / 2 - panelHeight / 2);
  const trackHeight = Math.max(132, Math.min(210, panelHeight - 310));
  const centerY = panelTop + 190 + trackHeight / 2;
  return {
    panelLeft,
    panelTop,
    panelWidth,
    adviceX: viewportWidth / 2,
    adviceY: panelTop + 140,
    adviceWidth: panelWidth - 52,
    potX: panelLeft + panelWidth * 0.25,
    gaugeX: panelLeft + panelWidth * 0.7,
    centerY,
    trackHeight,
    footerY: centerY + trackHeight / 2 + 34,
  };
}
