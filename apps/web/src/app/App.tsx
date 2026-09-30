import { useEffect, useMemo, useRef, useState } from "react";
import { GameBridge } from "../game/bridge/GameBridge.js";
import { discardPendingSave, SaveRequestError, setSaveUserId } from "../services/SaveApi.js";
import { loadSave, putSave, resetSave } from "../services/DeviceSave.js";
import { saveSummary } from "../services/SaveSummary.js";
import type { SaveDataV1 } from "@moribito/shared";
import { DeviceSessionService, type AuthSession } from "../services/AuthService.js";
import { bindLifecycleSave, type LifecycleScreen } from "../services/LifecycleSave.js";
import { feedbackPattern, loadFeedbackSettings, saveFeedbackSettings, type FeedbackSettings } from "../services/FeedbackSettings.js";
import { AudioFeedbackEngine } from "../services/AudioFeedbackEngine.js";
import { FramePerformanceMonitor, type PerformanceSnapshot } from "../services/FramePerformanceMonitor.js";
import { diagnoseBrowser, readBrowserCapabilityEnvironment, shouldRetrySaveAfterReconnect, type BrowserCapabilityEnvironment } from "../services/BrowserCapability.js";
import { createDeveloperPreset, DEVELOPER_PRESETS, type DeveloperPresetId } from "../game/runtime/DeveloperPresets.js";
import { activateWaitingServiceWorker, clearMoribitoAppCache, isStandaloneDisplay, PWA_UPDATE_EVENT, shouldSaveBeforeAppUpdate, type InstallPromptEvent } from "../services/PwaService.js";

type SaveStatus = "loading" | "saved" | "saving" | "dirty" | "error";
const statusText: Record<SaveStatus, string> = { loading: "読込中…", saved: "保存済み", saving: "保存中…", dirty: "未保存", error: "保存失敗" };

