Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$script:serverJob = $null
$script:tunnelJob = $null
$script:tunnelUrl = ""

$form = New-Object System.Windows.Forms.Form
$form.Text = "WatchParty"
$form.Size = New-Object Drawing.Size(560, 460)
$form.StartPosition = "CenterScreen"
$form.Font = New-Object Drawing.Font("Segoe UI", 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = "WatchParty"
$title.Font = New-Object Drawing.Font("Segoe UI", 18, [Drawing.FontStyle]::Bold)
$title.ForeColor = [Drawing.Color]::DodgerBlue
$title.Size = New-Object Drawing.Size(520, 40)
$title.Location = New-Object Drawing.Point(20, 15)
$form.Controls.Add($title)

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Multiline = $true
$logBox.ReadOnly = $true
$logBox.ScrollBars = "Vertical"
$logBox.Size = New-Object Drawing.Size(520, 200)
$logBox.Location = New-Object Drawing.Point(20, 60)
$logBox.BackColor = [Drawing.Color]::FromArgb(30, 30, 30)
$logBox.ForeColor = [Drawing.Color]::LimeGreen
$logBox.Font = New-Object Drawing.Font("Consolas", 9)
$form.Controls.Add($logBox)

$urlLabel = New-Object System.Windows.Forms.Label
$urlLabel.Text = "Ссылка появится здесь..."
$urlLabel.Size = New-Object Drawing.Size(500, 40)
$urlLabel.Location = New-Object Drawing.Point(20, 270)
$urlLabel.ForeColor = [Drawing.Color]::DimGray
$form.Controls.Add($urlLabel)

$startBtn = New-Object System.Windows.Forms.Button
$startBtn.Text = "Start"
$startBtn.Size = New-Object Drawing.Size(120, 35)
$startBtn.Location = New-Object Drawing.Point(20, 330)
$startBtn.BackColor = [Drawing.Color]::DodgerBlue
$startBtn.ForeColor = [Drawing.Color]::White
$startBtn.Add_Click({
    $startBtn.Enabled = $false
    $startBtn.Text = "Запуск..."
    $urlLabel.Text = "Запускаю сервер..."
    $logBox.Clear()
    
    $script:serverJob = Start-Job -ScriptBlock {
        Set-Location "$using:PWD\server"
        npx tsx src/index.ts 2>&1
    }
    
    Start-Sleep -Seconds 3
    $urlLabel.Text = "Запускаю туннель (pinggy)..."
    $logBox.AppendText("Подключаюсь к pinggy.io через SSH...`n")
    
    $script:tunnelJob = Start-Job -ScriptBlock {
        ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -p 443 -R 0:localhost:3001 ap@pinggy.io 2>&1
    }
    
    Start-Sleep -Seconds 2
    $timer.Start()
})
$form.Controls.Add($startBtn)

$copyBtn = New-Object System.Windows.Forms.Button
$copyBtn.Text = "Копировать ссылку"
$copyBtn.Size = New-Object Drawing.Size(150, 35)
$copyBtn.Location = New-Object Drawing.Point(160, 330)
$copyBtn.Enabled = $false
$copyBtn.Add_Click({
    if ($script:tunnelUrl) {
        [System.Windows.Forms.Clipboard]::SetText($script:tunnelUrl)
        $copyBtn.Text = "Скопировано!"
        Start-Sleep -Seconds 1
        $copyBtn.Text = "Копировать ссылку"
    }
})
$form.Controls.Add($copyBtn)

$stopBtn = New-Object System.Windows.Forms.Button
$stopBtn.Text = "Stop"
$stopBtn.Size = New-Object Drawing.Size(120, 35)
$stopBtn.Location = New-Object Drawing.Point(330, 330)
$stopBtn.BackColor = [Drawing.Color]::IndianRed
$stopBtn.ForeColor = [Drawing.Color]::White
$stopBtn.Add_Click({
    $timer.Stop()
    if ($script:serverJob) { Stop-Job $script:serverJob -Force }
    if ($script:tunnelJob) { Stop-Job $script:tunnelJob -Force }
    taskkill /f /im node.exe 2>$null
    $logBox.AppendText("`nОстановлено.`n")
    $startBtn.Enabled = $true
    $startBtn.Text = "Start"
    $urlLabel.Text = "Остановлено"
    $urlLabel.ForeColor = [Drawing.Color]::DimGray
    $copyBtn.Enabled = $false
})
$form.Controls.Add($stopBtn)

$retryBtn = New-Object System.Windows.Forms.Button
$retryBtn.Text = "Попробовать localtunnel"
$retryBtn.Size = New-Object Drawing.Size(200, 30)
$retryBtn.Location = New-Object Drawing.Point(20, 380)
$retryBtn.Add_Click({
    if ($script:tunnelJob) { Stop-Job $script:tunnelJob -Force }
    $logBox.AppendText("Переключаю на localtunnel...`n")
    $urlLabel.Text = "Запускаю localtunnel..."
    
    $script:tunnelJob = Start-Job -ScriptBlock {
        npx localtunnel --port 3001 2>&1
    }
})
$form.Controls.Add($retryBtn)

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 2000
$timer.Add_Tick({
    if ($script:serverJob -and $script:serverJob.HasMoreData) {
        $data = Receive-Job $script:serverJob
        foreach ($line in $data) {
            $logBox.AppendText("$line`n")
        }
        $logBox.SelectionStart = $logBox.Text.Length
        $logBox.ScrollToCaret()
    }
    if ($script:tunnelJob -and $script:tunnelJob.HasMoreData) {
        $data = Receive-Job $script:tunnelJob
        foreach ($line in $data) {
            $logBox.AppendText("$line`n")
            if ($line -match "https?://[a-zA-Z0-9.-]+(:\d+)?") {
                $url = $matches[0]
                if ($url -match "pinggy\.io|pinggy\.link|loca\.lt|trycloudflare\.com") {
                    $script:tunnelUrl = $url
                    $urlLabel.Text = "ССЫЛКА: $url"
                    $urlLabel.ForeColor = [Drawing.Color]::Lime
                    $urlLabel.Font = New-Object Drawing.Font("Consolas", 10, [Drawing.FontStyle]::Bold)
                    $copyBtn.Enabled = $true
                    $startBtn.Text = "Работает!"
                }
            }
        }
        $logBox.SelectionStart = $logBox.Text.Length
        $logBox.ScrollToCaret()
    }
})

$form.Add_Shown({ $form.Activate() })
$form.ShowDialog()

if ($script:serverJob) { Stop-Job $script:serverJob -Force }
if ($script:tunnelJob) { Stop-Job $script:tunnelJob -Force }
taskkill /f /im node.exe 2>$null
