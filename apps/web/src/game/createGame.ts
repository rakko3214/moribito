import Phaser from "phaser";
import type { GameBridge } from "./bridge/GameBridge.js";
import { BootScene } from "./scenes/BootScene.js";
import { WorldScene } from "./scenes/WorldScene.js";
import { GameRuntime } from "./runtime/GameRuntime.js";
export function createGame(parent: HTMLElement, bridge: GameBridge) {
  const runtime = new GameRuntime(bridge);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#17251f",
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
    render: { antialias: false, pixelArt: true },
    scene: [new BootScene(), new WorldScene(bridge, runtime)],
  });
  game.events.once(Phaser.Core.Events.DESTROY, () => runtime.destroy());
  return game;
}
