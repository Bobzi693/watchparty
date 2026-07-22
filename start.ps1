Write-Host "`n  >>> WatchParty <<<`n" -ForegroundColor Cyan

Write-Host "[1] Запускаю сервер..." -ForegroundColor Yellow
$server = Start-Job -ScriptBlock {
    Set-Location "$using:pwd\server"
    npx tsx src/index.ts
}
Start-Sleep -Seconds 4

Write-Host "[2] Запускаю туннель..." -ForegroundColor Yellow
$tunnel = Start-Job -ScriptBlock {
    npx localtunnel --port 3001
}
Start-Sleep -Seconds 5

$tunnelOutput = Receive-Job $tunnel
Write-Host "`n[3] Готово!" -ForegroundColor Green
Write-Host "`n$tunnelOutput" -ForegroundColor Cyan
Write-Host "`n+-----------------------------------------------+" -ForegroundColor Magenta
Write-Host "| Сервер: http://localhost:3001                  |" -ForegroundColor White
Write-Host "| Публичная ссылка выделена выше ^               |" -ForegroundColor White
Write-Host "| Скопируй её и кинь подруге                     |" -ForegroundColor White
Write-Host "+-----------------------------------------------+" -ForegroundColor Magenta
Write-Host "`nНажми Enter чтобы остановить всё..." -ForegroundColor Gray
Read-Host | Out-Null

Stop-Job $server -ErrorAction SilentlyContinue
Stop-Job $tunnel -ErrorAction SilentlyContinue
Remove-Job $server -ErrorAction SilentlyContinue
Remove-Job $tunnel -ErrorAction SilentlyContinue
taskkill /f /im node.exe 2>$null
