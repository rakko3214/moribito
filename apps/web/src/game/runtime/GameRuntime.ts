import type { SaveDataV1 } from "@moribito/shared";
import type { GameBridge } from "../bridge/GameBridge.js";
import type { MapId } from "../world/mapTypes.js";
import { EventBus } from "./EventBus.js";
import { createInitialState } from "./initialState.js";
import { SaveMapper } from "./SaveMapper.js";
import { SaveManager } from "./SaveManager.js";
import { EventSystem } from "./systems/EventSystem.js";
import { AlchemySystem } from "./systems/AlchemySystem.js";
import { CookingSystem } from "./systems/CookingSystem.js";
import { CombatSystem } from "./systems/CombatSystem.js";
import { FarmingSystem } from "./systems/FarmingSystem.js";
import { FishingSystem } from "./systems/FishingSystem.js";
import { GatheringSystem } from "./systems/GatheringSystem.js";
import { InventorySystem } from "./systems/InventorySystem.js";
import { QuestSystem } from "./systems/QuestSystem.js";
import { OfferingSystem } from "./systems/OfferingSystem.js";
import { NpcInteractionSystem } from "./systems/NpcInteractionSystem.js";
import { ShopSystem } from "./systems/ShopSystem.js";
import { StoryProgressionSystem } from "./systems/StoryProgressionSystem.js";
import { VillagerRequestSystem } from "./systems/VillagerRequestSystem.js";
import { ChapterOneProgressionSystem } from "./systems/ChapterOneProgressionSystem.js";
import { BakegaeruBossSystem } from "./systems/BakegaeruBossSystem.js";
import { ChapterTwoProgressionSystem } from "./systems/ChapterTwoProgressionSystem.js";
import { ChapterThreeProgressionSystem } from "./systems/ChapterThreeProgressionSystem.js";
import { YodomiTreeBossSystem } from "./systems/YodomiTreeBossSystem.js";
import { TimeSystem } from "./systems/TimeSystem.js";

type RuntimeDomain = "time" | "inventory" | "quests" | "events" | "farming" | "gathering" | "cooking" | "fishing" | "alchemy" | "shop" | "offering" | "combat" | "progression" | "npcs";
type RuntimeEvent = { type: "STATE_LOADED" } | { type: "PLAYER_CHANGED" } | { type: "STATE_CHANGED"; domain: RuntimeDomain };

