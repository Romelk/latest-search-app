#!/bin/bash

# NRF Search POC - Unified Startup Script
# Starts: Backend (8080), Fashion Agent (8001), Python Backend (8000), Frontend (3000)

set -e

echo "=============================================="
echo "🚀 Starting NRF Search POC Application"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on a port
kill_port() {
    local port=$1
    local name=$2
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port ($name) is in use, stopping existing process...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/.pids"

# Check and clean up ports
echo "📋 Checking ports..."
kill_port 8080 "Backend"
kill_port 8001 "Fashion Agent"
kill_port 8000 "Python Backend"
kill_port 3000 "Frontend"
echo ""

# Start Backend (Port 8080)
echo -e "${BLUE}1️⃣  Starting Backend (Port 8080)...${NC}"
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo "   Installing backend dependencies..."
    npm install
fi
nohup npm run dev > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/.pids/backend.pid"
echo "   PID: $BACKEND_PID"
echo ""
cd "$SCRIPT_DIR"

# Wait for backend to start
sleep 3

# Start Fashion Agent Backend (Port 8001)
echo -e "${BLUE}2️⃣  Starting Fashion Agent Backend (Port 8001)...${NC}"
cd "$SCRIPT_DIR/fashion-agent-backend"
if [ ! -d "node_modules" ]; then
    echo "   Installing fashion agent dependencies..."
    npm install
fi
nohup npm run dev > "$SCRIPT_DIR/logs/fashion-agent.log" 2>&1 &
FASHION_AGENT_PID=$!
echo $FASHION_AGENT_PID > "$SCRIPT_DIR/.pids/fashion-agent.pid"
echo "   PID: $FASHION_AGENT_PID"
echo ""
cd "$SCRIPT_DIR"

# Wait for fashion agent to start
sleep 3

# Start Python Backend (Port 8000)
echo -e "${BLUE}3️⃣  Starting Python Backend (Port 8000)...${NC}"
cd "$SCRIPT_DIR/fashion-agent-python-backend"
if [ ! -f "requirements.txt" ]; then
    echo -e "${YELLOW}   ⚠️  Python backend not found or requirements.txt missing${NC}"
    echo "   Skipping Python backend..."
else
    # Check if virtual environment exists, if not create it
    if [ ! -d "venv" ]; then
        echo "   Creating Python virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        echo "   Installing Python dependencies..."
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi

    nohup python3 alex_service.py > "$SCRIPT_DIR/logs/python-backend.log" 2>&1 &
    PYTHON_PID=$!
    echo $PYTHON_PID > "$SCRIPT_DIR/.pids/python-backend.pid"
    echo "   PID: $PYTHON_PID"
fi
echo ""
cd "$SCRIPT_DIR"

# Wait for python backend to start
sleep 3

# Start Frontend (Port 3000)
echo -e "${BLUE}4️⃣  Starting Frontend (Port 3000)...${NC}"
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install
fi
nohup npm run dev > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$SCRIPT_DIR/.pids/frontend.pid"
echo "   PID: $FRONTEND_PID"
echo ""
cd "$SCRIPT_DIR"

# Wait for all services to fully start
echo "⏳ Waiting for all services to start..."
sleep 5

# Verify all services are running
echo ""
echo "=============================================="
echo "📊 Service Status:"
echo "=============================================="

ALL_RUNNING=true

if check_port 8080; then
    echo -e "${GREEN}✅ Backend running on http://localhost:8080${NC}"
else
    echo -e "${RED}❌ Backend failed to start (check logs/backend.log)${NC}"
    ALL_RUNNING=false
fi

if check_port 8001; then
    echo -e "${GREEN}✅ Fashion Agent running on http://localhost:8001${NC}"
else
    echo -e "${RED}❌ Fashion Agent failed to start (check logs/fashion-agent.log)${NC}"
    ALL_RUNNING=false
fi

if check_port 8000; then
    echo -e "${GREEN}✅ Python Backend running on http://localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠️  Python Backend not running (check logs/python-backend.log)${NC}"
    echo "   (This is optional - fashion features may be limited)"
fi

if check_port 3000; then
    echo -e "${GREEN}✅ Frontend running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend failed to start (check logs/frontend.log)${NC}"
    ALL_RUNNING=false
fi

echo ""
echo "=============================================="

if [ "$ALL_RUNNING" = true ]; then
    echo -e "${GREEN}🎉 Application started successfully!${NC}"
else
    echo -e "${RED}⚠️  Some services failed to start. Check logs for details.${NC}"
fi

echo ""
echo "📱 Access the application:"
echo "   • Landing Page:  http://localhost:3000"
echo "   • New Search:    http://localhost:3000/new-search"
echo "   • Toolkit:       http://localhost:3000/toolkit"
echo ""
echo "📝 View logs:"
echo "   • Backend:        tail -f logs/backend.log"
echo "   • Fashion Agent:  tail -f logs/fashion-agent.log"
echo "   • Python Backend: tail -f logs/python-backend.log"
echo "   • Frontend:       tail -f logs/frontend.log"
echo ""
echo "🛑 To stop all services, run: ./stop.sh"
echo "=============================================="
echo ""
