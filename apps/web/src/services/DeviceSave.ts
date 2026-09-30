import { saveDataV1Schema, type SaveDataV1 } from "@moribito/shared";
import { LocalSaveCache, type SaveCacheStorage } from "./LocalSaveCache.js";

// Retain the existing local cache key so current players keep their progress.
const USER = "local-user";
export class DeviceSave {
  private cache: LocalSaveCache;
  constructor(private storage: SaveCacheStorage) { this.cache = new LocalSaveCache(storage); }
  load() {
    const raw = this.storage.getItem(`moribito.save-cache.${USER}`);
    if (!raw) return null;
    let value: unknown;
    try { value = JSON.parse(raw); }
    catch { throw new Error("端末の保存データを読み込めません。データは削除せず保持しています。"); }
    const parsed = saveDataV1Schema.safeParse(value);
    if (!parsed.success) throw new Error("端末の保存データを読み込めません。データは削除せず保持しています。");
    return parsed.data;
  }
  save(data: SaveDataV1) {
    const current = this.load();
    if ((current?.revision ?? 0) !== data.revision) throw new Error("別のタブで保存が更新されています。タイトルから読み込み直してください。");
    const revision = data.revision + 1;
    const savedAt = new Date().toISOString();
    if (!this.cache.save(USER, { ...data, revision, savedAt })) throw new Error("端末に保存できません。空き容量やブラウザの保存設定を確認してください。");
    return { revision, savedAt };
  }
  reset() { if (!this.cache.clear(USER)) throw new Error("保存データを初期化できませんでした。"); }
}
const device = () => new DeviceSave(window.localStorage);
// Serialize the read/check/write sequence across tabs on HTTPS and localhost.
// Older browsers retain revision checks, but cannot guarantee cross-tab atomicity.
export function withDeviceSaveLock<T>(operation: () => T, locks?: Pick<LockManager, "request">): Promise<T> {
  return locks ? locks.request("moribito.device-save", operation) : Promise.resolve().then(operation);
}
export async function loadSave() { return { save: device().load(), pendingConflict: false, cloudUnavailable: false }; }
export async function putSave(data: SaveDataV1) { return withDeviceSaveLock(() => device().save(data), navigator.locks); }
export async function resetSave() { return withDeviceSaveLock(() => device().reset(), navigator.locks); }
