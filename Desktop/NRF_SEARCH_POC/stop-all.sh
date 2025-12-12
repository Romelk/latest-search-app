#!/bin/bash

# Stop All Services Script for NRF_SEARCH_POC

echo "=============================================="
echo "🛑 Stopping NRF_SEARCH_POC Application"
echo "=============================================="
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to kill process on a port
kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "  Stopping $name (Port $port, PID: $pid)"
        kill -9 $pid 2>/dev/null
        sleep 1
        echo "  ✅ $name stopped"
    else
        echo "  ℹ️  No process found on port $port"
    fi
}

# Stop by ports
echo "📋 Stopping services by port..."
kill_port 8080 "Backend"
kill_port 8001 "Fashion Agent"
kill_port 8000 "Python Backend"
kill_port 3000 "Frontend"
echo ""

# Also kill by PIDs if they exist
if [ -f "$SCRIPT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/logs/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "  Killing Backend PID: $BACKEND_PID"
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    rm "$SCRIPT_DIR/logs/backend.pid"
fi

if [ -f "$SCRIPT_DIR/logs/fashion-agent.pid" ]; then
    FASHION_PID=$(cat "$SCRIPT_DIR/logs/fashion-agent.pid")
    if ps -p $FASHION_PID > /dev/null 2>&1; then
        echo "  Killing Fashion Agent PID: $FASHION_PID"
        kill -9 $FASHION_PID 2>/dev/null
    fi
    rm "$SCRIPT_DIR/logs/fashion-agent.pid"
fi

if [ -f "$SCRIPT_DIR/logs/python-backend.pid" ]; then
    PYTHON_PID=$(cat "$SCRIPT_DIR/logs/python-backend.pid")
    if ps -p $PYTHON_PID > /dev/null 2>&1; then
        echo "  Killing Python Backend PID: $PYTHON_PID"
        kill -9 $PYTHON_PID 2>/dev/null
    fi
    rm "$SCRIPT_DIR/logs/python-backend.pid"
fi

if [ -f "$SCRIPT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/logs/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "  Killing Frontend PID: $FRONTEND_PID"
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    rm "$SCRIPT_DIR/logs/frontend.pid"
fi

# Kill any remaining npm and python processes (safety net)
echo ""
echo "🧹 Cleaning up any remaining processes..."
pkill -f "npm run dev" 2>/dev/null && echo "  Cleaned up npm processes" || echo "  No remaining npm processes"
pkill -f "alex_service.py" 2>/dev/null && echo "  Cleaned up Python backend" || echo "  No remaining Python processes"

echo ""
echo "=============================================="
echo "✅ All services stopped successfully"
echo "=============================================="
echo ""
