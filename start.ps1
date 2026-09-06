# World History Learning Platform - Launcher
$ErrorActionPreference = "Stop"

$NodePath = "E:\ProgramData\historyApp\node-v22\node-v22.12.0-win-x64"
$BackendPath = "E:\ProgramData\historyApp\world-history-app\backend"
$DbPath = "$BackendPath\data\history.db"
$Port = 3000
$serverProcess = $null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  World History Learning Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function: Check if port is in LISTENING state (not TIME_WAIT)
function Test-PortListening {
    param([int]$Port)
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conns)
}

# Function: Get process ID listening on port
function Get-PortProcessId {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) { return $conn.OwningProcess }
    return $null
}

# Function: Wait for port to be free (handles TIME_WAIT)
function Wait-PortFree {
    param([int]$Port, [int]$TimeoutSeconds = 15)
    for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
        if (-not (Test-PortListening -Port $Port)) {
            # Also check if no connections at all (including TIME_WAIT)
            $any = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if (-not $any) { return $true }
        }
        Start-Sleep -Seconds 1
    }
    return (-not (Test-PortListening -Port $Port))
}

# [1/5] Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
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

# [2/5] Check and clean port (only LISTENING state matters, TIME_WAIT is fine)
Write-Host "[2/5] Checking port $Port..." -ForegroundColor Yellow
if (Test-PortListening -Port $Port) {
    $procId = Get-PortProcessId -Port $Port
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq "node") {
        Write-Host "  Found old node process (PID: $procId), stopping it..." -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        # Wait for port to actually be free after killing process
        $waitCount = 0
        while (Test-PortListening -Port $Port -and $waitCount -lt 10) {
            Start-Sleep -Seconds 1
            $waitCount++
        }
        Write-Host "  Old process stopped" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Port $Port is used by another process (PID: $procId, Name: $($proc.ProcessName))" -ForegroundColor Red
        Write-Host "  Please stop that process first, or change the port in server.js" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

if (Test-PortListening -Port $Port) {
    Write-Host "[ERROR] Port $Port is still in use after waiting" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  Port $Port is ready  OK" -ForegroundColor Green
Write-Host ""

# [3/5] Check database
Write-Host "[3/5] Checking database..." -ForegroundColor Yellow
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

# [4/5] Register cleanup on exit
Write-Host "[4/5] Preparing..." -ForegroundColor Yellow
# Register engine exit event to kill node process when window closes
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
} | Out-Null
Write-Host "  Ready  OK" -ForegroundColor Green
Write-Host ""

# [5/5] Start service
Write-Host "[5/5] Starting service..." -ForegroundColor Yellow
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

# Open browser after 3 seconds
$null = Start-Process -FilePath "cmd.exe" -ArgumentList "/c timeout /t 3 /nobreak >nul && start http://localhost:$Port" -WindowStyle Hidden

# Start server as process (so we can track and kill it)
Set-Location $BackendPath
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -PassThru

# Wait for server process to exit
try {
    $serverProcess.WaitForExit()
} catch {
    # Process was killed
}

# Cleanup
if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Service stopped, port released" -ForegroundColor Yellow
Start-Sleep -Seconds 2
