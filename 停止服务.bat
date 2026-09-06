@echo off
title Stop World History Service
echo Stopping service on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo Killing process PID: %%a
    taskkill /F /PID %%a
)
echo.
echo Done. Port 3000 will be released shortly.
pause
