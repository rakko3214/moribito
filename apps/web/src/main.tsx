import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.js";
import "./app/styles.css";
import { clearMoribitoAppCache, PWA_UPDATE_EVENT, registerMoribitoServiceWorker } from "./services/PwaService.js";
const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found");
const renderApp = () => createRoot(root).render(<StrictMode><App /></StrictMode>);
if (import.meta.env.PROD) {
  renderApp();
  void registerMoribitoServiceWorker(navigator, true, window.isSecureContext, () => window.dispatchEvent(new Event(PWA_UPDATE_EVENT))).catch((error: unknown) => console.warn("Service worker registration failed:", error));
} else {
  // A previously installed production worker must never serve stale maps while
  // testing the local development build.
  void clearMoribitoAppCache(navigator, caches)
    .catch((error: unknown) => console.warn("Development cache cleanup failed:", error))
    .finally(renderApp);
}
