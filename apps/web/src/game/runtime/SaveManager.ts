export type SaveStatus = "saved" | "saving" | "dirty" | "error";
export type SaveManagerConfig = { autoSaveIntervalMs: number };
const DEFAULT_CONFIG: SaveManagerConfig = { autoSaveIntervalMs: 5 * 60 * 1000 };

export class SaveManager {
  private dirty = false;
  private saving = false;
  private safeToSave = true;
  private saveRequested = false;
  private mutationVersion = 0;
  private savingVersion = 0;
  private elapsedSinceSaveMs = 0;

  constructor(private readonly sendSave: () => void, private readonly statusChanged: (status: SaveStatus) => void, private readonly config = DEFAULT_CONFIG) {}
  get isSaving() { return this.saving; }
  load(isNewGame: boolean) {
    this.dirty = isNewGame;
    this.saving = false;
    this.saveRequested = false;
    this.mutationVersion = 0;
    this.savingVersion = 0;
    this.elapsedSinceSaveMs = 0;
    this.statusChanged(this.dirty ? "dirty" : "saved");
  }
  markDirty() {
    this.mutationVersion += 1;
    if (this.dirty) return;
    this.dirty = true;
    this.statusChanged("dirty");
  }
  update(deltaMs: number) {
    if (!this.dirty || this.saving) return;
    this.elapsedSinceSaveMs += deltaMs;
    if (this.elapsedSinceSaveMs >= this.config.autoSaveIntervalMs) this.request();
  }
  request() {
    if (!this.dirty) return;
    if (this.saving || !this.safeToSave) { this.saveRequested = true; return; }
    this.saving = true;
    this.saveRequested = false;
    this.savingVersion = this.mutationVersion;
    this.statusChanged("saving");
    this.sendSave();
  }
  setSafeToSave(safe: boolean) {
    this.safeToSave = safe;
    if (safe && this.saveRequested) this.request();
  }
  completed() {
    this.saving = false;
    this.elapsedSinceSaveMs = 0;
    this.dirty = this.mutationVersion > this.savingVersion;
    this.statusChanged(this.dirty ? "dirty" : "saved");
    if (this.dirty && this.saveRequested) this.request();
  }
  failed() {
    this.saving = false;
    this.dirty = true;
    this.saveRequested = false;
    this.statusChanged("error");
  }
}
