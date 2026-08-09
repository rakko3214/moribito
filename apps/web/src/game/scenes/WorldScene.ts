import Phaser from "phaser";
import type { GameBridge } from "../bridge/GameBridge.js";
export class WorldScene extends Phaser.Scene {
  constructor(private readonly bridge: GameBridge) { super("WorldScene"); }
  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x17251f);
    this.add.circle(width / 2, height / 2 - 58, 42, 0xd6dfb9).setStrokeStyle(4, 0x879b70);
    this.add.text(width / 2, height / 2 + 18, "結師 · Moribito", { fontFamily: "serif", fontSize: "30px", color: "#f5f0dc" }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 62, "Phase 0 foundation is running", { fontFamily: "sans-serif", fontSize: "15px", color: "#a9bba3" }).setOrigin(0.5);
    this.bridge.toReact({ type: "GAME_READY" });
  }
}
