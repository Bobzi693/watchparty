@echo off
chcp 65001 >nul
title WatchParty Server
cls
echo.
echo  ^>^>^>  WatchParty  ^<^<^<
echo  ================================
echo.
echo  [1/3] Запускаю сервер...
start "WatchParty Server" /min cmd /c "cd /d server && npx tsx src/index.ts"
if errorlevel 1 (
    echo  Ошибка: не удалось запустить сервер!
    pause
    exit /b 1
)
timeout /t 4 /nobreak >nul

echo  [2/3] Запускаю туннель (публичный доступ)...
start "WatchParty Tunnel" cmd /k "echo Публичная ссылка появится ниже && npx localtunnel --port 3001"
timeout /t 7 /nobreak >nul

echo  [3/3] Готово!
echo.
echo  +------------------------------------------------------+
echo  ^|                                                      ^|
echo  ^|  Локально:    http://localhost:3001                  ^|
echo  ^|  По WiFi:     http://192.168.1.??? :3001             ^|
echo  ^|                                                      ^|
echo  ^|  Публичный доступ — в окне Tunnel                    ^|
echo  ^|  Подруга открывает ссылку вида *.loca.lt             ^|
echo  ^|  Если просит нажать кнопку — нажми "Click to Continue"^|
echo  ^|                                                      ^|
echo  +------------------------------------------------------+
echo.
echo  ^> Чтобы остановить сервер — просто закрой это окно.
echo.
