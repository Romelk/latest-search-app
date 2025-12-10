#!/bin/bash

# Agentic Search Demo - Status Check Script
# This script checks if servers are running and shows their status

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   📊 Agentic Search Demo - Status Check                       ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check backend
BACKEND_PID=$(lsof -ti:8080)
if [ -n "$BACKEND_PID" ]; then
  BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null)
  if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend:  Running on http://localhost:8080 (PID: $BACKEND_PID)"
  else
    echo "⚠️  Backend:  Process running but not responding (PID: $BACKEND_PID)"
  fi
else
  echo "🔴 Backend:  Not running"
fi

# Check frontend
FRONTEND_PID=$(lsof -ti:3000)
if [ -n "$FRONTEND_PID" ]; then
  FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
  if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "000" ]; then
    echo "✅ Frontend: Running on http://localhost:3000 (PID: $FRONTEND_PID)"
  else
    echo "⚠️  Frontend: Process running but not responding (PID: $FRONTEND_PID)"
  fi
else
  echo "🔴 Frontend: Not running"
fi

echo ""
echo "────────────────────────────────────────────────────────────────"
echo ""

# Overall status
if [ -n "$BACKEND_PID" ] && [ -n "$FRONTEND_PID" ]; then
  echo "📊 Status: Application is running"
  echo "💰 Cost:   AI resources are being consumed"
  echo ""
  echo "🛑 To stop and save costs: ./stop.sh"
elif [ -z "$BACKEND_PID" ] && [ -z "$FRONTEND_PID" ]; then
  echo "📊 Status: Application is stopped"
  echo "💰 Cost:   No AI resources being consumed"
  echo ""
  echo "🚀 To start: ./start.sh"
else
  echo "⚠️  Status: Partially running (inconsistent state)"
  echo ""
  echo "🛑 To stop all: ./stop.sh"
  echo "🚀 To restart: ./stop.sh && ./start.sh"
fi

echo ""

# Show log files if they exist
if [ -f "logs/backend.log" ] || [ -f "logs/frontend.log" ]; then
  echo "────────────────────────────────────────────────────────────────"
  echo "📝 Logs:"
  if [ -f "logs/backend.log" ]; then
    BACKEND_LOG_SIZE=$(du -h logs/backend.log | cut -f1)
    echo "   Backend:  logs/backend.log ($BACKEND_LOG_SIZE)"
  fi
  if [ -f "logs/frontend.log" ]; then
    FRONTEND_LOG_SIZE=$(du -h logs/frontend.log | cut -f1)
    echo "   Frontend: logs/frontend.log ($FRONTEND_LOG_SIZE)"
  fi
  echo ""
fi
