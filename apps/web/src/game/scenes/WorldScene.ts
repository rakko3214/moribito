import Phaser from "phaser";
import type { GameBridge } from "../bridge/GameBridge.js";
import { FieldInput } from "../input/FieldInput.js";
import type { GameRuntime } from "../runtime/GameRuntime.js";
import type { NpcId } from "../runtime/systems/NpcInteractionSystem.js";
import { getScheduledNpcPlacements } from "../runtime/systems/NpcScheduleSystem.js";
import { loadTiledMap } from "../world/mapLoader.js";
import type { LoadedMap, MapId } from "../world/mapTypes.js";

const PLAYER_SPEED = 235;
const FARM_PLOTS = Array.from({ length: 9 }, (_, index) => ({ id: `farm_${index + 1}`, x: 420 + (index % 3) * 42, y: 700 + Math.floor(index / 3) * 42 }));
const FARM_ACTION_LABEL = { till: "耕す", plant: "種を植える", water: "水をやる", harvest: "収穫", none: "" } as const;
const GATHERING_NODES = [
  { id: "herb_1", x: 690, y: 650, itemId: "item_yomogi", quantity: 1, color: 0x79a95b },
  { id: "herb_2", x: 754, y: 688, itemId: "item_yomogi", quantity: 1, color: 0x79a95b },
  { id: "wood_1", x: 816, y: 642, itemId: "item_wood", quantity: 2, color: 0x8d6848 },
  { id: "stone_1", x: 356, y: 632, itemId: "item_stone", quantity: 2, color: 0x899392 },
] as const;
const FOREST_CLUES = [
  { id: "clue_1", x: 260, y: 600, itemId: "clue_yota_footprint", quantity: 1, color: 0xd2b071 },
  { id: "clue_2", x: 560, y: 540, itemId: "clue_broken_branch", quantity: 1, color: 0x9c7954 },
  { id: "clue_3", x: 820, y: 360, itemId: "clue_guiding_nut", quantity: 1, color: 0xc67e65 },
] as const;
const LIFE_STATIONS = [
  { id: "cooking", mapId: "map_village", x: 860, y: 690, label: "料理", marker: "鍋", color: 0xc98255 },
  { id: "fishing", mapId: "map_village", x: 640, y: 875, label: "釣り", marker: "魚", color: 0x5d91aa },
  { id: "alchemy", mapId: "map_village", x: 870, y: 790, label: "調合", marker: "薬", color: 0x7c8f62 },
  { id: "shop", mapId: "map_village", x: 420, y: 520, label: "種を買う 20文", marker: "店", color: 0xb68a51 },
  { id: "offering", mapId: "map_shrine", x: 384, y: 260, label: "奉納", marker: "祈", color: 0xa66b65 },
  { id: "combat", mapId: "map_shrine", x: 384, y: 410, label: "戦闘開始", marker: "穢", color: 0x704955 },
  { id: "boss", mapId: "map_shrine", x: 650, y: 440, label: "化け蛙戦", marker: "蛙", color: 0x456f62 },
  { id: "kodama", mapId: "map_forest", x: 790, y: 590, label: "木霊と陽太", marker: "木", color: 0x699064 },
  { id: "tree", mapId: "map_forest", x: 760, y: 280, label: "淀みの大樹", marker: "樹", color: 0x68435f },
  { id: "sleep", mapId: "map_home", x: 145, y: 195, label: "眠る", marker: "眠", color: 0x6e668c },
  { id: "storage", mapId: "map_home", x: 515, y: 195, label: "倉庫を使う", marker: "蔵", color: 0x8a704f },
] as const;
type LifeStationId = typeof LIFE_STATIONS[number]["id"];
const NPC_MARKERS: Record<NpcId, string> = { shiki: "志", kaede: "楓", genzo: "源", tessai: "鉄", yota: "陽", kannushi: "神" };
const ITEM_LABELS: Record<string, string> = { item_wood: "木材", item_stone: "石", item_yomogi: "よもぎ", item_daikon: "大根", fish_ayu: "鮎", fish_crucian_carp: "フナ" };

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private fieldInput!: FieldInput;
  private map?: LoadedMap;
  private worldObjects: Phaser.GameObjects.GameObject[] = [];
  private colliders: Phaser.Physics.Arcade.Collider[] = [];
  private transitionLocked = false;
  private locationLabel!: Phaser.GameObjects.Text;
  private timeLabel!: Phaser.GameObjects.Text;
  private farmingInfoLabel!: Phaser.GameObjects.Text;
  private questLabel!: Phaser.GameObjects.Text;
  private helpLabel!: Phaser.GameObjects.Text;
  private dialogueLabel!: Phaser.GameObjects.Text;
  private actionButton!: Phaser.GameObjects.Text;
  private foodButton!: Phaser.GameObjects.Text;
  private barrierButton!: Phaser.GameObjects.Text;
  private barrierVisual!: Phaser.GameObjects.Arc;
  private actionKey!: Phaser.Input.Keyboard.Key;
  private nearbyPlotId: string | undefined;
  private nearbyGatheringNodeId: string | undefined;
  private nearbyStationId: LifeStationId | undefined;
  private nearbyNpcId: NpcId | undefined;
  private readonly plotVisuals = new Map<string, { soil: Phaser.GameObjects.Rectangle; crop: Phaser.GameObjects.Arc }>();
  private readonly gatheringVisuals = new Map<string, Phaser.GameObjects.Arc>();
  private combatEnemyVisual: Phaser.GameObjects.Arc | undefined;
  private combatEnemyLabel: Phaser.GameObjects.Text | undefined;
  private contactCooldownMs = 0;
  private enemyAttackCooldownMs = 1600;
  private telegraphRemainingMs = -1;
  private telegraphVisual: Phaser.GameObjects.Arc | undefined;
  private bossBarrierActive = false;
  private treeSafeZoneVisual: Phaser.GameObjects.Arc | undefined;
  private npcObjects: Phaser.GameObjects.GameObject[] = [];
  private lastNpcScheduleHour = -1;

  constructor(private readonly bridge: GameBridge, private readonly runtime: GameRuntime) { super("WorldScene"); }
  preload() {
    this.load.tilemapTiledJSON("map-village", "/maps/village.json");
    this.load.tilemapTiledJSON("map-home", "/maps/home.json");
    this.load.tilemapTiledJSON("map-shrine", "/maps/shrine.json");
    this.load.tilemapTiledJSON("map-forest", "/maps/forest.json");
  }
  create() {
    this.createPlayerTexture();
    this.player = this.physics.add.sprite(0, 0, "player-placeholder").setDepth(20);
    this.player.setCircle(13, 5, 9).setCollideWorldBounds(true);
    this.fieldInput = new FieldInput(this);
    this.locationLabel = this.add.text(16, 14, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "16px", color: "#f5f0dc", backgroundColor: "#102019dd", padding: { x: 10, y: 7 } }).setScrollFactor(0).setDepth(100);
    this.timeLabel = this.add.text(this.scale.width - 16, 14, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#f5f0dc", backgroundColor: "#102019dd", padding: { x: 10, y: 7 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.farmingInfoLabel = this.add.text(this.scale.width - 16, 54, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#d5dfc7", backgroundColor: "#102019bb", padding: { x: 8, y: 5 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.questLabel = this.add.text(16, 86, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#fff2bc", backgroundColor: "#4e3f25dd", padding: { x: 9, y: 6 }, wordWrap: { width: 260 } }).setScrollFactor(0).setDepth(101);
    this.dialogueLabel = this.add.text(this.scale.width / 2, 132, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff9e8", backgroundColor: "#16251fee", padding: { x: 14, y: 10 }, align: "center", wordWrap: { width: 260 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(120).setVisible(false);
    this.actionButton = this.add.text(this.scale.width - 18, this.scale.height - 18, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "16px", color: "#fff7dd", backgroundColor: "#6e5635ee", padding: { x: 16, y: 12 } }).setOrigin(1, 1).setScrollFactor(0).setDepth(110).setVisible(false).setInteractive({ useHandCursor: true });
    this.actionButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.performAction(); });
    this.foodButton = this.add.text(18, this.scale.height - 18, "料理で回復", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff7dd", backgroundColor: "#49705dee", padding: { x: 14, y: 11 } }).setOrigin(0, 1).setScrollFactor(0).setDepth(110).setVisible(false).setInteractive({ useHandCursor: true });
    this.foodButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.runtime.combat.useFood(); this.refreshLifeDisplay(); });
    this.barrierButton = this.add.text(this.scale.width - 18, this.scale.height - 76, "結界", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "15px", color: "#eef8ff", backgroundColor: "#416b82ee", padding: { x: 18, y: 12 } }).setOrigin(1, 1).setScrollFactor(0).setDepth(111).setVisible(false).setInteractive({ useHandCursor: true });
    this.barrierButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (this.runtime.bakegaeru.status === "battle" || this.runtime.yodomiTree.status === "battle") this.bossBarrierActive = true;
      else this.runtime.combat.setBarrier(true);
    });
    const releaseBarrier = () => { this.runtime.combat.setBarrier(false); this.bossBarrierActive = false; };
    this.barrierButton.on("pointerup", releaseBarrier).on("pointerout", releaseBarrier);
    this.barrierVisual = this.add.circle(0, 0, 28, 0x7fd4ef, 0.18).setStrokeStyle(4, 0xaeeaff).setDepth(19).setVisible(false);
    if (!this.input.keyboard) throw new Error("Keyboard input is unavailable.");
    this.actionKey = this.input.keyboard.addKey("E");
    this.helpLabel = this.add.text(16, 54, "移動: WASD / 矢印キー / 画面ドラッグ  作業: E / 画面ボタン", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#d5dfc7", backgroundColor: "#102019bb", padding: { x: 8, y: 5 } }).setScrollFactor(0).setDepth(100);
    const state = this.runtime.getState();
    this.changeMap(state.player.mapId as MapId, undefined, { x: state.player.x, y: state.player.y });
    this.runtime.events.on((event) => {
      if (event.type === "STATE_LOADED") {
        const loaded = this.runtime.getState().player;
        this.changeMap(loaded.mapId as MapId, undefined, { x: loaded.x, y: loaded.y });
      }
      if (event.type === "STATE_LOADED" || (event.type === "STATE_CHANGED" && event.domain === "time")) this.refreshTimeLabel();
      if (event.type === "STATE_CHANGED" && event.domain === "gathering") this.refreshGatheringVisuals();
      if (event.type === "STATE_LOADED" || event.type === "STATE_CHANGED") this.refreshLifeDisplay();
    });
    this.scale.on("resize", (size: Phaser.Structs.Size) => { this.layoutHud(size); this.dialogueLabel.setX(size.width / 2); this.actionButton.setPosition(size.width - 18, size.height - 18); this.foodButton.setY(size.height - 18); this.barrierButton.setPosition(size.width - 18, size.height - 76); });
    this.layoutHud(this.scale);
    this.refreshTimeLabel();
    this.refreshLifeDisplay();
    this.bridge.toReact({ type: "GAME_READY" });
  }
  update(_time: number, delta: number) {
    this.runtime.update(delta);
    this.refreshNpcScheduleIfNeeded();
    if (this.runtime.isPaused) { this.player.setVelocity(0, 0); return; }
    const direction = this.fieldInput.getDirection();
    this.player.setVelocity(direction.x * PLAYER_SPEED, direction.y * PLAYER_SPEED);
    if (direction.x !== 0) this.player.setFlipX(direction.x < 0);
    const facing = Math.abs(direction.x) > Math.abs(direction.y) ? (direction.x < 0 ? "left" : "right") : direction.y < 0 ? "up" : "down";
    if (direction.lengthSq() > 0 && this.map) this.runtime.updatePlayer(this.map.id, this.player.x, this.player.y, facing);
    this.refreshCombatControls();
    this.updateCombatSimulation(delta);
    this.updateInteraction();
    if (!this.map || this.transitionLocked) return;
    const transition = this.map.transitions.find((area) => Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(area.x, area.y, area.width, area.height), this.player.x, this.player.y));
    if (transition) this.changeMap(transition.targetMap, transition.targetSpawn, undefined, true);
  }
  private refreshTimeLabel() {
    const time = this.runtime.getState().time;
    const season = ({ spring: "春", summer: "夏", autumn: "秋", winter: "冬" } as Record<string, string>)[time.season] ?? time.season;
    const displayMinutes = Math.floor(time.minutes / 5) * 5;
    const hours = Math.floor(displayMinutes / 60).toString().padStart(2, "0");
    const minutes = (displayMinutes % 60).toString().padStart(2, "0");
    this.timeLabel.setText(`${season} ${time.day}日  ${hours}:${minutes}`);
  }
  private updateInteraction() {
    const nearestNpc = getScheduledNpcPlacements(this.runtime.getState().time.minutes)
      .filter((npc) => npc.mapId === this.map?.id && this.runtime.combat.state.status !== "battle")
      .map((npc) => ({ ...npc, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.nearbyNpcId = nearestNpc && nearestNpc.distance <= 64 ? nearestNpc.id : undefined;
    if (this.nearbyNpcId) {
      this.nearbyPlotId = undefined; this.nearbyGatheringNodeId = undefined; this.nearbyStationId = undefined;
      this.actionButton.setText("話す").setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
      return;
    }
    const nearestStation = LIFE_STATIONS
      .filter((station) => station.mapId === this.map?.id)
      .map((station) => ({ ...station, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, station.x, station.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.nearbyStationId = nearestStation && nearestStation.distance <= 64 ? nearestStation.id : undefined;
    if (this.nearbyStationId && nearestStation) {
      this.nearbyPlotId = undefined;
      this.nearbyGatheringNodeId = undefined;
      this.actionButton.setText(this.getStationActionLabel(nearestStation.id)).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
      return;
    }
    if (this.map?.id !== "map_village" && this.map?.id !== "map_forest") {
      this.nearbyPlotId = undefined;
      this.nearbyGatheringNodeId = undefined;
      this.actionButton.setVisible(false);
      return;
    }
    const nearest = this.map.id === "map_village" ? FARM_PLOTS.map((plot) => ({ ...plot, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, plot.x, plot.y) })).sort((a, b) => a.distance - b.distance)[0] : undefined;
    this.nearbyPlotId = nearest && nearest.distance <= 58 ? nearest.id : undefined;
    const nodes = this.map.id === "map_forest" ? FOREST_CLUES : GATHERING_NODES;
    const nearestNode = nodes
      .filter((node) => !this.runtime.gathering.isCollected(this.map?.id ?? "map_village", node.id))
      .map((node) => ({ ...node, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, node.x, node.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.nearbyGatheringNodeId = nearestNode && nearestNode.distance <= 58 ? nearestNode.id : undefined;
    if (this.nearbyGatheringNodeId && nearestNode && (!nearest || nearestNode.distance < nearest.distance)) {
      this.nearbyPlotId = undefined;
      this.actionButton.setText("採取").setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
      return;
    }
    this.nearbyGatheringNodeId = undefined;
    const action = this.nearbyPlotId ? this.runtime.farming.getAction(this.nearbyPlotId) : "none";
    this.actionButton.setText(FARM_ACTION_LABEL[action]).setVisible(action !== "none");
    if (action !== "none" && Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
  }
  private performAction() {
    if (this.nearbyNpcId) {
      const result = this.runtime.npcs.talk(this.nearbyNpcId);
      const delivery = this.runtime.villagerRequests.deliverTo(this.nearbyNpcId);
      this.dialogueLabel
        .setText(delivery
          ? `${result.name}  友情 ${result.friendship}\n依頼達成「${delivery.title}」\n報酬 ${delivery.reward}文`
          : `${result.name}  友情 ${result.friendship}\n「${result.line}」`)
        .setVisible(true);
      this.time.delayedCall(3600, () => this.dialogueLabel.setVisible(false));
      this.refreshLifeDisplay();
      return;
    }
    if (this.nearbyStationId) {
      if (this.nearbyStationId === "cooking") {
        const recipe = this.runtime.cooking.canCook("simmered_daikon") ? "simmered_daikon" : "herb_rice";
        this.runtime.cooking.cook(recipe);
      }
      if (this.nearbyStationId === "fishing") this.runtime.fishing.cast();
      if (this.nearbyStationId === "alchemy") this.runtime.alchemy.craft();
      if (this.nearbyStationId === "shop") this.runtime.shop.buy("seed_daikon", 20);
      if (this.nearbyStationId === "offering") this.runtime.offering.offerNextAvailable();
      if (this.nearbyStationId === "combat") {
        const status = this.runtime.combat.state.status;
        if (status === "idle" || status === "cleansed" || status === "defeated") {
          const chapter = this.runtime.getState().progression.chapter;
          const enemyType = chapter >= 3 ? "charger" : chapter === 2 ? "ranged" : "melee";
          this.runtime.combat.start(enemyType);
          const station = LIFE_STATIONS.find((candidate) => candidate.id === "combat");
          if (station) {
            this.combatEnemyVisual?.setPosition(station.x, station.y).setVisible(true).setAlpha(1);
            this.combatEnemyLabel?.setText(({ melee: "近", ranged: "射", charger: "突" } as const)[enemyType]).setPosition(station.x, station.y).setVisible(true).setAlpha(1);
          }
        }
        else if (status === "battle") this.runtime.combat.attack();
        else if (status === "purifiable") this.runtime.combat.cleanse();
      }
      if (this.nearbyStationId === "boss") this.performBakegaeruAction();
      if (this.nearbyStationId === "kodama") this.performKodamaAction();
      if (this.nearbyStationId === "tree") this.performYodomiTreeAction();
      if (this.nearbyStationId === "sleep") this.performSleep();
      if (this.nearbyStationId === "storage") this.performStorage();
      this.refreshLifeDisplay();
      return;
    }
    if (this.nearbyGatheringNodeId) {
      const nodes = this.map?.id === "map_forest" ? FOREST_CLUES : GATHERING_NODES;
      const node = nodes.find((candidate) => candidate.id === this.nearbyGatheringNodeId);
      if (node && this.map && this.runtime.gathering.collect(this.map.id, node.id, node.itemId, node.quantity)) {
        this.gatheringVisuals.get(node.id)?.setVisible(false);
      }
      this.nearbyGatheringNodeId = undefined;
      this.refreshLifeDisplay();
      return;
    }
    if (this.nearbyPlotId) this.runtime.farming.act(this.nearbyPlotId);
    this.refreshLifeDisplay();
  }
  private createFarmingPlots() {
    this.plotVisuals.clear();
    for (const plot of FARM_PLOTS) {
      const soil = this.add.rectangle(plot.x, plot.y, 34, 34, 0x355c42, 0.72).setStrokeStyle(2, 0x75916c).setDepth(-2);
      const crop = this.add.circle(plot.x, plot.y, 8, 0x8fbd5f).setDepth(-1).setVisible(false);
      this.plotVisuals.set(plot.id, { soil, crop });
      this.worldObjects.push(soil, crop);
    }
  }
  private createGatheringNodes(mapId: "map_village" | "map_forest" = "map_village") {
    this.gatheringVisuals.clear();
    const nodes = mapId === "map_forest" ? FOREST_CLUES : GATHERING_NODES;
    for (const node of nodes) {
      const visual = this.add.circle(node.x, node.y, node.itemId === "item_stone" ? 12 : 10, node.color)
        .setStrokeStyle(2, 0xe4dbb5)
        .setDepth(-1)
        .setVisible(!this.runtime.gathering.isCollected(mapId, node.id));
      this.gatheringVisuals.set(node.id, visual);
      this.worldObjects.push(visual);
    }
  }
  private refreshGatheringVisuals() {
    if (this.map?.id !== "map_village" && this.map?.id !== "map_forest") return;
    for (const [nodeId, visual] of this.gatheringVisuals) visual.setVisible(!this.runtime.gathering.isCollected(this.map.id, nodeId));
  }
  private createLifeStations(mapId: MapId) {
    for (const station of LIFE_STATIONS.filter((candidate) => candidate.mapId === mapId)) {
      const marker = this.add.circle(station.x, station.y, 20, station.color, 0.95).setStrokeStyle(3, 0xf0e3bd).setDepth(2);
      const text = this.add.text(station.x, station.y, station.marker, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff7dd" }).setOrigin(0.5).setDepth(3);
      this.worldObjects.push(marker, text);
      if (station.id === "combat") { this.combatEnemyVisual = marker; this.combatEnemyLabel = text; }
    }
  }
  private performSleep() {
    if (this.transitionLocked) return;
    this.transitionLocked = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(260, 10, 16, 28);
    this.time.delayedCall(300, () => {
      this.runtime.sleepUntilMorning();
      this.refreshTimeLabel();
      this.refreshLifeDisplay();
      this.dialogueLabel.setText("翌朝6:00になりました。\n作物と村の日常が更新されました。").setVisible(true);
      this.cameras.main.fadeIn(320, 10, 16, 28);
      this.transitionLocked = false;
      this.time.delayedCall(3000, () => this.dialogueLabel.setVisible(false));
    });
  }
  private performStorage() {
    const inventory = this.runtime.getState().inventory;
    const depositTarget = ["item_wood", "item_stone", "item_yomogi", "item_daikon", "fish_ayu", "fish_crucian_carp"]
      .find((itemId) => this.runtime.inventory.quantity(itemId) > 0);
    if (depositTarget) {
      this.runtime.inventory.deposit(depositTarget, 1);
      this.dialogueLabel.setText(`倉庫へ ${ITEM_LABELS[depositTarget] ?? depositTarget} を1個預けました。`).setVisible(true);
    } else {
      const withdrawTarget = inventory.storage.find((item) => item.quantity > 0)?.itemId;
      if (withdrawTarget) {
        this.runtime.inventory.withdraw(withdrawTarget, 1);
        this.dialogueLabel.setText(`倉庫から ${ITEM_LABELS[withdrawTarget] ?? withdrawTarget} を1個取り出しました。`).setVisible(true);
      } else this.dialogueLabel.setText("倉庫は空です。").setVisible(true);
    }
    this.time.delayedCall(2400, () => this.dialogueLabel.setVisible(false));
    this.refreshLifeDisplay();
  }
  private createNpcs(mapId: MapId) {
    for (const npc of getScheduledNpcPlacements(this.runtime.getState().time.minutes).filter((candidate) => candidate.mapId === mapId)) {
      const body = this.add.circle(npc.x, npc.y, 15, 0xd4b083, 0.98).setStrokeStyle(3, 0xeee0bd).setDepth(4);
      const marker = this.add.text(npc.x, npc.y, NPC_MARKERS[npc.id], { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#26382e" }).setOrigin(0.5).setDepth(5);
      this.npcObjects.push(body, marker);
      this.worldObjects.push(body, marker);
    }
  }
  private refreshNpcScheduleIfNeeded() {
    const scheduleHour = Math.floor(this.runtime.getState().time.minutes / 60);
    if (!this.map || scheduleHour === this.lastNpcScheduleHour) return;
    this.lastNpcScheduleHour = scheduleHour;
    for (const object of this.npcObjects) object.destroy();
    this.worldObjects = this.worldObjects.filter((object) => !this.npcObjects.includes(object));
    this.npcObjects = [];
    this.createNpcs(this.map.id);
  }
  private getStationActionLabel(stationId: LifeStationId) {
    if (stationId === "kodama") return this.runtime.chapterThree.step === "kodama_departure" ? "木霊を見送る" : "様子を見る";
    if (stationId === "tree") {
      if (this.runtime.yodomiTree.currentAttack?.kind === "enclosure") return "包囲する根を壊す";
      return ({ idle: "大樹戦開始", battle: "穢れを削る", purifiable: "大樹を浄化", cleansed: "浄化済み", defeated: "再挑戦" } as const)[this.runtime.yodomiTree.status];
    }
    if (stationId === "boss") return ({ idle: "化け蛙戦", battle: "穢れを削る", purifiable: "化け蛙を浄化", cleansed: "再戦", defeated: "再挑戦" } as const)[this.runtime.bakegaeru.status];
    if (stationId !== "combat") return LIFE_STATIONS.find((station) => station.id === stationId)?.label ?? "調べる";
    return ({ idle: "戦闘開始", battle: "攻撃", purifiable: "浄化", cleansed: "再戦", defeated: "再挑戦" } as const)[this.runtime.combat.state.status];
  }
  private refreshCombatControls() {
    const combat = this.runtime.combat.state;
    const bossBattle = this.runtime.bakegaeru.status === "battle" || this.runtime.yodomiTree.status === "battle";
    const hasFood = this.runtime.inventory.quantity("food_simmered_daikon") + this.runtime.inventory.quantity("food_herb_rice") > 0;
    this.foodButton.setVisible(combat.status === "battle" && combat.wards < combat.maxWards && hasFood);
    this.barrierButton.setVisible(combat.status === "battle" || bossBattle);
    this.barrierVisual.setPosition(this.player.x, this.player.y).setVisible(combat.barrierActive || this.bossBarrierActive);
  }
  private performBakegaeruAction() {
    const boss = this.runtime.bakegaeru;
    if (boss.status === "idle" || boss.status === "cleansed" || boss.status === "defeated") {
      boss.start();
      this.dialogueLabel.setText("第2章ボス 化け蛙\n白・青は回避か結界、黒・紫は移動回避、大波は結界必須").setVisible(true);
      this.time.delayedCall(3200, () => this.dialogueLabel.setVisible(false));
      return;
    }
    if (boss.status === "purifiable") {
      boss.cleanse();
      this.runtime.chapterTwo.recordBossCleansed();
      this.dialogueLabel.setText("浄化完了\n穢れの外殻が剥がれ、化け蛙は怯えながら古池へ逃げていった。").setVisible(true);
      this.time.delayedCall(3600, () => this.dialogueLabel.setVisible(false));
      return;
    }
    if (boss.currentAttack || !boss.attack() || boss.status !== "battle") return;
    const attack = boss.prepareNextAttack();
    if (!attack) return;
    const instruction = attack.kind === "ultimate" ? "結界を長押し！" : attack.kind === "piercing" ? "黒紫の予告から離れる！" : "予告から離れるか結界！";
    this.dialogueLabel.setText(`化け蛙 Phase ${boss.phase}\n${attack.name}\n${instruction}`).setVisible(true);
    this.time.delayedCall(1400, () => {
      const station = LIFE_STATIONS.find((candidate) => candidate.id === "boss");
      const avoided = Boolean(station && Phaser.Math.Distance.Between(this.player.x, this.player.y, station.x, station.y) > 115);
      const barrier = this.bossBarrierActive;
      boss.resolvePreparedAttack(avoided, barrier);
      const result = boss.status === "defeated" ? "護身札が尽きた。再挑戦しよう。" : barrier ? "結界で防いだ！" : avoided && attack.kind !== "ultimate" ? "回避成功！" : "攻撃を受けた！";
      this.dialogueLabel.setText(`${attack.name}\n${result}${boss.fatigued ? "\n化け蛙が疲労している。攻撃の好機！" : ""}`).setVisible(true);
      this.time.delayedCall(1700, () => this.dialogueLabel.setVisible(false));
      this.refreshLifeDisplay();
    });
  }
  private performKodamaAction() {
    if (this.runtime.chapterThree.step === "kodama_departure") {
      this.runtime.chapterThree.completeDeparture();
      this.dialogueLabel.setText("First Playable 完了\n木霊は陽太の無事を確かめ、一度だけ主人公を振り返って森へ去った。").setVisible(true);
    } else {
      this.runtime.chapterThree.recordKodamaEncounter();
      this.dialogueLabel.setText("木霊との初遭遇\n木霊は逃げず、自分の身体で陽太を穢れから守っている。\n攻撃すべき相手は木霊ではない。").setVisible(true);
    }
    this.time.delayedCall(4200, () => this.dialogueLabel.setVisible(false));
    this.refreshLifeDisplay();
  }
  private performYodomiTreeAction() {
    const tree = this.runtime.yodomiTree;
    if (tree.status === "idle" || tree.status === "defeated") {
      tree.start();
      this.dialogueLabel.setText("第3章ボス 淀みの大樹\n妖怪ではなく、森に蓄積した穢れの集合体だ。").setVisible(true);
      this.time.delayedCall(3000, () => this.dialogueLabel.setVisible(false));
      return;
    }
    if (tree.status === "purifiable") {
      tree.cleanse();
      this.runtime.chapterThree.recordTreeCleansed();
      this.dialogueLabel.setText("淀みの大樹を浄化した。\n黒い靄が消え、森へ光と自然の音が戻っていく。").setVisible(true);
      this.time.delayedCall(3600, () => this.dialogueLabel.setVisible(false));
      this.refreshLifeDisplay();
      return;
    }
    if (tree.status !== "battle") return;
    if (tree.currentAttack?.kind === "enclosure") {
      tree.attack("root");
      this.dialogueLabel.setText("包囲する根を破壊した！\n攻撃対象を大樹へ戻す。").setVisible(true);
      this.time.delayedCall(1700, () => this.dialogueLabel.setVisible(false));
      return;
    }
    if (tree.currentAttack || !tree.attack("tree") || tree.status !== "battle") { this.refreshLifeDisplay(); return; }
    const attack = tree.prepareNextAttack();
    if (!attack) return;
    if (attack.kind === "enclosure") {
      this.dialogueLabel.setText(`淀みの大樹 Phase ${tree.phase}\n根の包囲\n大樹ではなく、包囲する根を攻撃！`).setVisible(true);
      return;
    }
    const safeZones = [{ x: 480, y: 500 }, { x: 650, y: 590 }, { x: 830, y: 500 }];
    const safeZone = safeZones[tree.safeZoneIndex] ?? safeZones[0];
    if (attack.kind === "safe_zone" && safeZone) {
      if (!this.treeSafeZoneVisual) { this.treeSafeZoneVisual = this.add.circle(safeZone.x, safeZone.y, 64, 0xd7e99b, 0.3).setStrokeStyle(4, 0xe6f5b5).setDepth(1); this.worldObjects.push(this.treeSafeZoneVisual); }
      else this.treeSafeZoneVisual.setPosition(safeZone.x, safeZone.y).setVisible(true);
    }
    const instruction = attack.kind === "safe_zone" ? "光る安全地帯へ移動！ 結界は無効" : attack.kind === "piercing" ? "黒紫の蔦から移動回避！ 結界は貫通" : "予告から離れるか結界！";
    this.dialogueLabel.setText(`淀みの大樹 Phase ${tree.phase}\n${attack.name}\n${instruction}`).setVisible(true);
    this.time.delayedCall(1600, () => {
      const station = LIFE_STATIONS.find((candidate) => candidate.id === "tree");
      const avoided = Boolean(station && Phaser.Math.Distance.Between(this.player.x, this.player.y, station.x, station.y) > 115);
      const inSafeZone = Boolean(safeZone && Phaser.Math.Distance.Between(this.player.x, this.player.y, safeZone.x, safeZone.y) <= 72);
      tree.resolvePreparedAttack(avoided, this.bossBarrierActive, inSafeZone);
      this.treeSafeZoneVisual?.setVisible(false);
      const defended = attack.kind === "safe_zone" ? inSafeZone : attack.kind === "piercing" ? avoided : avoided || this.bossBarrierActive;
      this.dialogueLabel.setText(`${attack.name}\n${defended ? "対処成功！" : "攻撃を受けた！"}`).setVisible(true);
      this.time.delayedCall(1500, () => this.dialogueLabel.setVisible(false));
      this.refreshLifeDisplay();
    });
    this.refreshLifeDisplay();
  }
  private updateCombatSimulation(delta: number) {
    const enemy = this.combatEnemyVisual;
    const combat = this.runtime.combat.state;
    if (this.map?.id !== "map_shrine" || !enemy) return;
    const active = combat.status === "battle" || combat.status === "purifiable";
    enemy.setVisible(active || combat.status === "idle" || combat.status === "defeated" || combat.status === "cleansed");
    this.combatEnemyLabel?.setVisible(enemy.visible);
    if (!active) return;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    if (combat.status === "battle" && combat.enemyType !== "ranged" && distance > 38) {
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const speed = combat.enemyType === "charger" ? 96 : 58;
      const step = Math.min(distance - 38, speed * delta / 1000);
      enemy.x += Math.cos(angle) * step;
      enemy.y += Math.sin(angle) * step;
      this.combatEnemyLabel?.setPosition(enemy.x, enemy.y);
    }
    if (combat.status === "battle" && combat.enemyType === "ranged" && (distance < 150 || distance > 240)) {
      const towardPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const direction = distance < 150 ? -1 : 1;
      const step = Math.min(Math.abs(distance - (distance < 150 ? 150 : 240)), 48 * delta / 1000);
      enemy.x += Math.cos(towardPlayer) * step * direction;
      enemy.y += Math.sin(towardPlayer) * step * direction;
      this.combatEnemyLabel?.setPosition(enemy.x, enemy.y);
    }
    this.contactCooldownMs = Math.max(0, this.contactCooldownMs - delta);
    if (combat.status === "battle" && combat.enemyType !== "ranged" && distance <= 42 && this.contactCooldownMs === 0) {
      this.runtime.combat.takeHit();
      this.contactCooldownMs = 1200;
      this.player.setTint(0xe58a8a);
      this.time.delayedCall(150, () => this.player.clearTint());
    }
    this.updateEnemyTelegraph(delta);
    if (!this.fieldInput.consumeTap()) return;
    if (combat.status === "battle" && distance <= 230) {
      this.runtime.combat.attack();
      this.tweens.add({ targets: enemy, scaleX: 1.22, scaleY: 1.22, yoyo: true, duration: 90 });
    } else if (combat.status === "purifiable" && distance <= 70 && this.runtime.combat.cleanse()) {
      enemy.setAlpha(0.25);
      this.combatEnemyLabel?.setAlpha(0.25);
    }
  }
  private updateEnemyTelegraph(delta: number) {
    if (this.runtime.combat.state.status !== "battle") {
      this.telegraphVisual?.setVisible(false);
      this.telegraphRemainingMs = -1;
      return;
    }
    if (this.telegraphRemainingMs >= 0) {
      this.telegraphRemainingMs -= delta;
      if (this.telegraphRemainingMs <= 0 && this.telegraphVisual) {
        const radius = this.runtime.combat.state.enemyType === "charger" ? 72 : this.runtime.combat.state.enemyType === "ranged" ? 46 : 58;
        const hit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.telegraphVisual.x, this.telegraphVisual.y) <= radius;
        if (hit) this.runtime.combat.takeHit();
        this.telegraphVisual.setVisible(false);
        this.telegraphRemainingMs = -1;
        this.enemyAttackCooldownMs = this.runtime.combat.state.enemyType === "ranged" ? 1300 : this.runtime.combat.state.enemyType === "charger" ? 2200 : 1800;
      }
      return;
    }
    this.enemyAttackCooldownMs -= delta;
    if (this.enemyAttackCooldownMs > 0) return;
    const radius = this.runtime.combat.state.enemyType === "charger" ? 72 : this.runtime.combat.state.enemyType === "ranged" ? 46 : 58;
    if (!this.telegraphVisual) {
      this.telegraphVisual = this.add.circle(this.player.x, this.player.y, radius, 0x7d375f, 0.28).setStrokeStyle(4, 0xc66a98).setDepth(1);
      this.worldObjects.push(this.telegraphVisual);
    } else this.telegraphVisual.setRadius(radius).setPosition(this.player.x, this.player.y).setVisible(true).setAlpha(1);
    this.telegraphRemainingMs = 750;
  }
  private refreshLifeDisplay() {
    const objective = !this.runtime.chapterOne.isComplete
      ? this.runtime.chapterOne.objective
      : !this.runtime.chapterTwo.isComplete
        ? this.runtime.chapterTwo.objective
        : this.runtime.chapterThree.objective;
    const storyBeat = !this.runtime.chapterOne.isComplete
      ? this.runtime.chapterOne.storyBeat
      : !this.runtime.chapterTwo.isComplete
        ? this.runtime.chapterTwo.storyBeat
        : this.runtime.chapterThree.storyBeat;
    const compact = this.scale.width < 600;
    this.questLabel.setText(compact
      ? `第${this.runtime.getState().progression.chapter}章  ${objective}\n依頼: ${this.runtime.villagerRequests.summary}`
      : `第${this.runtime.getState().progression.chapter}章  目的: ${objective}\n物語: ${storyBeat}\n村人依頼: ${this.runtime.villagerRequests.summary}`);
    const storageCount = this.runtime.getState().inventory.storage.reduce((total, item) => total + item.quantity, 0);
    const inventorySummary =
      `大根の種 ${this.runtime.inventory.quantity("seed_daikon")}  大根 ${this.runtime.inventory.quantity("item_daikon")}  ` +
      `よもぎ ${this.runtime.inventory.quantity("item_yomogi")}  木 ${this.runtime.inventory.quantity("item_wood")}  石 ${this.runtime.inventory.quantity("item_stone")}  ${this.runtime.getState().player.money}文\n` +
      `料理 ${this.runtime.inventory.quantity("food_simmered_daikon") + this.runtime.inventory.quantity("food_herb_rice")}  魚 ${this.runtime.inventory.quantity("fish_ayu") + this.runtime.inventory.quantity("fish_crucian_carp")}  薬 ${this.runtime.inventory.quantity("medicine_healing")}  倉庫 ${storageCount}  奉納 ${this.runtime.offering.completedCount}/3\n` +
      `護身札 ${this.runtime.combat.state.wards}/${this.runtime.combat.state.maxWards}  穢れ ${this.runtime.combat.state.corruption}/${this.runtime.combat.state.maxCorruption}  霊力 ${Math.floor(this.runtime.combat.state.spirit)}/${this.runtime.combat.state.maxSpirit}  結界 ${this.runtime.combat.state.barrierDurability}/3  通常敵 ${({ melee: "近接", ranged: "遠距離", charger: "突進" } as const)[this.runtime.combat.state.enemyType]}  浄化素材 ${this.runtime.inventory.quantity("material_purified_fragment")}`;
    this.farmingInfoLabel.setText(inventorySummary);
    if (this.runtime.bakegaeru.status !== "idle") {
      this.farmingInfoLabel.setText(`${this.farmingInfoLabel.text}\n化け蛙 Phase ${this.runtime.bakegaeru.phase}  穢れ ${this.runtime.bakegaeru.corruption}/${this.runtime.bakegaeru.maxCorruption}  護身札 ${this.runtime.bakegaeru.wards}/4`);
    }
    if (this.runtime.yodomiTree.status !== "idle") {
      this.farmingInfoLabel.setText(`${this.farmingInfoLabel.text}\n淀みの大樹 Phase ${this.runtime.yodomiTree.phase}  穢れ ${this.runtime.yodomiTree.corruption}/${this.runtime.yodomiTree.maxCorruption}  護身札 ${this.runtime.yodomiTree.wards}/4`);
    }
    this.layoutHud(this.scale);
    for (const plot of FARM_PLOTS) {
      const visual = this.plotVisuals.get(plot.id);
      if (!visual) continue;
      const state = this.runtime.farming.getPlot(plot.id);
      visual.soil.setFillStyle(state ? 0x73583b : 0x355c42, state ? 0.95 : 0.72).setStrokeStyle(2, state?.wateredToday ? 0x6ea9c7 : 0x75916c);
      visual.crop.setVisible(Boolean(state?.cropId)).setScale(state?.cropId ? 0.45 + state.growthStage * 0.2 : 1).setFillStyle((state?.growthStage ?? 0) >= 4 ? 0xe8d36b : 0x8fbd5f);
    }
  }
  private layoutHud(size: Pick<Phaser.Structs.Size, "width" | "height">) {
    const compact = size.width < 600;
    this.timeLabel.setX(size.width - 16);
    if (compact) {
      const contentWidth = Math.max(220, size.width - 32);
      this.helpLabel.setText("移動: 画面ドラッグ  作業: 画面ボタン");
      this.helpLabel.setPosition(16, 54).setWordWrapWidth(contentWidth, true);
      this.questLabel.setPosition(16, 82).setWordWrapWidth(contentWidth, true);
      this.farmingInfoLabel.setOrigin(0, 0).setPosition(16, this.questLabel.y + this.questLabel.height + 6).setWordWrapWidth(contentWidth, true);
    } else {
      this.helpLabel.setText("移動: WASD / 矢印キー / 画面ドラッグ  作業: E / 画面ボタン");
      this.helpLabel.setPosition(16, 54).setWordWrapWidth(0);
      this.questLabel.setPosition(16, 86).setWordWrapWidth(260);
      this.farmingInfoLabel.setOrigin(1, 0).setPosition(size.width - 16, 54).setWordWrapWidth(0);
    }
  }
  private changeMap(id: MapId, spawnName?: string, exactSpawn?: { x: number; y: number }, saveAfterTransition = false) {
    if (saveAfterTransition) this.runtime.setSaveSafe(false);
    this.transitionLocked = true;
    this.player.setVelocity(0, 0);
    for (const collider of this.colliders) collider.destroy();
    for (const object of this.worldObjects) object.destroy();
    this.colliders = [];
    this.worldObjects = [];
    this.npcObjects = [];
    this.lastNpcScheduleHour = Math.floor(this.runtime.getState().time.minutes / 60);
    this.combatEnemyVisual = undefined;
    this.combatEnemyLabel = undefined;
    this.telegraphVisual = undefined;
    this.treeSafeZoneVisual = undefined;
    this.telegraphRemainingMs = -1;
    this.enemyAttackCooldownMs = 1600;
    const map = loadTiledMap(this, id);
    this.map = map;
    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.cameras.main
      .setBounds(0, 0, map.width, map.height)
      .setRoundPixels(true)
      .startFollow(this.player, true, 1, 1);
    this.drawMap(map);
    this.createLifeStations(map.id);
    this.createNpcs(map.id);
    if (map.id === "map_village") {
      this.createFarmingPlots();
      this.createGatheringNodes("map_village");
      this.refreshLifeDisplay();
    }
    if (map.id === "map_forest") this.createGatheringNodes("map_forest");
    const walls = this.physics.add.staticGroup();
    for (const area of map.collisions) {
      const wall = this.add.rectangle(area.x + area.width / 2, area.y + area.height / 2, area.width, area.height, map.accent, 0.34);
      this.physics.add.existing(wall, true);
      walls.add(wall);
      this.worldObjects.push(wall);
    }
    this.colliders.push(this.physics.add.collider(this.player, walls));
    const spawn = exactSpawn ?? (spawnName ? map.spawns[spawnName] : undefined) ?? map.spawns.start ?? { x: map.width / 2, y: map.height / 2 };
    this.player.setPosition(spawn.x, spawn.y);
    this.cameras.main.centerOn(spawn.x, spawn.y);
    this.locationLabel.setText(map.displayName);
    this.runtime.updatePlayer(id, spawn.x, spawn.y);
    this.runtime.chapterOne.recordVisit(id);
    this.runtime.chapterThree.recordVisit(id);
    this.cameras.main.fadeIn(180, 12, 21, 17);
    this.time.delayedCall(350, () => {
      this.transitionLocked = false;
      if (saveAfterTransition) {
        this.runtime.setSaveSafe(true);
        this.runtime.requestSave();
      }
    });
  }
  private drawMap(map: LoadedMap) {
    const background = this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, map.background).setDepth(-20);
    const grid = this.add.grid(map.width / 2, map.height / 2, map.width, map.height, 32, 32, map.background, 0, map.accent, 0.09).setDepth(-19);
    this.worldObjects.push(background, grid);
    for (const transition of map.transitions) this.worldObjects.push(this.add.rectangle(transition.x + transition.width / 2, transition.y + transition.height / 2, transition.width, transition.height, 0xf4d58d, 0.48).setDepth(-1));
  }
  private createPlayerTexture() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xf3ead1).fillCircle(18, 14, 9);
    graphics.fillStyle(0x315244).fillRoundedRect(8, 22, 20, 24, 5);
    graphics.fillStyle(0xc75d4d).fillTriangle(10, 22, 26, 22, 18, 31);
    graphics.generateTexture("player-placeholder", 36, 50).destroy();
  }
}
