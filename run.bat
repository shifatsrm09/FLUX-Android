@echo off
title FLUX Android - Emulator Runner
cd /d "%~dp0"

echo ===================================================
echo   FLUX Android - Emulator Launcher
echo ===================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File ".\run-emulator.ps1" %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Process exited with code %ERRORLEVEL%.
)

echo.
pause
