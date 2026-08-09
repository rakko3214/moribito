import type { SaveDataV1 } from "@moribito/shared";
export interface SaveRepository {
  get(userId: string): Promise<SaveDataV1 | null>;
  put(userId: string, baseRevision: number, save: SaveDataV1): Promise<SaveDataV1 | "conflict">;
  reset(userId: string): Promise<void>;
}
