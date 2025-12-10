#!/bin/bash

# Agentic Search Demo - Startup Script
# This script starts both backend and frontend servers

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🚀 Starting Agentic Search Demo                             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if servers are already running
BACKEND_PID=$(lsof -ti:8080)
FRONTEND_PID=$(lsof -ti:3000)

if [ -n "$BACKEND_PID" ]; then
  echo "⚠️  Backend already running on port 8080 (PID: $BACKEND_PID)"
  echo "   Run './stop.sh' first to stop existing servers"
  exit 1
fi

if [ -n "$FRONTEND_PID" ]; then
  echo "⚠️  Frontend already running on port 3000 (PID: $FRONTEND_PID)"
  echo "   Run './stop.sh' first to stop existing servers"
  exit 1
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start backend server in background
echo "🔧 Starting backend server (port 8080)..."
cd backend
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server in background
echo "🎨 Starting frontend server (port 3000)..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

# Wait for servers to be ready
echo ""
echo "⏳ Waiting for servers to start..."
sleep 5

# Check if servers are responding
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null)
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   ✅ Agentic Search Demo Started                              ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"

if [ "$BACKEND_STATUS" = "200" ]; then
  echo "║   Backend:  ✅ http://localhost:8080                          ║"
else
  echo "║   Backend:  ⚠️  Starting... (check logs/backend.log)          ║"
fi

if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "000" ]; then
  echo "║   Frontend: ✅ http://localhost:3000                          ║"
else
  echo "║   Frontend: ⚠️  Starting... (check logs/frontend.log)         ║"
fi

echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║   📝 Logs:                                                     ║"
echo "║      Backend:  logs/backend.log                                ║"
echo "║      Frontend: logs/frontend.log                               ║"
echo "║                                                                ║"
echo "║   🛑 To stop: ./stop.sh                                        ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "💡 Open http://localhost:3000 in your browser to start"
echo ""
