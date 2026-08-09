import Phaser from "phaser";
import { GameBridge } from "./bridge/GameBridge.js";
import { BootScene } from "./scenes/BootScene.js";
import { WorldScene } from "./scenes/WorldScene.js";
export function createGame(parent: HTMLElement, onReady: () => void) {
  const bridge = new GameBridge();
  const unsubscribe = bridge.onReact((event) => { if (event.type === "GAME_READY") onReady(); });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#17251f",
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
    render: { antialias: false, pixelArt: true },
    scene: [new BootScene(), new WorldScene(bridge)],
  });
  game.events.once(Phaser.Core.Events.DESTROY, unsubscribe);
  return game;
}
