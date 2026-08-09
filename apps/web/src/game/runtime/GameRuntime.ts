import type { SaveDataV1 } from "@moribito/shared";
import type { GameBridge } from "../bridge/GameBridge.js";
import type { MapId } from "../world/mapTypes.js";
import { EventBus } from "./EventBus.js";
import { createInitialState } from "./initialState.js";
import { SaveMapper } from "./SaveMapper.js";
import { SaveManager } from "./SaveManager.js";
import { EventSystem } from "./systems/EventSystem.js";
import { InventorySystem } from "./systems/InventorySystem.js";
import { QuestSystem } from "./systems/QuestSystem.js";
import { TimeSystem } from "./systems/TimeSystem.js";

type RuntimeDomain = "time" | "inventory" | "quests" | "events";
type RuntimeEvent = { type: "STATE_LOADED" } | { type: "PLAYER_CHANGED" } | { type: "STATE_CHANGED"; domain: RuntimeDomain };

export class GameRuntime {
  private state = createInitialState();
  private readonly mapper = new SaveMapper();
  private paused = false;
  readonly events = new EventBus<RuntimeEvent>();
  readonly time = new TimeSystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly inventory = new InventorySystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly quests = new QuestSystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly eventSystem = new EventSystem(() => this.state, (domain) => this.domainChanged(domain));
  private readonly unsubscribeBridge: () => void;
  private readonly saveManager = new SaveManager(
    () => this.bridge.toReact({ type: "SAVE_REQUEST", payload: this.mapper.toSaveData(this.state) }),
    (status) => this.bridge.toReact({ type: "SAVE_STATE_CHANGED", payload: { status } }),
  );

  constructor(private readonly bridge: GameBridge) {
    this.unsubscribeBridge = bridge.onGame((event) => {
      if (event.type === "START_NEW_GAME") this.load(createInitialState());
      if (event.type === "LOAD_GAME") this.load(event.payload);
      if (event.type === "REQUEST_SAVE") this.requestSave();
      if (event.type === "SAVE_COMPLETED") this.saveCompleted(event.payload.revision, event.payload.savedAt);
      if (event.type === "SAVE_FAILED") this.saveFailed();
      if (event.type === "PAUSE_GAME") this.paused = true;
      if (event.type === "RESUME_GAME") this.paused = false;
    });
  }

  getState() { return this.state; }
  destroy() { this.unsubscribeBridge(); }
  update(deltaMs: number) {
    if (!this.paused && !this.saveManager.isSaving) this.time.update(deltaMs);
    this.saveManager.update(deltaMs);
  }
  get isPaused() { return this.paused; }
  setSaveSafe(safe: boolean) { this.saveManager.setSafeToSave(safe); }
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
    this.saveManager.request();
  }
  private load(saveData: SaveDataV1) {
    this.state = this.mapper.fromSaveData(saveData);
    this.saveManager.load(this.state.revision === 0);
    this.events.emit({ type: "STATE_LOADED" });
  }
  private markDirty() {
    this.saveManager.markDirty();
  }
  private domainChanged(domain: RuntimeDomain) {
    this.markDirty();
    this.events.emit({ type: "STATE_CHANGED", domain });
  }
  private saveCompleted(revision: number, savedAt: string) {
    this.state.revision = revision;
    this.state.savedAt = savedAt;
    this.saveManager.completed();
  }
  private saveFailed() {
    this.saveManager.failed();
  }
}
