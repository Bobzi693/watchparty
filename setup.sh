#!/bin/bash
# WatchParty bootstrap for H1Cloud
# This runs in place of main.sh after an update. It installs WatchParty,
# passes control back to the original main.sh, and restores the update URL
# so the panel keeps updating normally.

set -e

LOG="/tmp/watchparty-bootstrap.log"
WATCHPARTY_REPO="https://github.com/Bobzi693/watchparty.git"
WATCHPARTY_DIR="/home/container/watchparty"
WATCHPARTY_PORT=3002
NODE_VERSION="20.17.0"
ORIGINAL_UPDATE_URL="https://my.h1cloud.net/api/vless/panel-main.sh"

log() { echo "[$(date '+%H:%M:%S')] $*" >> "$LOG"; echo "$*"; }

# 1. Установка Node.js
if ! command -v node &>/dev/null; then
  log "Устанавливаю Node.js ${NODE_VERSION}..."
  cd /tmp
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" | tar -xJ
  cp -r "node-v${NODE_VERSION}-linux-x64/"* /usr/local/
  rm -rf "node-v${NODE_VERSION}-linux-x64"
fi
log "Node.js $(node --version)"

# 2. WatchParty
if [ -d "$WATCHPARTY_DIR/.git" ]; then
  cd "$WATCHPARTY_DIR" && git pull
else
  git clone "$WATCHPARTY_REPO" "$WATCHPARTY_DIR"
  cd "$WATCHPARTY_DIR"
fi
cd "$WATCHPARTY_DIR"
cd server && npm install --omit=dev 2>/dev/null && cd ..
cd client && npm install 2>/dev/null && npm run build 2>/dev/null && cd ..

# 3. Запуск WatchParty
if ! curl -sf http://localhost:$WATCHPARTY_PORT/api/health > /dev/null 2>&1; then
  PORT=$WATCHPARTY_PORT nohup node server/dist/index.js > /tmp/watchparty.log 2>&1 &
  log "WatchParty запущен на порту $WATCHPARTY_PORT (PID $!)"
else
  log "WatchParty уже запущен"
fi

# 4. localtunnel
if command -v npx &>/dev/null && ! curl -sf http://localhost:4040/status > /dev/null 2>&1; then
  nohup npx localtunnel --port $WATCHPARTY_PORT > /tmp/localtunnel.log 2>&1 &
  sleep 5
  TUNNEL_URL=$(grep -oP 'https?://[^\s]+\.loca\.lt' /tmp/localtunnel.log | head -1)
  if [ -n "$TUNNEL_URL" ]; then
    log "WatchParty URL: $TUNNEL_URL"
    echo "$TUNNEL_URL" > /tmp/watchparty-url.txt
  fi
fi

# 5. Восстанавливаем оригинальный URL обновления
UPDATE_URL_FILE="$(dirname "$(realpath "$0")")/update_url.txt"
if [ -f "$UPDATE_URL_FILE" ]; then
  echo "$ORIGINAL_UPDATE_URL" > "$UPDATE_URL_FILE"
  log "Update URL восстановлен на оригинальный"
fi

# 6. Загружаем и запускаем оригинальный main.sh
log "Загружаю оригинальный main.sh..."
ORIG_SCRIPT="/tmp/main.sh.original"
curl -fsSL --max-time 30 -o "$ORIG_SCRIPT" "$ORIGINAL_UPDATE_URL"
chmod +x "$ORIG_SCRIPT"
log "Запускаю оригинальный main.sh"
exec /bin/bash "$ORIG_SCRIPT"
