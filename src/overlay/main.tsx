import React from "react";
import ReactDOM from "react-dom/client";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import PresenceMark from "./PresenceMark";
import RecordingOverlay from "./RecordingOverlay";
import "./PresenceMark.css";
import {
  applyTheme,
  getStoredTheme,
  syncThemeFromSettings,
} from "@/lib/utils/theme";
import type { Theme } from "@/bindings";
import "@/i18n";

// A separate webview from the settings window, so the overlay has to set
// `data-theme` on its own document: last-known theme before render (shared
// localStorage) to avoid a flash, reconcile with the persisted setting in case
// the overlay booted first, then follow live changes.
applyTheme(getStoredTheme());
syncThemeFromSettings();
listen<Theme>("theme-changed", (event) => applyTheme(event.payload));

const isPresenceMark = getCurrentWindow().label === "presence_mark";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isPresenceMark ? <PresenceMark /> : <RecordingOverlay />}
  </React.StrictMode>,
);
