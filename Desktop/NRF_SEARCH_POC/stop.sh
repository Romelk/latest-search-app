#!/bin/bash

# NRF Search POC - Unified Stop Script
# Stops: Backend (8080), Fashion Agent (8001), Python Backend (8000), Frontend (3000)

echo "=============================================="
echo "🛑 Stopping NRF Search POC Application"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to kill process by PID
kill_process() {
    local PID=$1
    local NAME=$2

    if [ -n "$PID" ] && ps -p $PID > /dev/null 2>&1; then
        echo "   Stopping $NAME (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        sleep 1
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}   ⚠️  Process $PID still running, forcing...${NC}"
            kill -9 $PID 2>/dev/null
        fi
        echo -e "${GREEN}   ✅ $NAME stopped${NC}"
        return 0
    fi
    return 1
}

# Function to kill processes by port
kill_by_port() {
    local PORT=$1
    local NAME=$2

    PIDS=$(lsof -ti:$PORT 2>/dev/null)

    if [ -n "$PIDS" ]; then
        echo "   Stopping $NAME on port $PORT (PIDs: $PIDS)..."
        for PID in $PIDS; do
            kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        done
        sleep 1
        echo -e "${GREEN}   ✅ $NAME stopped${NC}"
        return 0
    fi
    return 1
}

STOPPED_COUNT=0

# Try to stop using saved PIDs first
if [ -d "$SCRIPT_DIR/.pids" ]; then
    echo "📋 Stopping services using saved PIDs..."

    if [ -f "$SCRIPT_DIR/.pids/backend.pid" ]; then
        BACKEND_PID=$(cat "$SCRIPT_DIR/.pids/backend.pid")
        if kill_process $BACKEND_PID "Backend"; then
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        fi
    fi

    if [ -f "$SCRIPT_DIR/.pids/fashion-agent.pid" ]; then
        FASHION_AGENT_PID=$(cat "$SCRIPT_DIR/.pids/fashion-agent.pid")
        if kill_process $FASHION_AGENT_PID "Fashion Agent"; then
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        fi
    fi

    if [ -f "$SCRIPT_DIR/.pids/python-backend.pid" ]; then
        PYTHON_PID=$(cat "$SCRIPT_DIR/.pids/python-backend.pid")
        if kill_process $PYTHON_PID "Python Backend"; then
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        fi
    fi

    if [ -f "$SCRIPT_DIR/.pids/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$SCRIPT_DIR/.pids/frontend.pid")
        if kill_process $FRONTEND_PID "Frontend"; then
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        fi
    fi

    # Clean up PID files
    rm -rf "$SCRIPT_DIR/.pids"
    echo ""
fi

# Fallback: Kill by port (in case PIDs are stale or missing)
echo "🔍 Checking for any remaining processes on ports..."

if kill_by_port 8080 "Backend"; then
    STOPPED_COUNT=$((STOPPED_COUNT + 1))
else
    echo "   ℹ️  No process found on port 8080"
fi

if kill_by_port 8001 "Fashion Agent"; then
    STOPPED_COUNT=$((STOPPED_COUNT + 1))
else
    echo "   ℹ️  No process found on port 8001"
fi

if kill_by_port 8000 "Python Backend"; then
    STOPPED_COUNT=$((STOPPED_COUNT + 1))
else
    echo "   ℹ️  No process found on port 8000"
fi

if kill_by_port 3000 "Frontend"; then
    STOPPED_COUNT=$((STOPPED_COUNT + 1))
else
    echo "   ℹ️  No process found on port 3000"
fi

echo ""

# Kill any remaining related processes (safety net)
echo "🧹 Cleaning up any remaining processes..."
pkill -f "nodemon.*backend" 2>/dev/null && echo "   Cleaned up backend processes" || true
pkill -f "ts-node.*backend" 2>/dev/null && echo "   Cleaned up TypeScript backend processes" || true
pkill -f "nodemon.*fashion-agent" 2>/dev/null && echo "   Cleaned up fashion agent processes" || true
pkill -f "alex_service.py" 2>/dev/null && echo "   Cleaned up Python backend" || true
pkill -f "next-server" 2>/dev/null && echo "   Cleaned up Next.js server" || true
pkill -f "next dev" 2>/dev/null && echo "   Cleaned up frontend processes" || true

# Also clean up any Next.js dev lock files
rm -f "$SCRIPT_DIR/frontend/.next/dev/lock" 2>/dev/null || true

echo ""
echo "=============================================="

if [ $STOPPED_COUNT -eq 0 ]; then
    echo -e "${YELLOW}ℹ️  No services were running${NC}"
else
    echo -e "${GREEN}✅ Application stopped successfully!${NC}"
    echo "   Stopped $STOPPED_COUNT service(s)"
fi

echo ""
echo "📝 Log files preserved in logs/ directory:"
echo "   • Backend:        logs/backend.log"
echo "   • Fashion Agent:  logs/fashion-agent.log"
echo "   • Python Backend: logs/python-backend.log"
echo "   • Frontend:       logs/frontend.log"
echo ""
echo "🚀 To restart the application, run: ./start.sh"
echo "=============================================="
echo ""
