import { saveDataV1Schema, type SaveDataV1 } from "@moribito/shared";

export interface SaveCacheStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalSaveCache {
  constructor(private readonly storage: SaveCacheStorage, private readonly prefix = "moribito.save-cache.") {}

  load(userId: string): SaveDataV1 | null {
    try {
      const serialized = this.storage.getItem(`${this.prefix}${userId}`);
      if (!serialized) return null;
      const parsed = saveDataV1Schema.safeParse(JSON.parse(serialized));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  save(userId: string, saveData: SaveDataV1): boolean {
    try {
      this.storage.setItem(`${this.prefix}${userId}`, JSON.stringify(saveDataV1Schema.parse(structuredClone(saveData))));
      return true;
    } catch {
      return false;
    }
  }

  clear(userId: string): boolean {
    try { this.storage.removeItem(`${this.prefix}${userId}`); return true; }
    catch { return false; }
  }
}
