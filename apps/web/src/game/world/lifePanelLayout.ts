export type LifePanelLayout = { pageSize: number; buttonSpacing: number; panelHeight: number };

export function lifePanelLayout(viewportHeight: number): LifePanelLayout {
  const panelHeight = Math.min(520, Math.max(330, viewportHeight - 48));
  return { panelHeight, pageSize: viewportHeight < 620 ? 3 : 4, buttonSpacing: viewportHeight < 520 ? 50 : 58 };
}

export function pageItems<T>(items: readonly T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.max(0, Math.min(page, pageCount - 1));
  return { items: items.slice(safePage * pageSize, (safePage + 1) * pageSize), page: safePage, pageCount };
}
