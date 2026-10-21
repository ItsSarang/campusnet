@echo off
REM CampusNet — 1-Click Startup Script (Windows)
REM Automatically initializes virtual environment, installs packages, and launches both services.

title CampusNet — University Campus Network Manager

echo ==========================================================
echo   CampusNet — University Campus Network Management System
echo   Live Cisco Packet Tracer Integration
echo ==========================================================
echo.

REM 1. Detect Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python 3 is not installed or not in your PATH.
        echo Please install Python 3 from https://www.python.org/
        pause
        exit /b 1
    ) else (
        set PY_CMD=py
    )
) else (
    set PY_CMD=python
)

REM 2. Check and setup virtual environment
if not exist "backend\.venv" (
    echo [1/4] Creating Python virtual environment in backend\.venv ...
    %PY_CMD% -m venv backend\.venv
    call backend\.venv\Scripts\pip install --upgrade pip --quiet
    echo Installing backend dependencies (Flask, CORS)...
    call backend\.venv\Scripts\pip install -r backend\requirements.txt --quiet
    echo [OK] Backend ready.
) else (
    if not exist "backend\.venv\Scripts\flask.exe" (
        echo Installing missing backend dependencies...
        call backend\.venv\Scripts\pip install -r backend\requirements.txt --quiet
    )
)

REM 3. Check and install frontend packages
if not exist "frontend\node_modules" (
    echo [2/4] Installing frontend packages (npm install) ...
    where npm >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js / npm is not installed or not in your PATH.
        echo Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend packages installed.
)

echo.
echo ----------------------------------------------------------
echo PACKET TRACER REMINDER:
echo   1. Open Cisco Packet Tracer on your computer.
echo   2. Open: packet-tracer\campusnet_backbone.pkt
echo ----------------------------------------------------------
echo.

echo [3/4] Starting Flask API backend (port 5000)...
start "CampusNet Backend API" cmd /k "backend\.venv\Scripts\python backend\app.py"

echo [4/4] Starting Vite React Frontend (port 5173)...
cd frontend
call npm run dev