export class GameRuntime {
  private state = createInitialState();
  private readonly mapper = new SaveMapper();
  private paused = false;
  readonly events = new EventBus<RuntimeEvent>();
  readonly time = new TimeSystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly inventory = new InventorySystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly farming = new FarmingSystem(() => this.state, (domain) => this.domainChanged(domain), this.inventory);
  readonly gathering = new GatheringSystem(() => this.state, (domain) => this.domainChanged(domain), this.inventory);
  readonly cooking = new CookingSystem(() => this.state, (domain) => this.domainChanged(domain), this.inventory);
  readonly fishing = new FishingSystem(() => this.state, (domain) => this.domainChanged(domain), this.inventory);
  readonly alchemy = new AlchemySystem(() => this.state, (domain) => this.domainChanged(domain), this.inventory);
  readonly shop = new ShopSystem(() => this.state, (domain) => this.domainChanged(domain), this.inventory);
  readonly offering = new OfferingSystem(() => this.state, (domain) => this.domainChanged(domain), this.inventory);
  readonly combat = new CombatSystem((domain) => this.domainChanged(domain), this.inventory);
  readonly story = new StoryProgressionSystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly npcs = new NpcInteractionSystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly villagerRequests = new VillagerRequestSystem(() => this.state, (domain) => this.domainChanged(domain), this.inventory);
  readonly chapterOne = new ChapterOneProgressionSystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly bakegaeru = new BakegaeruBossSystem((domain) => this.domainChanged(domain), this.inventory);
  readonly chapterTwo = new ChapterTwoProgressionSystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly chapterThree = new ChapterThreeProgressionSystem(() => this.state, (domain) => this.domainChanged(domain));
  readonly yodomiTree = new YodomiTreeBossSystem((domain) => this.domainChanged(domain), this.inventory);
  private syncingStory = false;
  private loadingState = false;
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
    if (!this.paused && !this.saveManager.isSaving) {
      this.combat.update(deltaMs);
      const advancedDays = this.time.update(deltaMs);
      for (let day = 0; day < advancedDays; day += 1) { this.farming.advanceDay(); this.gathering.advanceDay(); }
    }
    this.saveManager.update(deltaMs);
  }
  get isPaused() { return this.paused; }
  setSaveSafe(safe: boolean) { this.saveManager.setSafeToSave(safe); }
  sleepUntilMorning() {
    this.time.sleepUntilMorning();
    this.farming.advanceDay();
    this.gathering.advanceDay();
    this.requestSave();
  }
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
    this.loadingState = true;
    this.state = this.mapper.fromSaveData(saveData);
    const defaultsAdded = this.applyContentDefaults();
    const storyAdded = this.story.sync();
    const requestsAdded = this.villagerRequests.ensureStarted();
    const chapterAdvanced = this.chapterOne.sync();
    const chapterTwoAdvanced = this.chapterTwo.sync();
    this.loadingState = false;
    this.saveManager.load(this.state.revision === 0 || defaultsAdded || storyAdded || requestsAdded || chapterAdvanced || chapterTwoAdvanced);
    this.events.emit({ type: "STATE_LOADED" });
  }
  private applyContentDefaults() {
    let changed = false;
    const farmingFlag = "content_phase3_farming";
    if (!this.state.events.flags.includes(farmingFlag)) {
      const seeds = this.state.inventory.items.find((item) => item.itemId === "seed_daikon");
      if (seeds) seeds.quantity += 6;
      else this.state.inventory.items.push({ itemId: "seed_daikon", quantity: 6 });
      if (!this.state.progression.unlockedSystems.includes("farming")) this.state.progression.unlockedSystems.push("farming");
      this.state.events.flags.push(farmingFlag);
      changed = true;
    }
    const gatheringFlag = "content_phase3_gathering";
    if (!this.state.events.flags.includes(gatheringFlag)) {
      if (!this.state.progression.unlockedSystems.includes("gathering")) this.state.progression.unlockedSystems.push("gathering");
      this.state.events.flags.push(gatheringFlag);
      changed = true;
    }
    const cookingFlag = "content_phase3_cooking";
    if (!this.state.events.flags.includes(cookingFlag)) {
      const daikon = this.state.inventory.items.find((item) => item.itemId === "item_daikon");
      if (daikon) daikon.quantity += 1;
      else this.state.inventory.items.push({ itemId: "item_daikon", quantity: 1 });
      if (!this.state.progression.unlockedSystems.includes("cooking")) this.state.progression.unlockedSystems.push("cooking");
      this.state.events.flags.push(cookingFlag);
      changed = true;
    }
    const fishingFlag = "content_phase3_fishing";
    if (!this.state.events.flags.includes(fishingFlag)) {
      if (!this.state.progression.unlockedSystems.includes("fishing")) this.state.progression.unlockedSystems.push("fishing");
      this.state.events.flags.push(fishingFlag);
      changed = true;
    }
    const lifeFlag = "content_phase3_life_economy";
    if (!this.state.events.flags.includes(lifeFlag)) {
      for (const system of ["alchemy", "shop", "offering"]) if (!this.state.progression.unlockedSystems.includes(system)) this.state.progression.unlockedSystems.push(system);
      this.state.events.flags.push(lifeFlag);
      changed = true;
    }
    return changed;
  }
  private markDirty() {
    this.saveManager.markDirty();
  }
  private domainChanged(domain: RuntimeDomain) {
    this.markDirty();
    this.events.emit({ type: "STATE_CHANGED", domain });
    if (domain !== "progression" && !this.syncingStory) {
      this.syncingStory = true;
      this.story.sync();
      this.chapterOne.sync();
      this.chapterTwo.sync();
      this.syncingStory = false;
    }
    if (domain === "combat") this.refreshCombatSaveSafety();
    if (domain === "progression" && !this.loadingState) this.requestSave();
  }
  private refreshCombatSaveSafety() {
    const unsafe = (status: string) => status === "battle" || status === "purifiable";
    this.saveManager.setSafeToSave(!unsafe(this.combat.state.status) && !unsafe(this.bakegaeru.status) && !unsafe(this.yodomiTree.status));
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
