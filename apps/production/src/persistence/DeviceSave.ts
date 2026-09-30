import { createNewSnapshot, SAVE_KEY, saveSchema, type PlayerPosition, type SaveSnapshot } from "../domain/save.js";

type SaveStorage = Pick<Storage, "getItem" | "setItem">;
type SaveLock = Pick<LockManager, "request">;

export class DeviceSave {
  constructor(
    private readonly storage: SaveStorage,
    private readonly locks?: SaveLock,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {}

  load(): SaveSnapshot | null {
    const raw = this.storage.getItem(SAVE_KEY);
    if (raw === null) return null;
    try { return saveSchema.parse(JSON.parse(raw)); }
    catch { throw new Error("保存データを読み込めません。元のデータは保持しています。"); }
  }

  startNew(): Promise<SaveSnapshot> {
    return this.withLock(() => {
      const snapshot = createNewSnapshot(this.newId(), this.now());
      this.storage.setItem(SAVE_KEY, JSON.stringify(snapshot));
      return snapshot;
    });
  }

  save(current: SaveSnapshot, player: PlayerPosition): Promise<SaveSnapshot> {
    return this.withLock(() => {
      const stored = this.load();
      if (!stored || stored.saveId !== current.saveId || stored.revision !== current.revision) {
        throw new Error("別のタブで保存が更新されています。タイトルから読み込み直してください。");
      }
      const next = saveSchema.parse({
        ...current,
        revision: current.revision + 1,
        savedAt: this.now(),
        state: { ...current.state, player },
      });
      this.storage.setItem(SAVE_KEY, JSON.stringify(next));
      return next;
    });
  }

  private withLock<T>(operation: () => T): Promise<T> {
    if (!this.locks) return Promise.resolve().then(operation);
    return this.locks.request("moribito.production.save", operation);
  }
}
