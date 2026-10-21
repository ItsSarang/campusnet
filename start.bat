@echo off
title CampusNet - Campus Network Manager

echo ==========================================================
echo   CampusNet - Campus Network Management System
echo   Cisco Packet Tracer Integration
echo ==========================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python 3 is not installed or not in PATH.
        pause
        exit /b 1
    ) else (
        set PY_CMD=py
    )
) else (
    set PY_CMD=python
)

if not exist "backend\.venv" (
    echo [SETUP] Creating Python virtual environment in backend\.venv...
    %PY_CMD% -m venv backend\.venv
    call backend\.venv\Scripts\pip install --upgrade pip --quiet
    echo [SETUP] Installing backend dependencies...
    call backend\.venv\Scripts\pip install -r backend\requirements.txt --quiet
    echo [OK] Backend ready.
) else (
    if not exist "backend\.venv\Scripts\flask.exe" (
        echo [SETUP] Installing missing backend dependencies...
        call backend\.venv\Scripts\pip install -r backend\requirements.txt --quiet
    )
)

if not exist "frontend\node_modules" (
    echo [SETUP] Installing frontend packages...
    where npm >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js / npm is not installed or not in PATH.
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
echo Packet Tracer Status Notice:
echo Ensure Cisco Packet Tracer is running with:
echo packet-tracer\campusnet_backbone.pkt
echo ----------------------------------------------------------
echo.

echo [INFO] Starting Flask backend on http://127.0.0.1:5000...
start "CampusNet Backend API" cmd /k "backend\.venv\Scripts\python backend\app.py"

echo [INFO] Starting Vite frontend on http://localhost:5173...
cd frontend
call npm run dev
