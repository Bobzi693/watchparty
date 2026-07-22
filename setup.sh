#!/bin/bash
# WatchParty bootstrap for H1Cloud
# Запускается через Update URL панели:
#   curl -s https://raw.githubusercontent.com/Bobzi693/watchparty/master/setup.sh | bash

set -e

LOG="/tmp/watchparty-bootstrap.log"
WATCHPARTY_REPO="https://github.com/Bobzi693/watchparty.git"
WATCHPARTY_DIR="/home/container/watchparty"
WATCHPARTY_PORT=3002
NODE_VERSION="20.17.0"

log() { echo "[$(date '+%H:%M:%S')] $*" >> "$LOG"; echo "$*"; }

# 1. Node.js
if ! command -v node &>/dev/null; then
  log "Устанавливаю Node.js ${NODE_VERSION}..."
  cd /tmp
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" | tar -xJ
  cp -r "node-v${NODE_VERSION}-linux-x64/"* /usr/local/
  rm -rf "node-v${NODE_VERSION}-linux-x64"
fi
log "Node.js $(node --version), npm $(npm --version)"

# 2. WatchParty
if [ -d "$WATCHPARTY_DIR/.git" ]; then
  cd "$WATCHPARTY_DIR" && git pull
else
  git clone "$WATCHPARTY_REPO" "$WATCHPARTY_DIR"
  cd "$WATCHPARTY_DIR"
fi

cd "$WATCHPARTY_DIR"
log "Устанавливаю зависимости..."
cd server && npm install --omit=dev && cd ..
cd client && npm install && npm run build && cd ..

# 3. Запуск WatchParty
if curl -sf http://localhost:$WATCHPARTY_PORT/api/health > /dev/null 2>&1; then
  log "WatchParty уже запущен на порту $WATCHPARTY_PORT"
else
  PORT=$WATCHPARTY_PORT nohup node server/dist/index.js > /tmp/watchparty.log 2>&1 &
  log "WatchParty запущен на порту $WATCHPARTY_PORT (PID $!)"
fi

# 4. localtunnel
if command -v npx &>/dev/null; then
  if ! curl -sf http://localhost:4040/status > /dev/null 2>&1; then
    log "Запускаю localtunnel..."
    nohup npx localtunnel --port $WATCHPARTY_PORT > /tmp/localtunnel.log 2>&1 &
    sleep 5
    TUNNEL_URL=$(grep -oP 'https?://[^\s]+\.loca\.lt' /tmp/localtunnel.log | head -1)
    if [ -n "$TUNNEL_URL" ]; then
      log "======================================"
      log "WatchParty доступен по ссылке:"
      log "$TUNNEL_URL"
      log "======================================"
      echo "$TUNNEL_URL" > /tmp/watchparty-url.txt
    else
      log "localtunnel запущен, жду URL..."
    fi
  else
    log "localtunnel уже запущен"
  fi
fi

log "Готово!"
