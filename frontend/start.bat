@echo off
title ParkWise - Smart Parking System
echo ======================================================
echo    Starting ParkWise Modern Smart Parking Frontend
echo ======================================================
cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Found Node.js runtime. Starting Node server...
    node server.js
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Found Python runtime. Starting HTTP server on port 3000...
    python -m http.server 3000 --directory "%~dp0"
    goto end
)

echo [ERROR] Neither Node.js nor Python was detected in PATH.
echo Please install Node.js or Python to run the local server.

:end
pause
