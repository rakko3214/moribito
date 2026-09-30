import Phaser from "phaser";
import { openTextEntryDialog } from "../world/textEntryDialog.js";
import type { GameBridge } from "../bridge/GameBridge.js";
import { FieldInput } from "../input/FieldInput.js";
import type { GameRuntime } from "../runtime/GameRuntime.js";
import type { NpcId } from "../runtime/systems/NpcInteractionSystem.js";
import { createFishingMiniGame, updateFishingMiniGame, type FishingMiniGameState } from "../runtime/systems/FishingMiniGame.js";
import { advanceAlchemyMiniGame, applyAlchemyRotation, createAlchemyMiniGame, releaseAlchemyRotation, type AlchemyMiniGameState } from "../runtime/systems/AlchemyMiniGame.js";
import { ALCHEMY_RECIPES, type AlchemyRecipeId } from "../runtime/systems/AlchemySystem.js";
import { advanceCookingMiniGame, cookingAdvice, createCookingMiniGame, setCookingHeat, type CookingMiniGameState } from "../runtime/systems/CookingMiniGame.js";
import { COOKING_RECIPES, cookedRecipeFlag, type CookingRecipeId } from "../runtime/systems/CookingSystem.js";
import { applyCookingCut, createCookingPrep, prepQuality, type CookingPrepState } from "../runtime/systems/CookingPrepMiniGame.js";
import { applyRiceMix, createRiceCooking, placeRicePortion, riceCookingQuality, type RiceCookingState } from "../runtime/systems/RiceCookingMiniGame.js";
import { STAFF_STONES, type StaffStoneId } from "../runtime/systems/StaffStoneSystem.js";
import { advanceForgeMiniGame, createForgeMiniGame, strikeForge, type ForgeMiniGameState } from "../runtime/systems/ForgeMiniGame.js";
import { advanceFishingApproach, castTowardFish, createFishingApproach, hookFishingApproach, type FishingApproachState } from "../runtime/systems/FishingApproachMiniGame.js";
import { decideMiniGameExit } from "../runtime/systems/MiniGameUiSystem.js";
import { WORKBENCH_RECIPES, WORKBENCH_RECIPE_SHOP, type PurchasableWorkbenchRecipeId, type WorkbenchCategory, type WorkbenchRecipeId } from "../runtime/systems/WorkbenchSystem.js";
import { PLACEABLE_DEFINITIONS, placeableDefinition, type BlockedArea, type PlacementRotation } from "../runtime/systems/PlacementSystem.js";
import { CONSTRUCTION_PROJECTS, type ConstructionId } from "../runtime/systems/ConstructionSystem.js";
import { homeUpgradeProfile } from "../runtime/systems/HomeUpgrade.js";
import { CROP_DEFINITIONS, cropDefinition, type SeedId } from "../runtime/systems/FarmingSystem.js";
import { FISH_DEFINITIONS } from "../runtime/systems/FishingSystem.js";
import { GATHERING_MATERIALS } from "../runtime/systems/GatheringSystem.js";
import { ENEMY_ARCHETYPES } from "../runtime/systems/CombatSystem.js";
import { getScheduledNpcPlacements } from "../runtime/systems/NpcScheduleSystem.js";
import { loadTiledMap } from "../world/mapLoader.js";
import { getMapDecorations } from "../world/mapPresentation.js";
import { exitLabel, findRoute, MAP_DISPLAY_NAMES, nextRouteMap, objectiveDestination } from "../world/navigationGuide.js";
import { mapAccess } from "../world/progressionGate.js";
import { environmentPresentation } from "../world/environmentPresentation.js";
import { farmPlotsFromEventZone } from "../world/mapGameplayConfig.js";
import { isLifeStationId, LIFE_STATION_DEFINITIONS, type LifeStationId } from "../world/mapStationCatalog.js";
import { gatheringSprite, mapTerrainTexture, mapWorldSprites, terrainTextures, worldSpriteTextures } from "../world/mapTerrainPresentation.js";
import { interiorRoomPresentation } from "../world/interiorRoomPresentation.js";
import { PointerOwner } from "../world/PointerOwner.js";
import { alchemyLayout } from "../world/alchemyLayout.js";
import { clearAttackPath, combatWaypoint, moveCombatActor } from "../world/combatGeometry.js";
import { BOSS_ATTACK_RADIUS, TREE_SAFE_RADIUS, TREE_SAFE_ZONES, frogDefense, insideBossCircle } from "../world/bossTelegraph.js";
import { bossHudText } from "../world/bossHud.js";
import { cropSpritePresentation, FARM_EXPANDED_SPRITE_SHEET, FARM_SPRITE_SHEET } from "../world/cropPresentation.js";
import { gatheringNodeFrame, GATHERING_SPRITE_SHEET } from "../world/gatheringPresentation.js";
import { CRAFTABLE_SPRITE_SHEET, FARM_BUILDING_SPRITE_SHEET, HOME_ESSENTIAL_SPRITE_SHEET, placedObjectBlocksMovement, placedObjectDisplaySize, placedObjectSprite } from "../world/placedObjectPresentation.js";
import { livestockBuildingId, livestockSpriteFrame, LIVESTOCK_SPRITE_SHEET } from "../world/livestockPresentation.js";
import { HOME_INTERIOR_SPRITE_SHEET, homeInteriorFrame } from "../world/homeInteriorPresentation.js";
import { combatHudText, farmingActionMessage, fieldToolFrame, FIELD_TOOL_SPRITE_SHEET } from "../world/fieldActionPresentation.js";
import { hudLayout } from "../world/hudLayout.js";
import { chapterThreeOfferingMenu, inventoryCategoryLines, journalText, lifeActionText, LIFE_ITEM_LABELS, npcDialogueText, offeringMenu, shopMenu, stationDescription, type InventoryCategory, type LifeMenuOption } from "../world/lifeUiPresentation.js";
import { lifePanelLayout, pageItems } from "../world/lifePanelLayout.js";
import { cookingGameLayout } from "../world/cookingGameLayout.js";
import { centeredCameraBounds, mapCameraZoom, mapFloorExtent } from "../world/mapCameraPresentation.js";
import { isCookingWorkPosition } from "../world/stationInteractionZones.js";
import { actionGuidance, completionSummary } from "../world/playGuidance.js";
import { npcFieldDisplaySize, npcPortrait, npcPortraitTextures, npcSprite, npcSpriteTextures } from "../world/npcPresentation.js";
import { BAKEGAERU_CORRUPTED_SPRITE, enemySpriteTextures, KEGARE_REMNANT_SPRITE, YODOMI_TREE_SPRITE } from "../world/enemyPresentation.js";
import { PLAYER_FIELD_SPRITE, playerFieldSprite, playerFieldTextures, playerWalkSprite, type PlayerFacing } from "../world/playerPresentation.js";
import { YOKAI_CARDS, type YokaiCardId } from "../runtime/systems/YokaiCardSystem.js";
import type { LoadedMap, MapId } from "../world/mapTypes.js";
import { assetFailureMessage, classifyAssetFailure, normalizeLoadProgress } from "../../services/AssetLoadPolicy.js";
import { STORY_DIALOGUES, type StoryDialogueLine } from "../runtime/StoryDialogue.js";
import { dangerEntryConfirmation } from "../world/dangerEntryConfirmation.js";
import { gatheringCollisionFootprint, npcCollisionFootprint } from "../world/worldCollision.js";
import { ITEM_ICON_ATLAS, itemIconFrame } from "../world/itemIconPresentation.js";
import { routeEdgeKeys, WORLD_MAP_EDGES, WORLD_MAP_NODES, worldMapEdgeKey } from "../world/worldMapPresentation.js";
import { npcFacilityAction, npcFacilityOption } from "../world/npcFacilityPresentation.js";

