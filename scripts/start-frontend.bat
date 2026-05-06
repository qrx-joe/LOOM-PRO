@echo off
chcp 65001 >nul
setlocal

REM Start only Frontend environment (No Docker required)
REM Dependencies: pnpm must be installed

cd /d "%~dp0.."

REM Check pnpm
where pnpm >nul 2>nul
if errorlevel 1 (
    echo [Error] pnpm not found. Install Node.js first: https://nodejs.org/
    pause
    exit /b 1
)

echo [LOOM-PLUS] Installing frontend dependencies...
cd /d frontend
call pnpm install
if errorlevel 1 (
    echo [Error] Failed to install dependencies. See error above.
    pause
    exit /b 1
)

echo [LOOM-PLUS] Starting frontend dev server...
start "LOOM-PLUS Frontend" cmd /k "pnpm dev"

echo [LOOM-PLUS] Waiting for service to start...
timeout /t 5 >nul

echo [LOOM-PLUS] Opening browser...
start http://localhost:5173

echo [LOOM-PLUS] Frontend startup complete.
echo [Note] Backend and Database are NOT running.
endlocal
