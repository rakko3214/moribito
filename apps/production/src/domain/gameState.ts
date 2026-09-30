import type { GameState, PlayerPosition } from "./save.js";

export type WorldEvent = { type: "player.moved"; player: PlayerPosition };

export function applyWorldEvent(state: GameState, event: WorldEvent): GameState {
  switch (event.type) {
    case "player.moved": return { ...state, player: event.player };
  }
}
