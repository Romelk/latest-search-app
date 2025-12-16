#!/bin/bash

# NRF Search POC - Shutdown Script
# This script stops all running servers

echo "🛑 Shutting down NRF Search POC Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill process by PID
kill_process() {
    local PID=$1
    local NAME=$2
    
    if [ -n "$PID" ] && ps -p $PID > /dev/null 2>&1; then
        echo -e "   Stopping $NAME (PID: $PID)..."
        kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        sleep 1
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}   ⚠️  Process $PID still running, forcing...${NC}"
            kill -9 $PID 2>/dev/null
        fi
        echo -e "${GREEN}   ✅ $NAME stopped${NC}"
    else
        echo -e "${YELLOW}   ℹ️  $NAME not running (PID: $PID)${NC}"
    fi
}

# Function to kill processes by port
kill_by_port() {
    local PORT=$1
    local NAME=$2
    
    echo "   Checking port $PORT for $NAME..."
    PIDS=$(lsof -ti:$PORT 2>/dev/null)
    
    if [ -n "$PIDS" ]; then
        echo -e "   Found process(es) on port $PORT: $PIDS"
        for PID in $PIDS; do
            kill $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        done
        sleep 1
        echo -e "${GREEN}   ✅ Stopped processes on port $PORT${NC}"
    else
        echo -e "   ℹ️  No process found on port $PORT"
    fi
}

# Try to stop using saved PIDs first
if [ -d ".pids" ]; then
    echo "📋 Stopping servers using saved PIDs..."
    
    if [ -f ".pids/backend.pid" ]; then
        BACKEND_PID=$(cat .pids/backend.pid)
        kill_process $BACKEND_PID "Backend"
    fi
    
    if [ -f ".pids/fashion-agent.pid" ]; then
        FASHION_AGENT_PID=$(cat .pids/fashion-agent.pid)
        kill_process $FASHION_AGENT_PID "Fashion Agent"
    fi
    
    if [ -f ".pids/frontend.pid" ]; then
        FRONTEND_PID=$(cat .pids/frontend.pid)
        kill_process $FRONTEND_PID "Frontend"
    fi
    
    # Clean up PID files
    rm -rf .pids
    echo ""
fi

# Fallback: Kill by port
echo "🔍 Checking for any remaining processes on ports..."
kill_by_port 5000 "Backend"
kill_by_port 8080 "Fashion Agent"
kill_by_port 3000 "Frontend"
echo ""

# Kill any remaining node processes related to this project
echo "🧹 Cleaning up any remaining node processes..."
pkill -f "nodemon.*NRF_SEARCH_POC" 2>/dev/null || true
pkill -f "next.*NRF_SEARCH_POC" 2>/dev/null || true
pkill -f "ts-node.*NRF_SEARCH_POC" 2>/dev/null || true
echo ""

echo -e "${GREEN}✅ Application shutdown complete!${NC}"
echo ""
echo "📝 Log files preserved in logs/ directory"
echo "   - Backend: logs/backend.log"
echo "   - Fashion Agent: logs/fashion-agent.log"
echo "   - Frontend: logs/frontend.log"
echo ""
echo "🚀 To restart the application, run: ./start.sh"
echo ""
