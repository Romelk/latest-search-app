#!/bin/bash

# NRF Search POC - Startup Script
# This script starts the frontend and backend servers

set -e

echo "🚀 Starting NRF Search POC Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if ports are already in use
echo "📋 Checking ports..."
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo "   Frontend may already be running or using alternate port"
fi

if check_port 5000; then
    echo -e "${YELLOW}⚠️  Port 5000 is already in use${NC}"
    echo "   Backend may already be running"
fi

if check_port 8080; then
    echo -e "${YELLOW}⚠️  Port 8080 is already in use${NC}"
    echo "   Fashion Agent Backend may already be running"
fi
echo ""

# Start Backend Server
echo -e "${BLUE}🔧 Starting Backend Server (Port 5000)...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "   Installing backend dependencies..."
    npm install
fi
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo ""
cd ..

# Wait a moment for backend to start
sleep 2

# Start Fashion Agent Backend
echo -e "${BLUE}🤖 Starting Fashion Agent Backend (Port 8080)...${NC}"
cd fashion-agent-backend
if [ ! -d "node_modules" ]; then
    echo "   Installing fashion agent dependencies..."
    npm install
fi
nohup npm run dev > ../logs/fashion-agent.log 2>&1 &
FASHION_AGENT_PID=$!
echo "   Fashion Agent PID: $FASHION_AGENT_PID"
echo ""
cd ..

# Wait a moment for fashion agent to start
sleep 2

# Start Frontend Server
echo -e "${BLUE}🎨 Starting Frontend Server (Port 3000)...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install
fi
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo ""
cd ..

# Wait for servers to fully start
echo "⏳ Waiting for servers to start..."
sleep 5

# Check if processes are still running
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend running on http://localhost:5000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may have failed to start. Check logs/backend.log${NC}"
fi

if ps -p $FASHION_AGENT_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Fashion Agent running on http://localhost:8080${NC}"
else
    echo -e "${YELLOW}⚠️  Fashion Agent may have failed to start. Check logs/fashion-agent.log${NC}"
fi

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend running on http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may have failed to start. Check logs/frontend.log${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Application started successfully!${NC}"
echo ""
echo "📱 Access the application:"
echo "   - Landing Page: http://localhost:3000"
echo "   - New Search: http://localhost:3000/new-search"
echo "   - Toolkit: http://localhost:3000/toolkit"
echo ""
echo "📝 View logs:"
echo "   - Backend: tail -f logs/backend.log"
echo "   - Fashion Agent: tail -f logs/fashion-agent.log"
echo "   - Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop the application, run: ./shutdown.sh"
echo ""

# Save PIDs to file for shutdown script
mkdir -p .pids
echo $BACKEND_PID > .pids/backend.pid
echo $FASHION_AGENT_PID > .pids/fashion-agent.pid
echo $FRONTEND_PID > .pids/frontend.pid
