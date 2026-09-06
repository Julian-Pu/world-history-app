# World History Learning Platform - Launcher
$ErrorActionPreference = "Stop"

$NodePath = "E:\ProgramData\historyApp\node-v22\node-v22.12.0-win-x64"
$BackendPath = "E:\ProgramData\historyApp\world-history-app\backend"
$DbPath = "$BackendPath\data\history.db"
$Port = 3000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  World History Learning Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# [1/4] Check Node.js
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Yellow
$nodeExe = "$NodePath\node.exe"
if (-not (Test-Path $nodeExe)) {
    Write-Host "[ERROR] node.exe not found: $NodePath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
$env:PATH = "$NodePath;$env:PATH"
$version = & node --version
Write-Host "  Node.js $version  OK" -ForegroundColor Green
Write-Host ""

# [2/4] Check port
Write-Host "[2/4] Checking port $Port..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "[INFO] Port $Port is already in use, service may be running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening browser..." -ForegroundColor Green
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:$Port"
    Write-Host ""
    Write-Host "If browser does not open, visit: http://localhost:$Port" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 0
}
Write-Host "  Port $Port is free  OK" -ForegroundColor Green
Write-Host ""

# [3/4] Check database
Write-Host "[3/4] Checking database..." -ForegroundColor Yellow
if (-not (Test-Path $DbPath)) {
    Write-Host "  Database not found, initializing..." -ForegroundColor Yellow
    Set-Location $BackendPath
    & node utils/initDatabase.js
    & node utils/importData.js
    Write-Host "  Database initialized" -ForegroundColor Green
} else {
    Write-Host "  Database exists  OK" -ForegroundColor Green
}
Write-Host ""

# [4/4] Start service
Write-Host "[4/4] Starting service..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Service started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend: http://localhost:$Port" -ForegroundColor White
Write-Host "  API:      http://localhost:$Port/api" -ForegroundColor White
Write-Host ""
Write-Host "  Browser will open in 3 seconds..." -ForegroundColor Yellow
Write-Host "  Press Ctrl+C or close this window to stop" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Open browser after 3 seconds (using a separate hidden process)
$null = Start-Process -FilePath "cmd.exe" -ArgumentList "/c timeout /t 3 /nobreak >nul && start http://localhost:$Port" -WindowStyle Hidden

# Start server (foreground)
Set-Location $BackendPath
& node server.js

Write-Host ""
Write-Host "Service stopped" -ForegroundColor Yellow
Read-Host "Press Enter to exit"
