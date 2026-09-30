import type { MapGameplayObject } from "./mapObjectLayers.js";

export type FarmPlotPoint = { id: string; x: number; y: number };

const finiteNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;

export function farmPlotsFromEventZone(zone: MapGameplayObject | undefined): FarmPlotPoint[] {
  if (!zone) return [];
  const originX = finiteNumber(zone.properties.originX);
  const originY = finiteNumber(zone.properties.originY);
  const columns = finiteNumber(zone.properties.columns);
  const rows = finiteNumber(zone.properties.rows);
  const spacing = finiteNumber(zone.properties.spacing);
  if (originX === undefined || originY === undefined || !columns || !rows || !spacing || columns < 1 || rows < 1 || spacing < 1 || !Number.isInteger(columns) || !Number.isInteger(rows)) return [];
  return Array.from({ length: columns * rows }, (_, index) => ({
    id: `farm_${index + 1}`,
    x: originX + (index % columns) * spacing,
    y: originY + Math.floor(index / columns) * spacing,
  }));
}
