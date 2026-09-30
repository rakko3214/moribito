import Phaser from "phaser";
import type { WorldEvent } from "../domain/gameState.js";
import type { PlayerPosition } from "../domain/save.js";
import { canStandAt, HOMESTEAD } from "./homesteadMap.js";

export type Direction = "up" | "down" | "left" | "right";
export type WorldHandle = {
  setTouchDirection(direction: Direction, pressed: boolean): void;
  setEnabled(enabled: boolean): void;
  destroy(): void;
};

export function mountWorld(parent: HTMLElement, initial: PlayerPosition, onEvent: (event: WorldEvent) => void): WorldHandle {
  const touchDirections = new Set<Direction>();
  let enabled = true;
  let playerPosition: PlayerPosition = { ...initial };

  class HomesteadScene extends Phaser.Scene {
    private avatar!: Phaser.GameObjects.Container;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private keys: Record<string, Phaser.Input.Keyboard.Key> | undefined;
    private pointerOrigin: { id: number; x: number; y: number } | null = null;
    private pointerAxis = { x: 0, y: 0 };

    constructor() { super("HomesteadScene"); }

    clearPointerInput() {
      this.pointerOrigin = null;
      this.pointerAxis = { x: 0, y: 0 };
    }

    create() {
      const ground = this.add.graphics();
      ground.fillStyle(0x547451).fillRect(0, 0, HOMESTEAD.width, HOMESTEAD.height);
      ground.fillStyle(0x69845b);
      for (let y = 0; y < HOMESTEAD.height; y += 40) {
        for (let x = 0; x < HOMESTEAD.width; x += 40) {
          if ((x / 40 + y / 40) % 3 === 0) ground.fillRect(x + 6, y + 8, 3, 3);
        }
      }
      ground.fillStyle(0xb19d74).fillRoundedRect(380, 205, 40, 185, 12);
      ground.fillStyle(0x415f47).fillRoundedRect(80, 315, 310, 275, 16);
      ground.lineStyle(2, 0x8aab78).strokeRoundedRect(80, 315, 310, 275, 16);
      ground.fillStyle(0x4c6876).fillEllipse(670, 440, 105, 92);
      ground.fillStyle(0x765442).fillRoundedRect(260, 70, 280, 165, 8);
      ground.fillStyle(0x4b3b34).fillTriangle(248, 84, 400, 5, 552, 84);
      ground.fillStyle(0xbba47b).fillRect(365, 220, 70, 40);
      ground.lineStyle(3, 0x283a31).strokeRect(0, 0, HOMESTEAD.width, HOMESTEAD.height);

      for (const [x, y] of [[115, 125], [170, 190], [580, 155], [735, 245], [565, 515], [490, 560]] as const) {
        ground.fillStyle(0x344f38).fillCircle(x, y, 24);
        ground.fillStyle(0x62805a).fillCircle(x - 5, y - 6, 20);
      }

      const shadow = this.add.ellipse(0, 10, 24, 9, 0x1a2922, .55);
      const body = this.add.rectangle(0, -5, 19, 25, 0xede0b8).setStrokeStyle(2, 0x33483e);
      const hair = this.add.circle(0, -22, 10, 0x312d2a).setStrokeStyle(2, 0xe3d5ad);
      this.avatar = this.add.container(playerPosition.x, playerPosition.y, [shadow, body, hair]);
      this.avatar.setDepth(2);
      this.cameras.main.setBounds(0, 0, HOMESTEAD.width, HOMESTEAD.height);
      this.cameras.main.startFollow(this.avatar, true, .12, .12);
      this.cameras.main.setBackgroundColor("#263c32");

      this.cursors = this.input.keyboard?.createCursorKeys();
      this.keys = this.input.keyboard?.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key> | undefined;
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (!enabled) return;
        this.pointerOrigin = { id: pointer.id, x: pointer.x, y: pointer.y };
      });
      this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        if (this.pointerOrigin?.id !== pointer.id || !pointer.isDown) return;
        const dx = pointer.x - this.pointerOrigin.x;
        const dy = pointer.y - this.pointerOrigin.y;
        const length = Math.hypot(dx, dy);
        this.pointerAxis = length < 12 ? { x: 0, y: 0 } : { x: dx / length, y: dy / length };
      });
      const releasePointer = (pointer: Phaser.Input.Pointer) => {
        if (this.pointerOrigin?.id !== pointer.id) return;
        this.pointerOrigin = null;
        this.pointerAxis = { x: 0, y: 0 };
      };
      this.input.on("pointerup", releasePointer);
      this.input.on("pointerupoutside", releasePointer);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.off("pointerup", releasePointer);
        this.input.off("pointerupoutside", releasePointer);
      });
    }

    update(_time: number, delta: number) {
      if (!enabled) return;
      const left = this.cursors?.left.isDown || this.keys?.A?.isDown || touchDirections.has("left");
      const right = this.cursors?.right.isDown || this.keys?.D?.isDown || touchDirections.has("right");
      const up = this.cursors?.up.isDown || this.keys?.W?.isDown || touchDirections.has("up");
      const down = this.cursors?.down.isDown || this.keys?.S?.isDown || touchDirections.has("down");
      const dx = Number(Boolean(right)) - Number(Boolean(left)) + this.pointerAxis.x;
      const dy = Number(Boolean(down)) - Number(Boolean(up)) + this.pointerAxis.y;
      const length = Math.hypot(dx, dy);
      if (length === 0) return;
      const step = Math.min(delta, 50) / 1000 * 145;
      const nextX = playerPosition.x + dx / length * step;
      const nextY = playerPosition.y + dy / length * step;
      let moved = false;
      if (canStandAt(nextX, playerPosition.y)) { playerPosition = { ...playerPosition, x: nextX }; moved = true; }
      if (canStandAt(playerPosition.x, nextY)) { playerPosition = { ...playerPosition, y: nextY }; moved = true; }
      if (!moved) return;
      const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      playerPosition = { ...playerPosition, facing };
      this.avatar.setPosition(playerPosition.x, playerPosition.y);
      onEvent({ type: "player.moved", player: snapshotPlayer() });
    }
  }

  const snapshotPlayer = (): PlayerPosition => ({ ...playerPosition, x: Math.round(playerPosition.x * 10) / 10, y: Math.round(playerPosition.y * 10) / 10 });
  const scene = new HomesteadScene();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    backgroundColor: "#263c32",
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    render: { pixelArt: true, antialias: false },
    audio: { noAudio: true },
    scene: [scene],
  });
  return {
    setTouchDirection: (direction, pressed) => { if (pressed) touchDirections.add(direction); else touchDirections.delete(direction); },
    setEnabled: (value) => { enabled = value; if (!value) { touchDirections.clear(); scene.clearPointerInput(); } },
    destroy: () => game.destroy(true),
  };
}
