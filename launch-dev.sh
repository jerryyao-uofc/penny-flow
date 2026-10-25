#!/bin/bash
set -u
export PATH="/opt/homebrew/bin:${HOME}/.cargo/bin:/usr/bin:/bin:/usr/sbin:/sbin"
if [ -f "${HOME}/.cargo/env" ]; then
  . "${HOME}/.cargo/env"
fi
unset CARGO_TARGET_DIR

APP_ROOT="/Users/jerry/Desktop/Consulting/Handy"
LOG_DIR="${HOME}/Library/Logs"
LOG="${LOG_DIR}/Handy Local.dev.log"
DEV_BIN="${APP_ROOT}/src-tauri/target/debug/handy"
SNAPSHOT_BIN="${HOME}/Library/Application Support/Handy Local/Handy Local.app/Contents/MacOS/handy"

mkdir -p "${LOG_DIR}"

dev_pids() {
  pgrep -f "${DEV_BIN}" || true
  pgrep -f "${APP_ROOT}/node_modules/.bin/tauri dev" || true
}

existing="$(dev_pids | awk 'NF' | sort -u)"
if [ -n "${existing}" ]; then
  pid="$(printf '%s\n' "${existing}" | head -1)"
  osascript -e "tell application \"System Events\" to set frontmost of first process whose unix id is ${pid} to true" >/dev/null 2>&1 || true
  exit 0
fi

if pgrep -f "${SNAPSHOT_BIN}" >/dev/null 2>&1; then
  pkill -f "${SNAPSHOT_BIN}" || true
  sleep 0.5
fi

cd "${APP_ROOT}"
nohup bun tauri dev >>"${LOG}" 2>&1 &
echo $! > "${LOG_DIR}/Handy Local.dev.pid"
