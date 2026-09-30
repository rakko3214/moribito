import { createNewSnapshot, SAVE_KEY, saveSchema, type GameState, type SaveSnapshot } from "../domain/save.js";

type SaveStorage = Pick<Storage, "getItem" | "setItem">;
type SaveLock = Pick<LockManager, "request">;

export class SaveConflictError extends Error {
  constructor() { super("別のタブで保存が更新されています。保存済みデータを読み込み直してください。"); }
}

export class SaveStorageError extends Error {
  constructor(action: "read" | "write", cause: unknown) {
    super(action === "read"
      ? "端末の保存データにアクセスできません。ブラウザの保存設定を確認してください。"
      : "端末に保存できません。空き容量やブラウザの保存設定を確認し、再試行してください。", { cause });
  }
}

export class DeviceSave {
  constructor(
    private readonly storage: SaveStorage,
    private readonly locks?: SaveLock,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {}

  load(): SaveSnapshot | null {
    let raw: string | null;
    try { raw = this.storage.getItem(SAVE_KEY); }
    catch (cause) { throw new SaveStorageError("read", cause); }
    if (raw === null) return null;
    try { return saveSchema.parse(JSON.parse(raw)); }
    catch { throw new Error("保存データを読み込めません。元のデータは保持しています。"); }
  }

  startNew(): Promise<SaveSnapshot> {
    return this.withLock(() => {
      const snapshot = createNewSnapshot(this.newId(), this.now());
      this.writeRaw(snapshot);
      return snapshot;
    });
  }

  save(current: SaveSnapshot, state: GameState): Promise<SaveSnapshot> {
    return this.withLock(() => this.write(current, state));
  }

  // pagehide cannot wait for a Web Lock; write synchronously as a last chance.
  saveBeforeUnload(current: SaveSnapshot, state: GameState): SaveSnapshot {
    return this.write(current, state);
  }

  private write(current: SaveSnapshot, state: GameState): SaveSnapshot {
    const stored = this.load();
    if (!stored || stored.saveId !== current.saveId || stored.revision !== current.revision) {
      throw new SaveConflictError();
    }
    const next = saveSchema.parse({
      ...current,
      revision: current.revision + 1,
      savedAt: this.now(),
      state,
    });
    this.writeRaw(next);
    return next;
  }

  private writeRaw(snapshot: SaveSnapshot): void {
    try { this.storage.setItem(SAVE_KEY, JSON.stringify(snapshot)); }
    catch (cause) { throw new SaveStorageError("write", cause); }
  }

  private withLock<T>(operation: () => T): Promise<T> {
    if (!this.locks) return Promise.resolve().then(operation);
    return this.locks.request("moribito.production.save", operation);
  }
}
