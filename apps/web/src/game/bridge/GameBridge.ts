import type { GameToReactEvent, ReactToGameEvent } from "@moribito/shared";
type GameListener = (event: ReactToGameEvent) => void;
type ReactListener = (event: GameToReactEvent) => void;
export class GameBridge {
  private gameListeners = new Set<GameListener>();
  private reactListeners = new Set<ReactListener>();
  toGame(event: ReactToGameEvent) { this.gameListeners.forEach((listener) => listener(event)); }
  toReact(event: GameToReactEvent) { this.reactListeners.forEach((listener) => listener(event)); }
  onGame(listener: GameListener) { this.gameListeners.add(listener); return () => { this.gameListeners.delete(listener); }; }
  onReact(listener: ReactListener) { this.reactListeners.add(listener); return () => { this.reactListeners.delete(listener); }; }
}
