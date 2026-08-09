import { useEffect, useRef, useState } from "react";
import { createGame } from "../game/createGame.js";
export function App() {
  const gameHost = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!gameHost.current) return;
    const game = createGame(gameHost.current, () => setReady(true));
    return () => game.destroy(true);
  }, []);
  return <main className="app-shell"><header className="app-header"><div><span className="eyebrow">FIRST PLAYABLE · PHASE 0</span><h1>結師</h1></div><span className={ready ? "status ready" : "status"}>{ready ? "GAME READY" : "起動中…"}</span></header><section className="game-frame" aria-label="Moribito game canvas"><div ref={gameHost} className="game-host" /></section><footer>React · Phaser · GameBridge foundation</footer></main>;
}
