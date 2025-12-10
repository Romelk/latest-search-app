#!/bin/bash

# Agentic Search Demo - Shutdown Script
# This script stops both backend and frontend servers

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   🛑 Stopping Agentic Search Demo                             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

STOPPED_COUNT=0

# Function to stop a process
stop_process() {
  local PORT=$1
  local NAME=$2
  local PID_FILE=$3

  # Try to get PID from file first
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
      echo "🔴 Stopping $NAME (PID: $PID from file)..."
      kill $PID 2>/dev/null
      rm -f "$PID_FILE"
      STOPPED_COUNT=$((STOPPED_COUNT + 1))
      return
    fi
  fi

  # Fallback: find by port
  PID=$(lsof -ti:$PORT)
  if [ -n "$PID" ]; then
    echo "🔴 Stopping $NAME on port $PORT (PID: $PID)..."
    kill $PID 2>/dev/null
    rm -f "$PID_FILE"
    STOPPED_COUNT=$((STOPPED_COUNT + 1))
  fi
}

# Stop backend
stop_process 8080 "Backend" "logs/backend.pid"

# Stop frontend
stop_process 3000 "Frontend" "logs/frontend.pid"

# Wait for processes to stop
if [ $STOPPED_COUNT -gt 0 ]; then
  echo ""
  echo "⏳ Waiting for processes to stop..."
  sleep 2
fi

# Verify servers are stopped
BACKEND_CHECK=$(lsof -ti:8080)
FRONTEND_CHECK=$(lsof -ti:3000)

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"

if [ -z "$BACKEND_CHECK" ] && [ -z "$FRONTEND_CHECK" ]; then
  echo "║   ✅ All servers stopped successfully                         ║"
  echo "║                                                                ║"
  echo "║   💰 No AI resources are being consumed                       ║"
elif [ $STOPPED_COUNT -eq 0 ]; then
  echo "║   ℹ️  No servers were running                                  ║"
else
  echo "║   ⚠️  Some processes may still be running                     ║"
  if [ -n "$BACKEND_CHECK" ]; then
    echo "║      Backend still on port 8080 (PID: $BACKEND_CHECK)         ║"
  fi
  if [ -n "$FRONTEND_CHECK" ]; then
    echo "║      Frontend still on port 3000 (PID: $FRONTEND_CHECK)       ║"
  fi
fi

echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "║   🚀 To restart: ./start.sh                                    ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
