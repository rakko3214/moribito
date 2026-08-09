import Phaser from "phaser";
import type { GameBridge } from "../bridge/GameBridge.js";
import { FieldInput } from "../input/FieldInput.js";
import type { GameRuntime } from "../runtime/GameRuntime.js";
import { loadTiledMap } from "../world/mapLoader.js";
import type { LoadedMap, MapId } from "../world/mapTypes.js";

const PLAYER_SPEED = 235;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private fieldInput!: FieldInput;
  private map?: LoadedMap;
  private worldObjects: Phaser.GameObjects.GameObject[] = [];
  private colliders: Phaser.Physics.Arcade.Collider[] = [];
  private transitionLocked = false;
  private locationLabel!: Phaser.GameObjects.Text;

  constructor(private readonly bridge: GameBridge, private readonly runtime: GameRuntime) { super("WorldScene"); }
  preload() {
    this.load.tilemapTiledJSON("map-village", "/maps/village.json");
    this.load.tilemapTiledJSON("map-home", "/maps/home.json");
    this.load.tilemapTiledJSON("map-shrine", "/maps/shrine.json");
  }
  create() {
    this.createPlayerTexture();
    this.player = this.physics.add.sprite(0, 0, "player-placeholder").setDepth(20);
    this.player.setCircle(13, 5, 9).setCollideWorldBounds(true);
    this.fieldInput = new FieldInput(this);
    this.locationLabel = this.add.text(16, 14, "", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "16px", color: "#f5f0dc", backgroundColor: "#102019dd", padding: { x: 10, y: 7 } }).setScrollFactor(0).setDepth(100);
    this.add.text(16, 54, "移動: WASD / 矢印キー / 画面をドラッグ", { fontFamily: "'Yu Gothic', sans-serif", fontSize: "12px", color: "#d5dfc7", backgroundColor: "#102019bb", padding: { x: 8, y: 5 } }).setScrollFactor(0).setDepth(100);
    const state = this.runtime.getState();
    this.changeMap(state.player.mapId as MapId, undefined, { x: state.player.x, y: state.player.y });
    this.runtime.events.on((event) => {
      if (event.type !== "STATE_LOADED") return;
      const loaded = this.runtime.getState().player;
      this.changeMap(loaded.mapId as MapId, undefined, { x: loaded.x, y: loaded.y });
    });
    this.bridge.toReact({ type: "GAME_READY" });
  }
  update() {
    const direction = this.fieldInput.getDirection();
    this.player.setVelocity(direction.x * PLAYER_SPEED, direction.y * PLAYER_SPEED);
    if (direction.x !== 0) this.player.setFlipX(direction.x < 0);
    const facing = Math.abs(direction.x) > Math.abs(direction.y) ? (direction.x < 0 ? "left" : "right") : direction.y < 0 ? "up" : "down";
    if (direction.lengthSq() > 0 && this.map) this.runtime.updatePlayer(this.map.id, this.player.x, this.player.y, facing);
    if (!this.map || this.transitionLocked) return;
    const transition = this.map.transitions.find((area) => Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(area.x, area.y, area.width, area.height), this.player.x, this.player.y));
    if (transition) this.changeMap(transition.targetMap, transition.targetSpawn);
  }
  private changeMap(id: MapId, spawnName?: string, exactSpawn?: { x: number; y: number }) {
    this.transitionLocked = true;
    this.player.setVelocity(0, 0);
    for (const collider of this.colliders) collider.destroy();
    for (const object of this.worldObjects) object.destroy();
    this.colliders = [];
    this.worldObjects = [];
    const map = loadTiledMap(this, id);
    this.map = map;
    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.cameras.main
      .setBounds(0, 0, map.width, map.height)
      .setRoundPixels(true)
      .startFollow(this.player, true, 1, 1);
    this.drawMap(map);
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
    this.cameras.main.fadeIn(180, 12, 21, 17);
    this.time.delayedCall(350, () => { this.transitionLocked = false; });
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