const PLAYER_SPEED = 235;
const DEFAULT_FARM_PLOTS = Array.from({ length: 48 }, (_, index) => ({ id: `farm_${index + 1}`, x: 120 + (index % 8) * 42, y: 350 + Math.floor(index / 8) * 42 }));
const FARM_ACTION_LABEL = { till: "耕す", plant: "種を植える", water: "水をやる", harvest: "収穫", none: "" } as const;
const TOOL_LABELS = { tool_hoe: "鍬", tool_axe: "斧", tool_pickaxe: "ピッケル", tool_watering_can: "じょうろ", tool_hand: "手" } as const;
type ToolId = keyof typeof TOOL_LABELS;
type FieldGatheringNode = { id: string; x: number; y: number; itemId: string; quantity: number; color: number; requiredTool?: ToolId };
const NPC_MARKERS: Record<NpcId, string> = { shiki: "志", kaede: "楓", genzo: "源", tessai: "鉄", sogen: "薬", soichiro: "長", yota: "陽", kannushi: "神" };
const ITEM_LABELS: Record<string, string> = { item_daikon: "大根", ...Object.fromEntries(Object.entries(GATHERING_MATERIALS).map(([id, material]) => [id, material.name])), ...Object.fromEntries(Object.entries(FISH_DEFINITIONS).map(([id, fish]) => [id, fish.name])) };

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private fieldInput!: FieldInput;
  private map?: LoadedMap;
  private worldObjects: Phaser.GameObjects.GameObject[] = [];
  private presentationObjects: Phaser.GameObjects.GameObject[] = [];
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
  private yokaiCardButton!: Phaser.GameObjects.Text;
  private combatHudLabel!: Phaser.GameObjects.Text;
  private mapButton!: Phaser.GameObjects.Text;
  private mapPanel!: Phaser.GameObjects.Rectangle;
  private mapPanelText!: Phaser.GameObjects.Text;
  private mapUiObjects: Phaser.GameObjects.GameObject[] = [];
  private mapOpen = false;
  private lifePanelOpen = false;
  private inventoryButton!: Phaser.GameObjects.Text;
  private journalButton!: Phaser.GameObjects.Text;
  private toolButton!: Phaser.GameObjects.Text;
  private placementButton!: Phaser.GameObjects.Text;
  private lifePanel!: Phaser.GameObjects.Rectangle;
  private lifePanelTitle!: Phaser.GameObjects.Text;
  private lifePanelBody!: Phaser.GameObjects.Text;
  private lifePanelButtons: Phaser.GameObjects.Text[] = [];
  private npcDialoguePortrait: Phaser.GameObjects.Image | undefined;
  private storyDialogueOpen = false;
  private lifePanelOptions: LifeMenuOption[] = [];
  private lifePanelOnSelect: ((id: string) => void) | undefined;
  private lifePanelOnClose: (() => void) | undefined;
  private lifePanelPage = 0;
  private inventoryCategory: InventoryCategory = "all";
  private inventoryPage = 0;
  private inventoryPanelActive = false;
  private inventoryUiObjects: Phaser.GameObjects.GameObject[] = [];
  private lifeActionTimer: Phaser.Time.TimerEvent | undefined;
  private miniGameExitArmedUntil = 0;
  private workbenchUiObjects: Phaser.GameObjects.GameObject[] = [];
  private workbenchCategory: WorkbenchCategory | undefined;
  private workbenchQuery = "";
  private workbenchCraftableOnly = false;
  private placementItemId: string | undefined;
  private movingPlacedObjectId: string | undefined;
  private placementRotation: PlacementRotation = 0;
  private placementTarget = { x: 0, y: 0 };
  private placementPreview: Phaser.GameObjects.Container | undefined;
  private placementPreviewFootprint: Phaser.GameObjects.Rectangle | undefined;
  private placementPreviewSprite: Phaser.GameObjects.Image | undefined;
  private placedObjectVisuals = new Map<string, Phaser.GameObjects.Container>();
  private placedObjectObstacles = new Map<string, Phaser.GameObjects.Rectangle>();
  private placedObjectColliders: Phaser.Physics.Arcade.Collider[] = [];
  private placedObjectObstacleGroup: Phaser.Physics.Arcade.StaticGroup | undefined;
  private livestockVisuals = new Map<string, Phaser.GameObjects.Container>();
  private fishingMiniGame: FishingMiniGameState | undefined;
  private fishingHeld = false;
  private fishingMiniObjects: Phaser.GameObjects.GameObject[] = [];
  private fishingTrack: Phaser.GameObjects.Rectangle | undefined;
  private fishingCatcher: Phaser.GameObjects.Rectangle | undefined;
  private fishingFish: Phaser.GameObjects.Text | undefined;
  private fishingProgress: Phaser.GameObjects.Rectangle | undefined;
  private alchemyMiniGame: AlchemyMiniGameState | undefined;
  private alchemyMiniObjects: Phaser.GameObjects.GameObject[] = [];
  private alchemyCenter = { x: 0, y: 0 };
  private alchemyLastSampleMs = 0;
  private alchemyInstructionLabel: Phaser.GameObjects.Text | undefined;
  private alchemyPestle: Phaser.GameObjects.Rectangle | undefined;
  private alchemyScoreBar: Phaser.GameObjects.Rectangle | undefined;
  private alchemyRecipeId: AlchemyRecipeId = "healing";
  private cookingMiniGame: CookingMiniGameState | undefined;
  private cookingRecipeId: CookingRecipeId = "simmered_daikon";
  private cookingMiniObjects: Phaser.GameObjects.GameObject[] = [];
  private cookingHeatMarker: Phaser.GameObjects.Rectangle | undefined;
  private cookingTargetZone: Phaser.GameObjects.Rectangle | undefined;
  private cookingQualityBar: Phaser.GameObjects.Rectangle | undefined;
  private cookingAdviceLabel: Phaser.GameObjects.Text | undefined;
  private cookingTimerLabel: Phaser.GameObjects.Text | undefined;
  private cookingFlame: Phaser.GameObjects.Triangle | undefined;
  private cookingBroth: Phaser.GameObjects.Ellipse | undefined;
  private cookingLastPointerY: number | undefined;
  private cookingPrep: CookingPrepState | undefined;
  private cookingMenuObjects: Phaser.GameObjects.GameObject[] = [];
  private cookingResultOpen = false;
  private cookingPrepObjects: Phaser.GameObjects.GameObject[] = [];
  private cookingCutStart: { x: number; y: number } | undefined;
  private cookingCutMarkers: Phaser.GameObjects.Rectangle[] = [];
  private cookingPrepLabel: Phaser.GameObjects.Text | undefined;
  private cookingPrepInputReady = false;
  private riceCooking: RiceCookingState | undefined;
  private riceCookingObjects: Phaser.GameObjects.GameObject[] = [];
  private riceGestureStart: { x: number; y: number } | undefined;
  private riceInstructionLabel: Phaser.GameObjects.Text | undefined;
  private ricePhaseLabel: Phaser.GameObjects.Text | undefined;
  private ricePaddle: Phaser.GameObjects.Rectangle | undefined;
  private riceProgressDots: Phaser.GameObjects.Arc[] = [];
  private ricePortionMarkers: Phaser.GameObjects.Arc[] = [];
  private riceInputReady = false;
  private forgeMiniGame: ForgeMiniGameState | undefined;
  private forgingStoneId: StaffStoneId | undefined;
  private forgeMiniObjects: Phaser.GameObjects.GameObject[] = [];
  private forgeAnvil: Phaser.GameObjects.Rectangle | undefined;
  private forgeTarget: Phaser.GameObjects.Arc | undefined;
  private forgeHeatBar: Phaser.GameObjects.Rectangle | undefined;
  private forgeStatusLabel: Phaser.GameObjects.Text | undefined;
  private fishingApproach: FishingApproachState | undefined;
  private fishingApproachObjects: Phaser.GameObjects.GameObject[] = [];
  private fishingCastStart: { x: number; y: number } | undefined;
  private fishingApproachLabel: Phaser.GameObjects.Text | undefined;
  private fishingBobber: Phaser.GameObjects.Arc | undefined;
  private fishingShadow: Phaser.GameObjects.Ellipse | undefined;
  private fishingApproachInputReady = false;
  private arrivalLabel!: Phaser.GameObjects.Text;
  private environmentTint!: Phaser.GameObjects.Rectangle;
  private weatherLabel!: Phaser.GameObjects.Text;
  private rainGraphics!: Phaser.GameObjects.Graphics;
  private statusButton!: Phaser.GameObjects.Text;
  private detailsOpen = false;
  private lastHudCompact: boolean | undefined;
  private barrierVisual!: Phaser.GameObjects.Arc;
  private actionKey!: Phaser.Input.Keyboard.Key;
  private nearbyPlotId: string | undefined;
  private nearbyGatheringNodeId: string | undefined;
  private nearbyStationId: LifeStationId | undefined;
  private nearbyPlacedObjectId: string | undefined;
  private nearbyNpcId: NpcId | undefined;
  private readonly plotVisuals = new Map<string, { soil: Phaser.GameObjects.Rectangle; crop: Phaser.GameObjects.Image }>();
  private readonly gatheringVisuals = new Map<string, Phaser.GameObjects.Arc | Phaser.GameObjects.Image>();
  private readonly gatheringObstacles = new Map<string, Phaser.GameObjects.Rectangle>();
  private gatheringObstacleGroup: Phaser.Physics.Arcade.StaticGroup | undefined;
  private gatheringCollider: Phaser.Physics.Arcade.Collider | undefined;
  private combatEnemyVisual: Phaser.GameObjects.Arc | Phaser.GameObjects.Image | undefined;
  private combatEnemyLabel: Phaser.GameObjects.Text | undefined;
  private contactCooldownMs = 0;
  private enemyAttackCooldownMs = 1600;
  private telegraphRemainingMs = -1;
  private telegraphVisual: Phaser.GameObjects.Arc | undefined;
  private telegraphCueLabel!: Phaser.GameObjects.Text;
  private bossBarrierActive = false;
  private treeSafeZoneVisual: Phaser.GameObjects.Arc | undefined;
  private npcObjects: Phaser.GameObjects.GameObject[] = [];
  private npcObstacleGroup: Phaser.Physics.Arcade.StaticGroup | undefined;
  private npcCollider: Phaser.Physics.Arcade.Collider | undefined;
  private lastNpcScheduleHour = -1;
  private movementSensitivity = 1;
  private screenShakeEnabled = true;
  private reducedEffects = false;
  private largeText = false;
  private highContrast = false;
  private questDetailsOpen = false;
  private combatCues = true;
  private assetLoadFatal = false;
  private playerFacing: PlayerFacing = "down";
  private playerWalkElapsedMs = 0;
  private lastSafePlayerPosition = { x: 400, y: 360 };

  constructor(private readonly bridge: GameBridge, private readonly runtime: GameRuntime) { super("WorldScene"); }
  preload() {
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => this.bridge.toReact({ type: "ASSET_LOAD_PROGRESS", payload: { percent: normalizeLoadProgress(value) } }));
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: { key: string; type: string }) => {
      const classification = classifyAssetFailure(file.key, file.type);
      const message = assetFailureMessage(file.key, classification);
      if (classification === "fatal") { this.assetLoadFatal = true; this.bridge.toReact({ type: "GAME_ERROR", payload: { fatal: true, message } }); }
      else this.bridge.toReact({ type: "ASSET_WARNING", payload: { message } });
    });
    for (const texture of terrainTextures()) this.load.image(texture.key, texture.path);
    for (const texture of worldSpriteTextures()) this.load.image(texture.key, texture.path);
    this.load.spritesheet(FARM_SPRITE_SHEET.key, FARM_SPRITE_SHEET.path, { frameWidth: FARM_SPRITE_SHEET.frameWidth, frameHeight: FARM_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(FARM_EXPANDED_SPRITE_SHEET.key, FARM_EXPANDED_SPRITE_SHEET.path, { frameWidth: FARM_EXPANDED_SPRITE_SHEET.frameWidth, frameHeight: FARM_EXPANDED_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(GATHERING_SPRITE_SHEET.key, GATHERING_SPRITE_SHEET.path, { frameWidth: GATHERING_SPRITE_SHEET.frameWidth, frameHeight: GATHERING_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(CRAFTABLE_SPRITE_SHEET.key, CRAFTABLE_SPRITE_SHEET.path, { frameWidth: CRAFTABLE_SPRITE_SHEET.frameWidth, frameHeight: CRAFTABLE_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(FARM_BUILDING_SPRITE_SHEET.key, FARM_BUILDING_SPRITE_SHEET.path, { frameWidth: FARM_BUILDING_SPRITE_SHEET.frameWidth, frameHeight: FARM_BUILDING_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(HOME_ESSENTIAL_SPRITE_SHEET.key, HOME_ESSENTIAL_SPRITE_SHEET.path, { frameWidth: HOME_ESSENTIAL_SPRITE_SHEET.frameWidth, frameHeight: HOME_ESSENTIAL_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(LIVESTOCK_SPRITE_SHEET.key, LIVESTOCK_SPRITE_SHEET.path, { frameWidth: LIVESTOCK_SPRITE_SHEET.frameWidth, frameHeight: LIVESTOCK_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(FIELD_TOOL_SPRITE_SHEET.key, FIELD_TOOL_SPRITE_SHEET.path, { frameWidth: FIELD_TOOL_SPRITE_SHEET.frameWidth, frameHeight: FIELD_TOOL_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(HOME_INTERIOR_SPRITE_SHEET.key, HOME_INTERIOR_SPRITE_SHEET.path, { frameWidth: HOME_INTERIOR_SPRITE_SHEET.frameWidth, frameHeight: HOME_INTERIOR_SPRITE_SHEET.frameHeight });
    this.load.spritesheet(ITEM_ICON_ATLAS.key, ITEM_ICON_ATLAS.path, { frameWidth: ITEM_ICON_ATLAS.frameWidth, frameHeight: ITEM_ICON_ATLAS.frameHeight });
    for (const texture of npcSpriteTextures()) this.load.image(texture.key, texture.path);
    for (const portrait of npcPortraitTextures()) this.load.image(portrait.key, portrait.path);
    for (const texture of enemySpriteTextures()) this.load.image(texture.key, texture.path);
    for (const texture of playerFieldTextures()) this.load.image(texture.key, texture.path);
    this.load.tilemapTiledJSON("map-homestead", "/maps/homestead.json");
    this.load.tilemapTiledJSON("map-village", "/maps/village.json");
    this.load.tilemapTiledJSON("map-home", "/maps/home.json");
    this.load.tilemapTiledJSON("map-nagomi", "/maps/nagomi.json");
    this.load.tilemapTiledJSON("map-shop", "/maps/shop.json");
    this.load.tilemapTiledJSON("map-forge", "/maps/forge.json");
    this.load.tilemapTiledJSON("map-clinic", "/maps/clinic.json");
    this.load.tilemapTiledJSON("map-village-hall", "/maps/village-hall.json");
    this.load.tilemapTiledJSON("map-river", "/maps/river.json");
    this.load.tilemapTiledJSON("map-fishing-hut", "/maps/fishing-hut.json");
    this.load.tilemapTiledJSON("map-old-pond", "/maps/old-pond.json");
    this.load.tilemapTiledJSON("map-shrine-approach", "/maps/shrine-approach.json");
    this.load.tilemapTiledJSON("map-shrine", "/maps/shrine.json");
    this.load.tilemapTiledJSON("map-forest", "/maps/forest.json");
    this.load.tilemapTiledJSON("map-forest-depths", "/maps/forest-depths.json");
    this.load.tilemapTiledJSON("map-yodomi-grove", "/maps/yodomi-grove.json");
  }
  create() {
    if (this.assetLoadFatal) return;
    const unsubscribeSettings = this.bridge.onGame((event) => {
      if (event.type !== "UPDATE_FEEDBACK_SETTINGS") return;
      this.movementSensitivity = Phaser.Math.Clamp(event.payload.movementSensitivity, 0.8, 1.2);
      this.screenShakeEnabled = event.payload.screenShake;
      this.reducedEffects = event.payload.reducedEffects;
      this.largeText = event.payload.largeText;
      this.highContrast = event.payload.highContrast;
      this.combatCues = event.payload.combatCues;
      if (this.rainGraphics) this.refreshEnvironment();
      this.applyAccessibilitySettings();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeSettings);
    this.createPlayerTexture();
    this.playerFacing = this.runtime.getState().player.direction;
    const initialPlayerSprite = playerFieldSprite(this.playerFacing);
    const playerTexture = this.textures.exists(initialPlayerSprite.key) ? initialPlayerSprite.key : "player-placeholder";
    this.player = this.physics.add.sprite(0, 0, playerTexture)
      .setDisplaySize(PLAYER_FIELD_SPRITE.width, PLAYER_FIELD_SPRITE.height)
      .setOrigin(0.5, PLAYER_FIELD_SPRITE.originY)
      .setFlipX(this.playerFacing === "left")
      .setDepth(20);
    this.player.setCircle(13, 5, 9).setCollideWorldBounds(true);
    this.fieldInput = new FieldInput(this);
    const resizeCamera = () => { if (this.map) this.fitMapCamera(this.map); };
    this.scale.on("resize", resizeCamera);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off("resize", resizeCamera));
    const gesturePointer = new PointerOwner();
    const cancelGesture = () => {
      gesturePointer.cancel();
      this.fishingHeld = false;
      this.cookingLastPointerY = undefined;
      this.cookingCutStart = undefined;
      this.riceGestureStart = undefined;
      this.fishingCastStart = undefined;
      if (this.alchemyMiniGame) this.alchemyMiniGame = releaseAlchemyRotation(this.alchemyMiniGame);
    };
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!gesturePointer.begin(pointer.id)) return;
      if (this.placementItemId) { const point = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2; this.placementTarget = this.runtime.placement.snapPosition(point.x, point.y); this.refreshPlacementPreview(); return; }
      if (this.fishingMiniGame?.status === "playing") this.fishingHeld = true;
      if (this.alchemyMiniGame && !this.alchemyMiniGame.quality) this.sampleAlchemyPointer(pointer, true);
      if (this.cookingMiniGame && !this.cookingMiniGame.result) this.cookingLastPointerY = pointer.y;
      if (this.cookingPrepInputReady && this.cookingPrep && !this.cookingPrep.complete) this.cookingCutStart = { x: pointer.x, y: pointer.y };
      if (this.riceInputReady && this.riceCooking && this.riceCooking.phase !== "complete") this.riceGestureStart = { x: pointer.x, y: pointer.y };
      if (this.forgeMiniGame && !this.forgeMiniGame.result) this.strikeForgeAt(pointer.x, pointer.y);
      if (this.fishingApproachInputReady && this.fishingApproach?.phase === "casting") this.fishingCastStart = { x: pointer.x, y: pointer.y };
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!gesturePointer.owns(pointer.id)) return;
      if (pointer.isDown && this.alchemyMiniGame && !this.alchemyMiniGame.quality) this.sampleAlchemyPointer(pointer, false);
      if (pointer.isDown && this.cookingMiniGame && !this.cookingMiniGame.result && this.cookingLastPointerY !== undefined) {
        this.cookingMiniGame = setCookingHeat(this.cookingMiniGame, this.cookingMiniGame.heat + (this.cookingLastPointerY - pointer.y) / 180);
        this.cookingLastPointerY = pointer.y;
      }
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!gesturePointer.end(pointer.id)) return;
      this.fishingHeld = false; this.cookingLastPointerY = undefined; if (this.alchemyMiniGame) this.alchemyMiniGame = releaseAlchemyRotation(this.alchemyMiniGame);
      if (this.cookingPrepInputReady && this.cookingPrep) this.handleCookingCut(pointer);
      if (this.riceInputReady && this.riceCooking) this.handleRiceGesture(pointer);
      if (this.fishingApproachInputReady && this.fishingApproach) this.handleFishingApproachRelease(pointer);
    });
    this.input.on("gameout", cancelGesture);
    this.input.on("pointerupoutside", cancelGesture);
    this.game.events.on(Phaser.Core.Events.BLUR, cancelGesture);
    this.game.events.on(Phaser.Core.Events.HIDDEN, cancelGesture);
    this.game.canvas.addEventListener("pointercancel", cancelGesture);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cancelGesture();
      this.game.events.off(Phaser.Core.Events.BLUR, cancelGesture);
      this.game.events.off(Phaser.Core.Events.HIDDEN, cancelGesture);
      this.game.canvas.removeEventListener("pointercancel", cancelGesture);
    });
    this.locationLabel = this.add.text(16, 14, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "16px", color: "#f5f0dc", backgroundColor: "#102019dd", padding: { x: 10, y: 7 } }).setScrollFactor(0).setDepth(100);
    this.environmentTint = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff, 0).setOrigin(0).setScrollFactor(0).setDepth(80);
    this.rainGraphics = this.add.graphics().setScrollFactor(0).setDepth(81).setVisible(false);
    this.weatherLabel = this.add.text(16, 48, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#e9f3df", backgroundColor: "#102019aa", padding: { x: 7, y: 4 } }).setScrollFactor(0).setDepth(100);
    this.timeLabel = this.add.text(this.scale.width - 16, 14, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#f5f0dc", backgroundColor: "#102019dd", padding: { x: 10, y: 7 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.farmingInfoLabel = this.add.text(this.scale.width - 16, 54, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#d5dfc7", backgroundColor: "#102019bb", padding: { x: 8, y: 5 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
    this.detailsOpen = hudLayout(this.scale.width).detailsDefaultVisible;
    this.statusButton = this.add.text(this.scale.width - 16, 50, this.detailsOpen ? "情報を閉じる" : "情報", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#e9f3df", backgroundColor: "#3f5948dd", padding: { x: 9, y: 6 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(105).setInteractive({ useHandCursor: true });
    this.statusButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.detailsOpen = !this.detailsOpen; this.refreshStatusVisibility(); });
    this.questLabel = this.add.text(16, 86, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#fff2bc", backgroundColor: "#4e3f25dd", padding: { x: 9, y: 6 }, wordWrap: { width: 260 } }).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
    this.questLabel.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.questDetailsOpen = !this.questDetailsOpen; this.refreshLifeDisplay(); });
    this.dialogueLabel = this.add.text(this.scale.width / 2, 132, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff9e8", backgroundColor: "#16251fee", padding: { x: 14, y: 10 }, align: "center", wordWrap: { width: 260 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(120).setVisible(false);
    this.mapPanel = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, Math.min(680, this.scale.width - 24), Math.min(500, this.scale.height - 64), 0x122019, 0.98).setStrokeStyle(3, 0xd6bd7b).setScrollFactor(0).setDepth(129).setVisible(false);
    this.mapPanelText = this.add.text(this.scale.width / 2, 38, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff5cf", align: "center", lineSpacing: 5 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(132).setVisible(false);
    this.mapButton = this.add.text(this.scale.width / 2, 14, "メニュー", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff5cf", backgroundColor: "#4c5f4bee", padding: { x: 14, y: 7 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(131).setInteractive({ useHandCursor: true });
    this.mapButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); if (this.mapOpen) this.toggleMapPanel(); else this.openMainMenu(); });
    this.inventoryButton = this.add.text(this.scale.width / 2 + 46, 14, "持ち物", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff5cf", backgroundColor: "#4c5f4bee", padding: { x: 12, y: 7 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(131).setInteractive({ useHandCursor: true });
    this.inventoryButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.openInventoryPanel(); });
    this.journalButton = this.add.text(this.scale.width / 2 + 80, 14, "依頼", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff5cf", backgroundColor: "#725f3fee", padding: { x: 12, y: 7 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(131).setInteractive({ useHandCursor: true });
    this.journalButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.openJournalPanel(); });
    this.yokaiCardButton = this.add.text(this.scale.width / 2 + 130, 14, "妖怪札", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff5cf", backgroundColor: "#5b4772ee", padding: { x: 12, y: 7 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(131).setInteractive({ useHandCursor: true });
    this.yokaiCardButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (this.runtime.combat.state.status === "battle") this.activateYokaiCard();
      else this.openYokaiCardPanel();
    });
    this.mapButton.setX(this.scale.width / 2 - 72);
    this.inventoryButton.setX(this.scale.width / 2);
    this.toolButton = this.add.text(18, this.scale.height - 70, "道具: 鍬", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff7dd", backgroundColor: "#596747ee", padding: { x: 13, y: 9 } }).setOrigin(0, 1).setScrollFactor(0).setDepth(110).setInteractive({ useHandCursor: true });
    this.toolButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); if (this.placementItemId) this.rotatePlacement(); else this.openToolPanel(); });
    this.placementButton = this.add.text(18, this.scale.height - 116, "配置", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff7dd", backgroundColor: "#735f45ee", padding: { x: 13, y: 9 } }).setOrigin(0, 1).setScrollFactor(0).setDepth(110).setVisible(false).setInteractive({ useHandCursor: true });
    this.placementButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); if (this.placementItemId) this.cancelPlacement(); else this.openPlacementPanel(); });
    this.lifePanel = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, Math.min(430, this.scale.width - 24), Math.min(500, this.scale.height - 70), 0xe6d29e, 0.99).setStrokeStyle(6, 0x5b3922).setScrollFactor(0).setDepth(139).setVisible(false);
    this.lifePanelTitle = this.add.text(this.scale.width / 2, Math.max(50, this.scale.height / 2 - Math.min(500, this.scale.height - 70) / 2 + 26), "", { fontFamily: "'Yu Mincho', serif", fontSize: "21px", fontStyle: "bold", color: "#3a2819" }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(140).setVisible(false);
    this.lifePanelBody = this.add.text(this.scale.width / 2, this.lifePanelTitle.y + 46, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#463723", align: "left", lineSpacing: 7, wordWrap: { width: Math.min(370, this.scale.width - 64) } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(140).setVisible(false);
    this.arrivalLabel = this.add.text(this.scale.width / 2, this.scale.height * 0.28, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "18px", color: "#fff5cf", backgroundColor: "#17251fee", padding: { x: 18, y: 12 }, align: "center" }).setOrigin(0.5).setScrollFactor(0).setDepth(128).setVisible(false);
    this.actionButton = this.add.text(this.scale.width - 18, this.scale.height - 18, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "16px", color: "#fff7dd", backgroundColor: "#6e5635ee", padding: { x: 16, y: 12 } }).setOrigin(1, 1).setScrollFactor(0).setDepth(110).setVisible(false).setInteractive({ useHandCursor: true });
    this.actionButton.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); if (this.placementItemId) this.confirmPlacement(); else this.performAction(); });
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
    this.combatHudLabel = this.add.text(this.scale.width / 2, this.scale.height - 16, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff7dd", backgroundColor: "#281d24ee", padding: { x: 14, y: 10 }, align: "center", lineSpacing: 5 }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(109).setVisible(false);
    this.telegraphCueLabel = this.add.text(this.scale.width / 2, this.scale.height * 0.34, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "18px", color: "#ffffff", backgroundColor: "#311f2fee", padding: { x: 16, y: 9 }, align: "center" }).setOrigin(0.5).setScrollFactor(0).setDepth(113).setVisible(false);
    this.barrierVisual = this.add.circle(0, 0, 28, 0x7fd4ef, 0.18).setStrokeStyle(4, 0xaeeaff).setDepth(19).setVisible(false);
    if (!this.input.keyboard) throw new Error("Keyboard input is unavailable.");
    this.actionKey = this.input.keyboard.addKey("E");
    this.helpLabel = this.add.text(16, 54, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#d5dfc7", backgroundColor: "#102019bb", padding: { x: 8, y: 5 } }).setScrollFactor(0).setDepth(100).setVisible(false);
    const state = this.runtime.getState();
    this.changeMap(state.player.mapId as MapId, undefined, { x: state.player.x, y: state.player.y });
    this.runtime.events.on((event) => {
      if (event.type === "STATE_LOADED") {
        const loaded = this.runtime.getState().player;
        this.changeMap(loaded.mapId as MapId, undefined, { x: loaded.x, y: loaded.y });
        this.applyPlayerFacing(loaded.direction);
      }
      if (event.type === "STATE_LOADED" || (event.type === "STATE_CHANGED" && event.domain === "time")) { this.refreshTimeLabel(); this.refreshEnvironment(); }
      if (event.type === "STATE_CHANGED" && event.domain === "gathering") this.refreshGatheringVisuals();
      if (event.type === "STATE_CHANGED" && event.domain === "livestock" && this.map?.id === "map_homestead") this.recreatePlacedObjectVisuals();
      if (event.type === "STATE_CHANGED" && event.domain === "progression" && (this.map?.id === "map_home" || this.map?.id === "map_homestead")) this.refreshMapPresentation();
      if (event.type === "STATE_LOADED" || event.type === "STATE_CHANGED") this.refreshLifeDisplay();
    });
    this.scale.on("resize", (size: Phaser.Structs.Size) => { this.layoutHud(size); this.dialogueLabel.setX(size.width / 2); this.actionButton.setPosition(size.width - 18, size.height - 18); this.foodButton.setY(size.height - 18); this.toolButton.setY(size.height - 70); this.placementButton.setY(size.height - 116); this.barrierButton.setPosition(size.width - 18, size.height - 76); this.yokaiCardButton.setX(size.width / 2 + 130); this.combatHudLabel.setPosition(size.width / 2, size.height - 16); this.telegraphCueLabel.setPosition(size.width / 2, size.height * 0.34); this.layoutMapPanel(size); this.layoutLifePanel(size); if (this.inventoryPanelActive) this.openInventoryPanel(); this.arrivalLabel.setPosition(size.width / 2, size.height * 0.28); this.environmentTint.setSize(size.width, size.height); if (this.map) this.cameras.main.setZoom(mapCameraZoom(this.map.id, size.height, this.map.height)); this.drawRain(size.width, size.height); });
    this.layoutHud(this.scale);
    this.refreshTimeLabel();
    this.refreshEnvironment();
    this.refreshLifeDisplay();
    this.bridge.toReact({ type: "GAME_READY" });
  }
  update(_time: number, delta: number) {
    this.runtime.update(delta, this.mapOpen || this.lifePanelOpen || Boolean(this.placementItemId));
    this.refreshNpcScheduleIfNeeded();
    if (this.fishingMiniGame) this.updateFishingMiniGameDisplay(delta);
    if (this.alchemyMiniGame) this.updateAlchemyMiniGameDisplay(delta);
    if (this.cookingMiniGame) this.updateCookingMiniGameDisplay(delta);
    if (this.forgeMiniGame) this.updateForgeMiniGameDisplay(delta);
    if (this.fishingApproach) this.updateFishingApproachDisplay(delta);
    if (this.placementItemId) { this.player.setVelocity(0, 0); this.actionButton.setVisible(true); return; }
    if (this.mapOpen || this.lifePanelOpen) { this.player.setVelocity(0, 0); return; }
    if (this.runtime.isPaused) { this.player.setVelocity(0, 0); return; }
    const direction = this.fieldInput.getDirection();
    this.player.setVelocity(direction.x * PLAYER_SPEED * this.movementSensitivity, direction.y * PLAYER_SPEED * this.movementSensitivity);
    const facing = Math.abs(direction.x) > Math.abs(direction.y) ? (direction.x < 0 ? "left" : "right") : direction.y < 0 ? "up" : "down";
    const isMoving = direction.lengthSq() > 0;
    if (isMoving) this.applyPlayerFacing(facing);
    this.updatePlayerWalk(isMoving ? facing : this.playerFacing, isMoving, delta);
    if (direction.lengthSq() > 0 && this.map) this.runtime.updatePlayer(this.map.id, this.player.x, this.player.y, facing);
    this.refreshCombatControls();
    this.updateCombatSimulation(delta);
    this.updateInteraction();
    if (!this.map || this.transitionLocked) return;
    const transition = this.map.transitions.find((area) => Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(area.x, area.y, area.width, area.height), this.player.x, this.player.y));
    if (transition) {
      const access = mapAccess(transition.targetMap, { chapterTwoStep: this.runtime.chapterTwo.step, chapterThreeStep: this.runtime.chapterThree.step });
      if (access.allowed) {
        const confirmation = dangerEntryConfirmation(transition.targetMap, this.runtime.chapterTwo.step, this.runtime.chapterThree.step);
        if (confirmation) this.openDangerEntryConfirmation(transition.targetMap, transition.targetSpawn, confirmation);
        else this.changeMap(transition.targetMap, transition.targetSpawn, undefined, true);
      }
      else this.rejectTransition(transition.x + transition.width / 2, transition.y + transition.height / 2, access.message);
    } else this.lastSafePlayerPosition = { x: this.player.x, y: this.player.y };
  }
  private rejectTransition(exitX: number, exitY: number, message: string) {
    if (!this.map) return;
    this.transitionLocked = true;
    this.player.setVelocity(0, 0);
    const towardCenter = new Phaser.Math.Vector2(this.map.width / 2 - exitX, this.map.height / 2 - exitY).normalize();
    this.player.setPosition(
      Phaser.Math.Clamp(this.player.x + towardCenter.x * 72, 48, this.map.width - 48),
      Phaser.Math.Clamp(this.player.y + towardCenter.y * 72, 48, this.map.height - 48),
    );
    this.dialogueLabel.setText(message).setVisible(true);
    this.time.delayedCall(1200, () => { this.dialogueLabel.setVisible(false); this.transitionLocked = false; });
  }
  private refreshTimeLabel() {
    const time = this.runtime.getState().time;
    const season = ({ spring: "春", summer: "夏", autumn: "秋", winter: "冬" } as Record<string, string>)[time.season] ?? time.season;
    const displayMinutes = Math.floor(time.minutes / 5) * 5;
    const hours = Math.floor(displayMinutes / 60).toString().padStart(2, "0");
    const minutes = (displayMinutes % 60).toString().padStart(2, "0");
    this.timeLabel.setText(`${season} ${time.day}日  ${hours}:${minutes}`);
  }
  private refreshEnvironment() {
    if (!this.map) return;
    const environment = environmentPresentation(this.map.id, this.runtime.getState().time);
    this.environmentTint.setFillStyle(environment.tint, environment.alpha).setVisible(environment.alpha > 0);
    this.weatherLabel.setText(`${environment.periodLabel}・${environment.weatherLabel}`);
    this.rainGraphics.setVisible(environment.outdoor && environment.weather === "rain");
    this.drawRain(this.scale.width, this.scale.height);
  }
  private applyAccessibilitySettings() {
    const texts = [this.locationLabel, this.weatherLabel, this.timeLabel, this.farmingInfoLabel, this.statusButton, this.questLabel, this.dialogueLabel, this.mapPanelText, this.mapButton, this.inventoryButton, this.journalButton, this.yokaiCardButton, this.toolButton, this.placementButton, this.lifePanelTitle, this.lifePanelBody, this.arrivalLabel, this.actionButton, this.foodButton, this.barrierButton, this.combatHudLabel, this.helpLabel, this.telegraphCueLabel].filter(Boolean);
    for (const text of texts) {
      const base = Number(text.getData("base-font-size")) || Number.parseFloat(String(text.style.fontSize)) || 14;
      if (!text.getData("base-font-size")) text.setData("base-font-size", base);
      text.setFontSize(Math.round(base * (this.largeText ? 1.16 : 1)));
    }
    this.combatHudLabel?.setBackgroundColor(this.highContrast ? "#000000f5" : "#281d24ee").setColor(this.highContrast ? "#ffffff" : "#fff7dd");
    this.telegraphCueLabel?.setBackgroundColor(this.highContrast ? "#000000fa" : "#311f2fee");
  }
  private drawRain(width: number, height: number) {
    this.rainGraphics.clear().lineStyle(2, 0xb9dff0, 0.42);
    const spacingX = this.reducedEffects ? 72 : 34; const spacingY = this.reducedEffects ? 150 : 92;
    for (let x = 12; x < width; x += spacingX) for (let y = 24 + (x % 50); y < height; y += spacingY) this.rainGraphics.lineBetween(x, y, x - 9, y + 24);
  }
  private updateInteraction() {
    const nearestNpc = (this.map ? this.scheduledNpcPlacementsForMap(this.map.id) : [])
      .filter(() => this.runtime.combat.state.status !== "battle")
      .map((npc) => ({ ...npc, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.nearbyNpcId = nearestNpc && nearestNpc.distance <= 64 ? nearestNpc.id : undefined;
    if (this.nearbyNpcId) {
      this.nearbyPlotId = undefined; this.nearbyGatheringNodeId = undefined; this.nearbyStationId = undefined; this.nearbyPlacedObjectId = undefined;
      this.actionButton.setText("話す").setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
      return;
    }
    if (this.map && isCookingWorkPosition(this.map.id, this.player.x, this.player.y)) {
      this.nearbyPlotId = undefined;
      this.nearbyGatheringNodeId = undefined;
      this.nearbyPlacedObjectId = undefined;
      this.nearbyStationId = "cooking";
      this.actionButton.setText("調理台を使う").setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
      return;
    }
    const nearestStation = (this.map ? this.lifeStationsForMap(this.map.id) : [])
      .map((station) => ({ ...station, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, station.x, station.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    const interactionRange = nearestStation?.id === "combat" ? 64 * (this.runtime.staffStones.equipped?.range ?? 1) : 64;
    this.nearbyStationId = nearestStation && nearestStation.distance <= interactionRange ? nearestStation.id : undefined;
    if (this.nearbyStationId && nearestStation) {
      this.nearbyPlotId = undefined;
      this.nearbyGatheringNodeId = undefined;
      this.nearbyPlacedObjectId = undefined;
      this.actionButton.setText(this.getStationActionLabel(nearestStation.id)).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
      return;
    }
    const nearestPlaced = this.map ? this.runtime.placement.list(this.map.id)
      .map((placed) => ({ placed, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, placed.x, placed.y) }))
      .sort((a, b) => a.distance - b.distance)[0] : undefined;
    const placedInteraction = nearestPlaced ? this.runtime.placedInteractions.describe(nearestPlaced.placed) : undefined;
    this.nearbyPlacedObjectId = nearestPlaced && nearestPlaced.distance <= 64 && placedInteraction ? nearestPlaced.placed.id : undefined;
    if (this.nearbyPlacedObjectId && nearestPlaced && placedInteraction) {
      this.nearbyPlotId = undefined; this.nearbyGatheringNodeId = undefined;
      this.actionButton.setText(placedInteraction.label).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
      return;
    }
    if (this.map?.id !== "map_homestead" && this.map?.id !== "map_forest_depths") {
      this.nearbyPlotId = undefined;
      this.nearbyGatheringNodeId = undefined;
      this.actionButton.setVisible(false);
      return;
    }
    const nearest = this.map.id === "map_homestead" ? this.farmPlotsForMap(this.map.id).map((plot) => ({ ...plot, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, plot.x, plot.y) })).sort((a, b) => a.distance - b.distance)[0] : undefined;
    this.nearbyPlotId = nearest && nearest.distance <= 58 ? nearest.id : undefined;
    const nodes = this.gatheringNodesForMap(this.map.id);
    const nearestNode = nodes
      .filter((node) => {
        const mapId = this.map?.id ?? "map_homestead";
        return "requiredTool" in node && (node.requiredTool === "tool_axe" || node.requiredTool === "tool_pickaxe") ? !this.runtime.gathering.isDestroyed(mapId, node.id) : !this.runtime.gathering.isCollected(mapId, node.id);
      })
      .map((node) => ({ ...node, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, node.x, node.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
    this.nearbyGatheringNodeId = nearestNode && nearestNode.distance <= 58 ? nearestNode.id : undefined;
    if (this.nearbyGatheringNodeId && nearestNode && (!nearest || nearestNode.distance < nearest.distance)) {
      this.nearbyPlotId = undefined;
      const equipped = this.runtime.getState().player.equippedToolId as ToolId | null;
      const required = "requiredTool" in nearestNode ? nearestNode.requiredTool : "tool_hand";
      this.actionButton.setText(equipped === required ? (required === "tool_axe" ? "木を切る" : required === "tool_pickaxe" ? "石を砕く" : "採取") : `${TOOL_LABELS[required]}に持替`).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
      return;
    }
    this.nearbyGatheringNodeId = undefined;
    const action = this.nearbyPlotId ? this.runtime.farming.getAction(this.nearbyPlotId) : "none";
    const requiredTool = this.requiredToolForFarming(action);
    const equipped = this.runtime.getState().player.equippedToolId as ToolId | null;
    this.actionButton.setText(requiredTool && equipped !== requiredTool ? `${TOOL_LABELS[requiredTool]}に持替` : FARM_ACTION_LABEL[action]).setVisible(action !== "none");
    if (action !== "none" && Phaser.Input.Keyboard.JustDown(this.actionKey)) this.performAction();
  }
  private performAction() {
    if (this.nearbyNpcId) {
      const result = this.runtime.npcs.talk(this.nearbyNpcId);
      const reportedKodamaTruth = this.nearbyNpcId === "kannushi" && this.runtime.chapterThree.recordShrineReport();
      const delivery = this.runtime.villagerRequests.deliverTo(this.nearbyNpcId);
      const sideEvents = this.runtime.sideEvents.forNpc(this.nearbyNpcId);
      const facilityOption = npcFacilityOption(this.nearbyNpcId);
      const options = [
        ...(facilityOption ? [facilityOption] : []),
        ...sideEvents.map((event) => ({ id: event.id, label: `サブイベント「${event.title}」`, enabled: event.ready, detail: event.ready ? `${event.itemName}を渡す` : `${event.itemName} ${event.current}/${event.quantity}` })),
      ];
      const storyLine = reportedKodamaTruth ? "\n\n主人公は、木霊が陽太を守っていた事実を伝えた。\n\n神主「事実は否定しません。しかし、妖怪の真意を人が容易に判断してはなりません。」" : "";
      this.openNpcDialogue(this.nearbyNpcId, result.name, `${npcDialogueText(result.line ?? "……", result.friendship, delivery)}${storyLine}`, options, (id) => {
        const facilityAction = npcFacilityAction(id);
        if (facilityAction === "cooking") { this.openCookingPanel(); return; }
        if (facilityAction === "alchemy") { this.openAlchemyPanel(); return; }
        if (facilityAction === "smithing") { this.openSmithingPanel(); return; }
        if (facilityAction === "fishing") { this.openStationPanel("fishing"); return; }
        const completed = this.runtime.sideEvents.complete(id);
        if (!completed) return;
        this.openLifePanel(completed.title, `${completed.description}\n\n${result.name}「${completed.completionLine}」\n\n報酬 ${completed.reward}文 / 友情 +${completed.friendship}`, []);
        this.refreshLifeDisplay();
      });
      this.refreshLifeDisplay();
      return;
    }
    if (this.nearbyPlacedObjectId && this.map) {
      const placed = this.runtime.placement.list(this.map.id).find((item) => item.id === this.nearbyPlacedObjectId);
      if (!placed) return;
      const interaction = this.runtime.placedInteractions.describe(placed);
      if (interaction?.action === "sleep") { this.performSleep(); return; }
      if (interaction?.action === "workbench") { this.openWorkbenchPanel(); return; }
      if (interaction?.action === "storage") { this.openStoragePanel(); return; }
      if (interaction?.action === "manage_building") { this.openLivestockPanel(); return; }
      if (interaction?.action === "edit_sign") {
        const mapId = this.map.id;
        this.requestTextEntry("看板の文字", placed.label ?? "", 30, (value) => {
          if (value === null) return;
          const result = this.runtime.placedInteractions.interact(mapId, placed, value);
          this.showLifeResult(result.message);
          this.recreatePlacedObjectVisuals();
          this.refreshLifeDisplay();
        });
        return;
      }
      const result = this.runtime.placedInteractions.interact(this.map.id, placed);
      this.dialogueLabel.setText(result.message).setVisible(true); this.time.delayedCall(2200, () => this.dialogueLabel.setVisible(false));
      this.recreatePlacedObjectVisuals(); this.refreshLifeDisplay(); return;
    }
    if (this.nearbyStationId) {
      if (this.nearbyStationId === "cooking") {
        this.openCookingPanel();
        return;
      }
      if (this.nearbyStationId === "fishing") { this.openStationPanel("fishing"); return; }
      if (this.nearbyStationId === "alchemy") { this.openStationPanel("alchemy"); return; }
      if (this.nearbyStationId === "smithing") { this.openSmithingPanel(); return; }
      if (this.nearbyStationId === "shop") { this.openShopPanel(); return; }
      if (this.nearbyStationId === "offering") { this.openOfferingPanel(); return; }
      if (this.nearbyStationId === "combat") {
        const status = this.runtime.combat.state.status;
        if (status === "idle" || status === "cleansed" || status === "defeated") {
          const chapter = this.runtime.getState().progression.chapter;
          const enemyType = this.runtime.combat.suggestedEnemy(chapter);
          this.runtime.combat.start(enemyType);
          const station = this.stationForCurrentMap("combat");
          if (station) {
            this.combatEnemyVisual?.setPosition(station.x, station.y).setVisible(true).setAlpha(1);
            this.combatEnemyLabel?.setText(ENEMY_ARCHETYPES[enemyType].marker).setPosition(station.x, station.y).setVisible(!this.textures.exists(KEGARE_REMNANT_SPRITE.key)).setAlpha(1);
          }
        }
        else if (status === "battle") {
          this.tryStaffAttack();
        }
        else if (status === "purifiable") this.runtime.combat.cleanse();
      }
      if (this.nearbyStationId === "boss") this.performBakegaeruAction();
      if (this.nearbyStationId === "kodama") this.performKodamaAction();
      if (this.nearbyStationId === "tree") this.performYodomiTreeAction();
      if (this.nearbyStationId === "construction") { this.openConstructionPanel(); return; }
      if (this.nearbyStationId === "livestock") { this.openLivestockPanel(); return; }
      if (this.nearbyStationId === "notebook") {
        if (this.runtime.chapterThree.step !== "read_notebook") {
          this.openLifePanel("祖父の手帳", "使い込まれた手帳だ。今は気になる記述を見つけられない。", []);
        } else {
          this.openStoryDialogue(STORY_DIALOGUES.grandfatherNotebook, () => this.runtime.chapterThree.recordNotebookRead());
        }
        return;
      }
      this.refreshLifeDisplay();
      return;
    }
    if (this.nearbyGatheringNodeId) {
      const nodes = this.map ? this.gatheringNodesForMap(this.map.id) : [];
      const node = nodes.find((candidate) => candidate.id === this.nearbyGatheringNodeId);
      const required = node && "requiredTool" in node ? node.requiredTool : "tool_hand";
      if (this.runtime.getState().player.equippedToolId !== required) { this.openToolPanel(required); return; }
      const destroyed = node && this.map && (required === "tool_axe" || required === "tool_pickaxe")
        ? this.runtime.gathering.destroy(this.map.id, node.id, node.itemId, node.quantity)
        : node && this.map ? this.runtime.gathering.collect(this.map.id, node.id, node.itemId, node.quantity) : false;
      if (destroyed && node) {
        this.gatheringVisuals.get(node.id)?.setVisible(false);
        const color = required === "tool_axe" ? 0xb78a55 : required === "tool_pickaxe" ? 0xc8c2b0 : 0x86c980;
        this.showFieldActionEffect(node.x, node.y, color, required);
      }
      this.nearbyGatheringNodeId = undefined;
      this.refreshLifeDisplay();
      return;
    }
    if (this.nearbyPlotId) {
      const pendingAction = this.runtime.farming.getAction(this.nearbyPlotId);
      const required = this.requiredToolForFarming(pendingAction);
      if (required && this.runtime.getState().player.equippedToolId !== required) { this.openToolPanel(required); return; }
      if (pendingAction === "plant") { this.openSeedSelectionPanel(this.nearbyPlotId); return; }
      const cropBeforeAction = cropDefinition(this.runtime.farming.getPlot(this.nearbyPlotId)?.cropId);
      const action = this.runtime.farming.act(this.nearbyPlotId);
      if (action !== "none") {
        const message = action === "harvest" && cropBeforeAction ? `${cropBeforeAction.name}を1個収穫しました。` : farmingActionMessage[action];
        const plot = this.runtime.farming.getPlot(this.nearbyPlotId);
        const color = action === "water" ? 0x79c8df : action === "harvest" ? 0xe4c766 : action === "till" ? 0xa8794f : 0x83b95d;
        if (plot) {
          const location = this.farmPlotsForMap("map_homestead").find((candidate) => candidate.id === this.nearbyPlotId);
          if (location && required) this.showFieldActionEffect(location.x, location.y, color, required, action);
        }
        this.dialogueLabel.setText(message).setVisible(true);
        this.time.delayedCall(1800, () => this.dialogueLabel.setVisible(false));
      }
    }
    this.refreshLifeDisplay();
  }
  private requiredToolForFarming(action: keyof typeof FARM_ACTION_LABEL): ToolId | undefined {
    return ({ till: "tool_hoe", plant: "tool_hand", water: "tool_watering_can", harvest: "tool_hand", none: undefined } as const)[action];
  }
  private showFieldActionEffect(x: number, y: number, color: number, tool: ToolId, action?: keyof typeof FARM_ACTION_LABEL) {
    if (this.reducedEffects) return;
    const toolImage = this.add.image(x + 3, y - 12, FIELD_TOOL_SPRITE_SHEET.key, fieldToolFrame(tool, action)).setDisplaySize(46, 46).setOrigin(0.5, 0.72).setDepth(23).setAngle(-28);
    const ring = this.add.circle(x, y, 9, color, 0.14).setStrokeStyle(3, color, 0.9).setDepth(22);
    const motes = [-1, 0, 1].map((offset) => this.add.circle(x + offset * 7, y - 4, 3, color, 0.95).setDepth(22));
    this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 320, ease: "Quad.Out", onComplete: () => ring.destroy() });
    this.tweens.add({ targets: toolImage, angle: 24, scaleX: toolImage.scaleX * 1.06, scaleY: toolImage.scaleY * 1.06, alpha: 0, duration: 280, ease: "Cubic.Out", onComplete: () => toolImage.destroy() });
    motes.forEach((mote, index) => this.tweens.add({ targets: mote, x: mote.x + (index - 1) * 15, y: mote.y - 18 - index * 3, alpha: 0, duration: 380, ease: "Quad.Out", onComplete: () => mote.destroy() }));
  }
  private createFarmingPlots() {
    this.plotVisuals.clear();
    for (const plot of this.farmPlotsForMap("map_homestead")) {
      const soil = this.add.rectangle(plot.x, plot.y, 34, 34, 0x355c42, 0.08).setStrokeStyle(1, 0x75916c, 0.15).setDepth(-2);
      const crop = this.add.image(plot.x, plot.y + 8, FARM_SPRITE_SHEET.key, 0).setDisplaySize(46, 46).setOrigin(0.5, 0.82).setDepth(-1).setVisible(false);
      this.plotVisuals.set(plot.id, { soil, crop });
      this.worldObjects.push(soil, crop);
    }
  }
  private createGatheringNodes(mapId: MapId = "map_homestead") {
    this.gatheringVisuals.clear();
    const nodes = this.gatheringNodesForMap(mapId);
    const obstacleGroup = this.physics.add.staticGroup();
    this.gatheringObstacleGroup = obstacleGroup;
    for (const node of nodes) {
      const sprite = gatheringSprite(node.requiredTool);
      const gatheringFrame = gatheringNodeFrame(node.itemId);
      const visual = sprite && this.textures.exists(sprite.key)
        ? this.add.image(node.x, node.y, sprite.key).setDisplaySize(sprite.width, sprite.height).setOrigin(0.5, sprite.originY).setDepth(1)
        : gatheringFrame !== undefined && this.textures.exists(GATHERING_SPRITE_SHEET.key)
          ? this.add.image(node.x, node.y, GATHERING_SPRITE_SHEET.key, gatheringFrame).setDisplaySize(node.itemId === "item_spring_water" ? 58 : 44, node.itemId === "item_spring_water" ? 44 : 38).setOrigin(0.5, 0.82).setDepth(1)
        : this.add.circle(node.x, node.y, node.itemId === "item_stone" ? 12 : 10, node.color).setStrokeStyle(2, 0xe4dbb5).setDepth(-1);
      visual.setVisible(node.requiredTool === "tool_axe" || node.requiredTool === "tool_pickaxe" ? !this.runtime.gathering.isDestroyed(mapId, node.id) : !this.runtime.gathering.isCollected(mapId, node.id));
      this.gatheringVisuals.set(node.id, visual);
      this.worldObjects.push(visual);
      const footprint = gatheringCollisionFootprint(node.x, node.y, node.requiredTool);
      if (footprint) {
        const obstacle = this.add.rectangle(footprint.x + footprint.width / 2, footprint.y + footprint.height / 2, footprint.width, footprint.height, 0, 0);
        this.physics.add.existing(obstacle, true);
        obstacleGroup.add(obstacle);
        const available = !this.runtime.gathering.isDestroyed(mapId, node.id);
        const body = obstacle.body as Phaser.Physics.Arcade.StaticBody | null;
        if (body) body.enable = available;
        this.gatheringObstacles.set(node.id, obstacle);
        this.worldObjects.push(obstacle);
      }
    }
    if (obstacleGroup.getLength() > 0) this.gatheringCollider = this.physics.add.collider(this.player, obstacleGroup);
  }
  private refreshGatheringVisuals() {
    if (!this.map || this.gatheringVisuals.size === 0) return;
    for (const [nodeId, visual] of this.gatheringVisuals) {
      const node = this.gatheringNodesForMap(this.map.id).find((candidate) => candidate.id === nodeId);
      const available = node && (node.requiredTool === "tool_axe" || node.requiredTool === "tool_pickaxe") ? !this.runtime.gathering.isDestroyed(this.map.id, nodeId) : !this.runtime.gathering.isCollected(this.map.id, nodeId);
      visual.setVisible(Boolean(available));
      const obstacle = this.gatheringObstacles.get(nodeId);
      const body = obstacle?.body as Phaser.Physics.Arcade.StaticBody | null | undefined;
      if (body) body.enable = Boolean(available);
    }
  }
  private createLifeStations(mapId: MapId) {
    for (const station of this.lifeStationsForMap(mapId)) {
      const sprite = station.id === "combat" ? KEGARE_REMNANT_SPRITE : station.id === "boss" ? BAKEGAERU_CORRUPTED_SPRITE : station.id === "tree" ? YODOMI_TREE_SPRITE : undefined;
      const marker = sprite && this.textures.exists(sprite.key)
        ? this.add.image(station.x, station.y, sprite.key)
          .setDisplaySize(sprite.width, sprite.height)
          .setOrigin(0.5, sprite.originY).setDepth(2)
        : station.marker
          ? this.add.circle(station.x, station.y, 20, station.color, 0.95).setStrokeStyle(3, 0xf0e3bd).setDepth(2)
          : this.add.circle(station.x, station.y, 1, station.color, 0).setDepth(2);
      const text = this.add.text(station.x, station.y, station.marker, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff7dd" }).setOrigin(0.5).setDepth(3);
      if ((station.id === "combat" || station.id === "boss" || station.id === "tree") && marker instanceof Phaser.GameObjects.Image) text.setVisible(false);
      if (marker instanceof Phaser.GameObjects.Image && !this.reducedEffects) {
        const duration = station.id === "combat" ? 720 : station.id === "boss" ? 1050 : 1350;
        this.tweens.add({ targets: marker, scaleX: marker.scaleX * 1.025, scaleY: marker.scaleY * 0.975, yoyo: true, repeat: -1, duration, ease: "Sine.InOut" });
      }
      this.worldObjects.push(marker, text);
      if (station.id === "combat") { this.combatEnemyVisual = marker; this.combatEnemyLabel = text; }
    }
  }
  private gatheringNodesForMap(mapId: MapId): FieldGatheringNode[] {
    const layer = this.map?.id === mapId ? this.map.objectLayers.gatheringNodes : [];
    if (layer.length > 0) return layer.map((object) => {
      const required = object.properties.requiredTool; const rawColor = object.properties.color;
      return { id: object.name, x: object.x, y: object.y, itemId: String(object.properties.itemId ?? ""), quantity: Number(object.properties.quantity ?? 1), color: typeof rawColor === "string" ? Number.parseInt(rawColor.replace("#", ""), 16) : 0x79a95b, ...(typeof required === "string" && required in TOOL_LABELS ? { requiredTool: required as ToolId } : {}) };
    });
    return [];
  }
  private farmPlotsForMap(mapId: MapId) {
    if (mapId !== "map_homestead") return [];
    const zone = this.map?.id === mapId ? this.map.objectLayers.eventZones.find((object) => object.name === "farming_tutorial") : undefined;
    const configured = farmPlotsFromEventZone(zone);
    return configured.length > 0 ? configured : DEFAULT_FARM_PLOTS;
  }
  private lifeStationsForMap(mapId: MapId) {
    const layer = this.map?.id === mapId ? this.map.objectLayers.interactables : [];
    return layer.flatMap((object) => {
      if (!isLifeStationId(object.name)) return [];
      const template = LIFE_STATION_DEFINITIONS[object.name];
      const rawColor = object.properties.color;
      return [{ ...template, id: object.name, mapId, x: object.x, y: object.y, label: String(object.properties.label ?? template.label), marker: String(object.properties.marker ?? template.marker), color: typeof rawColor === "string" ? Number.parseInt(rawColor.replace("#", ""), 16) : template.color }];
    });
  }
  private stationForCurrentMap(stationId: LifeStationId) { return this.map ? this.lifeStationsForMap(this.map.id).find((station) => station.id === stationId) : undefined; }
  private scheduledNpcPlacementsForMap(mapId: MapId) {
    const scheduled = getScheduledNpcPlacements(this.runtime.getState().time.minutes).filter((npc) => npc.mapId === mapId);
    const layer = this.map?.id === mapId ? this.map.objectLayers.npcSpawns : [];
    return scheduled.map((npc) => {
      const spawn = layer.find((object) => object.name === npc.id);
      return spawn ? { ...npc, x: spawn.x, y: spawn.y } : npc;
    });
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
    const depositTarget = [...Object.keys(GATHERING_MATERIALS), "item_daikon", ...Object.keys(FISH_DEFINITIONS)]
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
    this.destroyNpcCollisions();
    const obstacleGroup = this.physics.add.staticGroup();
    this.npcObstacleGroup = obstacleGroup;
    for (const npc of this.scheduledNpcPlacementsForMap(mapId)) {
      const sprite = npcSprite(npc.id);
      if (sprite && this.textures.exists(sprite.key)) {
        const display = npcFieldDisplaySize(npc.id);
        const image = this.add.image(npc.x, npc.y, sprite.key).setDisplaySize(display.width, display.height).setOrigin(0.5, sprite.originY).setDepth(5);
        if (!this.reducedEffects) {
          this.tweens.add({ targets: image, scaleY: image.scaleY * 0.975, yoyo: true, repeat: -1, duration: 820 + (npc.id.length % 4) * 90, ease: "Sine.InOut" });
        }
        this.npcObjects.push(image);
        this.worldObjects.push(image);
      } else {
        const body = this.add.circle(npc.x, npc.y, 15, 0xd4b083, 0.98).setStrokeStyle(3, 0xeee0bd).setDepth(4);
        const marker = this.add.text(npc.x, npc.y, NPC_MARKERS[npc.id], { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#26382e" }).setOrigin(0.5).setDepth(5);
        this.npcObjects.push(body, marker);
        this.worldObjects.push(body, marker);
      }
      const footprint = npcCollisionFootprint(npc.x, npc.y);
      const obstacle = this.add.rectangle(footprint.x + footprint.width / 2, footprint.y + footprint.height / 2, footprint.width, footprint.height, 0, 0);
      this.physics.add.existing(obstacle, true);
      obstacleGroup.add(obstacle);
      this.npcObjects.push(obstacle);
      this.worldObjects.push(obstacle);
    }
    if (obstacleGroup.getLength() > 0) this.npcCollider = this.physics.add.collider(this.player, obstacleGroup);
  }
  private destroyNpcCollisions() {
    this.npcCollider?.destroy();
    this.npcCollider = undefined;
    this.npcObstacleGroup?.destroy();
    this.npcObstacleGroup = undefined;
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
    if (stationId === "cooking") return "調理台を使う";
    if (stationId === "kodama") return this.runtime.chapterThree.step === "kodama_departure" ? "木霊を見つける" : "様子を見る";
    if (stationId === "tree") {
      if (this.runtime.yodomiTree.currentAttack?.kind === "enclosure") return "包囲する根を壊す";
      return ({ idle: "大樹戦開始", battle: "穢れを削る", purifiable: "大樹を浄化", cleansed: "浄化済み", defeated: "再挑戦" } as const)[this.runtime.yodomiTree.status];
    }
    if (stationId === "boss") return ({ idle: "化け蛙戦", battle: "穢れを削る", purifiable: "化け蛙を浄化", cleansed: "再戦", defeated: "再挑戦" } as const)[this.runtime.bakegaeru.status];
    if (stationId !== "combat") return LIFE_STATION_DEFINITIONS[stationId].label;
    return ({ idle: "戦闘開始", battle: "攻撃", purifiable: "浄化", cleansed: "再戦", defeated: "再挑戦" } as const)[this.runtime.combat.state.status];
  }
  private refreshCombatControls() {
    const combat = this.runtime.combat.state;
    const bossBattle = this.runtime.bakegaeru.status === "battle" || this.runtime.yodomiTree.status === "battle";
    const hasFood = this.runtime.inventory.quantity("food_simmered_daikon") + this.runtime.inventory.quantity("food_herb_rice") > 0;
    this.foodButton.setVisible(combat.status === "battle" && combat.wards < combat.maxWards && hasFood);
    this.barrierButton.setVisible(combat.status === "battle" || bossBattle);
    this.barrierVisual.setPosition(this.player.x, this.player.y).setVisible(combat.barrierActive || this.bossBarrierActive);
    const currentBoss = this.map?.id === "map_old_pond" ? this.runtime.bakegaeru : this.map?.id === "map_yodomi_grove" ? this.runtime.yodomiTree : undefined;
    const showBoss = currentBoss && ["battle", "purifiable", "defeated"].includes(currentBoss.status);
    const showHud = Boolean(showBoss) || combat.status === "battle" || combat.status === "purifiable";
    this.combatHudLabel.setText(showBoss ? bossHudText(this.map?.id === "map_old_pond" ? "化け蛙" : "淀みの大樹", currentBoss) : combatHudText(combat))
      .setOrigin(showBoss ? 0 : 0.5, 1).setPosition(showBoss ? 16 : this.scale.width / 2, this.scale.height - (showBoss ? 140 : 16))
      .setWordWrapWidth(Math.max(180, this.scale.width - 64))
      .setVisible(showHud && !this.mapOpen && !this.lifePanelOpen);
    const card = this.runtime.yokaiCards.equipped;
    const cooldown = this.runtime.yokaiCards.cooldownMs;
    this.yokaiCardButton.setText(combat.status === "battle" && card ? `${card.ability}${cooldown > 0 ? ` ${Math.ceil(cooldown / 1000)}秒` : ""}` : "妖怪札");
    this.yokaiCardButton.setBackgroundColor(combat.status === "battle" && card && cooldown === 0 ? "#76539bee" : "#5b4772ee");
  }

  private activateYokaiCard() {
    const card = this.runtime.yokaiCards.equipped;
    if (!card) { this.showLifeResult("装備中の妖怪札がありません。"); return; }
    if (!this.runtime.yokaiCards.activate()) {
      const reason = this.runtime.yokaiCards.cooldownMs > 0 ? `再使用まで ${Math.ceil(this.runtime.yokaiCards.cooldownMs / 1000)}秒` : "霊力が足りません。";
      this.dialogueLabel.setText(reason).setVisible(true); this.time.delayedCall(1200, () => this.dialogueLabel.setVisible(false)); return;
    }
    this.dialogueLabel.setText(`${card.name}の幻影――${card.ability}！`).setVisible(true);
    this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: "success", channel: "se" } });
    this.time.delayedCall(1200, () => this.dialogueLabel.setVisible(false));
  }

  private openYokaiCardPanel() {
    if (!this.map) return;
    const cards = this.runtime.yokaiCards.cards;
    const options: LifeMenuOption[] = cards.map((owned) => {
      const definition = YOKAI_CARDS[owned.id]; const equipped = this.runtime.yokaiCards.equippedId === owned.id;
      return { id: owned.id, label: `${equipped ? "装備中 " : ""}${definition.name} Rank ${owned.rank}`, detail: `${definition.ability} / 霊力${definition.spiritCost} / 再使用${definition.cooldownMs / 1000}秒`, enabled: !equipped };
    });
    const body = cards.length > 0 ? "妖怪札は1枚だけ装備できます。付け替えは自宅・敷地・村・神社でのみ可能です。" : "妖怪との絆を結ぶと、妖怪札がここに追加されます。";
    this.openLifePanel("妖怪札", body, options, (id) => {
      if (this.runtime.yokaiCards.equip(id as YokaiCardId, this.map!.id)) this.showLifeResult(`${YOKAI_CARDS[id as YokaiCardId].name}の札を装備しました。`);
    });
  }
  private performBakegaeruAction() {
    const boss = this.runtime.bakegaeru;
    if (boss.status === "idle" || boss.status === "cleansed" || boss.status === "defeated") {
      this.openStoryDialogue(STORY_DIALOGUES.bakegaeruIntro, () => boss.start());
      return;
    }
    if (boss.status === "purifiable") {
      boss.cleanse();
      this.runtime.chapterTwo.recordBossCleansed();
      this.refreshMapPresentation();
      this.openStoryDialogue(STORY_DIALOGUES.bakegaeruCleansed);
      return;
    }
    if (boss.currentAttack || !boss.attack() || boss.status !== "battle") return;
    const attack = boss.prepareNextAttack();
    if (!attack) return;
    const attackMap = this.map;
    const station = this.stationForCurrentMap("boss");
    const warning = station ? this.add.circle(station.x, station.y, BOSS_ATTACK_RADIUS, attack.kind === "piercing" ? 0x8e4eb0 : 0xd95d43, 0.25).setStrokeStyle(3, 0xffcc99).setDepth(1) : undefined;
    if (warning) { warning.setVisible(attack.kind !== "ultimate"); this.worldObjects.push(warning); }
    const instruction = attack.kind === "ultimate" ? "結界を長押し！" : attack.kind === "piercing" ? "黒紫の予告から離れる！" : "予告から離れるか結界！";
    this.dialogueLabel.setText(`化け蛙\n${attack.name}\n${instruction}`).setVisible(true);
    this.time.delayedCall(1400, () => {
      warning?.destroy();
      if (this.map !== attackMap || boss.status !== "battle" || boss.currentAttack !== attack) return;
      const avoided = Boolean(station && !insideBossCircle(this.player, station, BOSS_ATTACK_RADIUS));
      const barrier = this.bossBarrierActive;
      boss.resolvePreparedAttack(avoided, barrier);
      const defense = frogDefense(attack.kind, avoided, barrier);
      const result = boss.wards === 0 ? "護身札が尽きた。再挑戦しよう。" : defense === "barrier" ? "結界で防いだ！" : defense === "evaded" ? "回避成功！" : "攻撃を受けた！";
      this.dialogueLabel.setText(`${attack.name}\n${result}${boss.fatigued ? "\n化け蛙が疲労している。攻撃の好機！" : ""}`).setVisible(true);
      this.time.delayedCall(1700, () => { if (this.map === attackMap && !boss.currentAttack) this.dialogueLabel.setVisible(false); });
      this.refreshLifeDisplay();
    });
  }
  private performKodamaAction() {
    if (this.runtime.chapterThree.step === "kodama_departure") {
      this.openStoryDialogue(STORY_DIALOGUES.kodamaDeparture, () => {
        this.runtime.chapterThree.completeDeparture();
        const state = this.runtime.getState();
        const friendship = Object.values(state.npcs.states).reduce((total, npc) => total + (npc.friendship ?? 0), 0);
        this.openLifePanel("第3章 完了", completionSummary({ day: state.time.day, completed: state.quests.completedIds.length, bosses: state.progression.defeatedBosses.length, friendship, money: state.player.money }), []);
      });
    } else {
      this.openStoryDialogue(STORY_DIALOGUES.kodamaEncounter, () => this.runtime.chapterThree.recordKodamaEncounter());
    }
    this.refreshLifeDisplay();
  }
  private performYodomiTreeAction() {
    const tree = this.runtime.yodomiTree;
    if (tree.status === "idle" || tree.status === "defeated") {
      this.openStoryDialogue(STORY_DIALOGUES.yodomiTreeIntro, () => tree.start());
      return;
    }
    if (tree.status === "purifiable") {
      tree.cleanse();
      this.runtime.chapterThree.recordTreeCleansed();
      this.refreshMapPresentation();
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
      this.dialogueLabel.setText("淀みの大樹\n根の包囲\n大樹ではなく、包囲する根を攻撃！").setVisible(true);
      return;
    }
    const attackMap = this.map;
    const station = this.stationForCurrentMap("tree");
    const warning = station && attack.kind !== "safe_zone" ? this.add.circle(station.x, station.y, BOSS_ATTACK_RADIUS, attack.kind === "piercing" ? 0x8e4eb0 : 0xd95d43, 0.25).setStrokeStyle(3, 0xffcc99).setDepth(1) : undefined;
    if (warning) this.worldObjects.push(warning);
    const safeZones = TREE_SAFE_ZONES;
    const safeZone = safeZones[tree.safeZoneIndex] ?? safeZones[0];
    if (attack.kind === "safe_zone" && safeZone) {
      if (!this.treeSafeZoneVisual) { this.treeSafeZoneVisual = this.add.circle(safeZone.x, safeZone.y, TREE_SAFE_RADIUS, 0xd7e99b, 0.3).setStrokeStyle(4, 0xe6f5b5).setDepth(1); this.worldObjects.push(this.treeSafeZoneVisual); }
      else this.treeSafeZoneVisual.setPosition(safeZone.x, safeZone.y).setVisible(true);
    }
    const instruction = attack.kind === "safe_zone" ? "光る安全地帯へ移動！ 結界は無効" : attack.kind === "piercing" ? "黒紫の蔦から移動回避！ 結界は貫通" : "予告から離れるか結界！";
    this.dialogueLabel.setText(`淀みの大樹\n${attack.name}\n${instruction}`).setVisible(true);
    this.time.delayedCall(1600, () => {
      warning?.destroy();
      if (this.map !== attackMap || tree.status !== "battle" || tree.currentAttack !== attack) return;
      const avoided = Boolean(station && !insideBossCircle(this.player, station, BOSS_ATTACK_RADIUS));
      const inSafeZone = Boolean(safeZone && insideBossCircle(this.player, safeZone, TREE_SAFE_RADIUS));
      tree.resolvePreparedAttack(avoided, this.bossBarrierActive, inSafeZone);
      this.treeSafeZoneVisual?.setVisible(false);
      const defended = attack.kind === "safe_zone" ? inSafeZone : attack.kind === "piercing" ? avoided : avoided || this.bossBarrierActive;
      this.dialogueLabel.setText(`${attack.name}\n${defended ? "対処成功！" : "攻撃を受けた！"}`).setVisible(true);
      this.time.delayedCall(1500, () => { if (this.map === attackMap && !tree.currentAttack) this.dialogueLabel.setVisible(false); });
      this.refreshLifeDisplay();
    });
    this.refreshLifeDisplay();
  }
  private tryStaffAttack() {
    const enemy = this.combatEnemyVisual;
    if (!enemy || !this.map) return false;
    const stone = this.runtime.staffStones.equipped;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) > 230 * (stone?.range ?? 1) || !clearAttackPath(this.player, enemy, this.map.collisions)) return false;
    if (!this.runtime.combat.attack(stone?.damage ?? 1)) return false;
    this.showStaffAttackEffect();
    return true;
  }
  private updateCombatSimulation(delta: number) {
    const enemy = this.combatEnemyVisual;
    const combat = this.runtime.combat.state;
    if (this.map?.id !== "map_shrine_approach" || !enemy) return;
    const active = combat.status === "battle" || combat.status === "purifiable";
    enemy.setVisible(active || combat.status === "idle" || combat.status === "defeated" || combat.status === "cleansed");
    this.combatEnemyLabel?.setVisible(enemy.visible && enemy instanceof Phaser.GameObjects.Arc);
    if (!active) return;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    if (combat.status === "battle" && combat.enemyType !== "ranged" && distance > 38) {
      const waypoint = combatWaypoint(enemy, this.player, this.map.width, this.map.height, this.map.collisions);
      const angle = waypoint ? Phaser.Math.Angle.Between(enemy.x, enemy.y, waypoint.x, waypoint.y) : 0;
      const speed = ENEMY_ARCHETYPES[combat.enemyType].moveSpeed;
      const step = waypoint ? Math.min(distance - 38, speed * delta / 1000, Phaser.Math.Distance.Between(enemy.x, enemy.y, waypoint.x, waypoint.y)) : 0;
      const moved = moveCombatActor(enemy, Math.cos(angle) * step, Math.sin(angle) * step, this.map.width, this.map.height, this.map.collisions);
      enemy.setPosition(moved.x, moved.y);
      this.combatEnemyLabel?.setPosition(enemy.x, enemy.y);
    }
    if (combat.status === "battle" && combat.enemyType === "ranged" && (distance < 150 || distance > 240)) {
      const waypoint = distance > 240 ? combatWaypoint(enemy, this.player, this.map.width, this.map.height, this.map.collisions) : this.player;
      const towardPlayer = waypoint ? Phaser.Math.Angle.Between(enemy.x, enemy.y, waypoint.x, waypoint.y) : 0;
      const direction = distance < 150 ? -1 : 1;
      const step = waypoint ? Math.min(Math.abs(distance - (distance < 150 ? 150 : 240)), 48 * delta / 1000, Phaser.Math.Distance.Between(enemy.x, enemy.y, waypoint.x, waypoint.y)) : 0;
      const moved = moveCombatActor(enemy, Math.cos(towardPlayer) * step * direction, Math.sin(towardPlayer) * step * direction, this.map.width, this.map.height, this.map.collisions);
      enemy.setPosition(moved.x, moved.y);
      this.combatEnemyLabel?.setPosition(enemy.x, enemy.y);
    }
    this.contactCooldownMs = Math.max(0, this.contactCooldownMs - delta);
    if (combat.status === "battle" && combat.enemyType !== "ranged" && distance <= 42 && this.contactCooldownMs === 0 && clearAttackPath(enemy, this.player, this.map.collisions)) {
      this.runtime.combat.takeEnemyHit(); this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: "damage" } });
      this.contactCooldownMs = 1200;
      this.player.setTint(0xe58a8a);
      this.time.delayedCall(150, () => this.player.clearTint());
    }
    this.updateEnemyTelegraph(delta);
    if (!this.fieldInput.consumeTap()) return;
    if (combat.status === "battle" && this.tryStaffAttack()) {
      if (!this.reducedEffects) this.tweens.add({ targets: enemy, scaleX: 1.22, scaleY: 1.22, yoyo: true, duration: 90 });
    } else if (combat.status === "purifiable" && distance <= 70 && this.runtime.combat.cleanse()) {
      enemy.setAlpha(0.25);
      this.combatEnemyLabel?.setAlpha(0.25);
    }
  }
  private updateEnemyTelegraph(delta: number) {
    if (this.runtime.combat.state.status !== "battle") {
      this.telegraphVisual?.setVisible(false);
      this.telegraphCueLabel.setVisible(false);
      this.telegraphRemainingMs = -1;
      return;
    }
    if (this.telegraphRemainingMs >= 0) {
      this.telegraphRemainingMs -= delta;
      if (this.telegraphRemainingMs <= 0 && this.telegraphVisual) {
        const profile = ENEMY_ARCHETYPES[this.runtime.combat.state.enemyType]; const radius = profile.attackRadius;
        const hit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.telegraphVisual.x, this.telegraphVisual.y) <= radius && Boolean(this.combatEnemyVisual && this.map && clearAttackPath(this.combatEnemyVisual, this.player, this.map.collisions));
        if (hit) { this.runtime.combat.takeEnemyHit(); this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: "damage" } }); }
        this.telegraphVisual.setVisible(false);
        this.telegraphCueLabel.setVisible(false);
        this.telegraphRemainingMs = -1;
        this.enemyAttackCooldownMs = profile.attackCooldownMs;
      }
      return;
    }
    this.enemyAttackCooldownMs -= delta;
    if (this.enemyAttackCooldownMs > 0) return;
    const profile = ENEMY_ARCHETYPES[this.runtime.combat.state.enemyType]; const radius = profile.attackRadius;
    if (!this.telegraphVisual) {
      this.telegraphVisual = this.add.circle(this.player.x, this.player.y, radius, profile.piercing ? 0x593e80 : 0x7d375f, this.highContrast ? 0.46 : 0.28).setStrokeStyle(this.highContrast ? 7 : 4, this.highContrast ? 0xffffff : profile.piercing ? 0xb889df : 0xc66a98).setDepth(1);
      this.worldObjects.push(this.telegraphVisual);
    } else this.telegraphVisual.setRadius(radius).setPosition(this.player.x, this.player.y).setFillStyle(profile.piercing ? 0x593e80 : 0x7d375f, this.highContrast ? 0.46 : 0.28).setStrokeStyle(this.highContrast ? 7 : 4, this.highContrast ? 0xffffff : profile.piercing ? 0xb889df : 0xc66a98).setVisible(true).setAlpha(1);
    this.telegraphCueLabel.setText(profile.piercing ? "貫通攻撃：範囲外へ" : "攻撃予兆：回避 / 結界").setVisible(this.combatCues);
    this.telegraphRemainingMs = profile.telegraphMs;
  }
  private refreshLifeDisplay() {
    const equippedTool = this.runtime.getState().player.equippedToolId as ToolId | null;
    this.toolButton?.setText(`道具: ${equippedTool && equippedTool in TOOL_LABELS ? TOOL_LABELS[equippedTool] : "手"}`);
    const activeChapter = !this.runtime.chapterOne.isComplete ? 1 : !this.runtime.chapterTwo.isComplete ? 2 : 3;
    const activeStep = activeChapter === 1 ? this.runtime.chapterOne.step : activeChapter === 2 ? this.runtime.chapterTwo.step : this.runtime.chapterThree.step;
    const objective = activeChapter === 1
      ? this.runtime.chapterOne.objective
      : activeChapter === 2
        ? this.runtime.chapterTwo.objective
        : this.runtime.chapterThree.objective;
    const storyBeat = activeChapter === 1
      ? this.runtime.chapterOne.storyBeat
      : activeChapter === 2
        ? this.runtime.chapterTwo.storyBeat
        : this.runtime.chapterThree.storyBeat;
    const destination = objectiveDestination(activeChapter, activeStep);
    const destinationText = this.map?.id === destination ? `目的地: ${MAP_DISPLAY_NAMES[destination]}（到着）` : `目的地: ${MAP_DISPLAY_NAMES[destination]}`;
    const guidance = actionGuidance(activeChapter, activeStep);
    const compact = this.scale.width < 760;
    const showQuestDetails = this.questDetailsOpen;
    this.questLabel.setText(showQuestDetails
      ? `第${this.runtime.getState().progression.chapter}章  ${objective}\n${destinationText}\n次の操作: ${guidance}${compact ? "\n▲ 目的を閉じる" : `\n物語: ${storyBeat}\n村人依頼: ${this.runtime.villagerRequests.summary}`}`
      : `第${this.runtime.getState().progression.chapter}章  ${objective}  ▾`);
    const storageCount = this.runtime.getState().inventory.storage.reduce((total, item) => total + item.quantity, 0);
    const seedCount = Object.values(CROP_DEFINITIONS).reduce((total, crop) => total + this.runtime.inventory.quantity(crop.seedId), 0);
    const cropCount = Object.values(CROP_DEFINITIONS).reduce((total, crop) => total + this.runtime.inventory.quantity(crop.harvestId), 0);
    const fishCount = Object.keys(FISH_DEFINITIONS).reduce((total, fishId) => total + this.runtime.inventory.quantity(fishId), 0);
    const dishCount = Object.values(COOKING_RECIPES).reduce((total, recipe) => total + this.runtime.inventory.quantity(recipe.resultItemId), 0);
    const medicineCount = Object.values(ALCHEMY_RECIPES).reduce((total, recipe) => total + this.runtime.inventory.quantity(recipe.resultItemId), 0);
    const inventorySummary =
      `種 ${seedCount}  収穫物 ${cropCount}  ` +
      `よもぎ ${this.runtime.inventory.quantity("item_yomogi")}  木 ${this.runtime.inventory.quantity("item_wood")}  石 ${this.runtime.inventory.quantity("item_stone")}  ${this.runtime.getState().player.money}文\n` +
      `料理 ${dishCount}  魚 ${fishCount}  薬 ${medicineCount}  倉庫 ${storageCount}  奉納 ${this.runtime.offering.completedCount}/3\n` +
      `護身札 ${this.runtime.combat.state.wards}/${this.runtime.combat.state.maxWards}  穢れ ${this.runtime.combat.state.corruption}/${this.runtime.combat.state.maxCorruption}  霊力 ${Math.floor(this.runtime.combat.state.spirit)}/${this.runtime.combat.state.maxSpirit}  結界 ${this.runtime.combat.state.barrierDurability}/3  通常敵 ${ENEMY_ARCHETYPES[this.runtime.combat.state.enemyType].name}  浄化素材 ${this.runtime.inventory.quantity("material_purified_fragment")}`;
    this.farmingInfoLabel.setText(inventorySummary);
    if (this.runtime.bakegaeru.status !== "idle") {
      this.farmingInfoLabel.setText(`${this.farmingInfoLabel.text}\n化け蛙 Phase ${this.runtime.bakegaeru.phase}  穢れ ${this.runtime.bakegaeru.corruption}/${this.runtime.bakegaeru.maxCorruption}  護身札 ${this.runtime.bakegaeru.wards}/4`);
    }
    if (this.runtime.yodomiTree.status !== "idle") {
      this.farmingInfoLabel.setText(`${this.farmingInfoLabel.text}\n淀みの大樹 Phase ${this.runtime.yodomiTree.phase}  穢れ ${this.runtime.yodomiTree.corruption}/${this.runtime.yodomiTree.maxCorruption}  護身札 ${this.runtime.yodomiTree.wards}/4`);
    }
    if (this.mapOpen) this.refreshMapPanel();
    this.layoutHud(this.scale);
    for (const plot of this.farmPlotsForMap("map_homestead")) {
      const visual = this.plotVisuals.get(plot.id);
      if (!visual) continue;
      const state = this.runtime.farming.getPlot(plot.id);
      const crop = cropDefinition(state?.cropId);
      visual.soil.setFillStyle(state ? 0x73583b : 0x355c42, state ? 0.95 : 0.08).setStrokeStyle(state ? 2 : 1, state?.wateredToday ? 0x6ea9c7 : 0x75916c, state ? 1 : 0.15);
      visual.crop.setVisible(Boolean(crop));
      if (crop && state?.cropId) {
        const presentation = cropSpritePresentation(state.cropId, state.growthStage, crop.matureStage);
        visual.crop.setTexture(presentation.textureKey, presentation.frame).setDisplaySize(46, 46).clearTint();
      }
    }
  }
  private layoutHud(size: Pick<Phaser.Structs.Size, "width" | "height">) {
    const layout = hudLayout(size.width);
    const compact = layout.compact;
    if (this.lastHudCompact !== compact) {
      this.detailsOpen = layout.detailsDefaultVisible;
      this.lastHudCompact = compact;
    }
    this.timeLabel.setX(size.width - 16);
    this.statusButton.setPosition(size.width - 16, layout.weatherY);
    this.weatherLabel.setY(layout.weatherY);
    this.mapButton.setPosition(size.width / 2, layout.actionRowY);
    this.inventoryButton.setPosition(size.width / 2 - 35, layout.actionRowY);
    this.journalButton.setPosition(size.width / 2 + 35, layout.actionRowY);
    this.yokaiCardButton.setPosition(size.width / 2 + 105, layout.actionRowY);
    if (compact) {
      const contentWidth = layout.contentWidth;
      this.questLabel.setPosition(16, layout.questY).setWordWrapWidth(layout.questWidth, true);
      this.farmingInfoLabel.setOrigin(0, 0).setPosition(16, this.questLabel.y + this.questLabel.height + 6).setWordWrapWidth(contentWidth, true);
    } else {
      this.questLabel.setPosition(16, layout.questY).setWordWrapWidth(layout.questWidth);
      this.farmingInfoLabel.setOrigin(1, 0).setPosition(size.width - 16, 86).setWordWrapWidth(0);
    }
    this.refreshStatusVisibility();
  }
  private refreshStatusVisibility() {
    this.statusButton.setText(this.detailsOpen ? "情報を閉じる" : "情報");
    this.refreshOverlayVisibility();
  }
  private layoutLifePanel(size: Pick<Phaser.Structs.Size, "width" | "height">) {
    if (this.storyDialogueOpen) {
      const width = Math.min(600, size.width - 24);
      const left = (size.width - width) / 2;
      this.lifePanelBody.setOrigin(0, 0).setWordWrapWidth(width - 48, true);
      const height = Math.max(210, this.lifePanelBody.height + 150);
      const top = Math.max(12, size.height - height - 24);
      this.lifePanel.setPosition(size.width / 2, top + height / 2).setSize(width, height).setFillStyle(0xead8aa, 0.995).setStrokeStyle(6, 0x5b3922, 1);
      this.lifePanelTitle.setOrigin(0, 0).setPosition(left + 24, top + 18);
      this.lifePanelBody.setPosition(left + 24, top + 62);
      this.lifePanelButtons[0]?.setPosition(size.width / 2, top + height - 68);
      this.lifePanelButtons.at(-1)?.setPosition(left + width - 20, top + 14).setOrigin(1, 0);
      return;
    }
    const layout = lifePanelLayout(size.height); const height = layout.panelHeight;
    const width = Math.min(430, size.width - 24); const left = size.width / 2 - width / 2; const top = Math.max(24, size.height / 2 - height / 2);
    this.lifePanel.setPosition(size.width / 2, size.height / 2).setSize(width, height).setFillStyle(0xe6d29e, 0.99).setStrokeStyle(6, 0x5b3922, 1);
    this.lifePanelTitle.setOrigin(0, 0).setPosition(left + 24, top + 22);
    const portraitWidth = width < 390 ? 82 : 128;
    const portraitHeight = Math.round(portraitWidth * 1.5);
    const bodyLeft = this.npcDialoguePortrait ? left + portraitWidth + 42 : left + 24;
    this.lifePanelBody.setOrigin(0, 0).setPosition(bodyLeft, this.lifePanelTitle.y + 46).setWordWrapWidth(width - (bodyLeft - left) - 24, true);
    this.npcDialoguePortrait?.setPosition(left + 20, this.lifePanelTitle.y + 42).setDisplaySize(portraitWidth, portraitHeight).setOrigin(0, 0);
    const portraitBottom = this.npcDialoguePortrait ? this.lifePanelTitle.y + 42 + portraitHeight : 0;
    const startY = this.cookingResultOpen
      ? top + Math.min(350, height - 150)
      : Math.max(this.lifePanelTitle.y + 118, this.lifePanelBody.y + this.lifePanelBody.height + 14, portraitBottom + 12);
    const close = this.lifePanelButtons.at(-1);
    this.lifePanelButtons.slice(0, -1).forEach((button, index) => button.setPosition(size.width / 2, startY + index * layout.buttonSpacing));
    close?.setPosition(left + width - 24, top + 16).setOrigin(1, 0);
  }
  private openToolPanel(recommended?: ToolId) {
    const equipped = this.runtime.getState().player.equippedToolId as ToolId | null;
    const options: LifeMenuOption[] = (Object.keys(TOOL_LABELS) as ToolId[]).map((id) => ({ id, label: `${TOOL_LABELS[id]}${equipped === id ? "（選択中）" : ""}`, enabled: equipped !== id, detail: id === "tool_hoe" ? "土を耕す" : id === "tool_axe" ? "木や切り株を壊す" : id === "tool_pickaxe" ? "石を砕く" : id === "tool_watering_can" ? "作物へ水をやる" : "種植え・収穫・採取" }));
    this.openLifePanel("道具を選ぶ", recommended ? `${TOOL_LABELS[recommended]}が必要です。道具はいつでも持ち替えられます。` : "使う道具を選んでください。", options, (id) => {
      if (!(id in TOOL_LABELS)) return;
      this.runtime.equipTool(id as ToolId);
      this.toolButton.setText(`道具: ${TOOL_LABELS[id as ToolId]}`);
      this.closeLifePanel();
    });
  }
  private openMainMenu() {
    this.openLifePanel("メニュー", "確認する項目を選んでください。", [
      { id: "map", label: "地図", enabled: true, detail: "現在地と目的地への道順" },
      { id: "inventory", label: "持ち物", enabled: true, detail: "所持品と倉庫を確認" },
      { id: "journal", label: "依頼と物語", enabled: true, detail: "章の目的と村人依頼" },
    ], (id) => {
      if (id === "map") { this.closeLifePanel(false); this.toggleMapPanel(); }
      if (id === "inventory") this.openInventoryPanel();
      if (id === "journal") this.openJournalPanel();
    });
  }
  private openInventoryPanel() {
    const state = this.runtime.getState();
    const labels: Record<InventoryCategory, string> = { all: "すべて", materials: "素材", food: "食べ物", medicine: "薬・結晶石", placeables: "家具・建築" };
    const categoryItems = state.inventory.items.filter((item) => item.quantity > 0 && inventoryCategoryLines([item], this.inventoryCategory)[0] !== "このカテゴリに品物はありません");
    const pageSize = this.scale.width < 520 ? 6 : 9;
    const pageCount = Math.max(1, Math.ceil(categoryItems.length / pageSize));
    this.inventoryPage = Phaser.Math.Clamp(this.inventoryPage, 0, pageCount - 1);
    this.openLifePanel("持ち物", `所持金  ${state.player.money}文    かばん ${categoryItems.length}種    倉庫 ${state.inventory.storage.reduce((sum, item) => sum + item.quantity, 0)}個`, []);
    this.inventoryPanelActive = true;
    this.renderInventoryGrid(labels, categoryItems.slice(this.inventoryPage * pageSize, (this.inventoryPage + 1) * pageSize), pageCount);
  }

  private renderInventoryGrid(labels: Record<InventoryCategory, string>, items: readonly { itemId: string; quantity: number }[], pageCount: number) {
    this.inventoryUiObjects.forEach((object) => object.destroy()); this.inventoryUiObjects = [];
    const panelWidth = Math.min(430, this.scale.width - 24); const left = this.scale.width / 2 - panelWidth / 2;
    const top = Math.max(24, this.scale.height / 2 - Math.min(520, Math.max(330, this.scale.height - 48)) / 2);
    const categories = Object.entries(labels) as [InventoryCategory, string][];
    const tabWidth = (panelWidth - 42) / categories.length;
    categories.forEach(([id, label], index) => {
      const active = id === this.inventoryCategory;
      const tab = this.add.text(left + 21 + index * tabWidth, top + 92, label, { fontFamily: "'Yu Gothic', sans-serif", fontSize: this.scale.width < 520 ? "11px" : "12px", color: active ? "#fff6d6" : "#4a3825", backgroundColor: active ? "#6b804f" : "#cbb27e", padding: { x: 4, y: 8 }, align: "center", fixedWidth: tabWidth - 3 }).setScrollFactor(0).setDepth(143).setInteractive({ useHandCursor: true });
      tab.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.inventoryCategory = id; this.inventoryPage = 0; this.openInventoryPanel(); });
      this.inventoryUiObjects.push(tab);
    });
    const columns = this.scale.width < 520 ? 2 : 3; const cellWidth = (panelWidth - 48) / columns; const cellHeight = 86;
    if (items.length === 0) {
      this.inventoryUiObjects.push(this.add.text(this.scale.width / 2, top + 210, "この分類の品物はまだありません", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#68543b" }).setOrigin(0.5).setScrollFactor(0).setDepth(143));
    }
    items.forEach((item, index) => {
      const column = index % columns; const row = Math.floor(index / columns); const x = left + 24 + column * cellWidth; const y = top + 140 + row * cellHeight;
      const card = this.add.rectangle(x, y, cellWidth - 8, cellHeight - 8, 0xf1dfb3, 0.98).setOrigin(0).setStrokeStyle(2, 0x8d6a3f).setScrollFactor(0).setDepth(142);
      const frame = itemIconFrame(item.itemId);
      const icon = frame === undefined
        ? this.add.text(x + 33, y + 34, "◇", { fontSize: "26px", color: "#d8bd72" }).setOrigin(0.5)
        : this.add.image(x + 33, y + 34, ITEM_ICON_ATLAS.key, frame).setDisplaySize(58, 58).setOrigin(0.5);
      icon.setScrollFactor(0).setDepth(143);
      const name = this.add.text(x + 66, y + 17, LIFE_ITEM_LABELS[item.itemId] ?? item.itemId, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#3f3020", wordWrap: { width: cellWidth - 78 } }).setScrollFactor(0).setDepth(143);
      const quantity = this.add.text(x + cellWidth - 18, y + cellHeight - 18, `×${item.quantity}`, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "13px", color: "#fff0b1", backgroundColor: "#66462ddd", padding: { x: 5, y: 2 } }).setOrigin(1, 1).setScrollFactor(0).setDepth(144);
      this.inventoryUiObjects.push(card, icon, name, quantity);
    });
    if (pageCount > 1) {
      const nav = this.add.text(this.scale.width / 2, top + 414, `‹      ${this.inventoryPage + 1} / ${pageCount}      ›`, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff4cc", backgroundColor: "#6b4a2d", padding: { x: 20, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(144).setInteractive({ useHandCursor: true });
      nav.on("pointerdown", (_p: Phaser.Input.Pointer, localX: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.inventoryPage = localX < nav.width / 2 ? Math.max(0, this.inventoryPage - 1) : Math.min(pageCount - 1, this.inventoryPage + 1); this.openInventoryPanel(); });
      this.inventoryUiObjects.push(nav);
    }
  }
  private openJournalPanel() {
    const state = this.runtime.getState();
    const chapter = !this.runtime.chapterOne.isComplete ? 1 : !this.runtime.chapterTwo.isComplete ? 2 : 3;
    const progression = chapter === 1 ? this.runtime.chapterOne : chapter === 2 ? this.runtime.chapterTwo : this.runtime.chapterThree;
    const requests: LifeMenuOption[] = this.runtime.villagerRequests.activeRequests.map((request) => ({ id: request.id, label: request.title, enabled: false, detail: `${request.current}/${request.quantity} / 報酬 ${request.reward}文` }));
    const sideEventText = `${this.runtime.sideEvents.summary}\n${this.runtime.sideEvents.details}`;
    this.openLifePanel("依頼と物語", `${journalText(chapter, progression.objective, progression.storyBeat, this.runtime.villagerRequests.summary, state.quests.completedIds.length)}\n\n【次の操作】\n${actionGuidance(chapter, progression.step)}\n\n【サブイベント】\n${sideEventText}`, requests);
  }
  private openCookingPanel() {
    this.openLifePanel("なごみ亭・料理場", "楓「作りたい料理を選んでね。材料が足りない料理は、必要なものを確認できるよ。」", []);
    this.renderCookingRecipeGrid();
  }
  private renderCookingRecipeGrid() {
    this.cookingMenuObjects.forEach((object) => object.destroy());
    this.cookingMenuObjects = [];
    this.cookingResultOpen = false;
    const recipes = Object.entries(COOKING_RECIPES) as [CookingRecipeId, (typeof COOKING_RECIPES)[CookingRecipeId]][];
    const panelWidth = Math.min(430, this.scale.width - 24);
    const panelHeight = Math.min(500, this.scale.height - 70);
    const left = this.scale.width / 2 - panelWidth / 2;
    const top = Math.max(24, this.scale.height / 2 - panelHeight / 2);
    const columns = 2;
    const cellWidth = (panelWidth - 48) / columns;
    const cellHeight = Math.min(76, (panelHeight - 168) / 4);
    const availableCount = recipes.filter(([id]) => this.runtime.cooking.canCook(id)).length;
    const masteredCount = recipes.filter(([id]) => this.runtime.eventSystem.hasFlag(cookedRecipeFlag(id))).length;
    const bookLabel = this.add.text(left + 22, top + 100, "献立帳", {
      fontFamily: "'Yu Gothic', sans-serif", fontSize: "13px", fontStyle: "bold", color: "#fff4cf",
      backgroundColor: "#755033", padding: { x: 12, y: 5 },
    }).setScrollFactor(0).setDepth(143);
    const availability = this.add.text(left + panelWidth - 22, top + 103, `調理可 ${availableCount}/${recipes.length} / 習得 ${masteredCount}/${recipes.length}`, {
      fontFamily: "'Yu Gothic', sans-serif", fontSize: "11px", color: "#5a432c",
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(143);
    this.cookingMenuObjects.push(bookLabel, availability);
    recipes.forEach(([id, recipe], index) => {
      const canCook = this.runtime.cooking.canCook(id);
      const mastered = this.runtime.eventSystem.hasFlag(cookedRecipeFlag(id));
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = left + 22 + column * cellWidth;
      const y = top + 132 + row * cellHeight;
      const card = this.add.rectangle(x, y, cellWidth - 6, cellHeight - 6, canCook ? 0xf4e4b8 : 0xc5bda5, 0.99)
        .setOrigin(0).setStrokeStyle(canCook ? 3 : 2, canCook ? 0x846238 : 0x8e8777).setScrollFactor(0).setDepth(142)
        .setInteractive({ useHandCursor: true });
      const frame = itemIconFrame(recipe.resultItemId);
      const icon = frame === undefined
        ? this.add.text(x + 28, y + cellHeight / 2 - 3, "◇", { fontSize: "25px", color: canCook ? "#9b6a37" : "#777267" }).setOrigin(0.5)
        : this.add.image(x + 28, y + cellHeight / 2 - 3, ITEM_ICON_ATLAS.key, frame).setDisplaySize(46, 46).setOrigin(0.5);
      icon.setScrollFactor(0).setDepth(143).setAlpha(canCook ? 1 : 0.55);
      const missing = recipe.ingredients.filter((ingredient) => this.runtime.inventory.quantity(ingredient.itemId) < ingredient.quantity).length;
      const method = recipe.method === "rice" ? "混ぜる・盛付" : "切る・火加減";
      const label = this.add.text(x + 54, y + 7, `${recipe.name}\n${method}${mastered ? " ・ 習得済" : ""}`, {
        fontFamily: "'Yu Gothic', sans-serif", fontSize: panelWidth < 390 ? "10px" : "11px", color: canCook ? "#3c2d1d" : "#675f52",
        lineSpacing: 3, wordWrap: { width: cellWidth - 66 },
      }).setScrollFactor(0).setDepth(143);
      const stateBadge = this.add.text(x + cellWidth - 12, y + cellHeight - 13, canCook ? (mastered ? "おまかせ可" : "作れる") : `不足 ${missing}`, {
        fontFamily: "'Yu Gothic', sans-serif", fontSize: "10px", color: canCook ? "#fff8db" : "#fff4e2",
        backgroundColor: canCook ? "#60784f" : "#8b6755", padding: { x: 6, y: 3 },
      }).setOrigin(1, 1).setScrollFactor(0).setDepth(144);
      card.on("pointerover", () => card.setFillStyle(canCook ? 0xffefc5 : 0xd1c9b2, 1));
      card.on("pointerout", () => card.setFillStyle(canCook ? 0xf4e4b8 : 0xc5bda5, 0.99));
      card.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation(); this.cookingRecipeId = id; this.openCookingConfirmation();
      });
      this.cookingMenuObjects.push(card, icon, label, stateBadge);
    });
  }
  private openCookingConfirmation() {
      const recipe = COOKING_RECIPES[this.cookingRecipeId];
      const ingredients = recipe.ingredients.map((item) => `${LIFE_ITEM_LABELS[item.itemId] ?? item.itemId} ${this.runtime.inventory.quantity(item.itemId)}/${item.quantity}`).join("\n");
      const control = recipe.method === "rice" ? "左右スワイプで混ぜ、中央をタップして盛り付ける" : "切り目に沿って切り、上下スライドで火加減を整える";
      this.openLifePanel(`${recipe.name}・調理準備`, `【使う材料】\n${ingredients}\n\n【調理方法】\n${control}`, [
        { id: "start", label: "調理を始める", enabled: this.runtime.cooking.canCook(this.cookingRecipeId), detail: "材料を使ってミニゲームへ" },
        { id: "auto", label: "おまかせ調理", enabled: this.runtime.cooking.canCook(this.cookingRecipeId) && this.runtime.eventSystem.hasFlag(cookedRecipeFlag(this.cookingRecipeId)), detail: this.runtime.eventSystem.hasFlag(cookedRecipeFlag(this.cookingRecipeId)) ? "短時間で普通品質を1個作る" : "手作りで一度完成すると解放" },
        { id: "back", label: "レシピ選択へ戻る", enabled: true, detail: "別の料理を選ぶ" },
      ], (choice) => {
      if (choice === "back") { this.openCookingPanel(); return; }
      if (choice === "auto") {
        const cooked = this.runtime.cooking.cookAutomatically(this.cookingRecipeId);
        if (!cooked) { this.showLifeResult("材料が足りません。"); return; }
        this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: "success", channel: "asmr" } });
        this.showCookingResult(recipe.resultItemId, "普通", 1);
        return;
      }
      if (recipe.method === "rice") {
        this.startRiceCooking();
        return;
      }
      if (!this.runtime.eventSystem.hasFlag("tutorial:cooking_heat")) {
        this.openLifePanel("楓の料理教室", "楓「煮物や焼き物は火加減が大切よ。画面を上へ滑らせると強火、下へ滑らせると弱火になるの。\n\n色のついた適温範囲へ火力を合わせて。調理中も私が声をかけるから、慌てなくて大丈夫。」", [{ id: "start", label: `${recipe.name}を作る`, enabled: true, detail: "上下スライドで火加減を調整" }], () => {
          this.runtime.eventSystem.setFlag("tutorial:cooking_heat");
          this.startCookingPrep();
        });
      } else this.startCookingPrep();
      });
  }
  private startRiceCooking() {
    const recipe = COOKING_RECIPES[this.cookingRecipeId];
    if (!this.runtime.eventSystem.hasFlag("tutorial:cooking_rice")) this.runtime.eventSystem.setFlag("tutorial:cooking_rice");
    this.openLifePanel(recipe.name, "楓「まず左右交互に6回混ぜてね。混ざったら、お椀の中央を3回タップして盛り付けましょう。」", []);
    this.riceCooking = createRiceCooking(); this.riceInputReady = false;
    this.time.delayedCall(180, () => { if (this.riceCooking) this.riceInputReady = true; });
    const compact = this.scale.height < 620;
    const centerX = this.scale.width / 2 - (this.scale.width >= 760 ? 45 : 0);
    const bowlRadius = compact ? 66 : 78;
    const centerY = Math.min(this.scale.height - (compact ? 178 : 210), this.scale.height / 2 + (compact ? 36 : 54));
    const phaseY = centerY - bowlRadius - 58;
    const instructionY = centerY + bowlRadius + 34;
    const progressY = centerY + bowlRadius + 82;
    const shadow = this.add.ellipse(centerX, centerY + bowlRadius * 0.72, bowlRadius * 2.15, bowlRadius * 0.48, 0x24180f, 0.32).setScrollFactor(0).setDepth(142);
    const bowl = this.add.ellipse(centerX, centerY, bowlRadius * 2.2, bowlRadius * 1.72, 0x6b3824, 1).setStrokeStyle(5, 0xd3a263).setScrollFactor(0).setDepth(143);
    const bowlInner = this.add.ellipse(centerX, centerY - 3, bowlRadius * 1.82, bowlRadius * 1.34, 0x3b2119, 1).setStrokeStyle(3, 0x9b6742).setScrollFactor(0).setDepth(144);
    const rice = this.add.ellipse(centerX, centerY - 5, bowlRadius * 1.55, bowlRadius * 1.08, 0xf1e7c6, 1).setStrokeStyle(2, 0xd8c99d).setScrollFactor(0).setDepth(145);
    const garnish: Phaser.GameObjects.GameObject[] = [];
    for (let index = 0; index < 18; index += 1) {
      const angle = (index / 18) * Math.PI * 2;
      const radius = 12 + (index % 4) * 8;
      garnish.push(this.add.ellipse(centerX + Math.cos(angle) * radius, centerY - 5 + Math.sin(angle) * radius * 0.55, 10, 4, 0xfff7dc, 0.95).setRotation(angle).setScrollFactor(0).setDepth(146));
    }
    for (const [offsetX, offsetY] of [[-32, -12], [20, 8], [6, -25], [37, -17], [-12, 22]] as const) {
      garnish.push(this.add.ellipse(centerX + offsetX, centerY + offsetY, 12, 7, 0x6e8c45, 1).setRotation(offsetX / 40).setScrollFactor(0).setDepth(147));
    }
    this.ricePaddle = this.add.rectangle(centerX + bowlRadius * 0.58, centerY - bowlRadius * 0.56, 18, bowlRadius * 1.45, 0xd9b778, 1).setStrokeStyle(2, 0x805b35).setRotation(-0.58).setScrollFactor(0).setDepth(148);
    this.ricePhaseLabel = this.add.text(centerX, phaseY, "工程 1 / 2　混ぜる", { fontFamily: "'Yu Gothic', sans-serif", fontStyle: "bold", fontSize: "16px", color: "#fff2cc", backgroundColor: "#493526ee", padding: { x: 18, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(149);
    this.riceInstructionLabel = this.add.text(centerX, instructionY, "左右へ交互にスワイプ", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "15px", color: "#fff7dd", backgroundColor: "#684838ee", padding: { x: 16, y: 9 } }).setOrigin(0.5).setScrollFactor(0).setDepth(149);
    this.riceProgressDots = Array.from({ length: 6 }, (_, index) => this.add.circle(centerX - 50 + index * 20, progressY, 6, 0x463328, 1).setStrokeStyle(2, 0xd8bd81).setScrollFactor(0).setDepth(149));
    this.riceCookingObjects.push(shadow, bowl, bowlInner, rice, ...garnish, this.ricePaddle, this.ricePhaseLabel, this.riceInstructionLabel, ...this.riceProgressDots);
  }
  private handleRiceGesture(pointer: Phaser.Input.Pointer) {
    const state = this.riceCooking; const start = this.riceGestureStart; this.riceGestureStart = undefined; if (!state || !start) return;
    const compact = this.scale.height < 620;
    const centerX = this.scale.width / 2 - (this.scale.width >= 760 ? 45 : 0);
    const bowlRadius = compact ? 66 : 78;
    const centerY = Math.min(this.scale.height - (compact ? 178 : 210), this.scale.height / 2 + (compact ? 36 : 54));
    const next = state.phase === "mixing" ? applyRiceMix(state, pointer.x - start.x) : placeRicePortion(state, Phaser.Math.Distance.Between(pointer.x, pointer.y, centerX, centerY) / bowlRadius);
    this.riceCooking = next;
    if (next.strokes > state.strokes) {
      this.riceProgressDots[next.strokes - 1]?.setFillStyle(0xe2a94f, 1);
      this.tweens.add({ targets: this.ricePaddle, rotation: next.lastDirection > 0 ? 0.45 : -0.75, duration: 120, yoyo: true });
      this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: "success", channel: "asmr" } });
    }
    if (state.phase === "mixing" && next.phase === "plating") {
      this.ricePhaseLabel?.setText("工程 2 / 2　盛り付け");
      this.riceInstructionLabel?.setText("お椀の中央を3回タップ");
      this.ricePaddle?.setVisible(false);
      this.riceProgressDots.forEach((dot) => dot.setVisible(false));
    }
    if (next.portions > state.portions) {
      const offsets = [[0, -5], [-20, 10], [20, 10]] as const;
      const [offsetX, offsetY] = offsets[next.portions - 1] ?? offsets[0];
      const marker = this.add.circle(centerX + offsetX, centerY + offsetY, 12, 0xfff4d2, 0.82).setStrokeStyle(2, 0xd1b97c).setScrollFactor(0).setDepth(148);
      this.ricePortionMarkers.push(marker); this.riceCookingObjects.push(marker);
      this.tweens.add({ targets: marker, scale: { from: 1.5, to: 1 }, duration: 160 });
      this.riceInstructionLabel?.setText(next.phase === "complete" ? "盛り付け完成！" : `中央へ盛り付け ${next.portions}/3`);
      this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: "success", channel: "asmr" } });
    }
    if (next.phase !== "complete") return;
    const quality = riceCookingQuality(next); const quantity = quality === "great" ? 2 : 1; const recipe = COOKING_RECIPES[this.cookingRecipeId];
    this.time.delayedCall(350, () => {
      if (this.riceCooking !== next) return;
      const cooked = this.runtime.cooking.cook(this.cookingRecipeId, undefined, quantity);
      if (cooked) {
        this.runtime.eventSystem.setFlag(cookedRecipeFlag(this.cookingRecipeId));
        this.showCookingResult(recipe.resultItemId, quality === "great" ? "極上" : quality === "success" ? "良質" : "普通", quantity);
      }
      else this.showLifeResult("材料が足りません。");
    });
  }
  private startCookingPrep() {
    const recipe = COOKING_RECIPES[this.cookingRecipeId];
    this.openLifePanel(`${recipe.name}の下ごしらえ`, "包丁を上から下へ滑らせ、3本の切り目に沿って材料を切りましょう。", []);
    this.cookingPrep = createCookingPrep();
    this.cookingPrepInputReady = false;
    this.time.delayedCall(180, () => { if (this.cookingPrep) this.cookingPrepInputReady = true; });
    const centerX = this.scale.width / 2 - 45; const centerY = this.scale.height / 2 + 50; const width = Math.min(260, this.scale.width - 100);
    const board = this.add.rectangle(centerX, centerY, width + 44, 150, 0xa97c51, 1).setStrokeStyle(4, 0xe0bd82).setScrollFactor(0).setDepth(142);
    const daikon = this.add.rectangle(centerX, centerY, width, 72, 0xf1edce, 1).setStrokeStyle(3, 0x9eb77c).setScrollFactor(0).setDepth(143);
    this.cookingCutMarkers = [0.25, 0.5, 0.75].map((position) => this.add.rectangle(centerX - width / 2 + width * position, centerY, 5, 86, 0xd56c55, 0.9).setScrollFactor(0).setDepth(144));
    this.cookingPrepLabel = this.add.text(centerX, centerY + 104, "切り目に沿って縦にスワイプ  0/3", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff7dd", backgroundColor: "#76584bee", padding: { x: 14, y: 9 } }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    this.cookingPrepObjects.push(board, daikon, ...this.cookingCutMarkers, this.cookingPrepLabel);
  }
  private handleCookingCut(pointer: Phaser.Input.Pointer) {
    const state = this.cookingPrep; const start = this.cookingCutStart; this.cookingCutStart = undefined;
    if (!state || !start) return;
    const width = Math.min(260, this.scale.width - 100); const left = this.scale.width / 2 - 45 - width / 2;
    const next = applyCookingCut(state, (start.x - left) / width, pointer.y - start.y); this.cookingPrep = next;
    next.cuts.forEach((index) => this.cookingCutMarkers[index]?.setFillStyle(0x73a966, 0.95));
    this.cookingPrepLabel?.setText(`切り目に沿って縦にスワイプ  ${next.cuts.length}/3`);
    if (!next.complete) return;
    const quality = prepQuality(next); const initialQuality = quality === "great" ? 0.58 : quality === "success" ? 0.49 : 0.36;
    this.time.delayedCall(350, () => { if (this.cookingPrep === next) this.startCookingMiniGame(initialQuality); });
  }
  private startCookingMiniGame(initialQuality = 0.42) {
    this.openLifePanel(COOKING_RECIPES[this.cookingRecipeId].name, "火加減を色の帯に合わせ、焦がさず仕上げましょう。", []);
    this.cookingMiniGame = createCookingMiniGame(initialQuality);
    this.cookingLastPointerY = undefined;
    const layout = cookingGameLayout(this.scale.width, this.scale.height);
    const adviceBack = this.add.rectangle(layout.adviceX, layout.adviceY, layout.adviceWidth, 62, 0x76584b, 0.98).setStrokeStyle(2, 0xd6b978).setScrollFactor(0).setDepth(142);
    this.cookingAdviceLabel = this.add.text(layout.adviceX, layout.adviceY, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: this.scale.width < 430 ? "12px" : "14px", color: "#fff7dd", align: "center", wordWrap: { width: layout.adviceWidth - 28 } }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    this.cookingTimerLabel = this.add.text(layout.panelLeft + layout.panelWidth - 16, layout.panelTop + 22, "残り 12秒", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#6a4b2f" }).setOrigin(1, 0).setScrollFactor(0).setDepth(145);
    const stove = this.add.rectangle(layout.potX, layout.centerY + 38, 116, 78, 0x493b32, 1).setStrokeStyle(4, 0x866440).setScrollFactor(0).setDepth(142);
    this.cookingFlame = this.add.triangle(layout.potX, layout.centerY + 58, 0, 30, 18, 0, 36, 30, 0xe96d38, 0.95).setScrollFactor(0).setDepth(143);
    const pot = this.add.ellipse(layout.potX, layout.centerY, 118, 68, 0x3d4542, 1).setStrokeStyle(5, 0xc5ad7c).setScrollFactor(0).setDepth(144);
    const broth = this.add.ellipse(layout.potX, layout.centerY - 3, 94, 48, 0xb47746, 0.98).setStrokeStyle(2, 0xe5b779).setScrollFactor(0).setDepth(145);
    this.cookingBroth = broth;
    const potRim = this.add.ellipse(layout.potX, layout.centerY - 3, 108, 60, 0x000000, 0).setStrokeStyle(5, 0x6c726c).setScrollFactor(0).setDepth(146);
    const track = this.add.rectangle(layout.gaugeX, layout.centerY, 38, layout.trackHeight, 0x29342e, 1).setStrokeStyle(4, 0x9a7548).setScrollFactor(0).setDepth(143);
    this.cookingTargetZone = this.add.rectangle(layout.gaugeX, layout.centerY, 32, layout.trackHeight * 0.26, 0xe4bd61, 0.62).setScrollFactor(0).setDepth(144);
    this.cookingHeatMarker = this.add.rectangle(layout.gaugeX, layout.centerY, 54, 10, 0xf36f50, 1).setStrokeStyle(2, 0xffd19b).setScrollFactor(0).setDepth(145);
    const heatLabels = this.add.text(layout.gaugeX + 34, layout.centerY, "強火 ▲\n\n適温\n\n弱火 ▼", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "11px", color: "#59412c", align: "left" }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(145);
    const qualityLabel = this.add.text(layout.panelLeft + 16, layout.footerY, "仕上がり", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "11px", color: "#5b432e" }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(145);
    const qualityX = layout.panelLeft + 82;
    const qualityWidth = layout.panelWidth - 100;
    const qualityBack = this.add.rectangle(qualityX, layout.footerY, qualityWidth, 16, 0x29342e, 1).setOrigin(0, 0.5).setStrokeStyle(2, 0x8a6b43).setScrollFactor(0).setDepth(143);
    this.cookingQualityBar = this.add.rectangle(qualityX + 2, layout.footerY, 1, 12, 0x88b96f, 1).setOrigin(0, 0.5).setScrollFactor(0).setDepth(144);
    const guide = this.add.text(layout.potX, layout.footerY - 24, "画面を上下へスライド", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "11px", color: "#6b4b31", align: "center" }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    this.cookingMiniObjects.push(adviceBack, this.cookingAdviceLabel, this.cookingTimerLabel, stove, this.cookingFlame, pot, broth, potRim, track, this.cookingTargetZone, this.cookingHeatMarker, heatLabels, qualityLabel, qualityBack, this.cookingQualityBar, guide);
  }
  private updateCookingMiniGameDisplay(delta: number) {
    const state = this.cookingMiniGame;
    if (!state || !this.cookingHeatMarker || !this.cookingTargetZone || !this.cookingQualityBar || !this.cookingAdviceLabel) return;
    const next = advanceCookingMiniGame(state, delta);
    this.cookingMiniGame = next;
    const layout = cookingGameLayout(this.scale.width, this.scale.height);
    const yFor = (value: number) => layout.centerY + layout.trackHeight / 2 - value * layout.trackHeight;
    this.cookingHeatMarker.setY(yFor(next.heat));
    this.cookingTargetZone.setY(yFor(next.targetHeat));
    this.cookingQualityBar.setSize(Math.max(1, (layout.panelWidth - 104) * next.qualityScore), 12);
    this.cookingAdviceLabel.setText(`楓「${cookingAdvice(next)}」`);
    this.cookingTimerLabel?.setText(`残り ${Math.max(0, Math.ceil((12_000 - next.elapsedMs) / 1000))}秒`);
    this.cookingFlame?.setScale(0.7 + next.heat * 0.65, 0.7 + next.heat * 0.65).setAlpha(0.65 + next.heat * 0.35);
    this.cookingBroth?.setFillStyle(next.burn > 0.45 ? 0x70402f : 0xb47746, 0.98);
    if (!next.result) return;
    const result = next.result; const recipe = COOKING_RECIPES[this.cookingRecipeId];
    const cooked = result === "failed"
      ? this.runtime.cooking.cook(this.cookingRecipeId, "food_failed_dish")
      : this.runtime.cooking.cook(this.cookingRecipeId, undefined, result === "great" ? 2 : 1);
    if (!cooked) { this.showLifeResult("材料が足りません。"); return; }
    const quality = result === "great" ? "極上" : result === "success" ? "良質" : result === "incomplete" ? "普通" : "失敗";
    if (result !== "failed") this.runtime.eventSystem.setFlag(cookedRecipeFlag(this.cookingRecipeId));
    this.showCookingResult(result === "failed" ? "food_failed_dish" : recipe.resultItemId, quality, result === "great" ? 2 : 1);
  }
  private showCookingResult(itemId: string, quality: "普通" | "良質" | "極上" | "失敗", quantity: number) {
    const recipe = COOKING_RECIPES[this.cookingRecipeId];
    const effect = quality === "失敗" ? "食事効果なし" : recipe.effect;
    this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: quality === "失敗" ? "failure" : "success", channel: "asmr" } });
    this.openLifePanel("料理完成", "\n\n\n\n\n\n\n\n\n", [
      { id: "recipes", label: "続けて料理する", enabled: true, detail: "献立帳へ戻る" },
      { id: "close", label: "料理を終える", enabled: true, detail: "持ち物へ追加済み" },
    ], (choice) => { if (choice === "recipes") this.openCookingPanel(); else this.closeLifePanel(); });
    this.cookingResultOpen = true;
    const panelWidth = Math.min(430, this.scale.width - 24);
    const panelHeight = Math.min(520, Math.max(330, this.scale.height - 48));
    const top = Math.max(24, this.scale.height / 2 - panelHeight / 2);
    const centerX = this.scale.width / 2;
    const halo = this.add.circle(centerX, top + 142, 60, quality === "失敗" ? 0x948b78 : 0xe7c76b, 0.3)
      .setStrokeStyle(3, quality === "失敗" ? 0x766d60 : 0xa97735).setScrollFactor(0).setDepth(142);
    const frame = itemIconFrame(itemId);
    const icon = frame === undefined
      ? this.add.text(centerX, top + 142, "◇", { fontSize: "52px", color: "#8a6038" }).setOrigin(0.5)
      : this.add.image(centerX, top + 142, ITEM_ICON_ATLAS.key, frame).setDisplaySize(104, 104).setOrigin(0.5);
    icon.setScrollFactor(0).setDepth(143);
    const ribbon = this.add.text(centerX, top + 196, quality, {
      fontFamily: "'Yu Gothic', sans-serif", fontSize: "13px", fontStyle: "bold", color: "#fff5ce",
      backgroundColor: quality === "失敗" ? "#75695a" : quality === "極上" ? "#9a6a2f" : "#60784f", padding: { x: 15, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(144);
    const details = this.add.text(centerX, top + 224, `${recipe.name}  ×${quantity}\n効果: ${effect}`, {
      fontFamily: "'Yu Gothic', sans-serif", fontSize: panelWidth < 390 ? "12px" : "14px", color: "#4a3521",
      align: "center", lineSpacing: 7, wordWrap: { width: panelWidth - 64 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(143);
    this.cookingMenuObjects.push(halo, icon, ribbon, details);
    this.layoutLifePanel(this.scale);
    this.refreshLifeDisplay();
  }
  private openStationPanel(station: "fishing" | "alchemy") {
    if (station === "alchemy") { this.openAlchemyPanel(); return; }
    const copy = stationDescription(station);
    const fish = FISH_DEFINITIONS[this.runtime.fishing.nextCatch];
    this.openLifePanel("川辺・釣り準備", `${copy.description}\n\n魚影: ${fish.name}\n操作: 魚影へスワイプして投げ、アタリでタップ`, [{ id: station, label: copy.action, enabled: true, detail: "竿を構えて釣りを始める" }], () => this.beginFishingApproach());
  }
  private openAlchemyPanel() {
    const difficultyLabel = { normal: "通常", hard: "上級", expert: "熟練" } as const;
    const options = (Object.keys(ALCHEMY_RECIPES) as AlchemyRecipeId[]).map((id) => ({ id, label: ALCHEMY_RECIPES[id].name, enabled: true, detail: `${difficultyLabel[ALCHEMY_RECIPES[id].difficulty]}${this.runtime.alchemy.canCraft(id) ? "" : "・材料不足"} / ${ALCHEMY_RECIPES[id].ingredients.map((item) => `${LIFE_ITEM_LABELS[item.itemId] ?? item.itemId} ${this.runtime.inventory.quantity(item.itemId)}/${item.quantity}`).join("  ")}` }));
    this.openLifePanel("宗玄の調合台", "調合する薬を選んでください。\n選択後に材料、難度、操作を確認できます。", options, (id) => {
      if (!(id in ALCHEMY_RECIPES)) return;
      this.alchemyRecipeId = id as AlchemyRecipeId;
      this.openAlchemyConfirmation();
    });
  }
  private openAlchemyConfirmation() {
      const recipe = ALCHEMY_RECIPES[this.alchemyRecipeId];
      const difficultyLabel = { normal: "通常", hard: "上級", expert: "熟練" } as const;
      const ingredients = recipe.ingredients.map((item) => `${LIFE_ITEM_LABELS[item.itemId] ?? item.itemId} ${this.runtime.inventory.quantity(item.itemId)}/${item.quantity}`).join("\n");
      this.openLifePanel(`${recipe.name}・調合準備`, `【使う材料】\n${ingredients}\n\n難度: ${difficultyLabel[recipe.difficulty]}\n色の指示に合わせて、すり鉢を回します。`, [
        { id: "start", label: "調合を始める", enabled: this.runtime.alchemy.canCraft(this.alchemyRecipeId), detail: "材料を使ってミニゲームへ" },
        { id: "back", label: "薬の選択へ戻る", enabled: true, detail: "別の薬を選ぶ" },
      ], (choice) => {
      if (choice === "back") { this.openAlchemyPanel(); return; }
      if (!this.runtime.eventSystem.hasFlag("tutorial:alchemy_rotation")) {
        this.openLifePanel("宗玄の調合指南", "宗玄「薬の色を見ながら、すり鉢を回してください。青はゆっくり、赤は速く、黄は同じ速さ、紫は逆回転です。失敗しても粗悪品として残ります。」", [{ id: "start", label: "調合を始める", enabled: true, detail: ALCHEMY_RECIPES[this.alchemyRecipeId].name }], () => { this.runtime.eventSystem.setFlag("tutorial:alchemy_rotation"); this.startAlchemyMiniGame(); });
      } else this.startAlchemyMiniGame();
      });
  }
  private startAlchemyMiniGame() {
    this.openLifePanel("調合", "表示される指示に合わせ、画面上で円を描いてください。", []);
    this.alchemyMiniGame = createAlchemyMiniGame(ALCHEMY_RECIPES[this.alchemyRecipeId].difficulty);
    const layout = alchemyLayout(this.scale.width, this.scale.height);
    this.alchemyCenter = { x: layout.bowlX, y: layout.bowlY };
    this.alchemyLastSampleMs = this.game.loop.time;
    const bowl = this.add.circle(this.alchemyCenter.x, this.alchemyCenter.y, 74, 0x72644d, 1).setStrokeStyle(6, 0xd5c28e).setScrollFactor(0).setDepth(143);
    const mixture = this.add.circle(this.alchemyCenter.x, this.alchemyCenter.y, 56, 0x73956a, 0.9).setScrollFactor(0).setDepth(144);
    this.alchemyPestle = this.add.rectangle(this.alchemyCenter.x + 48, this.alchemyCenter.y, 72, 13, 0xd8c39a, 1).setOrigin(0.15, 0.5).setScrollFactor(0).setDepth(145);
    this.alchemyInstructionLabel = this.add.text(layout.instructionX, layout.instructionY, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "18px", color: "#fff7dd", backgroundColor: "#49617bee", padding: { x: 12, y: 10 }, wordWrap: { width: layout.textWidth - 24 }, align: "center" }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    const scoreBack = this.add.rectangle(layout.scoreX, layout.scoreY, 110, 14, 0x29342e, 1).setStrokeStyle(2, 0xd5c28e).setScrollFactor(0).setDepth(143);
    this.alchemyScoreBar = this.add.rectangle(layout.scoreX - 55, layout.scoreY, 1, 10, 0xe2c75c, 1).setOrigin(0, 0.5).setScrollFactor(0).setDepth(144);
    const guide = this.add.text(layout.scoreX, layout.guideY, "指で円を描く", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "13px", color: "#403622" }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    this.alchemyMiniObjects.push(bowl, mixture, this.alchemyPestle, this.alchemyInstructionLabel, scoreBack, this.alchemyScoreBar, guide);
  }
  private sampleAlchemyPointer(pointer: Phaser.Input.Pointer, initialize: boolean) {
    if (!this.alchemyMiniGame) return;
    const angle = Math.atan2(pointer.y - this.alchemyCenter.y, pointer.x - this.alchemyCenter.x);
    const now = this.game.loop.time;
    const delta = initialize ? 16 : now - this.alchemyLastSampleMs;
    if (delta <= 0) return;
    this.alchemyLastSampleMs = now;
    this.alchemyMiniGame = applyAlchemyRotation(this.alchemyMiniGame, angle, delta);
    this.alchemyPestle?.setRotation(angle);
  }
  private updateAlchemyMiniGameDisplay(delta: number) {
    const state = this.alchemyMiniGame;
    if (!state || !this.alchemyInstructionLabel || !this.alchemyScoreBar) return;
    const next = advanceAlchemyMiniGame(state, delta);
    this.alchemyMiniGame = next;
    const presentation = ({ slow: ["青・遅", "ゆっくり回す", "#4f7899"], fast: ["赤・速", "素早く回す", "#a9534d"], steady: ["黄・維持", "速さを保つ", "#9b823d"], reverse: ["紫・逆", "反対へ回す", "#735b91"] } as const)[next.instruction];
    this.alchemyInstructionLabel.setText(`${presentation[0]}\n${presentation[1]}`).setBackgroundColor(`${presentation[2]}ee`);
    this.alchemyScoreBar.setSize(Math.max(1, 110 * next.score), 10);
    if (!next.quality) return;
    const quality = next.quality;
    const recipe = ALCHEMY_RECIPES[this.alchemyRecipeId];
    const crafted = quality === "failed"
      ? this.runtime.alchemy.craft(1, "item_crude_product", this.alchemyRecipeId)
      : this.runtime.alchemy.craft(quality === "great" ? 2 : 1, undefined, this.alchemyRecipeId);
    if (!crafted) { this.showLifeResult("材料が足りません。"); return; }
    const quantity = quality === "great" ? 2 : 1;
    const itemId = quality === "failed" ? "item_crude_product" : recipe.resultItemId;
    const name = quality === "failed" ? "粗悪品" : recipe.name;
    const label = { great: "大成功", success: "成功", incomplete: "普通", failed: "粗悪品" }[quality];
    this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: quality === "failed" ? "failure" : "success", channel: "asmr" } });
    this.openLifePanel("調合結果", `\n\n\n\n\n${name} ×${quantity}\n仕上がり：${label}\n持ち物に追加しました。`, [
      { id: "retry", label: "同じ薬を調合", enabled: this.runtime.alchemy.canCraft(this.alchemyRecipeId), detail: this.runtime.alchemy.canCraft(this.alchemyRecipeId) ? "材料を確認して作る" : "材料が足りません" },
      { id: "recipes", label: "薬の一覧へ", enabled: true, detail: "別の薬を選ぶ" },
      { id: "close", label: "調合を終える", enabled: true, detail: "診療所へ戻る" },
    ], (choice) => {
      if (choice === "retry") this.openAlchemyConfirmation();
      else if (choice === "recipes") this.openAlchemyPanel();
      else this.closeLifePanel();
    });
    const frame = itemIconFrame(itemId);
    if (frame !== undefined) {
      const icon = this.add.image(this.scale.width / 2, this.lifePanelTitle.y + 108, ITEM_ICON_ATLAS.key, frame).setDisplaySize(88, 88).setScrollFactor(0).setDepth(143);
      this.cookingMenuObjects.push(icon);
    }
    this.refreshLifeDisplay();
  }
  private beginTimedLifeAction(kind: "cooking" | "alchemy", delay: number, complete: () => void) {
    const copy = lifeActionText(kind);
    this.openLifePanel(copy.title, copy.body, []);
    this.lifeActionTimer = this.time.delayedCall(delay, () => { this.lifeActionTimer = undefined; complete(); });
  }
  private beginFishingApproach() {
    if (!this.runtime.eventSystem.hasFlag("tutorial:fishing_cast")) {
      this.openLifePanel("源三の釣り指南", "源三「魚影の少し前へ浮きを落とせ。魚が何度かつついても慌てるな。本当に食いつけば浮きが深く沈む。その瞬間だけ画面を叩くんだ。」", [{ id: "start", label: "釣りを始める", enabled: true, detail: "魚影へスワイプして投げる" }], () => { this.runtime.eventSystem.setFlag("tutorial:fishing_cast"); this.startFishingApproach(); });
    } else this.startFishingApproach();
  }
  private startFishingApproach() {
    this.openLifePanel("川釣り", "魚影の少し前へ向けて、右上方向にスワイプして浮きを投げましょう。", []);
    this.fishingApproach = createFishingApproach(this.runtime.fishing.nextCatch); this.fishingCastStart = undefined;
    this.fishingApproachInputReady = false;
    this.time.delayedCall(180, () => { if (this.fishingApproach) this.fishingApproachInputReady = true; });
    const centerX = this.scale.width / 2; const centerY = this.scale.height / 2 + 55;
    const water = this.add.rectangle(centerX, centerY, Math.min(360, this.scale.width - 50), Math.min(250, this.scale.height - 280), 0x4d8591, 0.86).setStrokeStyle(3, 0xb9d9d4).setScrollFactor(0).setDepth(142);
    this.fishingShadow = this.add.ellipse(centerX + 90, centerY - 62, 54, 20, 0x1d4652, 0.75).setScrollFactor(0).setDepth(143);
    this.fishingBobber = this.add.circle(centerX - 80, centerY + 75, 8, 0xf2e5c0, 1).setStrokeStyle(4, 0xd15f55).setScrollFactor(0).setDepth(144);
    this.fishingApproachLabel = this.add.text(centerX, centerY + 118, "↗ 魚影へ向けてスワイプ", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "16px", color: "#fff7dd", backgroundColor: "#315b64dd", padding: { x: 16, y: 9 } }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    this.fishingApproachObjects.push(water, this.fishingShadow, this.fishingBobber, this.fishingApproachLabel);
  }
  private handleFishingApproachRelease(pointer: Phaser.Input.Pointer) {
    const state = this.fishingApproach; if (!state) return;
    if (state.phase === "casting") {
      const start = this.fishingCastStart; this.fishingCastStart = undefined; if (!start) return;
      this.fishingApproach = castTowardFish(state, pointer.x - start.x, pointer.y - start.y);
      return;
    }
    if (state.phase === "approaching" || state.phase === "nibbling" || state.phase === "bite") this.fishingApproach = hookFishingApproach(state);
  }
  private updateFishingApproachDisplay(delta: number) {
    const state = this.fishingApproach; if (!state || !this.fishingApproachLabel || !this.fishingBobber || !this.fishingShadow) return;
    const next = advanceFishingApproach(state, delta); this.fishingApproach = next;
    if (next.phase === "approaching") { this.fishingApproachLabel.setText("魚が浮きへ近づいている…"); this.fishingBobber.setPosition(this.scale.width / 2 + 72, this.scale.height / 2 - 2); }
    if (next.phase === "nibbling") { this.fishingApproachLabel.setText(`コツ… ${next.nibbleCount + 1}回目\nまだ待つ`); this.fishingShadow.x += (this.fishingBobber.x - this.fishingShadow.x) * 0.04; }
    if (next.phase === "bite") { this.fishingApproachLabel.setText("アタリ！ 今すぐ画面をタップ！").setBackgroundColor("#a54d45ee"); this.fishingBobber.setScale(1, 0.4); }
    if (next.phase === "hooked") { this.fishingApproach = undefined; this.startFishingMiniGame(); return; }
    if (next.phase === "escaped") { this.showLifeResult(next.landingAccuracy > 0 ? "魚影から外れました。投げる方向を合わせましょう。" : "魚に逃げられました。浮きが深く沈むまで待ちましょう。"); }
  }
  private startFishingMiniGame() {
    const hook = lifeActionText("fishing_hook");
    this.openLifePanel(hook.title, "魚を緑の範囲に入れ続けましょう。\n長押しで上昇、指を離すと下降します。", []);
    const fishId = this.runtime.fishing.nextCatch;
    this.fishingMiniGame = createFishingMiniGame(fishId);
    this.fishingHeld = false;
    const centerX = this.scale.width / 2 - 42;
    const centerY = this.scale.height / 2 + 50;
    const trackHeight = Math.min(280, this.scale.height - 250);
    this.fishingTrack = this.add.rectangle(centerX, centerY, 54, trackHeight, 0x24362f, 1).setStrokeStyle(3, 0xd8c990).setScrollFactor(0).setDepth(143);
    this.fishingCatcher = this.add.rectangle(centerX, centerY, 48, trackHeight * 0.29, 0x79ad6b, 0.55).setStrokeStyle(2, 0xbfe19e).setScrollFactor(0).setDepth(144);
    this.fishingFish = this.add.text(centerX, centerY, FISH_DEFINITIONS[fishId].name, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff8d6", backgroundColor: "#477c91", padding: { x: 7, y: 5 } }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    const progressBack = this.add.rectangle(centerX + 48, centerY, 12, trackHeight, 0x26302c, 1).setStrokeStyle(2, 0xc9b97e).setScrollFactor(0).setDepth(143);
    this.fishingProgress = this.add.rectangle(centerX + 48, centerY + trackHeight / 2, 8, 1, 0xe2c75c, 1).setOrigin(0.5, 1).setScrollFactor(0).setDepth(144);
    const controlGuide = this.add.text(centerX + 125, centerY, "画面を長押し\n▲ 上昇\n\n指を離す\n▼ 下降", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "16px", color: "#fff7dd", backgroundColor: "#405647cc", padding: { x: 18, y: 20 }, align: "center", lineSpacing: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    this.fishingMiniObjects.push(this.fishingTrack, this.fishingCatcher, this.fishingFish, progressBack, this.fishingProgress, controlGuide);
  }
  private updateFishingMiniGameDisplay(delta: number) {
    const current = this.fishingMiniGame;
    if (!current || !this.fishingTrack || !this.fishingCatcher || !this.fishingFish || !this.fishingProgress) return;
    const next = updateFishingMiniGame(current, this.fishingHeld, delta);
    this.fishingMiniGame = next;
    const height = this.fishingTrack.height;
    const top = this.fishingTrack.y - height / 2;
    const positionY = (position: number) => top + (1 - position) * height;
    this.fishingCatcher.setY(positionY(next.catcherPosition));
    this.fishingFish.setY(positionY(next.fishPosition));
    this.fishingProgress.setSize(8, Math.max(1, height * next.catchProgress));
    if (next.status === "caught") {
      const fish = this.runtime.fishing.cast();
      this.showLifeResult(`${LIFE_ITEM_LABELS[fish] ?? fish}を釣り上げました！`);
    } else if (next.status === "escaped") this.showLifeResult("魚に逃げられてしまいました。もう一度挑戦しましょう。");
  }
  private openSmithingPanel() {
    const equippedId = this.runtime.staffStones.equippedId;
    const options: LifeMenuOption[] = (Object.keys(STAFF_STONES) as StaffStoneId[]).map((id) => {
      const stone = STAFF_STONES[id]; const owned = this.runtime.staffStones.owns(id); const equipped = equippedId === id;
      return { id, label: equipped ? `${stone.name}（装着中）` : owned ? `${stone.name}を装着` : `${stone.name}を制作`, enabled: !equipped && (owned || this.runtime.staffStones.canCraft(id)), detail: owned ? stone.description : `石材 ×2 / ${stone.description}` };
    });
    const tutorial = this.runtime.eventSystem.hasFlag("tutorial:staff_stone")
      ? `現在の装着: ${equippedId ? STAFF_STONES[equippedId].name : "なし"}\n結師の杖へ装着できる結晶石は1個だけです。制作済みの石は失わず交換できます。`
      : "鉄斎「石材を結晶石へ鍛え直し、結師の杖へはめ込む。石は一つしか付けられん。色も射程も攻撃の形も変わる。戦へ出る前に選べ。」";
    this.runtime.eventSystem.setFlag("tutorial:staff_stone");
    this.openLifePanel("鉄火堂・結晶石鍛冶", tutorial, options, (selected) => {
      const id = selected as StaffStoneId;
      if (!this.runtime.staffStones.owns(id)) {
        if (!this.runtime.staffStones.canCraft(id)) { this.showLifeResult("石材が足りません。石材が2個必要です。"); return; }
        const stone = STAFF_STONES[id];
        this.openLifePanel(`${stone.name}・鍛造準備`, `【必要素材】\n石材 ${this.runtime.inventory.quantity("item_stone")}/2\n\n【攻撃変化】\n${stone.description}\n\n光る位置を狙って叩き、熱が冷める前に仕上げます。`, [
          { id: "start", label: "鍛造を始める", enabled: true, detail: "石材は成功時に消費" },
          { id: "back", label: "結晶石一覧へ戻る", enabled: true, detail: "別の石を選ぶ" },
        ], (choice) => { if (choice === "back") this.openSmithingPanel(); else this.startForgeMiniGame(id); });
        return;
      }
      const canChange = this.runtime.combat.state.status !== "battle" && this.runtime.bakegaeru.status !== "battle" && this.runtime.yodomiTree.status !== "battle";
      this.showLifeResult(this.runtime.staffStones.equip(id, canChange) ? `${STAFF_STONES[id].name}を結師の杖へ装着しました。` : "戦闘中は結晶石を交換できません。");
    });
  }
  private startForgeMiniGame(id: StaffStoneId) {
    this.openLifePanel("鉄斎の鍛冶指南", `鉄斎「赤熱した石が光る場所を狙って叩け。熱すぎても冷めすぎてもいかん。光が移ったら、次の場所へすぐ打ち込め。」\n\n制作: ${STAFF_STONES[id].name}`, []);
    const hard = ["stone_homing", "stone_spread", "stone_piercing", "stone_rapid"].includes(id);
    this.forgeMiniGame = createForgeMiniGame(hard ? "hard" : "normal"); this.forgingStoneId = id;
    const centerX = this.scale.width / 2; const centerY = this.scale.height / 2 + 70;
    this.forgeAnvil = this.add.rectangle(centerX, centerY, Math.min(310, this.scale.width - 80), 70, 0x54575a, 1).setStrokeStyle(5, 0xc8b58a).setScrollFactor(0).setDepth(143);
    this.forgeTarget = this.add.circle(centerX, centerY, 18, 0xffd464, 0.9).setStrokeStyle(4, 0xfff0a8).setScrollFactor(0).setDepth(145);
    const heatBack = this.add.rectangle(centerX, centerY + 67, Math.min(300, this.scale.width - 90), 14, 0x2d302f, 1).setStrokeStyle(2, 0xc8b58a).setScrollFactor(0).setDepth(143);
    this.forgeHeatBar = this.add.rectangle(heatBack.x - heatBack.width / 2, heatBack.y, heatBack.width, 10, 0xe45e42, 1).setOrigin(0, 0.5).setScrollFactor(0).setDepth(144);
    this.forgeStatusLabel = this.add.text(centerX, centerY - 72, "光る場所をタップ", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "17px", color: "#fff4d3", backgroundColor: "#704538ee", padding: { x: 16, y: 10 }, align: "center" }).setOrigin(0.5).setScrollFactor(0).setDepth(145);
    this.forgeMiniObjects.push(this.forgeAnvil, this.forgeTarget, heatBack, this.forgeHeatBar, this.forgeStatusLabel);
    this.updateForgeTargetPosition();
  }
  private strikeForgeAt(pointerX: number, pointerY: number) {
    const state = this.forgeMiniGame; const anvil = this.forgeAnvil; if (!state || !anvil) return;
    if (Math.abs(pointerY - anvil.y) > anvil.height / 2 + 12 || Math.abs(pointerX - anvil.x) > anvil.width / 2) return;
    const position = (pointerX - (anvil.x - anvil.width / 2)) / anvil.width;
    this.forgeMiniGame = strikeForge(state, position);
    if (this.screenShakeEnabled) this.cameras.main.shake(60, 0.004);
    this.updateForgeTargetPosition();
  }
  private updateForgeTargetPosition() {
    const state = this.forgeMiniGame; const anvil = this.forgeAnvil; const target = this.forgeTarget; if (!state || !anvil || !target) return;
    const position = state.targets[state.targetIndex];
    target.setVisible(position !== undefined);
    if (position !== undefined) target.setX(anvil.x - anvil.width / 2 + anvil.width * position);
  }
  private updateForgeMiniGameDisplay(delta: number) {
    const state = this.forgeMiniGame; if (!state || !this.forgeHeatBar || !this.forgeStatusLabel || !this.forgeAnvil) return;
    const next = advanceForgeMiniGame(state, delta); this.forgeMiniGame = next;
    this.forgeHeatBar.setSize(Math.max(1, this.forgeAnvil.width * next.heat), 10);
    const heatText = next.heat > 0.82 ? "鉄斎「まだ熱すぎる。光をよく見ろ」" : next.heat < 0.28 ? "鉄斎「冷めてきた。急げ」" : "鉄斎「今が打ち頃だ」";
    this.forgeStatusLabel.setText(`${heatText}\n命中 ${next.hits}/${next.targets.length}`);
    if (!next.result) return;
    const id = this.forgingStoneId; if (!id) return;
    if (next.result === "failed") { this.showLifeResult("鍛造に失敗しました。石材は失われていません。"); return; }
    const crafted = this.runtime.staffStones.craft(id);
    if (crafted && next.result === "great") this.runtime.inventory.add("item_stone", 1);
    const prefix = next.result === "great" ? "大成功！" : "鍛造成功！";
    this.showLifeResult(crafted ? `${prefix} ${STAFF_STONES[id].name}が完成しました。${next.result === "great" ? " 石材を1個節約できました。" : ""}` : "石材が足りません。");
  }
  private showStaffAttackEffect() {
    const enemy = this.combatEnemyVisual; if (!enemy) return;
    const stone = this.runtime.staffStones.equipped;
    const color = stone?.color ?? 0xe8dfbd;
    const graphics = this.add.graphics().setDepth(18);
    graphics.lineStyle(stone?.projectile === "large" ? 9 : 4, color, 0.95);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    const drawRay = (offset: number) => graphics.lineBetween(this.player.x, this.player.y, enemy.x + Math.cos(angle + Math.PI / 2) * offset, enemy.y + Math.sin(angle + Math.PI / 2) * offset);
    if (stone?.projectile === "spread") { drawRay(-28); drawRay(0); drawRay(28); }
    else if (stone?.projectile === "rapid") { drawRay(-8); drawRay(0); drawRay(8); }
    else drawRay(0);
    if (enemy instanceof Phaser.GameObjects.Arc) enemy.setFillStyle(color, 1);
    else enemy.setTint(color);
    this.tweens.add({ targets: graphics, alpha: 0, duration: stone?.projectile === "homing" ? 360 : 180, onComplete: () => graphics.destroy() });
    this.time.delayedCall(180, () => {
      if (enemy instanceof Phaser.GameObjects.Arc) enemy.setFillStyle(0x704955, 0.95);
      else enemy.clearTint();
    });
  }
  private openShopPanel() {
    const money = this.runtime.getState().player.money;
    this.openLifePanel("万屋", `所持金: ${money}文\n購入する数を選んでください。`, shopMenu(money), (id) => {
      const [itemId, quantityText] = id.split(":"); const quantity = Number(quantityText ?? 0);
      if (itemId) this.openShopConfirmation(itemId, quantity);
    });
  }
  private openShopConfirmation(itemId: string, quantity: number) {
    const crop = Object.values(CROP_DEFINITIONS).find((entry) => entry.seedId === itemId);
    if (!crop || !Number.isSafeInteger(quantity) || quantity < 1) return;
    const money = this.runtime.getState().player.money;
    const total = crop.seedPrice * quantity;
    let purchased = false;
    this.openLifePanel(`${crop.name}の種・購入確認`, `単価: ${crop.seedPrice}文\n個数: ${quantity}個\n合計: ${total}文\n所持金: ${money}文\n${money >= total ? `購入後: ${money - total}文` : `不足: ${total - money}文`}\n所持数: ${this.runtime.inventory.quantity(itemId)}個`, [
      { id: "buy", label: `${quantity}個を購入する`, enabled: money >= total, detail: `合計 ${total}文` },
      { id: "less", label: "1個減らす", enabled: quantity > 1, detail: "購入数を調整" },
      { id: "more", label: "1個増やす", enabled: money >= crop.seedPrice * (quantity + 1), detail: "購入数を調整" },
      { id: "back", label: "商品一覧へ戻る", enabled: true, detail: "購入せずに戻る" },
    ], (choice) => {
      if (purchased) return;
      if (choice === "back") { this.openShopPanel(); return; }
      if (choice === "less") { this.openShopConfirmation(itemId, quantity - 1); return; }
      if (choice === "more") { this.openShopConfirmation(itemId, quantity + 1); return; }
      if (choice !== "buy") return;
      purchased = true;
      this.showLifeResult(this.runtime.shop.buy(itemId, crop.seedPrice, quantity) ? `${crop.name}の種を${quantity}個買いました。` : "所持金を確認してください。購入は行われませんでした。");
    });
  }
  private openSeedSelectionPanel(plotId: string) {
    const options: LifeMenuOption[] = this.runtime.farming.availableSeeds().map(([, crop]) => ({
      id: crop.seedId, label: `${crop.name}の種を植える`, enabled: true, detail: `所持 ×${this.runtime.inventory.quantity(crop.seedId)} / 収穫まで水やり${crop.matureStage - 1}日`,
    }));
    this.openLifePanel("植える種を選ぶ", "作物ごとに育つまでの日数が異なります。", options, (selected) => {
      const crop = Object.values(CROP_DEFINITIONS).find((entry) => entry.seedId === selected);
      const planted = this.runtime.farming.act(plotId, selected as SeedId) === "plant";
      this.showLifeResult(planted && crop ? `${crop.name}の種を植えました。毎日水をあげましょう。` : "その種は植えられませんでした。");
      this.refreshLifeDisplay();
    });
  }
  private openOfferingPanel() {
    if (this.runtime.chapterThree.step === "fulfill_offering") {
      const progress = this.runtime.offering.chapterThreeProgress;
      const options = chapterThreeOfferingMenu(this.runtime.getState().inventory.items);
      this.openLifePanel("第3章 生活の奉納", `合計 ${progress.total}/10 / 種類 ${progress.varieties}/4\n魚料理 ${progress.fish}/1 / 採取素材料理 ${progress.gathered}/2`, options, (id) => {
        if (!this.runtime.offering.offerChapterThree(id)) { this.showLifeResult("その料理は奉納できません。"); return; }
        if (this.runtime.offering.isChapterThreeComplete) this.showLifeResult(`${LIFE_ITEM_LABELS[id] ?? id}を奉納しました。\n第3章の奉納条件を達成しました。`);
        else this.openOfferingPanel();
      });
      return;
    }
    const options = offeringMenu((id) => this.runtime.inventory.quantity(id), (id) => this.runtime.offering.progress(id) > 0);
    this.openLifePanel("神社へ奉納", `奉納済み: ${this.runtime.offering.completedCount}/3\n納める品を選んでください。`, options, (id) => {
      this.showLifeResult(this.runtime.offering.offer(id) ? `${LIFE_ITEM_LABELS[id] ?? id}を奉納しました。` : "その品は奉納できません。");
    });
  }
  private openStoragePanel() {
    const inventory = this.runtime.getState().inventory;
    const options: LifeMenuOption[] = [
      { id: "deposit", label: "預ける", enabled: inventory.items.some((item) => item.quantity > 0), detail: `かばん：${inventory.items.length}種類` },
      { id: "withdraw", label: "取り出す", enabled: inventory.storage.some((item) => item.quantity > 0), detail: `倉庫：${inventory.storage.length}種類` },
    ];
    this.openLifePanel("倉庫", "品物と数量を選んで移動できます。", options, (id) => {
      if (id === "deposit" || id === "withdraw") this.openStorageItems(id);
    });
  }
  private openStorageItems(operation: "deposit" | "withdraw", notice = "品物を選んでください。") {
    const inventory = this.runtime.getState().inventory;
    const items = operation === "deposit" ? inventory.items : inventory.storage;
    const options: LifeMenuOption[] = items.filter((item) => item.quantity > 0).map((item) => ({ id: item.itemId, label: LIFE_ITEM_LABELS[item.itemId] ?? item.itemId, detail: `所持数 ${item.quantity}個`, enabled: true }));
    options.push({ id: "back", label: "倉庫メニューへ", detail: "預ける・取り出すを切り替える", enabled: true });
    this.openLifePanel(operation === "deposit" ? "倉庫へ預ける" : "倉庫から取り出す", notice, options, (id) => {
      if (id === "back") this.openStoragePanel();
      else this.openStorageQuantity(operation, id);
    });
  }
  private openStorageQuantity(operation: "deposit" | "withdraw", itemId: string, requested = 1) {
    const available = operation === "deposit" ? this.runtime.inventory.quantity(itemId) : this.runtime.inventory.storageQuantity(itemId);
    if (available <= 0) { this.openStorageItems(operation, "その品物は移動済みです。"); return; }
    const quantity = Math.max(1, Math.min(available, requested));
    const label = LIFE_ITEM_LABELS[itemId] ?? itemId;
    let submitted = false;
    this.openLifePanel(label, `移動する数量：${quantity}個 / ${available}個\n${operation === "deposit" ? "かばん → 倉庫" : "倉庫 → かばん"}`, [
      { id: "confirm", label: `${quantity}個${operation === "deposit" ? "預ける" : "取り出す"}`, detail: "この数量で移動", enabled: true },
      { id: "less", label: "− 1個", detail: "数量を減らす", enabled: quantity > 1 },
      { id: "more", label: "＋ 1個", detail: "数量を増やす", enabled: quantity < available },
      { id: "all", label: "すべて選ぶ", detail: `${available}個`, enabled: quantity < available },
      { id: "back", label: "品物一覧へ戻る", detail: "移動せずに戻る", enabled: true },
    ], (id) => {
      if (id === "back") { this.openStorageItems(operation); return; }
      if (id !== "confirm") { this.openStorageQuantity(operation, itemId, id === "all" ? available : quantity + (id === "less" ? -1 : 1)); return; }
      if (submitted) return;
      submitted = true;
      const moved = operation === "deposit" ? this.runtime.inventory.deposit(itemId, quantity) : this.runtime.inventory.withdraw(itemId, quantity);
      this.openStorageItems(operation, moved ? `${label}を${quantity}個移動しました。` : "所持数が変わったため移動できませんでした。");
      this.refreshLifeDisplay();
    });
  }
  private openWorkbenchPanel() {
    const recipes = this.runtime.workbench.list({ ...(this.workbenchCategory ? { category: this.workbenchCategory } : {}), query: this.workbenchQuery, craftableOnly: this.workbenchCraftableOnly });
    const options: LifeMenuOption[] = recipes.map(([id, recipe]) => ({
      id,
      label: `${recipe.name}${this.runtime.workbench.canCraft(id) ? "" : "（素材不足）"}`,
      enabled: this.runtime.workbench.canCraft(id),
      detail: `${recipe.ingredients.map((item) => `${LIFE_ITEM_LABELS[item.itemId] ?? item.itemId} ${this.runtime.inventory.quantity(item.itemId)}/${item.quantity}`).join("  ")}  ${recipe.placement === "indoor" ? "屋内" : recipe.placement === "outdoor" ? "屋外" : "屋内・屋外"}`,
    }));
    const filterText = `${this.workbenchCategory ? ({ furniture: "家具", fence: "柵・扉", livestock: "家畜", decor: "装飾" } as const)[this.workbenchCategory] : "すべて"}${this.workbenchCraftableOnly ? "・制作可能のみ" : ""}${this.workbenchQuery ? `・検索「${this.workbenchQuery}」` : ""}`;
    this.openLifePanel("作業台", `${filterText}\nレシピ ${recipes.length}件`, options, (selected) => {
      if (!(selected in WORKBENCH_RECIPES)) return;
      const id = selected as WorkbenchRecipeId; const recipe = WORKBENCH_RECIPES[id];
      this.showLifeResult(this.runtime.workbench.craft(id) ? `${recipe.name}を制作しました。持ち物から配置できます。` : "素材が足りません。");
    });
    const categories: Array<{ id: WorkbenchCategory | undefined; label: string }> = [
      { id: undefined, label: "すべて" }, { id: "furniture", label: "家具" }, { id: "fence", label: "柵" }, { id: "livestock", label: "家畜" }, { id: "decor", label: "装飾" },
    ];
    const spacing = Math.min(70, (this.scale.width - 50) / categories.length);
    categories.forEach((category, index) => {
      const active = this.workbenchCategory === category.id;
      const tab = this.add.text(this.scale.width / 2 + (index - 2) * spacing, this.lifePanelTitle.y + 103, category.label, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#fff7dd", backgroundColor: active ? "#8b7048ee" : "#405047ee", padding: { x: 8, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(142).setInteractive({ useHandCursor: true });
      tab.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.workbenchCategory = category.id; this.openWorkbenchPanel(); });
      this.workbenchUiObjects.push(tab);
    });
    const craftable = this.add.text(this.scale.width / 2 - 78, this.lifePanelTitle.y + 66, this.workbenchCraftableOnly ? "✓ 作れるもの" : "□ 作れるもの", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#fff7dd", backgroundColor: "#52634dee", padding: { x: 9, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(142).setInteractive({ useHandCursor: true });
    craftable.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.workbenchCraftableOnly = !this.workbenchCraftableOnly; this.openWorkbenchPanel(); });
    const search = this.add.text(this.scale.width / 2 + 92, this.lifePanelTitle.y + 66, this.workbenchQuery ? `検索: ${this.workbenchQuery}` : "検索 🔍", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#fff7dd", backgroundColor: "#52634dee", padding: { x: 9, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(142).setInteractive({ useHandCursor: true });
    search.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.requestTextEntry("制作物名・素材名で検索", this.workbenchQuery, 60, (value) => {
        if (value !== null) { this.workbenchQuery = value.trim(); this.openWorkbenchPanel(); }
      });
    });
    this.workbenchUiObjects.push(craftable, search);
  }
  private requestTextEntry(title: string, value: string, maxLength: number, onClose: (value: string | null) => void) {
    const keyboard = this.input.keyboard;
    const keyboardEnabled = keyboard?.enabled ?? false;
    if (keyboard) keyboard.enabled = false;
    this.player.setVelocity(0, 0);
    this.scene.pause();
    let shuttingDown = false;
    const cancel = openTextEntryDialog(title, value, maxLength, (result) => {
      this.events.off("shutdown", shutdown);
      if (shuttingDown) return;
      if (keyboard) keyboard.enabled = keyboardEnabled;
      this.scene.resume();
      onClose(result);
    });
    const shutdown = () => { shuttingDown = true; cancel(); };
    this.events.once("shutdown", shutdown);
  }
  private openConstructionPanel() {
    const home = homeUpgradeProfile(this.runtime.getState().events.flags);
    const reasonLabel = { ordered: "依頼済み", prerequisite: "前段階の増築が必要", money: "所持金不足", materials: "材料不足" } as const;
    const options: LifeMenuOption[] = (Object.entries(CONSTRUCTION_PROJECTS) as [ConstructionId, typeof CONSTRUCTION_PROJECTS[ConstructionId]][]).map(([id, project]) => {
      const availability = this.runtime.construction.availability(id);
      return {
        id,
        label: `${project.name}${availability.canOrder ? "" : `（${reasonLabel[availability.reason]}）`}`,
        enabled: availability.canOrder,
        detail: `${project.money}文  ${project.ingredients.map((item) => `${LIFE_ITEM_LABELS[item.itemId] ?? item.itemId} ${this.runtime.inventory.quantity(item.itemId)}/${item.quantity}`).join("  ")}`,
      };
    });
    const recipeReasonLabel = { unlocked: "購入済み", prerequisite: "家畜小屋が必要", money: "所持金不足" } as const;
    for (const [id, offer] of Object.entries(WORKBENCH_RECIPE_SHOP) as [PurchasableWorkbenchRecipeId, typeof WORKBENCH_RECIPE_SHOP[PurchasableWorkbenchRecipeId]][]) {
      const availability = this.runtime.workbench.recipePurchaseAvailability(id);
      const recipe = WORKBENCH_RECIPES[id];
      options.push({ id: `recipe:${id}`, label: `${recipe.name}のレシピ${availability.canPurchase ? "" : `（${recipeReasonLabel[availability.reason]}）`}`, enabled: availability.canPurchase, detail: `${offer.price}文 / 購入後は自宅の作業台で制作` });
    }
    this.openLifePanel("樹工務店", `所持金: ${this.runtime.getState().player.money}文\n現在: ${home.name}（段階 ${home.stage + 1}/3）\n${home.features.join("・")}\n樹「家は段階的に直す。小屋や温室の場所は敷地で決めてくれ」`, options, (selected) => {
      if (selected.startsWith("recipe:")) {
        const id = selected.slice(7) as PurchasableWorkbenchRecipeId;
        const recipe = WORKBENCH_RECIPES[id];
        this.showLifeResult(this.runtime.workbench.purchaseRecipe(id) ? `${recipe.name}のレシピを購入しました。自宅の作業台で制作できます。` : "購入条件または所持金を確認してください。");
        return;
      }
      if (!(selected in CONSTRUCTION_PROJECTS)) return;
      const id = selected as ConstructionId; const project = CONSTRUCTION_PROJECTS[id];
      const success = this.runtime.construction.order(id);
      if (success && project.kind === "home_upgrade") this.refreshMapPresentation();
      this.showLifeResult(success ? project.kind === "home_upgrade" ? `${project.name}が完了しました。主人公宅の外観と住空間が広がりました。` : `${project.name}を依頼しました。主人公宅の敷地で建築場所を選べます。` : "お金、材料、または前段階の増築が不足しています。");
    });
  }
  private openLivestockPanel() {
    const animals = this.runtime.livestock.animals;
    const ready = animals.filter((animal) => animal.productReady).length;
    const fed = animals.filter((animal) => animal.fedToday).length;
    const summary = animals.length === 0 ? "まだ家畜はいません。先に小屋を配置してください。" : animals.map((animal) => `${animal.name} ${animal.ageDays}日目 / なかよし${animal.friendship} / ${animal.fedToday ? "餌済" : "空腹"}${animal.productReady ? " / 収穫あり" : ""}`).join("\n");
    const options: LifeMenuOption[] = [
      { id: "buy_feed", label: "家畜の餌 ×5", enabled: this.runtime.getState().player.money >= 75, detail: `75文 / 所持 ×${this.runtime.inventory.quantity("item_animal_feed")}` },
      { id: "buy_chicken", label: "鶏を迎える", enabled: this.runtime.livestock.canBuy("chicken"), detail: "100文 / 鶏小屋1棟につき4羽まで" },
      { id: "buy_cow", label: "牛を迎える", enabled: this.runtime.livestock.canBuy("cow"), detail: "500文 / 家畜小屋1棟につき3頭まで" },
      { id: "feed_all", label: "餌をまとめて与える", enabled: animals.length > fed && this.runtime.inventory.quantity("item_animal_feed") > 0, detail: `未給餌 ${animals.length - fed}匹` },
      { id: "collect_all", label: "生産物を回収", enabled: ready > 0, detail: `回収可能 ${ready}個` },
    ];
    this.openLifePanel("家畜の世話", `${summary}\n\n所持金 ${this.runtime.getState().player.money}文`, options, (selected) => {
      if (selected === "buy_feed") this.showLifeResult(this.runtime.livestock.buyFeed() ? "家畜の餌を5個買いました。" : "お金が足りません。");
      if (selected === "buy_chicken") this.showLifeResult(this.runtime.livestock.buy("chicken") ? "鶏を迎えました。毎日餌をあげましょう。" : "鶏小屋・空き・お金を確認してください。");
      if (selected === "buy_cow") this.showLifeResult(this.runtime.livestock.buy("cow") ? "牛を迎えました。毎日餌をあげましょう。" : "家畜小屋・空き・お金を確認してください。");
      if (selected === "feed_all") { const count = this.runtime.livestock.feedAll(); this.showLifeResult(count > 0 ? `${count}匹へ餌を与えました。` : "餌を与えられる家畜がいません。"); }
      if (selected === "collect_all") { const count = this.runtime.livestock.collectAll(); this.showLifeResult(count > 0 ? `${count}個の生産物を回収しました。` : "回収できる生産物がありません。"); }
    });
  }
  private openPlacementPanel() {
    if (this.map?.id !== "map_home" && this.map?.id !== "map_homestead") { this.showLifeResult("家具や設備は自宅または主人公宅の敷地で配置できます。"); return; }
    const compatible = PLACEABLE_DEFINITIONS.filter((recipe, index, all) => all.findIndex((value) => value.resultItemId === recipe.resultItemId) === index)
      .filter((recipe) => this.runtime.inventory.quantity(recipe.resultItemId) > 0)
      .filter((recipe) => recipe.placement === "both" || (recipe.placement === "indoor" ? this.map?.id === "map_home" : this.map?.id === "map_homestead"));
    const nearby = this.runtime.placement.list(this.map.id).map((placed) => ({ placed, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, placed.x, placed.y) })).sort((a, b) => a.distance - b.distance)[0];
    const options: LifeMenuOption[] = compatible.map((recipe) => ({ id: `place:${recipe.resultItemId}`, label: `${recipe.name}を配置`, enabled: true, detail: `所持 ×${this.runtime.inventory.quantity(recipe.resultItemId)} / ${recipe.placement === "indoor" ? "屋内" : recipe.placement === "outdoor" ? "屋外" : "屋内・屋外"}` }));
    if (nearby && nearby.distance <= 64) {
      options.push({ id: `move:${nearby.placed.id}`, label: "近くの配置物を移動", enabled: true, detail: LIFE_ITEM_LABELS[nearby.placed.itemId] ?? nearby.placed.itemId });
      options.push({ id: `recover:${nearby.placed.id}`, label: "近くの配置物を持ち物へ戻す", enabled: true, detail: LIFE_ITEM_LABELS[nearby.placed.itemId] ?? nearby.placed.itemId });
    }
    const indoorLimit = this.map.id === "map_home" ? this.runtime.placement.placementLimit("map_home") : undefined;
    const placementStatus = indoorLimit === undefined ? "" : `\n家具配置 ${this.runtime.placement.list("map_home").length}/${indoorLimit}（増築で上限解放）`;
    this.openLifePanel("配置・模様替え", `配置する品を選び、マップ上の場所をタップしてください。回転してから決定できます。${placementStatus}`, options, (selected) => {
      if (selected.startsWith("recover:")) { const id = selected.slice(8); this.showLifeResult(this.runtime.placement.recover(this.map?.id ?? "", id) ? "配置物を持ち物へ戻しました。" : "回収できませんでした。"); this.recreatePlacedObjectVisuals(); return; }
      if (selected.startsWith("move:")) { this.startRelocation(selected.slice(5)); return; }
      if (selected.startsWith("place:")) this.startPlacement(selected.slice(6));
    });
  }
  private startPlacement(itemId: string) {
    this.closeLifePanel(); this.movingPlacedObjectId = undefined; this.placementItemId = itemId; this.placementRotation = 0;
    const offset = this.runtime.getState().player.direction === "left" ? [-42, 0] : this.runtime.getState().player.direction === "right" ? [42, 0] : this.runtime.getState().player.direction === "up" ? [0, -42] : [0, 42];
    this.placementTarget = this.runtime.placement.snapPosition(this.player.x + (offset[0] ?? 0), this.player.y + (offset[1] ?? 0));
    this.placementButton.setText("配置を中止").setVisible(true); this.toolButton.setText("回転").setVisible(true); this.createPlacementPreview(); this.refreshPlacementPreview();
  }
  private startRelocation(id: string) {
    const placed = this.map ? this.runtime.placement.list(this.map.id).find((item) => item.id === id) : undefined; if (!placed) return;
    this.closeLifePanel(); this.movingPlacedObjectId = id; this.placementItemId = placed.itemId; this.placementRotation = placed.rotation; this.placementTarget = { x: placed.x, y: placed.y };
    this.placedObjectVisuals.get(id)?.setVisible(false);
    this.placementButton.setText("移動を中止").setVisible(true); this.toolButton.setText("回転").setVisible(true); this.createPlacementPreview(); this.refreshPlacementPreview();
  }
  private createPlacementPreview() {
    this.placementPreview?.destroy(); const recipe = placeableDefinition(this.placementItemId ?? ""); if (!recipe) return;
    const footprint = this.add.rectangle(0, 0, recipe.size[0] * 38, recipe.size[1] * 38, 0x77c879, 0.28).setStrokeStyle(3, 0xeaf5ce, 0.95);
    const sprite = placedObjectSprite(this.placementItemId ?? "");
    const image = sprite && this.textures.exists(sprite.textureKey) ? this.add.image(0, 0, sprite.textureKey, sprite.frame).setAlpha(0.68).setOrigin(0.5, 0.72) : undefined;
    this.placementPreviewFootprint = footprint; this.placementPreviewSprite = image;
    this.placementPreview = this.add.container(this.placementTarget.x, this.placementTarget.y, image ? [footprint, image] : [footprint]).setDepth(30);
  }
  private refreshPlacementPreview() {
    const preview = this.placementPreview; const itemId = this.placementItemId; const mapId = this.map?.id; if (!preview || !itemId || !mapId) return;
    const recipe = placeableDefinition(itemId); if (!recipe) return;
    const rotated = this.placementRotation === 90 || this.placementRotation === 270;
    const width = (rotated ? recipe.size[1] : recipe.size[0]) * 38; const height = (rotated ? recipe.size[0] : recipe.size[1]) * 38;
    preview.setPosition(this.placementTarget.x, this.placementTarget.y);
    this.placementPreviewFootprint?.setSize(width, height).setDisplaySize(width, height);
    const display = placedObjectDisplaySize(itemId, width, height);
    this.placementPreviewSprite?.setDisplaySize(display.width, display.height).setAngle(this.placementRotation);
    const valid = this.runtime.placement.canPlace(mapId, itemId, this.placementTarget.x, this.placementTarget.y, this.placementRotation, this.placementBlockedAreas(), this.movingPlacedObjectId);
    this.placementPreviewFootprint?.setFillStyle(valid ? 0x77c879 : 0xc95f54, 0.3).setStrokeStyle(3, valid ? 0xeaf5ce : 0xffc5b8, 0.95);
    this.placementPreviewSprite?.setTint(valid ? 0xffffff : 0xff857c).setAlpha(valid ? 0.7 : 0.52);
    this.actionButton.setText(valid ? "ここに配置" : "配置できません").setVisible(true);
  }
  private rotatePlacement() { if (!this.placementItemId) return; this.placementRotation = this.runtime.placement.rotate(this.placementRotation); this.refreshPlacementPreview(); }
  private confirmPlacement() {
    const itemId = this.placementItemId; const mapId = this.map?.id; if (!itemId || !mapId) return;
    const placed = this.movingPlacedObjectId
      ? this.runtime.placement.move(mapId, this.movingPlacedObjectId, this.placementTarget.x, this.placementTarget.y, this.placementRotation, this.placementBlockedAreas())
      : this.runtime.placement.place(mapId, itemId, this.placementTarget.x, this.placementTarget.y, this.placementRotation, this.placementBlockedAreas());
    if (!placed) { this.dialogueLabel.setText("その場所には配置できません。").setVisible(true); this.time.delayedCall(1500, () => this.dialogueLabel.setVisible(false)); return; }
    this.recreatePlacedObjectVisuals();
    if (!this.movingPlacedObjectId && itemId === "placeable_livestock_fence" && this.runtime.inventory.quantity(itemId) > 0) {
      const horizontal = this.placementRotation === 0 || this.placementRotation === 180; this.placementTarget = { x: placed.x + (horizontal ? 42 : 0), y: placed.y + (horizontal ? 0 : 42) }; this.refreshPlacementPreview(); return;
    }
    this.cancelPlacement();
  }
  private cancelPlacement() { if (this.movingPlacedObjectId) this.placedObjectVisuals.get(this.movingPlacedObjectId)?.setVisible(true); this.movingPlacedObjectId = undefined; this.placementItemId = undefined; this.placementPreview?.destroy(); this.placementPreview = undefined; this.placementPreviewFootprint = undefined; this.placementPreviewSprite = undefined; this.placementButton.setText("配置"); this.refreshLifeDisplay(); this.refreshOverlayVisibility(); }
  private placementBlockedAreas(): BlockedArea[] {
    const blocked: BlockedArea[] = [{ x: this.player.x - 16, y: this.player.y - 22, width: 32, height: 44 }];
    if (this.map?.id === "map_homestead") {
      this.farmPlotsForMap("map_homestead").forEach((plot) => { if (this.runtime.farming.getPlot(plot.id)) blocked.push({ x: plot.x - 18, y: plot.y - 18, width: 36, height: 36 }); });
      this.gatheringNodesForMap("map_homestead").forEach((node) => { const gone = node.requiredTool === "tool_axe" || node.requiredTool === "tool_pickaxe" ? this.runtime.gathering.isDestroyed("map_homestead", node.id) : this.runtime.gathering.isCollected("map_homestead", node.id); if (!gone) blocked.push({ x: node.x - 16, y: node.y - 16, width: 32, height: 32 }); });
    }
    return blocked;
  }
  private recreatePlacedObjectVisuals() {
    for (const collider of this.placedObjectColliders) collider.destroy();
    this.placedObjectColliders = [];
    for (const obstacle of this.placedObjectObstacles.values()) { obstacle.destroy(); const index = this.worldObjects.indexOf(obstacle); if (index >= 0) this.worldObjects.splice(index, 1); }
    this.placedObjectObstacles.clear();
    this.placedObjectObstacleGroup?.destroy();
    this.placedObjectObstacleGroup = undefined;
    for (const visual of this.placedObjectVisuals.values()) { visual.destroy(); const index = this.worldObjects.indexOf(visual); if (index >= 0) this.worldObjects.splice(index, 1); }
    for (const visual of this.livestockVisuals.values()) { visual.destroy(); const index = this.worldObjects.indexOf(visual); if (index >= 0) this.worldObjects.splice(index, 1); }
    this.placedObjectVisuals.clear();
    this.livestockVisuals.clear();
    if (!this.map) return;
    const obstacleGroup = this.physics.add.staticGroup();
    this.placedObjectObstacleGroup = obstacleGroup;
    for (const placed of this.runtime.placement.list(this.map.id)) {
      const recipe = placeableDefinition(placed.itemId); if (!recipe) continue;
      const rotated = placed.rotation === 90 || placed.rotation === 270; const width = (rotated ? recipe.size[1] : recipe.size[0]) * 38; const height = (rotated ? recipe.size[0] : recipe.size[1]) * 38;
      const sprite = placedObjectSprite(placed.itemId);
      const display = placedObjectDisplaySize(placed.itemId, width, height);
      const color = recipe.category === "building" ? 0x8b6040 : recipe.category === "furniture" ? 0x9a7048 : recipe.category === "fence" ? 0x76583d : recipe.category === "livestock" ? 0x77835c : 0xb08a56;
      const shape = sprite && this.textures.exists(sprite.textureKey)
        ? this.add.image(0, 0, sprite.textureKey, sprite.frame).setDisplaySize(display.width, display.height).setOrigin(0.5, 0.72)
        : this.add.rectangle(0, 0, width, height, color, 0.95).setStrokeStyle(3, 0xe8d7ad);
      shape.setAngle(placed.rotation);
      const marker = placed.itemId === "placeable_fence_gate" ? (placed.active ? "開" : "閉") : (placed.label?.slice(0, 1) || recipe.name.slice(0, 1));
      const showMarker = !sprite || placed.itemId === "placeable_fence_gate" || Boolean(placed.label);
      const label = this.add.text(0, -height * 0.5, marker, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "11px", color: "#fff7dd", backgroundColor: "#18251dcc", padding: { x: 3, y: 2 } }).setOrigin(0.5).setVisible(showMarker);
      const container = this.add.container(placed.x, placed.y, [shape, label]).setDepth(1);
      this.placedObjectVisuals.set(placed.id, container); this.worldObjects.push(container);
      if (placedObjectBlocksMovement(placed.itemId, placed.active)) {
        const obstacle = this.add.rectangle(placed.x, placed.y, Math.max(24, width - 8), Math.max(20, height - 8), 0x000000, 0);
        this.physics.add.existing(obstacle, true); obstacleGroup.add(obstacle);
        this.placedObjectObstacles.set(placed.id, obstacle); this.worldObjects.push(obstacle);
      }
    }
    if (obstacleGroup.getLength() > 0) this.placedObjectColliders.push(this.physics.add.collider(this.player, obstacleGroup));
    if (this.map.id === "map_homestead") this.createLivestockVisuals();
  }
  private createLivestockVisuals() {
    const positions = { chicken: 0, cow: 0 };
    for (const animal of this.runtime.livestock.animals) {
      const building = this.runtime.placement.list("map_homestead").find((placed) => placed.itemId === livestockBuildingId(animal.species));
      if (!building) continue;
      const index = positions[animal.species]++;
      const x = building.x + (index % 2 === 0 ? -28 : 28);
      const y = building.y + 62 + Math.floor(index / 2) * 34;
      const size = animal.species === "cow" ? 62 : 46;
      const image = this.add.image(0, 0, LIVESTOCK_SPRITE_SHEET.key, livestockSpriteFrame(animal)).setDisplaySize(size, size).setOrigin(0.5, 0.82);
      const status = animal.productReady ? "!" : animal.fedToday ? "♥" : "";
      const label = this.add.text(size * 0.34, -size * 0.42, status, { fontFamily: "sans-serif", fontSize: "13px", color: animal.productReady ? "#ffe071" : "#ff9dac", backgroundColor: "#17231dcc", padding: { x: 3, y: 1 } }).setOrigin(0.5).setVisible(Boolean(status));
      const container = this.add.container(x, y, [image, label]).setDepth(3);
      if (!this.reducedEffects) this.tweens.add({ targets: image, y: -2, yoyo: true, repeat: -1, duration: 900 + index * 90, ease: "Sine.InOut" });
      this.livestockVisuals.set(animal.id, container); this.worldObjects.push(container);
    }
  }
  private openLifePanel(title: string, body: string, options: LifeMenuOption[], onSelect?: (id: string) => void, onClose?: () => void) {
    if (this.mapOpen) this.toggleMapPanel();
    this.closeLifePanel(false);
    this.lifePanelOpen = true;
    this.player.setVelocity(0, 0);
    this.lifePanel.setVisible(true);
    this.lifePanelTitle.setText(title).setVisible(true);
    this.lifePanelBody.setText(body).setVisible(true);
    this.lifePanelOptions = options; this.lifePanelOnSelect = onSelect; this.lifePanelOnClose = onClose; this.lifePanelPage = 0;
    this.renderLifePanelButtons();
    this.layoutLifePanel(this.scale);
    this.refreshOverlayVisibility();
  }
  private openNpcDialogue(npcId: NpcId, name: string, body: string, options: LifeMenuOption[], onSelect?: (id: string) => void) {
    this.openLifePanel(name, body, options, onSelect);
    const portrait = npcPortrait(npcId);
    if (portrait && this.textures.exists(portrait.key)) {
      this.npcDialoguePortrait = this.add.image(0, 0, portrait.key).setScrollFactor(0).setDepth(142);
      this.lifePanel.setFillStyle(0xead8aa, 0.995).setStrokeStyle(7, 0x4f321f, 1);
      this.layoutLifePanel(this.scale);
    }
  }
  private openStoryDialogue(lines: readonly StoryDialogueLine[], onComplete?: () => void, index = 0) {
    const line = lines[index];
    if (!line) { this.closeLifePanel(); onComplete?.(); this.refreshLifeDisplay(); return; }
    const final = index === lines.length - 1;
    this.openLifePanel(line.speaker, line.text, [{ id: "next", label: final ? "進む" : "次へ", detail: `${index + 1}/${lines.length}`, enabled: true }], () => {
      if (final) { this.closeLifePanel(); onComplete?.(); this.refreshLifeDisplay(); }
      else this.openStoryDialogue(lines, onComplete, index + 1);
    });
    this.storyDialogueOpen = true;
    this.layoutLifePanel(this.scale);
  }
  private openDangerEntryConfirmation(targetMap: MapId, targetSpawn: string, confirmation: { title: string; message: string }) {
    if (this.lifePanelOpen || this.transitionLocked) return;
    this.transitionLocked = true;
    const returnToSafety = () => {
      this.player.setPosition(this.lastSafePlayerPosition.x, this.lastSafePlayerPosition.y).setVelocity(0, 0);
      this.transitionLocked = false;
      if (this.map) this.runtime.updatePlayer(this.map.id, this.player.x, this.player.y);
    };
    this.openLifePanel(confirmation.title, confirmation.message, [
      { id: "proceed", label: "進む", detail: "ボスエリアへ入る", enabled: true },
      { id: "return", label: "戻る", detail: "準備してから戻る", enabled: true },
    ], (id) => {
      if (id === "proceed") { this.closeLifePanel(false); this.transitionLocked = false; this.changeMap(targetMap, targetSpawn, undefined, true); }
      else this.closeLifePanel();
    }, returnToSafety);
  }
  private renderLifePanelButtons() {
    this.lifePanelButtons.forEach((button) => button.destroy()); this.lifePanelButtons = [];
    const layout = lifePanelLayout(this.scale.height); const page = pageItems(this.lifePanelOptions, this.lifePanelPage, layout.pageSize); this.lifePanelPage = page.page;
    page.items.forEach((option) => {
      const width = Math.min(350, this.scale.width - 70);
      const button = this.add.text(this.scale.width / 2, 0, `${option.enabled ? "◆" : "◇"}  ${option.label}\n     ${option.detail}                                      ›`, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: option.enabled ? "#fff7dd" : "#776c59", backgroundColor: option.enabled ? "#61774ff2" : "#b8a57ddd", padding: { x: 14, y: 7 }, align: "left", fixedWidth: width, fixedHeight: 52 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(141);
      if (option.enabled) button.setInteractive({ useHandCursor: true }).on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => { event.stopPropagation(); this.lifePanelOnSelect?.(option.id); });
      this.lifePanelButtons.push(button);
    });
    if (page.pageCount > 1) {
      const navigation = this.add.text(this.scale.width / 2, 0, `${page.page > 0 ? "‹ 前へ" : "      "}   ${page.page + 1}/${page.pageCount}   ${page.page + 1 < page.pageCount ? "次へ ›" : "      "}`, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "13px", color: "#fff7dd", backgroundColor: "#6b4a2dee", padding: { x: 14, y: 9 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(141).setInteractive({ useHandCursor: true });
      navigation.on("pointerdown", (_p: Phaser.Input.Pointer, localX: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation(); const goPrevious = localX < navigation.width / 2;
        if (goPrevious && page.page > 0) this.lifePanelPage -= 1;
        if (!goPrevious && page.page + 1 < page.pageCount) this.lifePanelPage += 1;
        this.renderLifePanelButtons(); this.layoutLifePanel(this.scale);
      });
      this.lifePanelButtons.push(navigation);
    }
    const close = this.add.text(this.scale.width / 2, 0, "閉じる", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "14px", color: "#fff2bd", backgroundColor: "#6b4529ee", padding: { x: 18, y: 9 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(143).setInteractive({ useHandCursor: true });
    close.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      const active = Boolean(this.fishingMiniGame || this.fishingApproach || this.alchemyMiniGame || this.cookingMiniGame || this.cookingPrep || this.riceCooking || this.forgeMiniGame);
      const decision = decideMiniGameExit(active, this.miniGameExitArmedUntil, this.game.loop.time);
      this.miniGameExitArmedUntil = decision.armedUntil;
      if (decision.action === "close") this.closeLifePanel();
      else { close.setText("中断しますか？"); this.time.delayedCall(1_550, () => { if (close.active) close.setText("閉じる"); }); }
    });
    this.lifePanelButtons.push(close);
  }
  private showLifeResult(message: string) {
    const failed = /足り|失敗|逃げ|できません|できない|外れ/.test(message);
    const tactileCraft = /料理|調合|完成|制作|鍛造|釣り上げ|収穫/.test(message);
    this.bridge.toReact({ type: "GAME_FEEDBACK", payload: { kind: failed ? "failure" : "success", channel: tactileCraft ? "asmr" : "se" } });
    this.closeLifePanel();
    this.dialogueLabel.setText(message).setVisible(true);
    this.time.delayedCall(2200, () => this.dialogueLabel.setVisible(false));
    this.refreshLifeDisplay();
  }
  private closeLifePanel(invokeOnClose = true) {
    this.storyDialogueOpen = false;
    const onClose = invokeOnClose ? this.lifePanelOnClose : undefined;
    this.lifePanelOnClose = undefined;
    this.cookingResultOpen = false;
    this.lifeActionTimer?.remove(false);
    this.cookingMenuObjects.forEach((object) => object.destroy());
    this.cookingMenuObjects = [];
    this.npcDialoguePortrait?.destroy();
    this.npcDialoguePortrait = undefined;
    this.miniGameExitArmedUntil = 0;
    this.workbenchUiObjects.forEach((object) => object.destroy());
    this.workbenchUiObjects = [];
    this.inventoryUiObjects.forEach((object) => object.destroy());
    this.inventoryUiObjects = [];
    this.inventoryPanelActive = false;
    this.lifeActionTimer = undefined;
    this.fishingMiniGame = undefined;
    this.fishingHeld = false;
    this.fishingMiniObjects.forEach((object) => object.destroy());
    this.fishingMiniObjects = [];
    this.fishingTrack = undefined;
    this.fishingCatcher = undefined;
    this.fishingFish = undefined;
    this.fishingProgress = undefined;
    this.alchemyMiniGame = undefined;
    this.alchemyMiniObjects.forEach((object) => object.destroy());
    this.alchemyMiniObjects = [];
    this.alchemyInstructionLabel = undefined;
    this.alchemyPestle = undefined;
    this.alchemyScoreBar = undefined;
    this.cookingMiniGame = undefined;
    this.cookingLastPointerY = undefined;
    this.cookingPrep = undefined;
    this.cookingPrepInputReady = false;
    this.cookingCutStart = undefined;
    this.cookingPrepObjects.forEach((object) => object.destroy());
    this.cookingPrepObjects = [];
    this.cookingCutMarkers = [];
    this.cookingPrepLabel = undefined;
    this.riceCooking = undefined;
    this.riceInputReady = false;
    this.riceGestureStart = undefined;
    this.riceCookingObjects.forEach((object) => object.destroy());
    this.riceCookingObjects = [];
    this.riceInstructionLabel = undefined;
    this.ricePhaseLabel = undefined;
    this.ricePaddle = undefined;
    this.riceProgressDots = [];
    this.ricePortionMarkers = [];
    this.cookingMiniObjects.forEach((object) => object.destroy());
    this.cookingMiniObjects = [];
    this.cookingHeatMarker = undefined;
    this.cookingTargetZone = undefined;
    this.cookingQualityBar = undefined;
    this.cookingAdviceLabel = undefined;
    this.cookingTimerLabel = undefined;
    this.cookingFlame = undefined;
    this.cookingBroth = undefined;
    this.forgeMiniGame = undefined;
    this.forgingStoneId = undefined;
    this.forgeMiniObjects.forEach((object) => object.destroy());
    this.forgeMiniObjects = [];
    this.forgeAnvil = undefined;
    this.forgeTarget = undefined;
    this.forgeHeatBar = undefined;
    this.forgeStatusLabel = undefined;
    this.fishingApproach = undefined;
    this.fishingApproachInputReady = false;
    this.fishingCastStart = undefined;
    this.fishingApproachObjects.forEach((object) => object.destroy());
    this.fishingApproachObjects = [];
    this.fishingApproachLabel = undefined;
    this.fishingBobber = undefined;
    this.fishingShadow = undefined;
    this.lifePanelOpen = false;
    this.lifePanel.setVisible(false);
    this.lifePanelTitle.setVisible(false);
    this.lifePanelBody.setVisible(false);
    this.lifePanelButtons.forEach((button) => button.destroy());
    this.lifePanelButtons = [];
    this.lifePanelOptions = [];
    this.lifePanelOnSelect = undefined;
    this.lifePanelPage = 0;
    this.refreshOverlayVisibility();
    onClose?.();
  }
  private refreshOverlayVisibility() {
    const overlayOpen = this.mapOpen || this.lifePanelOpen;
    this.mapButton.setVisible(!this.lifePanelOpen);
    this.inventoryButton.setVisible(false);
    this.journalButton.setVisible(false);
    this.yokaiCardButton.setVisible(!this.mapOpen && !this.lifePanelOpen && this.runtime.yokaiCards.cards.length > 0);
    this.statusButton.setVisible(!overlayOpen);
    this.toolButton.setVisible(!overlayOpen && this.map?.id === "map_homestead");
    this.placementButton.setVisible(!overlayOpen && (this.map?.id === "map_home" || this.map?.id === "map_homestead"));
    this.farmingInfoLabel.setVisible(this.detailsOpen && !overlayOpen);
    if (overlayOpen) this.combatHudLabel.setVisible(false);
    if (overlayOpen) this.actionButton.setVisible(false);
  }
  private toggleMapPanel() {
    this.mapOpen = !this.mapOpen;
    this.mapButton.setText(this.mapOpen ? "閉じる" : "メニュー");
    this.mapPanel.setVisible(this.mapOpen);
    this.mapPanelText.setVisible(this.mapOpen);
    this.actionButton.setVisible(false);
    this.refreshOverlayVisibility();
    if (this.mapOpen) this.refreshMapPanel();
    else this.clearMapUiObjects();
  }
  private clearMapUiObjects() {
    for (const object of this.mapUiObjects) object.destroy();
    this.mapUiObjects = [];
  }
  private refreshMapPanel() {
    if (!this.map) return;
    this.clearMapUiObjects();
    const activeChapter = !this.runtime.chapterOne.isComplete ? 1 : !this.runtime.chapterTwo.isComplete ? 2 : 3;
    const activeStep = activeChapter === 1 ? this.runtime.chapterOne.step : activeChapter === 2 ? this.runtime.chapterTwo.step : this.runtime.chapterThree.step;
    const destination = objectiveDestination(activeChapter, activeStep);
    const route = findRoute(this.map.id, destination);
    const routeEdges = routeEdgeKeys(route);
    const panelWidth = this.mapPanel.width;
    const panelHeight = this.mapPanel.height;
    const left = this.mapPanel.x - panelWidth / 2 + 22;
    const top = this.mapPanel.y - panelHeight / 2 + 76;
    const mapWidth = panelWidth - 44;
    const mapHeight = panelHeight - 138;
    const compact = panelWidth < 480;
    const gateState = { chapterTwoStep: this.runtime.chapterTwo.step, chapterThreeStep: this.runtime.chapterThree.step };
    const positions = Object.fromEntries(Object.entries(WORLD_MAP_NODES).map(([id, node]) => [id, { x: left + node.x * mapWidth, y: top + node.y * mapHeight }])) as Record<MapId, { x: number; y: number }>;
    const paths = this.add.graphics().setScrollFactor(0).setDepth(130);
    for (const [from, to] of WORLD_MAP_EDGES) {
      const a = positions[from]; const b = positions[to];
      const highlighted = routeEdges.has(worldMapEdgeKey(from, to));
      const accessible = mapAccess(from, gateState).allowed && mapAccess(to, gateState).allowed;
      paths.lineStyle(highlighted ? 4 : 2, highlighted ? 0xf3ce71 : accessible ? 0x7b9678 : 0x465049, highlighted ? 1 : 0.7);
      paths.lineBetween(a.x, a.y, b.x, b.y);
    }
    this.mapUiObjects.push(paths);
    const kindColor = { home: 0x9b744b, village: 0x6f8d55, facility: 0x596d78, nature: 0x47735d, danger: 0x76505a } as const;
    for (const [id, node] of Object.entries(WORLD_MAP_NODES) as [MapId, (typeof WORLD_MAP_NODES)[MapId]][]) {
      const point = positions[id];
      const accessible = mapAccess(id, gateState).allowed;
      const current = id === this.map.id;
      const target = id === destination;
      const radius = current || target ? 8 : 6;
      const marker = this.add.circle(point.x, point.y, radius, accessible ? kindColor[node.kind] : 0x353b38, accessible ? 1 : 0.7)
        .setStrokeStyle(current ? 4 : target ? 3 : 2, current ? 0x8fe8d0 : target ? 0xf3ce71 : accessible ? 0xd7d2ae : 0x777c77)
        .setScrollFactor(0).setDepth(131);
      const label = this.add.text(point.x, point.y + 10, `${accessible ? "" : "× "}${node.label}`, {
        fontFamily: "'Yu Gothic', sans-serif", fontSize: compact ? "9px" : "11px", color: accessible ? "#f7f0d7" : "#929991",
        backgroundColor: "#17261fdd", padding: { x: compact ? 2 : 4, y: 2 }, align: "center",
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(131);
      this.mapUiObjects.push(marker, label);
    }
    const footer = this.add.text(this.mapPanel.x, this.mapPanel.y + panelHeight / 2 - 35,
      this.map.id === destination ? "目的地に到着しています" : `次の目的地 ${MAP_DISPLAY_NAMES[destination]} / 次は ${MAP_DISPLAY_NAMES[route[1] ?? destination]} 方面`,
      { fontFamily: "'Yu Gothic', sans-serif", fontSize: compact ? "11px" : "13px", color: "#fff1bd", backgroundColor: "#3e3424dd", padding: { x: 9, y: 5 }, align: "center" })
      .setOrigin(0.5).setScrollFactor(0).setDepth(132);
    this.mapUiObjects.push(footer);
    this.mapPanelText.setText(`旅の地図\n● 現在地  ◆ 目的地  × 未解放`);
  }
  private getObjectiveDestination() {
    const activeChapter = !this.runtime.chapterOne.isComplete ? 1 : !this.runtime.chapterTwo.isComplete ? 2 : 3;
    const activeStep = activeChapter === 1 ? this.runtime.chapterOne.step : activeChapter === 2 ? this.runtime.chapterTwo.step : this.runtime.chapterThree.step;
    return objectiveDestination(activeChapter, activeStep);
  }
  private layoutMapPanel(size: Pick<Phaser.Structs.Size, "width" | "height">) {
    const width = Math.min(680, size.width - 24);
    const height = Math.min(500, size.height - 64);
    this.mapButton.setPosition(size.width / 2, 14);
    this.mapPanel.setPosition(size.width / 2, size.height / 2).setSize(width, height);
    this.mapPanelText.setPosition(size.width / 2, size.height / 2 - height / 2 + 16);
    if (this.mapOpen) this.refreshMapPanel();
  }
  private changeMap(id: MapId, spawnName?: string, exactSpawn?: { x: number; y: number }, saveAfterTransition = false) {
    if (saveAfterTransition) this.runtime.setSaveSafe(false);
    this.transitionLocked = true;
    this.player.setVelocity(0, 0);
    for (const collider of this.colliders) collider.destroy();
    this.destroyNpcCollisions();
    this.gatheringCollider?.destroy();
    this.gatheringCollider = undefined;
    this.gatheringObstacleGroup?.destroy();
    this.gatheringObstacleGroup = undefined;
    for (const collider of this.placedObjectColliders) collider.destroy();
    this.placedObjectObstacleGroup?.destroy();
    for (const object of this.worldObjects) object.destroy();
    for (const object of this.presentationObjects) object.destroy();
    this.colliders = [];
    this.placedObjectColliders = [];
    this.placedObjectObstacleGroup = undefined;
    this.worldObjects = [];
    this.placedObjectVisuals.clear();
    this.placedObjectObstacles.clear();
    this.gatheringObstacles.clear();
    this.livestockVisuals.clear();
    this.presentationObjects = [];
    this.npcObjects = [];
    this.lastNpcScheduleHour = Math.floor(this.runtime.getState().time.minutes / 60);
    this.combatEnemyVisual = undefined;
    this.combatEnemyLabel = undefined;
    this.telegraphVisual = undefined;
    this.telegraphCueLabel.setVisible(false);
    this.treeSafeZoneVisual = undefined;
    this.telegraphRemainingMs = -1;
    this.enemyAttackCooldownMs = 1600;
    const map = loadTiledMap(this, id);
    this.map = map;
    this.runtime.chapterOne.recordVisit(id);
    this.runtime.chapterThree.recordVisit(id);
    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.cameras.main
      .setBounds(0, 0, map.width, map.height)
      .setBackgroundColor(map.background)
      .setZoom(mapCameraZoom(map.id, this.scale.height, map.height))
      .setRoundPixels(true)
      .startFollow(this.player, true, 1, 1);
    this.fitMapCamera(map);
    this.drawMap(map);
    this.createLifeStations(map.id);
    if (map.id === "map_home" || map.id === "map_homestead") this.recreatePlacedObjectVisuals();
    this.createNpcs(map.id);
    if (map.id === "map_homestead") {
      this.createFarmingPlots();
      this.createGatheringNodes("map_homestead");
      this.refreshLifeDisplay();
    }
    if (map.objectLayers.gatheringNodes.length > 0 && map.id !== "map_homestead") this.createGatheringNodes(map.id);
    const walls = this.physics.add.staticGroup();
    for (const area of map.collisions) {
      // Collision bodies are authoring data, not part of the player-facing art.
      // Keeping the rectangle transparent preserves Arcade Physics while removing
      // the debug blocks that previously showed through floors and buildings.
      const wall = this.add.rectangle(area.x + area.width / 2, area.y + area.height / 2, area.width, area.height, map.accent, 0);
      this.physics.add.existing(wall, true);
      walls.add(wall);
      this.worldObjects.push(wall);
    }
    this.colliders.push(this.physics.add.collider(this.player, walls));
    const spawn = exactSpawn ?? (spawnName ? map.spawns[spawnName] : undefined) ?? map.spawns.start ?? { x: map.width / 2, y: map.height / 2 };
    this.player.setPosition(spawn.x, spawn.y);
    this.cameras.main.centerOn(spawn.x, spawn.y);
    this.locationLabel.setText(map.displayName);
    this.refreshEnvironment();
    if (this.mapOpen) this.refreshMapPanel();
    this.runtime.updatePlayer(id, spawn.x, spawn.y);
    this.refreshOverlayVisibility();
    if (saveAfterTransition) this.showArrivalGuide(map.id);
    this.cameras.main.fadeIn(180, 12, 21, 17);
    this.time.delayedCall(350, () => {
      this.transitionLocked = false;
      if (saveAfterTransition) {
        this.runtime.setSaveSafe(true);
        this.runtime.requestSave();
      }
    });
  }
  private fitMapCamera(map: LoadedMap) {
    const bounds = centeredCameraBounds(map.width, map.height, this.scale.width, this.scale.height);
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    if (interiorRoomPresentation(map)) this.cameras.main.setBackgroundColor(0x211d1a);
  }
  private drawMap(map: LoadedMap) {
    const floor = mapFloorExtent(map.id, map.width, map.height, this.scale.width, this.scale.height);
    const room = interiorRoomPresentation(map);
    const surface = room ? { width: map.width, height: map.height } : floor;
    const background = this.add.rectangle(floor.width / 2, floor.height / 2, floor.width, floor.height, room ? 0x211d1a : map.background).setDepth(-20);
    const terrain = mapTerrainTexture(map.id);
    const texturedGround = !room?.stoneFloor && terrain && this.textures.exists(terrain.key) ? this.add.tileSprite(surface.width / 2, surface.height / 2, surface.width, surface.height, terrain.key).setTileScale(terrain.tileScale).setDepth(-19) : undefined;
    const grid = this.add.grid(surface.width / 2, surface.height / 2, surface.width, surface.height, 32, 32, map.background, texturedGround ? 0 : 1, map.accent, texturedGround ? 0.035 : 0.09).setDepth(-18);
    this.worldObjects.push(background, ...(texturedGround ? [texturedGround] : []), grid);
    if (room) {
      const architecture = this.add.graphics().setDepth(-16);
      if (room.stoneFloor) {
        for (let y = 0; y < map.height; y += 32) {
          for (let x = 0; x < map.width; x += 32) {
            architecture.fillStyle(((x + y) / 32) % 3 === 0 ? 0x625c54 : 0x55514a);
            architecture.fillRect(x + 1, y + 1, 30, 30);
          }
        }
      }
      for (const wall of room.walls) {
        architecture.fillStyle(0x493526).fillRect(wall.x, wall.y, wall.width, wall.height);
        architecture.fillStyle(0x947454).fillRect(wall.x + 4, wall.y + 4, Math.max(0, wall.width - 8), Math.max(0, wall.height - 8));
        architecture.lineStyle(2, 0x2c211b).strokeRect(wall.x, wall.y, wall.width, wall.height);
      }
      for (const door of map.transitions) {
        architecture.fillStyle(0xae8a5b).fillRect(door.x, door.y, door.width, door.height);
        architecture.lineStyle(2, 0x5b422d);
        for (let y = door.y + 8; y < door.y + door.height; y += 8) architecture.lineBetween(door.x, y, door.x + door.width, y);
      }
      this.worldObjects.push(architecture);
    }
    this.refreshMapPresentation();
    const destination = this.getObjectiveDestination();
    const nextMap = nextRouteMap(map.id, destination);
    for (const transition of map.transitions) {
      const x = transition.x + transition.width / 2;
      const y = transition.y + transition.height / 2;
      const isWaypoint = transition.targetMap === nextMap;
      const exit = this.add.rectangle(x, y, transition.width, transition.height, isWaypoint ? 0x87d97c : 0xf4d58d, isWaypoint ? 0.72 : 0.48).setDepth(-1);
      if (isWaypoint) {
        exit.setStrokeStyle(4, 0xeaffb5);
        if (this.reducedEffects) exit.setAlpha(0.78);
        else this.tweens.add({ targets: exit, alpha: { from: 0.48, to: 0.92 }, duration: 650, yoyo: true, repeat: -1 });
      }
      this.worldObjects.push(exit);
      if (isWaypoint) {
        const label = `目的地  ${exitLabel(transition.targetMap)}`;
        this.worldObjects.push(this.add.text(x, y, label, { fontFamily: "'Yu Gothic', sans-serif", fontSize: "13px", color: "#f5ffd9", backgroundColor: "#365331ee", padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(2));
      }
    }
  }
  private showArrivalGuide(mapId: MapId) {
    const destination = this.getObjectiveDestination();
    const nextMap = nextRouteMap(mapId, destination);
    const guide = mapId === destination ? "目的地に到着しました" : nextMap ? `次は「${MAP_DISPLAY_NAMES[nextMap]}」方面です` : "周囲を確認しましょう";
    this.arrivalLabel.setText(`${MAP_DISPLAY_NAMES[mapId]}\n${guide}`).setAlpha(1).setVisible(true);
    this.time.delayedCall(1800, () => this.tweens.add({ targets: this.arrivalLabel, alpha: 0, duration: 350, onComplete: () => this.arrivalLabel.setVisible(false) }));
  }
  private refreshMapPresentation() {
    if (!this.map) return;
    for (const object of this.presentationObjects) object.destroy();
    this.presentationObjects = [];
    if (this.map.id === "map_home" && this.textures.exists(HOME_INTERIOR_SPRITE_SHEET.key)) {
      const frame = homeInteriorFrame(this.runtime.getState().events.flags);
      this.presentationObjects.push(this.add.image(320, 456, HOME_INTERIOR_SPRITE_SHEET.key, frame).setDisplaySize(610, 430).setOrigin(0.5, 1).setDepth(-17));
    }
    for (const sprite of mapWorldSprites(this.map.id, this.runtime.getState().events.flags)) {
      if (!this.textures.exists(sprite.key)) continue;
      this.presentationObjects.push(this.add.image(sprite.x, sprite.y, sprite.key).setDisplaySize(sprite.width, sprite.height).setOrigin(0.5, sprite.originY).setDepth(sprite.depth));
    }
    for (const decoration of getMapDecorations(this.map.id, this.runtime.getState().events.flags)) {
      if (decoration.kind === "circle") {
        this.presentationObjects.push(this.add.circle(decoration.x, decoration.y, decoration.radius ?? 32, decoration.color, decoration.alpha ?? 0.35).setDepth(-18));
      } else if (decoration.kind === "rect") {
        this.presentationObjects.push(this.add.rectangle(decoration.x, decoration.y, decoration.width ?? 64, decoration.height ?? 64, decoration.color, decoration.alpha ?? 0.35).setDepth(-18));
      } else {
        this.presentationObjects.push(this.add.text(decoration.x, decoration.y, decoration.text ?? "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "16px", color: `#${decoration.color.toString(16).padStart(6, "0")}`, backgroundColor: "#122019aa", padding: { x: 8, y: 5 } }).setOrigin(0.5).setDepth(-1));
      }
    }
  }
  private createPlayerTexture() {
    if (this.textures.exists(PLAYER_FIELD_SPRITE.key)) return;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xf3ead1).fillCircle(18, 14, 9);
    graphics.fillStyle(0x315244).fillRoundedRect(8, 22, 20, 24, 5);
    graphics.fillStyle(0xc75d4d).fillTriangle(10, 22, 26, 22, 18, 31);
    graphics.generateTexture("player-placeholder", 36, 50).destroy();
  }

  private applyPlayerFacing(facing: PlayerFacing) {
    if (facing === this.playerFacing) return;
    this.playerFacing = facing;
    const sprite = playerFieldSprite(facing);
    if (this.textures.exists(sprite.key)) this.player.setTexture(sprite.key);
    this.player.setFlipX(facing === "left");
  }

  private updatePlayerWalk(facing: PlayerFacing, moving: boolean, delta: number) {
    if (!moving) {
      this.playerWalkElapsedMs = 0;
      const idle = playerFieldSprite(facing);
      if (this.textures.exists(idle.key) && this.player.texture.key !== idle.key) this.player.setTexture(idle.key);
      return;
    }
    this.playerWalkElapsedMs += delta;
    const sprite = Math.floor(this.playerWalkElapsedMs / 140) % 2 === 0 ? playerFieldSprite(facing) : playerWalkSprite(facing);
    if (this.textures.exists(sprite.key) && this.player.texture.key !== sprite.key) this.player.setTexture(sprite.key);
    this.player.setFlipX(facing === "left");
  }
}
