#!/usr/bin/env bash
# Continuity-safe local install: replace /Applications/Penny Flow.app only.
# Does NOT touch ~/Library/Application Support/com.pais.handy or the HF cache.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="Penny Flow.app"
DEST="/Applications/${APP_NAME}"
SRC=""

usage() {
  echo "Usage: $0 [--build] [path/to/Penny Flow.app]"
  echo "  --build   Run bun tauri build, then install the release bundle"
  echo "  path      Install an already-built .app (default: find release bundle under src-tauri/target)"
}

BUILD=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build) BUILD=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) SRC="$1"; shift ;;
  esac
done

find_built_app() {
  local candidates=(
    "$ROOT/src-tauri/target/release/bundle/macos/${APP_NAME}"
    "$ROOT/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/${APP_NAME}"
    "$ROOT/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/${APP_NAME}"
  )
  if [[ -n "${CARGO_TARGET_DIR:-}" ]]; then
    candidates+=("${CARGO_TARGET_DIR}/release/bundle/macos/${APP_NAME}")
  fi
  # Cursor may redirect cargo target into a sandbox cache
  if [[ -d "${HOME}/.cursor" ]]; then
    local cached
    cached="$(find /var/folders -path '*/cursor-sandbox-cache/*/cargo-target/release/bundle/macos/Penny Flow.app' -type d 2>/dev/null | head -1 || true)"
    if [[ -n "$cached" ]]; then
      candidates+=("$cached")
    fi
  fi
  local c
  for c in "${candidates[@]}"; do
    if [[ -d "$c" ]]; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

if [[ "$BUILD" -eq 1 ]]; then
  echo "Building release Penny Flow..."
  # Updater archive signing may fail without TAURI_SIGNING_PRIVATE_KEY;
  # the .app bundle is still produced before that step.
  set +e
  (cd "$ROOT" && bun tauri build)
  build_status=$?
  set -e
  if [[ "$build_status" -ne 0 ]]; then
    if SRC_FOUND="$(find_built_app)"; then
      echo "tauri build exited ${build_status}, but found ${SRC_FOUND}; continuing install."
      SRC="$SRC_FOUND"
    else
      echo "tauri build failed and no ${APP_NAME} was found." >&2
      exit "$build_status"
    fi
  fi
fi

if [[ -z "$SRC" ]]; then
  SRC="$(find_built_app || true)"
fi

if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "Could not find ${APP_NAME}. Pass --build or a path to the .app." >&2
  exit 1
fi

ENTITLEMENTS="$ROOT/src-tauri/Entitlements.plist"
if [[ ! -f "$ENTITLEMENTS" ]]; then
  ENTITLEMENTS=""
fi

echo "Quitting running Penny Flow / handy..."
osascript -e 'tell application "Penny Flow" to quit' 2>/dev/null || true
pkill -x "Penny Flow" 2>/dev/null || true
pkill -x handy 2>/dev/null || true
sleep 1

TMP="$(mktemp -d)/${APP_NAME}"
ditto "$SRC" "$TMP"

echo "Ad-hoc signing..."
if [[ -n "$ENTITLEMENTS" ]]; then
  codesign --force --deep --sign - --entitlements "$ENTITLEMENTS" "$TMP"
else
  codesign --force --deep --sign - "$TMP"
fi

echo "Installing to ${DEST} (Application Support untouched)..."
if [[ -d "$DEST" ]]; then
  rm -rf "$DEST"
fi
ditto "$TMP" "$DEST"
rm -rf "$(dirname "$TMP")"

echo "Launching..."
open "$DEST"

echo "Done. Settings, models, and analytics stay in:"
echo "  ~/Library/Application Support/com.pais.handy/"
echo "If Accessibility stops working after a rebuild, re-enable Penny Flow once in System Settings."
