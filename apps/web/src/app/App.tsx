import { useEffect, useRef, useState } from "react";
import { GameBridge } from "../game/bridge/GameBridge.js";
import { discardPendingSave, loadSave, putSave, resetSave, SaveRequestError, setSaveUserId } from "../services/SaveApi.js";
import type { SaveDataV1 } from "@moribito/shared";
import { LocalMockAuthService, type AuthSession } from "../services/AuthService.js";
import { bindLifecycleSave, type LifecycleScreen } from "../services/LifecycleSave.js";

type SaveStatus = "loading" | "saved" | "saving" | "dirty" | "error";
const statusText: Record<SaveStatus, string> = { loading: "読込中…", saved: "保存済み", saving: "保存中…", dirty: "未保存", error: "保存失敗" };

export function App() {
  const gameHost = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<GameBridge | null>(null);
  const pendingExitRef = useRef<"title" | "signout" | null>(null);
  const authRef = useRef<LocalMockAuthService | null>(null);
  if (!authRef.current) authRef.current = new LocalMockAuthService(window.localStorage);
  if (!bridgeRef.current) bridgeRef.current = new GameBridge();
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [screen, setScreen] = useState<LifecycleScreen>("auth");
  const screenRef = useRef<LifecycleScreen>("auth");
  screenRef.current = screen;
  const [session, setSession] = useState<AuthSession | null>(null);
  const [availableSave, setAvailableSave] = useState<SaveDataV1 | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmDiscardPending, setConfirmDiscardPending] = useState(false);
  const [saveFailure, setSaveFailure] = useState<{ message: string; retryable: boolean } | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const prepareTitle = () => {
    setScreen("loading"); setLoadError(null); setLoadWarning(null); setSaveStatus("loading");
    void loadSave().then(({ save, pendingConflict }) => {
      if (pendingConflict) setLoadWarning("この端末の未送信データより新しいクラウドセーブがあります。クラウド版を使用し、端末データは上書きせず保留しています。");
      setAvailableSave(save); setSaveStatus(save ? "saved" : "dirty"); setScreen("title");
    }).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "セーブデータを読み込めませんでした。"); setSaveStatus("error"); setScreen("title");
    });
  };

  const continueGame = () => {
    if (!availableSave) return;
    bridgeRef.current?.toGame({ type: "LOAD_GAME", payload: availableSave });
    bridgeRef.current?.toGame({ type: "RESUME_GAME" }); setScreen("game");
  };
  const startNewGame = () => {
    if (availableSave && !confirmNew) { setConfirmNew(true); return; }
    const begin = () => {
      setAvailableSave(null); bridgeRef.current?.toGame({ type: "START_NEW_GAME" }); bridgeRef.current?.toGame({ type: "RESUME_GAME" });
      setSaveStatus("dirty"); setConfirmNew(false); setScreen("game");
    };
    if (!availableSave) { begin(); return; }
    setScreen("loading"); setLoadError(null);
    void resetSave().then(begin).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "セーブデータを初期化できませんでした。"); setSaveStatus("error"); setConfirmNew(false); setScreen("title");
    });
  };
  const openMenu = () => { bridgeRef.current?.toGame({ type: "PAUSE_GAME" }); setScreen("menu"); };
  const resumeGame = () => { bridgeRef.current?.toGame({ type: "RESUME_GAME" }); setScreen("game"); };
  const returnToTitle = () => {
    if (saveStatus !== "saved") {
      pendingExitRef.current = "title";
      bridgeRef.current?.toGame({ type: "REQUEST_SAVE" });
      return;
    }
    prepareTitle();
  };
  const signIn = () => {
    const next = authRef.current?.signIn(); if (!next) return;
    setSession(next); setSaveUserId(next.userId); prepareTitle();
  };
  const completeSignOut = () => {
    authRef.current?.signOut(); setSession(null); setAvailableSave(null); setScreen("auth"); bridgeRef.current?.toGame({ type: "PAUSE_GAME" });
  };
  const signOut = () => {
    if (saveStatus !== "saved") {
      pendingExitRef.current = "signout";
      bridgeRef.current?.toGame({ type: "REQUEST_SAVE" });
      return;
    }
    completeSignOut();
  };
  const discardConflictingPendingSave = () => {
    if (!confirmDiscardPending) { setConfirmDiscardPending(true); return; }
    setScreen("loading");
    void discardPendingSave().then(() => {
      setLoadWarning(null); setConfirmDiscardPending(false); setScreen("title");
    }).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "端末の未送信データを削除できませんでした。"); setConfirmDiscardPending(false); setScreen("title");
    });
  };

  useEffect(() => {
    if (!gameHost.current || !bridgeRef.current) return;
    const bridge = bridgeRef.current;
    const unsubscribe = bridge.onReact((event) => {
      if (event.type === "GAME_READY") {
        setReady(true);
        bridge.toGame({ type: "PAUSE_GAME" });
        const restoredSession = authRef.current?.restoreSession() ?? null;
        if (restoredSession) { setSession(restoredSession); setSaveUserId(restoredSession.userId); prepareTitle(); }
        else setScreen("auth");
      }
      if (event.type === "SAVE_STATE_CHANGED") {
        setSaveStatus(event.payload.status);
        if (event.payload.status === "saving" || event.payload.status === "saved") setSaveFailure(null);
        if (event.payload.status === "saved" && pendingExitRef.current) {
          const destination = pendingExitRef.current; pendingExitRef.current = null;
          if (destination === "signout") completeSignOut(); else prepareTitle();
        }
      }
      if (event.type === "SAVE_REQUEST") {
        void putSave(event.payload)
          .then((result) => bridge.toGame({ type: "SAVE_COMPLETED", payload: result }))
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "Save failed.";
            console.error("Save failed:", message);
            pendingExitRef.current = null;
            setSaveFailure(error instanceof SaveRequestError && error.kind === "conflict"
              ? { message: "別の端末に新しいクラウドセーブがあります。現在のデータでは上書きできません。タイトルへ戻ってクラウド版を読み込み直してください。", retryable: false }
              : { message: "クラウド保存に失敗しました。未送信データはこの端末へ保留しています。通信を確認して再試行してください。", retryable: true });
            bridge.toGame({ type: "SAVE_FAILED", payload: { message } });
          });
      }
    });
    const unbindLifecycleSave = bindLifecycleSave(document, window, () => screenRef.current, () => bridge.toGame({ type: "REQUEST_SAVE" }));
    const parent = gameHost.current;
    let disposed = false;
    let game: { destroy(removeCanvas: boolean): void } | undefined;
    void import("../game/createGame.js")
      .then(({ createGame }) => { if (!disposed) game = createGame(parent, bridge); })
      .catch((error: unknown) => { if (!disposed) setBootError(error instanceof Error ? error.message : "ゲームエンジンを読み込めませんでした。"); });
    return () => { disposed = true; unbindLifecycleSave(); unsubscribe(); game?.destroy(true); };
  }, []);

  return <main className="app-shell">
    <header className="app-header">
      <div><span className="eyebrow">FIRST PLAYABLE · PHASE 8</span><h1>結師</h1></div>
      <div className="header-actions">
        <span className={`save-status ${saveStatus}`}>{statusText[saveStatus]}</span>
        <button type="button" disabled={!ready || saveStatus === "saving" || saveStatus === "loading"} onClick={() => bridgeRef.current?.toGame({ type: "REQUEST_SAVE" })}>セーブ</button>
        {screen === "game" && <button type="button" onClick={openMenu}>メニュー</button>}
        {session && screen !== "game" && <span className="account-name">{session.displayName}</span>}
        <span className={ready ? "status ready" : bootError ? "status error" : "status"}>{ready ? "GAME READY" : bootError ? "起動失敗" : "起動中…"}</span>
      </div>
    </header>
    <section className="game-frame" aria-label="Moribito game canvas">
      <div ref={gameHost} className="game-host" />
      {saveFailure && <div className="save-error-banner" role="alert"><span>{saveFailure.message}</span>{saveFailure.retryable && <button type="button" onClick={() => bridgeRef.current?.toGame({ type: "REQUEST_SAVE" })}>保存を再試行</button>}</div>}
      {screen !== "game" && <div className="title-screen" role="dialog" aria-label={screen === "menu" ? "一時停止メニュー" : "結師 タイトル画面"}>
        {screen === "auth" ? <div className="title-panel auth-panel">
          <span className="title-kicker">ACCOUNT</span><h2>結師</h2>
          <p>{bootError ?? "セーブデータをアカウントごとに安全に管理します。"}</p>
          <div className="title-actions">{bootError ? <button type="button" onClick={() => window.location.reload()}>ゲームを再読み込み</button> : <button type="button" className="primary" onClick={signIn}>開発用アカウントでログイン</button>}</div>
          <small>本番環境ではGoogleログインへ接続します</small>
        </div> : screen === "menu" ? <div className="title-panel pause-panel">
          <span className="title-kicker">PAUSE</span>
          <h2>一時停止</h2>
          <p>{pendingExitRef.current === "title" ? "保存完了後にタイトルへ戻ります…" : pendingExitRef.current === "signout" ? "保存完了後にログアウトします…" : "村の時間とゲーム操作を停止しています"}</p>
          <div className="title-actions">
            <button type="button" className="primary" onClick={resumeGame}>ゲームに戻る</button>
            <button type="button" onClick={() => bridgeRef.current?.toGame({ type: "REQUEST_SAVE" })}>現在の進行を保存</button>
            <button type="button" className="subtle" onClick={returnToTitle}>保存してタイトルへ戻る</button>
            <button type="button" className="subtle" onClick={signOut}>ログアウト</button>
          </div>
        </div> : <div className="title-panel">
          <span className="title-kicker">人と妖怪を、もう一度結ぶ物語</span>
          <h2>結師</h2>
          <p className={loadWarning ? "load-warning" : undefined}>{screen === "loading" ? "セーブデータを確認しています…" : loadError ?? loadWarning ?? (availableSave ? `春 ${availableSave.time.day}日・第${availableSave.progression.chapter}章から再開できます` : "守人村へ帰郷し、新しい生活を始めます")}</p>
          {screen === "title" && <div className="title-actions">
            {availableSave && <button type="button" className="primary" onClick={continueGame}>続きから</button>}
            <button type="button" onClick={startNewGame}>{confirmNew ? "もう一度押して新しく始める" : "新しく始める"}</button>
            {confirmNew && <button type="button" className="subtle" onClick={() => setConfirmNew(false)}>キャンセル</button>}
            {loadWarning && <button type="button" className="warning-action" onClick={discardConflictingPendingSave}>{confirmDiscardPending ? "もう一度押して端末データを破棄" : "端末の未送信データを破棄"}</button>}
            {confirmDiscardPending && <button type="button" className="subtle" onClick={() => setConfirmDiscardPending(false)}>破棄をキャンセル</button>}
            {loadError && <button type="button" className="subtle" onClick={prepareTitle}>読み込みを再試行</button>}
          </div>}
        </div>}
      </div>}
    </section>
    <footer>First Playable · Integration · Account · Cloud Save Boundary</footer>
  </main>;
}
