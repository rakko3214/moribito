export type AssetFailureClassification = "fatal" | "warning";

export function classifyAssetFailure(key: string, type: string): AssetFailureClassification {
  return key.startsWith("map-") || type === "tilemapJSON" || type === "json" ? "fatal" : "warning";
}

export function assetFailureMessage(key: string, classification: AssetFailureClassification): string {
  return classification === "fatal"
    ? `必須マップ「${key}」を読み込めませんでした。通信またはキャッシュを確認してください。`
    : `任意アセット「${key}」を読み込めなかったため、簡易表示で続行します。`;
}

export function normalizeLoadProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(1, Math.max(0, value)) * 100);
}
