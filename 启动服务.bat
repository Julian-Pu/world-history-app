@echo off
title World History Learning Platform
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File start.ps1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a ^>nul 2^>^&1
)
exit /b 0
