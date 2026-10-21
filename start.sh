#!/usr/bin/env bash
# CampusNet — 1-Click Startup Script (macOS / Linux)
# Automatically initializes virtual environment, installs packages, and launches both services.

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  CampusNet — University Campus Network Management System"
echo "  Live Cisco Packet Tracer Integration"
echo "=========================================================="

# 1. Detect Python 3
if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
else
    echo "❌ Error: Python 3 is not installed or not in PATH."
    echo "Please install Python 3 (https://www.python.org/) and try again."
    exit 1
fi

# 2. Check and setup Python Virtual Environment
VENV_DIR="$DIR/backend/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 [1/4] Creating Python virtual environment in backend/.venv ..."
    $PY_CMD -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install --upgrade pip --quiet
    echo "📦 Installing backend requirements (Flask, CORS)..."
    "$VENV_DIR/bin/pip" install -r "$DIR/backend/requirements.txt" --quiet
    echo "✅ Backend dependencies ready."
else
    if ! "$VENV_DIR/bin/python" -c "import flask" &>/dev/null; then
        echo "📦 Installing missing backend requirements..."
        "$VENV_DIR/bin/pip" install -r "$DIR/backend/requirements.txt" --quiet
    fi
fi

# 3. Check and setup Frontend Node packages
if [ ! -d "$DIR/frontend/node_modules" ]; then
    echo "📦 [2/4] Installing frontend packages (npm install) ..."
    if ! command -v npm &>/dev/null; then
        echo "❌ Error: Node.js / npm is not installed or not in PATH."
        echo "Please install Node.js (https://nodejs.org/) and try again."
        exit 1
    fi
    cd "$DIR/frontend"
    npm install
    cd "$DIR"
    echo "✅ Frontend packages installed."
fi

# 4. Reminder about Cisco Packet Tracer
echo ""
echo "----------------------------------------------------------"
echo "ℹ️  PACKET TRACER REMINDER:"
echo "   1. Open Cisco Packet Tracer on your computer."
echo "   2. Open the file: packet-tracer/campusnet_backbone.pkt"
echo "----------------------------------------------------------"
echo ""

# 5. Start Backend
echo "🚀 [3/4] Starting Flask API Server on http://127.0.0.1:5000 ..."
"$VENV_DIR/bin/python" "$DIR/backend/app.py" &
BACKEND_PID=$!

sleep 1

# 6. Start Frontend
echo "🚀 [4/4] Starting Vite React Frontend on http://localhost:5173 ..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Stopping CampusNet services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

wait
