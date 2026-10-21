#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  CampusNet - Campus Network Management System"
echo "  Cisco Packet Tracer Integration"
echo "=========================================================="

if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
else
    echo "[ERROR] Python 3 is not installed or not in PATH."
    exit 1
fi

VENV_DIR="$DIR/backend/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "[SETUP] Creating Python virtual environment in backend/.venv..."
    $PY_CMD -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install --upgrade pip --quiet
    "$VENV_DIR/bin/pip" install -r "$DIR/backend/requirements.txt" --quiet
    echo "[OK] Backend dependencies installed."
else
    if ! "$VENV_DIR/bin/python" -c "import flask" &>/dev/null; then
        echo "[SETUP] Installing backend requirements..."
        "$VENV_DIR/bin/pip" install -r "$DIR/backend/requirements.txt" --quiet
    fi
fi

if [ ! -d "$DIR/frontend/node_modules" ]; then
    echo "[SETUP] Installing frontend packages..."
    if ! command -v npm &>/dev/null; then
        echo "[ERROR] Node.js / npm is not installed or not in PATH."
        exit 1
    fi
    cd "$DIR/frontend"
    npm install
    cd "$DIR"
    echo "[OK] Frontend packages installed."
fi

echo ""
echo "----------------------------------------------------------"
echo "Packet Tracer Status Notice:"
echo "Ensure Cisco Packet Tracer is running with:"
echo "packet-tracer/campusnet_backbone.pkt"
echo "----------------------------------------------------------"
echo ""

echo "[INFO] Starting Flask backend on http://127.0.0.1:5000..."
"$VENV_DIR/bin/python" "$DIR/backend/app.py" &
BACKEND_PID=$!

sleep 1

echo "[INFO] Starting Vite frontend on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

cleanup() {
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

wait
