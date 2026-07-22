#!/bin/bash
# WatchParty bootstrap for H1Cloud
# Запускается через Update URL: curl -s https://raw.githubusercontent.com/Bobzi693/watchparty/main/setup.sh | bash

set -e

WATCHPARTY_REPO="https://github.com/Bobzi693/watchparty.git"
WATCHPARTY_DIR="/home/container/watchparty"
WATCHPARTY_PORT="${WATCHPARTY_PORT:-3002}"
NODE_VERSION="20.17.0"

# 1. Установка Node.js если нет
if ! command -v node &>/dev/null; then
  echo "[WatchParty] Node.js не найден, устанавливаю..."
  cd /tmp
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" | tar -xJ
  cp -r "node-v${NODE_VERSION}-linux-x64/"* /usr/local/
  rm -rf "node-v${NODE_VERSION}-linux-x64"
fi

echo "[WatchParty] Node.js $(node --version), npm $(npm --version)"

# 2. Клонируем или обновляем репозиторий
if [ -d "$WATCHPARTY_DIR/.git" ]; then
  cd "$WATCHPARTY_DIR" && git pull
else
  git clone "$WATCHPARTY_REPO" "$WATCHPARTY_DIR"
  cd "$WATCHPARTY_DIR"
fi

cd "$WATCHPARTY_DIR"

# 3. Устанавливаем зависимости и собираем клиент
cd server && npm install --omit=dev && cd ..
cd client && npm install && npm run build && cd ..

# 4. Запускаем WatchParty (если ещё не запущен)
if ! curl -sf http://localhost:$WATCHPARTY_PORT/api/health > /dev/null 2>&1; then
  PORT=$WATCHPARTY_PORT nohup node server/dist/index.js > /tmp/watchparty.log 2>&1 &
  echo "[WatchParty] Запущен на порту $WATCHPARTY_PORT (PID $!)"
else
  echo "[WatchParty] Уже запущен на порту $WATCHPARTY_PORT"
fi
