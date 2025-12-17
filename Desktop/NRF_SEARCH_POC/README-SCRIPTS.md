# NRF Search POC - Start/Stop Scripts Guide

## Overview

This project includes unified start and stop scripts to manage all services with a single command.

## Services Managed

The scripts manage **4 services** on specific ports:

| Service | Port | Description |
|---------|------|-------------|
| **Backend** | 8080 | Main NRF Search API (Node.js/Express) |
| **Fashion Agent** | 8001 | Autonomous Fashion Styling Agent (Node.js/WebSocket) |
| **Python Backend** | 8000 | Image Generation Service (Python/FastAPI) |
| **Frontend** | 3000 | Next.js React Application |

## Quick Start

### Start All Services

```bash
./start.sh
```

This will:
- Check if ports are available (kill existing processes if needed)
- Install dependencies automatically if missing
- Create Python virtual environment on first run
- Start all 4 services in the background
- Verify each service is running properly
- Show service status and access URLs

**Expected Output:**
```
==============================================
🚀 Starting NRF Search POC Application
==============================================

📋 Checking ports...

1️⃣  Starting Backend (Port 8080)...
   PID: 12345

2️⃣  Starting Fashion Agent Backend (Port 8001)...
   PID: 12346

3️⃣  Starting Python Backend (Port 8000)...
   PID: 12347

4️⃣  Starting Frontend (Port 3000)...
   PID: 12348

⏳ Waiting for all services to start...

==============================================
📊 Service Status:
==============================================
✅ Backend running on http://localhost:8080
✅ Fashion Agent running on http://localhost:8001
✅ Python Backend running on http://localhost:8000
✅ Frontend running on http://localhost:3000

==============================================
🎉 Application started successfully!

📱 Access the application:
   • Landing Page:  http://localhost:3000
   • New Search:    http://localhost:3000/new-search
   • Toolkit:       http://localhost:3000/toolkit
```

### Stop All Services

```bash
./stop.sh
```

This will:
- Stop all running services gracefully
- Clean up PID files
- Verify all ports are freed
- Preserve log files for debugging

**Expected Output:**
```
==============================================
🛑 Stopping NRF Search POC Application
==============================================

📋 Stopping services using saved PIDs...
   Stopping Backend (PID: 12345)...
   ✅ Backend stopped
   Stopping Fashion Agent (PID: 12346)...
   ✅ Fashion Agent stopped
   Stopping Python Backend (PID: 12347)...
   ✅ Python Backend stopped
   Stopping Frontend (PID: 12348)...
   ✅ Frontend stopped

🔍 Checking for any remaining processes on ports...
   ℹ️  No process found on port 8080
   ℹ️  No process found on port 8001
   ℹ️  No process found on port 8000
   ℹ️  No process found on port 3000

==============================================
✅ Application stopped successfully!
   Stopped 4 service(s)
```

## Access URLs

Once started, access the application at:

- **Landing Page**: http://localhost:3000
- **New Search Experience**: http://localhost:3000/new-search
- **Fashion Toolkit**: http://localhost:3000/toolkit
- **Backend API**: http://localhost:8080
- **Fashion Agent API**: http://localhost:8001
- **Python Backend API**: http://localhost:8000

## Logs

All services log to the `logs/` directory:

- `logs/backend.log` - Backend API logs
- `logs/fashion-agent.log` - Fashion Agent logs
- `logs/python-backend.log` - Python backend logs
- `logs/frontend.log` - Frontend build/runtime logs

**View logs in real-time:**
```bash
# Backend
tail -f logs/backend.log

# Fashion Agent
tail -f logs/fashion-agent.log

# Python Backend
tail -f logs/python-backend.log

# Frontend
tail -f logs/frontend.log
```

## Troubleshooting

### Port Already in Use

If you see "Port X is already in use", the script will automatically:
1. Identify the process using the port
2. Stop it gracefully
3. Continue with startup

You can also manually check and kill processes:

```bash
# Check what's using port 8080
lsof -i :8080

# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### Service Failed to Start

If a service fails to start:

1. **Check the logs** in the `logs/` directory
2. **Check environment variables** in `.env` files:
   - `backend/.env`
   - `fashion-agent-backend/.env`
   - `fashion-agent-python-backend/.env`
3. **Reinstall dependencies**:
   ```bash
   cd backend && npm install
   cd fashion-agent-backend && npm install
   cd frontend && npm install
   cd fashion-agent-python-backend && pip install -r requirements.txt
   ```

### Python Backend Not Starting

The Python backend is **optional**. If it doesn't start:
- Fashion features may be limited
- Check `logs/python-backend.log` for errors
- Ensure Python 3.x is installed
- Manually test: `cd fashion-agent-python-backend && python3 alex_service.py`

### Clean Restart

For a completely clean restart:

```bash
# Stop everything
./stop.sh

# Clean up any remaining processes
pkill -f "nodemon"
pkill -f "next"
pkill -f "alex_service"

# Clear logs (optional)
rm -rf logs/*.log

# Remove Python virtual environment (optional)
rm -rf fashion-agent-python-backend/venv

# Start fresh
./start.sh
```

## Script Features

### Start Script (`start.sh`)
- ✅ Automatic port conflict resolution
- ✅ Dependency installation check
- ✅ Python virtual environment setup
- ✅ Service health verification
- ✅ PID tracking for graceful shutdown
- ✅ Colored output for easy reading
- ✅ Detailed error messages

### Stop Script (`stop.sh`)
- ✅ Graceful shutdown using PIDs
- ✅ Fallback port-based cleanup
- ✅ Process count tracking
- ✅ Log preservation
- ✅ Multiple cleanup strategies

## Environment Variables

Each service requires environment variables. Make sure these files exist:

### Backend (`backend/.env`)
```env
GCP_PROJECT_ID=your-project-id
CLAUDE_API_KEY=your-api-key
PORT=8080
```

### Fashion Agent (`fashion-agent-backend/.env`)
```env
CLAUDE_API_KEY=your-api-key
PORT=8001
```

### Python Backend (`fashion-agent-python-backend/.env`)
```env
GEMINI_API_KEY=your-gemini-key
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (Port 3000)                │
│         Next.js React App                   │
└─────────────────────────────────────────────┘
           ↓                    ↓
┌──────────────────┐  ┌─────────────────────┐
│ Backend (8080)   │  │ Fashion Agent (8001)│
│ Express API      │  │ WebSocket Server    │
└──────────────────┘  └─────────────────────┘
                              ↓
                   ┌────────────────────────┐
                   │ Python Backend (8000)  │
                   │ Image Generation       │
                   └────────────────────────┘
```

## Migration Notes

### Old Scripts (Removed)
- ❌ `start-all.sh` - Had port conflicts (5000 vs 8080)
- ❌ `shutdown.sh` - Incomplete service coverage
- ❌ `stop-all.sh` - Less robust cleanup

### New Unified Scripts
- ✅ `start.sh` - Single source of truth for all services
- ✅ `stop.sh` - Comprehensive shutdown with fallbacks

## Support

If you encounter issues:
1. Check logs in `logs/` directory
2. Verify environment variables in `.env` files
3. Ensure all dependencies are installed
4. Try a clean restart (see Troubleshooting)

Happy coding! 🚀