export function App() {
  const gameHost = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<GameBridge | null>(null);
  const pendingExitRef = useRef<"title" | "signout" | "update" | null>(null);
  const reloadForUpdateRef = useRef(false);
  const authRef = useRef<DeviceSessionService | null>(null);
  const audioRef = useRef<AudioFeedbackEngine | null>(null);
  const developerSessionRef = useRef(false);
  const performanceMonitorRef = useRef(new FramePerformanceMonitor());
  if (!authRef.current) authRef.current = new DeviceSessionService();
  if (!bridgeRef.current) bridgeRef.current = new GameBridge();
  if (!audioRef.current) audioRef.current = new AudioFeedbackEngine();
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const saveStatusRef = useRef<SaveStatus>("loading");
  saveStatusRef.current = saveStatus;
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
  const [assetLoadPercent, setAssetLoadPercent] = useState(0);
  const [assetWarning, setAssetWarning] = useState<string | null>(null);
  const [bootRecoveryBusy, setBootRecoveryBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackSettings>(() => loadFeedbackSettings(window.localStorage));
  const [performanceSnapshot, setPerformanceSnapshot] = useState<PerformanceSnapshot>({ tier: "measuring", averageFps: 0, lowFps: 0, samples: 0 });
  const [browserEnvironment, setBrowserEnvironment] = useState<BrowserCapabilityEnvironment>(() => readBrowserCapabilityEnvironment(window, document));
  const [networkNotice, setNetworkNotice] = useState<string | null>(null);
  const [developerSession, setDeveloperSession] = useState(false);
  const [developerPreset, setDeveloperPreset] = useState<DeveloperPresetId>("life");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(() => isStandaloneDisplay(window.matchMedia("(display-mode: standalone)").matches, Boolean((navigator as Navigator & { standalone?: boolean }).standalone)));
  const [pwaUpdateAvailable, setPwaUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const capability = useMemo(() => diagnoseBrowser(browserEnvironment), [browserEnvironment]);
  const fatalCapabilityIssues = capability.issues.filter((issue) => issue.severity === "error");
  const showOrientationNotice = capability.touch && capability.orientation === "landscape";
  const feedbackRef = useRef(feedback); feedbackRef.current = feedback;
  const updateFeedback = <K extends keyof FeedbackSettings,>(key: K, value: FeedbackSettings[K]) => setFeedback((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    saveFeedbackSettings(window.localStorage, feedback);
    document.documentElement.classList.toggle("reduced-motion", feedback.reducedMotion);
    document.documentElement.classList.toggle("large-text", feedback.largeText);
    document.documentElement.classList.toggle("high-contrast", feedback.highContrast);
    audioRef.current?.update(feedback);
    bridgeRef.current?.toGame({ type: "UPDATE_FEEDBACK_SETTINGS", payload: { movementSensitivity: feedback.movementSensitivity, screenShake: feedback.screenShake, reducedEffects: feedback.reducedEffects, largeText: feedback.largeText, highContrast: feedback.highContrast, combatCues: feedback.combatCues } });
  }, [feedback]);

  useEffect(() => {
    let noticeTimer = 0;
    const refresh = (networkChange?: "online" | "offline") => {
      setBrowserEnvironment(readBrowserCapabilityEnvironment(window, document));
      if (networkChange === "offline") setNetworkNotice("オフラインです。進行はこのブラウザに保存されます。");
      if (networkChange === "online") {
        setNetworkNotice("オンラインへ復帰しました。進行は引き続きこのブラウザに保存されます。");
        if (shouldRetrySaveAfterReconnect(screenRef.current, saveStatusRef.current)) {
          bridgeRef.current?.toGame({ type: "REQUEST_SAVE" });
        }
        window.clearTimeout(noticeTimer);
        noticeTimer = window.setTimeout(() => setNetworkNotice(null), 5000);
      }
    };
    const online = () => refresh("online");
    const offline = () => refresh("offline");
    const resize = () => refresh();
    window.addEventListener("online", online); window.addEventListener("offline", offline);
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", resize);
    return () => {
      window.clearTimeout(noticeTimer);
      window.removeEventListener("online", online); window.removeEventListener("offline", offline);
      window.removeEventListener("resize", resize); window.removeEventListener("orientationchange", resize);
    };
  }, []);

  useEffect(() => {
    const beforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    let mounted = true;
    if (import.meta.env.PROD && window.isSecureContext && navigator.serviceWorker) {
      void navigator.serviceWorker.ready.then(() => { if (mounted) setOfflineReady(true); });
    }
    const installed = () => { setInstallPrompt(null); setStandalone(true); };
    const updateAvailable = () => setPwaUpdateAvailable(true);
    const controllerChanged = () => { if (reloadForUpdateRef.current) window.location.reload(); };
    window.addEventListener("beforeinstallprompt", beforeInstall); window.addEventListener("appinstalled", installed); window.addEventListener(PWA_UPDATE_EVENT, updateAvailable);
    navigator.serviceWorker?.addEventListener("controllerchange", controllerChanged);
    return () => {
      mounted = false;
      window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", installed); window.removeEventListener(PWA_UPDATE_EVENT, updateAvailable);
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChanged);
    };
  }, []);

  useEffect(() => {
    if (screen !== "game") return;
    const monitor = performanceMonitorRef.current; monitor.reset(); let frame = 0; let lastPublishedTier: PerformanceSnapshot["tier"] = "measuring";
    const sample = (timestamp: number) => {
      const snapshot = monitor.addFrame(timestamp);
      if (snapshot.tier !== "measuring" && (snapshot.tier !== lastPublishedTier || snapshot.samples % 60 === 0)) { lastPublishedTier = snapshot.tier; setPerformanceSnapshot(snapshot); }
      frame = window.requestAnimationFrame(sample);
    };
    frame = window.requestAnimationFrame(sample);
    return () => window.cancelAnimationFrame(frame);
  }, [screen]);

  const applyRecommendedPerformance = () => setFeedback((current) => ({ ...current, reducedEffects: true, screenShake: false, reducedMotion: true }));

  const prepareTitle = () => {
    developerSessionRef.current = false; setDeveloperSession(false);
    audioRef.current?.stopAmbient();
    setScreen("loading"); setLoadError(null); setLoadWarning(null); setSaveStatus("loading");
    void loadSave().then(({ save, pendingConflict, cloudUnavailable }) => {
      if (pendingConflict) setLoadWarning("この端末の未送信データより新しいクラウドセーブがあります。クラウド版を使用し、端末データは上書きせず保留しています。");
      else if (cloudUnavailable) setLoadWarning("クラウドへ接続できないため、端末に保存した最新データを読み込みました。進行は端末へ保留し、接続後に保存できます。");
      setAvailableSave(save); setSaveStatus(cloudUnavailable ? "dirty" : save ? "saved" : "dirty"); setScreen("title");
    }).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "セーブデータを読み込めませんでした。"); setSaveStatus("error"); setScreen("title");
    });
  };

  const continueGame = () => {
    if (!availableSave) return;
    bridgeRef.current?.toGame({ type: "LOAD_GAME", payload: availableSave });
    bridgeRef.current?.toGame({ type: "RESUME_GAME" }); audioRef.current?.startAmbient(); setScreen("game");
  };
  const startNewGame = () => {
    if (availableSave && !confirmNew) { setConfirmNew(true); return; }
    const begin = () => {
      setAvailableSave(null); bridgeRef.current?.toGame({ type: "START_NEW_GAME" }); bridgeRef.current?.toGame({ type: "RESUME_GAME" }); audioRef.current?.startAmbient();
      setSaveStatus("dirty"); setConfirmNew(false); setScreen("game");
    };
    if (!availableSave) { begin(); return; }
    setScreen("loading"); setLoadError(null);
    void resetSave().then(begin).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "セーブデータを初期化できませんでした。"); setSaveStatus("error"); setConfirmNew(false); setScreen("title");
    });
  };
  const openMenu = () => { bridgeRef.current?.toGame({ type: "PAUSE_GAME" }); audioRef.current?.stopAmbient(); setScreen("menu"); };
  const resumeGame = () => { bridgeRef.current?.toGame({ type: "RESUME_GAME" }); audioRef.current?.startAmbient(); setScreen("game"); };
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
    audioRef.current?.stopAmbient();
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
  const launchDeveloperPreset = () => {
    developerSessionRef.current = true; setDeveloperSession(true);
    bridgeRef.current?.toGame({ type: "LOAD_GAME", payload: createDeveloperPreset(developerPreset) });
    bridgeRef.current?.toGame({ type: "RESUME_GAME" }); audioRef.current?.startAmbient(); setSaveStatus("saved"); setScreen("game");
  };
  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null);
  };
  const applyPwaUpdate = async (saveAlreadyCompleted = false) => {
    if (shouldSaveBeforeAppUpdate(saveAlreadyCompleted, developerSessionRef.current, saveStatusRef.current)) {
      pendingExitRef.current = "update";
      bridgeRef.current?.toGame({ type: "REQUEST_SAVE" });
      return;
    }
    reloadForUpdateRef.current = true;
    if (!await activateWaitingServiceWorker(navigator)) window.location.reload();
  };
  const clearAppCacheAndReload = async () => {
    setBootRecoveryBusy(true);
    try { if ("caches" in window) await clearMoribitoAppCache(navigator, window.caches); }
    finally { window.location.reload(); }
  };

  useEffect(() => {
    if (!gameHost.current || !bridgeRef.current) return;
    const bridge = bridgeRef.current;
    const unsubscribe = bridge.onReact((event) => {
      if (event.type === "GAME_READY") {
        setReady(true); setAssetLoadPercent(100);
        bridge.toGame({ type: "PAUSE_GAME" });
        const restoredSession = authRef.current?.restoreSession() ?? null;
        if (restoredSession) { setSession(restoredSession); setSaveUserId(restoredSession.userId); prepareTitle(); }
        else setScreen("auth");
        bridge.toGame({ type: "UPDATE_FEEDBACK_SETTINGS", payload: { movementSensitivity: feedbackRef.current.movementSensitivity, screenShake: feedbackRef.current.screenShake, reducedEffects: feedbackRef.current.reducedEffects, largeText: feedbackRef.current.largeText, highContrast: feedbackRef.current.highContrast, combatCues: feedbackRef.current.combatCues } });
      }
      if (event.type === "ASSET_LOAD_PROGRESS") setAssetLoadPercent(event.payload.percent);
      if (event.type === "ASSET_WARNING") setAssetWarning(event.payload.message);
      if (event.type === "GAME_ERROR") {
        if (event.payload.fatal) { setReady(false); setBootError(event.payload.message); setScreen("auth"); audioRef.current?.stopAmbient(); }
        else setAssetWarning(event.payload.message);
      }
      if (event.type === "SAVE_STATE_CHANGED") {
        setSaveStatus(event.payload.status);
        if (event.payload.status === "saving" || event.payload.status === "saved") setSaveFailure(null);
        if (event.payload.status === "saved" && pendingExitRef.current) {
          const destination = pendingExitRef.current; pendingExitRef.current = null;
          if (destination === "signout") completeSignOut();
          else if (destination === "update") void applyPwaUpdate(true);
          else prepareTitle();
        }
      }
      if (event.type === "SAVE_REQUEST") {
        if (developerSessionRef.current) {
          bridge.toGame({ type: "SAVE_COMPLETED", payload: { revision: event.payload.revision, savedAt: event.payload.savedAt } });
          return;
        }
        void putSave(event.payload)
          .then((result) => bridge.toGame({ type: "SAVE_COMPLETED", payload: result }))
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "Save failed.";
            console.error("Save failed:", message);
            pendingExitRef.current = null;
            setSaveFailure(error instanceof SaveRequestError && error.kind === "conflict"
              ? { message: "別の端末に新しいクラウドセーブがあります。現在のデータでは上書きできません。タイトルへ戻ってクラウド版を読み込み直してください。", retryable: false }
              : { message, retryable: true });
            bridge.toGame({ type: "SAVE_FAILED", payload: { message } });
          });
      }
      if (event.type === "GAME_FEEDBACK") {
        audioRef.current?.play(event.payload.kind, event.payload.channel);
        if (feedbackRef.current.vibration && "vibrate" in navigator) navigator.vibrate(feedbackPattern(event.payload.kind));
      }
    });
    const unbindLifecycleSave = bindLifecycleSave(document, window, () => screenRef.current, () => bridge.toGame({ type: "REQUEST_SAVE" }));
    const parent = gameHost.current;
    let disposed = false;
    let game: { destroy(removeCanvas: boolean): void } | undefined;
    void import("../game/createGame.js")
      .then(({ createGame }) => { if (!disposed) game = createGame(parent, bridge); })
      .catch((error: unknown) => { if (!disposed) setBootError(error instanceof Error ? error.message : "ゲームエンジンを読み込めませんでした。"); });
    return () => { disposed = true; unbindLifecycleSave(); unsubscribe(); audioRef.current?.destroy(); game?.destroy(true); };
  }, []);

  return <main className={`app-shell ${screen === "game" ? "is-playing" : "is-overlay"}`}>
    <header className="app-header" aria-hidden="true">
      <div><span className="eyebrow">FIRST PLAYABLE · PHASE 8</span><h1>結師</h1></div>
      <div className="header-actions">
        <span className={`save-status ${saveStatus}`}>{developerSession ? "テスト中" : statusText[saveStatus]}</span>
        <span className="api-status">端末内保存</span>
        <button type="button" disabled={developerSession || !ready || saveStatus === "saving" || saveStatus === "loading"} onClick={() => bridgeRef.current?.toGame({ type: "REQUEST_SAVE" })}>{developerSession ? "保存対象外" : "セーブ"}</button>
        {screen === "game" && <button type="button" onClick={openMenu}>メニュー</button>}
        {session && screen !== "game" && <span className="account-name">{session.displayName}</span>}
        <span className={ready ? "status ready" : bootError ? "status error" : "status"}>{ready ? "GAME READY" : bootError ? "起動失敗" : "起動中…"}</span>
      </div>
    </header>
    <section className="game-frame" aria-label="Moribito game canvas">
      <div ref={gameHost} className="game-host" />
      {screen === "game" && <button type="button" className="game-pause-button" aria-label="ポーズ・設定" onClick={openMenu}>⚙</button>}
      {(networkNotice || !capability.features.online) && <div className={`network-banner ${capability.features.online ? "restored" : "offline"}`} role="status">{networkNotice ?? "オフラインです。進行はこのブラウザに保存されます。"}</div>}
      {pwaUpdateAvailable && <div className="update-banner" role="status"><span>新しいバージョンを利用できます</span><button type="button" onClick={() => void applyPwaUpdate()}>更新して再起動</button></div>}
      {assetWarning && <div className="asset-warning-banner" role="status"><span>{assetWarning}</span><button type="button" onClick={() => setAssetWarning(null)}>閉じる</button></div>}
      {showOrientationNotice && <div className="orientation-notice" role="status">端末を縦向きにすると操作しやすくなります</div>}
      {saveFailure && <div className="save-error-banner" role="alert"><span>{saveFailure.message}</span>{saveFailure.retryable && <button type="button" onClick={() => bridgeRef.current?.toGame({ type: "REQUEST_SAVE" })}>保存を再試行</button>}</div>}
      {(!capability.supported || screen !== "game") && <div className="title-screen" role="dialog" aria-label={!capability.supported ? "対応環境エラー" : screen === "menu" ? "一時停止メニュー" : "結師 タイトル画面"}>
        {!capability.supported ? <div className="title-panel capability-error-panel">
          <span className="title-kicker">BROWSER CHECK</span><h2>対応環境を確認してください</h2>
          <ul>{fatalCapabilityIssues.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul>
          <div className="title-actions"><button type="button" onClick={() => window.location.reload()}>環境を確認して再読み込み</button></div>
        </div> : screen === "auth" ? <div className="title-panel auth-panel">
          <span className="title-kicker">MORIBITO</span><h2>結師</h2>
          <p>{bootError ?? "人と妖怪の絆を結ぶ、村での暮らしを始めましょう。"}</p>
          {!ready && !bootError && <div className="asset-progress" aria-label={`ゲームデータ読込 ${assetLoadPercent}%`}><span style={{ width: `${assetLoadPercent}%` }} /></div>}
          <div className="title-actions">{bootError ? <><button type="button" onClick={() => window.location.reload()}>ゲームを再読み込み</button>{"caches" in window && <button type="button" className="warning-action" disabled={bootRecoveryBusy} onClick={() => void clearAppCacheAndReload()}>{bootRecoveryBusy ? "キャッシュを削除中…" : "アプリキャッシュを消して再試行"}</button>}</> : <button type="button" className="primary" onClick={signIn}>はじめる</button>}</div>
          <small>アカウント不要。このブラウザに保存します。ブラウザのデータ削除で進行が失われます。端末間同期はありません。</small>
        </div> : screen === "menu" ? <div className="title-panel pause-panel">
          <span className="title-kicker">PAUSE</span>
          <h2>一時停止</h2>
          <p>{pendingExitRef.current === "title" ? "保存完了後にタイトルへ戻ります…" : pendingExitRef.current === "signout" ? "保存完了後に開始画面へ戻ります…" : "村の時間とゲーム操作を停止しています"}</p>
          <div className="title-actions">
            <button type="button" className="primary" onClick={resumeGame}>ゲームに戻る</button>
            <button type="button" onClick={() => bridgeRef.current?.toGame({ type: "REQUEST_SAVE" })}>現在の進行を保存</button>
            <button type="button" className="subtle" onClick={returnToTitle}>保存してタイトルへ戻る</button>
            <button type="button" className="subtle" onClick={signOut}>開始画面へ</button>
          </div>
          <div className="settings-panel" aria-label="音響と演出の設定">
            <h3>音響・演出設定</h3>
            <div className={`performance-status ${performanceSnapshot.tier}`}><strong>端末性能</strong><span>{performanceSnapshot.tier === "measuring" ? "測定中" : `${performanceSnapshot.averageFps} FPS（低下時 ${performanceSnapshot.lowFps}）`}</span></div>
            <div className="capability-status" aria-label="ブラウザ対応状況">
              <strong>ブラウザ</strong>
              <span className={capability.features.online ? "ok" : "warning"}>{capability.features.online ? "オンライン" : "オフライン"}</span>
              <span>{capability.touch ? "タッチ操作" : "マウス操作"}</span>
              <span>{capability.orientation === "portrait" ? "縦画面" : "横画面"}</span>
              <span className={capability.features.audioContext ? "ok" : "warning"}>音声 {capability.features.audioContext ? "対応" : "非対応"}</span>
              <span className={capability.features.vibration ? "ok" : "muted"}>振動 {capability.features.vibration ? "対応" : "非対応"}</span>
              <span>保存先：このブラウザ（端末間同期なし）</span>
            </div>
            {(performanceSnapshot.tier === "limited" || performanceSnapshot.tier === "poor") && !feedback.reducedEffects && <button type="button" className="performance-recommendation" onClick={applyRecommendedPerformance}>推奨軽量設定を適用</button>}
            {([['bgm', 'BGM'], ['se', '効果音'], ['asmr', '調理・環境音']] as const).map(([key, label]) => <label key={key}><span>{label}</span><input type="range" min="0" max="1" step="0.05" value={feedback[key]} onChange={(event) => updateFeedback(key, Number(event.target.value))} /><output>{Math.round(feedback[key] * 100)}%</output></label>)}
            <button type="button" className="setting-toggle" aria-pressed={feedback.vibration} onClick={() => updateFeedback("vibration", !feedback.vibration)}>振動 {feedback.vibration ? "ON" : "OFF"}</button>
            <button type="button" className="setting-toggle" aria-pressed={feedback.reducedMotion} onClick={() => updateFeedback("reducedMotion", !feedback.reducedMotion)}>演出軽減 {feedback.reducedMotion ? "ON" : "OFF"}</button>
            <label><span>移動感度</span><input type="range" min="0.8" max="1.2" step="0.05" value={feedback.movementSensitivity} onChange={(event) => updateFeedback("movementSensitivity", Number(event.target.value))} /><output>{Math.round(feedback.movementSensitivity * 100)}%</output></label>
            <button type="button" className="setting-toggle" aria-pressed={feedback.screenShake} onClick={() => updateFeedback("screenShake", !feedback.screenShake)}>画面揺れ {feedback.screenShake ? "ON" : "OFF"}</button>
            <button type="button" className="setting-toggle" aria-pressed={feedback.reducedEffects} onClick={() => updateFeedback("reducedEffects", !feedback.reducedEffects)}>軽量演出 {feedback.reducedEffects ? "ON" : "OFF"}</button>
            <button type="button" className="setting-toggle" aria-pressed={feedback.largeText} onClick={() => updateFeedback("largeText", !feedback.largeText)}>文字拡大 {feedback.largeText ? "ON" : "OFF"}</button>
            <button type="button" className="setting-toggle" aria-pressed={feedback.highContrast} onClick={() => updateFeedback("highContrast", !feedback.highContrast)}>高コントラスト {feedback.highContrast ? "ON" : "OFF"}</button>
            <button type="button" className="setting-toggle" aria-pressed={feedback.combatCues} onClick={() => updateFeedback("combatCues", !feedback.combatCues)}>戦闘文字予兆 {feedback.combatCues ? "ON" : "OFF"}</button>
          </div>
          {import.meta.env.DEV && <div className="developer-panel" aria-label="開発用テストメニュー">
            <h3>開発用テストメニュー</h3>
            <p>実セーブを変更せず、選択した確認地点から開始します。</p>
            <select value={developerPreset} onChange={(event) => setDeveloperPreset(event.target.value as DeveloperPresetId)}>
              {Object.entries(DEVELOPER_PRESETS).map(([id, preset]) => <option key={id} value={id}>{preset.label}</option>)}
            </select>
            <small>{DEVELOPER_PRESETS[developerPreset].description}</small>
            <button type="button" onClick={launchDeveloperPreset}>この状態でテスト開始</button>
          </div>}
        </div> : <div className="title-panel">
          <span className="title-kicker">人と妖怪を、もう一度結ぶ物語</span>
          <h2>結師</h2>
          <p className={loadWarning ? "load-warning" : undefined}>{screen === "loading" ? "セーブデータを確認しています…" : loadError ?? loadWarning ?? (availableSave ? saveSummary(availableSave) : "守人村へ帰郷し、新しい生活を始めます")}</p>
          <small>このブラウザに保存します。端末間同期はありません。ブラウザのデータ削除で進行が失われます。</small>
          {import.meta.env.PROD && <small role="status">{!window.isSecureContext || !navigator.serviceWorker ? "この環境ではオフライン起動に対応していません。" : offlineReady ? "オフライン用データの準備ができました。" : "オフライン用データは準備未完了です。通信と端末の空き容量を確認し、完了までは通信を切らずにお待ちください。"}</small>}
          {screen === "title" && <div className="title-actions">
            {availableSave && <button type="button" className="primary" onClick={continueGame}>続きから</button>}
            <button type="button" onClick={startNewGame}>{confirmNew ? "もう一度押して新しく始める" : "新しく始める"}</button>
            {confirmNew && <button type="button" className="subtle" onClick={() => setConfirmNew(false)}>キャンセル</button>}
            {loadWarning && <button type="button" className="warning-action" onClick={discardConflictingPendingSave}>{confirmDiscardPending ? "もう一度押して端末データを破棄" : "端末の未送信データを破棄"}</button>}
            {confirmDiscardPending && <button type="button" className="subtle" onClick={() => setConfirmDiscardPending(false)}>破棄をキャンセル</button>}
            {loadError && <button type="button" className="subtle" onClick={prepareTitle}>読み込みを再試行</button>}
            {!standalone && installPrompt && <button type="button" className="install-action" onClick={() => void installApp()}>ホーム画面に追加</button>}
          </div>}
        </div>}
      </div>}
    </section>
    <footer aria-hidden="true">結師</footer>
  </main>;
}
