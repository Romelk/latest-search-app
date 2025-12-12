#!/bin/bash

# Start All Services Script for NRF_SEARCH_POC
# This script starts: Backend (port 8080), Fashion Agent (port 8001), Python Backend (port 8000), Frontend (port 3000)

echo "=============================================="
echo "🚀 Starting NRF_SEARCH_POC Application"
echo "=============================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "Killing existing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Check and kill existing processes
echo "📋 Checking for existing processes..."
if check_port 8080; then
    echo "  ⚠️  Port 8080 (Backend) is in use"
    kill_port 8080
fi
if check_port 8001; then
    echo "  ⚠️  Port 8001 (Fashion Agent) is in use"
    kill_port 8001
fi
if check_port 8000; then
    echo "  ⚠️  Port 8000 (Python Backend) is in use"
    kill_port 8000
fi
if check_port 3000; then
    echo "  ⚠️  Port 3000 (Frontend) is in use"
    kill_port 3000
fi
echo ""

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Start Backend (NRF Search Backend)
echo -e "${GREEN}1. Starting Backend (Port 8080)...${NC}"
cd "$SCRIPT_DIR/backend"
npm run dev > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"
echo ""

# Wait a moment for backend to start
sleep 2

# Start Fashion Agent Backend
echo -e "${ORANGE}2. Starting Fashion Agent Backend (Port 8001)...${NC}"
cd "$SCRIPT_DIR/fashion-agent-backend"
npm run dev > "$SCRIPT_DIR/logs/fashion-agent.log" 2>&1 &
FASHION_AGENT_PID=$!
echo "   PID: $FASHION_AGENT_PID"
echo ""

# Wait a moment for fashion agent to start
sleep 2

# Start Python Backend (for Fashion Agent image generation)
echo -e "${ORANGE}3. Starting Python Backend (Port 8000)...${NC}"
cd "$SCRIPT_DIR/fashion-agent-python-backend"
python3 alex_service.py > "$SCRIPT_DIR/logs/python-backend.log" 2>&1 &
PYTHON_PID=$!
echo "   PID: $PYTHON_PID"
echo ""

# Wait a moment for python backend to start
sleep 2

# Start Frontend
echo -e "${BLUE}4. Starting Frontend (Port 3000)...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check if all services are running
echo ""
echo "=============================================="
echo "📊 Service Status:"
echo "=============================================="

if check_port 8080; then
    echo -e "${GREEN}✅ Backend running on http://localhost:8080${NC}"
else
    echo -e "❌ Backend failed to start (check logs/backend.log)"
fi

if check_port 8001; then
    echo -e "${ORANGE}✅ Fashion Agent running on http://localhost:8001${NC}"
else
    echo -e "❌ Fashion Agent failed to start (check logs/fashion-agent.log)"
fi

if check_port 8000; then
    echo -e "${ORANGE}✅ Python Backend running on http://localhost:8000${NC}"
else
    echo -e "❌ Python Backend failed to start (check logs/python-backend.log)"
fi

if check_port 3000; then
    echo -e "${BLUE}✅ Frontend running on http://localhost:3000${NC}"
else
    echo -e "❌ Frontend failed to start (check logs/frontend.log)"
fi

echo ""
echo "=============================================="
echo "📝 Logs available at:"
echo "   Backend:        logs/backend.log"
echo "   Fashion Agent:  logs/fashion-agent.log"
echo "   Python Backend: logs/python-backend.log"
echo "   Frontend:       logs/frontend.log"
echo ""
echo "🌐 Open your browser to: http://localhost:3000"
echo ""
echo "To stop all services, run: ./stop-all.sh"
echo "Or press Ctrl+C and run: pkill -f 'npm run dev'"
echo "=============================================="
echo ""

# Save PIDs for later cleanup
echo $BACKEND_PID > "$SCRIPT_DIR/logs/backend.pid"
echo $FASHION_AGENT_PID > "$SCRIPT_DIR/logs/fashion-agent.pid"
echo $PYTHON_PID > "$SCRIPT_DIR/logs/python-backend.pid"
echo $FRONTEND_PID > "$SCRIPT_DIR/logs/frontend.pid"

# Trap Ctrl+C and cleanup
trap 'echo ""; echo "🛑 Stopping all services..."; kill $BACKEND_PID $FASHION_AGENT_PID $PYTHON_PID $FRONTEND_PID 2>/dev/null; exit' INT

# Keep script running
wait
