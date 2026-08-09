import type { SaveDataV1 } from "@moribito/shared";
import type { GameBridge } from "../bridge/GameBridge.js";
import type { MapId } from "../world/mapTypes.js";
import { EventBus } from "./EventBus.js";
import { createInitialState } from "./initialState.js";
import { SaveMapper } from "./SaveMapper.js";

type RuntimeEvent = { type: "STATE_LOADED" } | { type: "PLAYER_CHANGED" };

export class GameRuntime {
  private state = createInitialState();
  private readonly mapper = new SaveMapper();
  private dirty = false;
  private saving = false;
  private mutationVersion = 0;
  private savingVersion = 0;
  readonly events = new EventBus<RuntimeEvent>();

  constructor(private readonly bridge: GameBridge) {
    bridge.onGame((event) => {
      if (event.type === "START_NEW_GAME") this.load(createInitialState());
      if (event.type === "LOAD_GAME") this.load(event.payload);
      if (event.type === "REQUEST_SAVE") this.requestSave();
      if (event.type === "SAVE_COMPLETED") this.saveCompleted(event.payload.revision, event.payload.savedAt);
      if (event.type === "SAVE_FAILED") this.saveFailed();
    });
  }

  getState() { return this.state; }
  updatePlayer(mapId: MapId, x: number, y: number, direction?: SaveDataV1["player"]["direction"]) {
    const player = this.state.player;
    if (player.mapId === mapId && Math.abs(player.x - x) < 0.5 && Math.abs(player.y - y) < 0.5 && (!direction || player.direction === direction)) return;
    player.mapId = mapId;
    player.x = Math.round(x * 10) / 10;
    player.y = Math.round(y * 10) / 10;
    if (direction) player.direction = direction;
    this.markDirty();
    this.events.emit({ type: "PLAYER_CHANGED" });
  }
  requestSave() {
    if (this.saving || !this.dirty) return;
    this.saving = true;
    this.savingVersion = this.mutationVersion;
    this.bridge.toReact({ type: "SAVE_STATE_CHANGED", payload: { status: "saving" } });
    this.bridge.toReact({ type: "SAVE_REQUEST", payload: this.mapper.toSaveData(this.state) });
  }
  private load(saveData: SaveDataV1) {
    this.state = this.mapper.fromSaveData(saveData);
    this.dirty = this.state.revision === 0;
    this.saving = false;
    this.mutationVersion = 0;
    this.savingVersion = 0;
    this.bridge.toReact({ type: "SAVE_STATE_CHANGED", payload: { status: this.dirty ? "dirty" : "saved" } });
    this.events.emit({ type: "STATE_LOADED" });
  }
  private markDirty() {
    this.mutationVersion += 1;
    if (this.dirty) return;
    this.dirty = true;
    this.bridge.toReact({ type: "SAVE_STATE_CHANGED", payload: { status: "dirty" } });
  }
  private saveCompleted(revision: number, savedAt: string) {
    this.state.revision = revision;
    this.state.savedAt = savedAt;
    this.dirty = this.mutationVersion > this.savingVersion;
    this.saving = false;
    this.bridge.toReact({ type: "SAVE_STATE_CHANGED", payload: { status: this.dirty ? "dirty" : "saved" } });
  }
  private saveFailed() {
    this.saving = false;
    this.dirty = true;
    this.bridge.toReact({ type: "SAVE_STATE_CHANGED", payload: { status: "error" } });
  }
}
