# Startup and Shutdown Scripts

## Overview

Simple scripts to start and stop the NRF Search POC application with all required services.

## Scripts

### `start.sh` - Application Startup

Starts all required services for the NRF Search POC application:
- Backend Server (Port 5000)
- Fashion Agent Backend (Port 8080)
- Frontend Server (Port 3000)

**Usage:**
```bash
./start.sh
```

**Features:**
- ✅ Checks if ports are already in use
- ✅ Installs dependencies if needed
- ✅ Runs servers in background with logging
- ✅ Verifies all services started successfully
- ✅ Saves process IDs for clean shutdown
- ✅ Provides access URLs and log locations

**Output:**
- Process IDs saved to `.pids/` directory
- Logs saved to `logs/` directory

### `shutdown.sh` - Application Shutdown

Stops all running services gracefully.

**Usage:**
```bash
./shutdown.sh
```

**Features:**
- ✅ Stops services using saved process IDs
- ✅ Fallback: kills processes by port number
- ✅ Cleans up any remaining node processes
- ✅ Preserves log files for debugging
- ✅ Graceful shutdown with force-kill fallback

## Quick Start

### First Time Setup

```bash
# Make scripts executable
chmod +x start.sh shutdown.sh

# Start the application
./start.sh
```

### Daily Usage

```bash
# Start application
./start.sh

# Stop application
./shutdown.sh
```

## Access Points

After starting, the application is available at:

- **Landing Page**: http://localhost:3000
- **New Search**: http://localhost:3000/new-search
- **Toolkit**: http://localhost:3000/toolkit
- **Backend API**: http://localhost:5000
- **Fashion Agent API**: http://localhost:8080

## Viewing Logs

### Real-time Log Viewing

```bash
# View backend logs
tail -f logs/backend.log

# View fashion agent logs
tail -f logs/fashion-agent.log

# View frontend logs
tail -f logs/frontend.log

# View all logs simultaneously
tail -f logs/*.log
```

### Check Last 50 Lines

```bash
tail -50 logs/backend.log
tail -50 logs/fashion-agent.log
tail -50 logs/frontend.log
```

## Troubleshooting

### Port Already in Use

If you see warnings about ports being in use:

```bash
# Check what's using a port
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :8080  # Fashion Agent

# Kill specific process
kill <PID>

# Or use shutdown script to clean up
./shutdown.sh
```

### Service Failed to Start

Check the logs for errors:

```bash
# Check which service failed
cat logs/backend.log
cat logs/fashion-agent.log
cat logs/frontend.log

# Common issues:
# 1. Missing dependencies - run npm install in that directory
# 2. Port conflicts - use shutdown.sh to clean up
# 3. Environment variables - check .env files
```

### Dependencies Not Installed

If a service fails to start due to missing dependencies:

```bash
# Backend
cd backend && npm install

# Fashion Agent
cd fashion-agent-backend && npm install

# Frontend
cd frontend && npm install
```

### Force Clean Shutdown

If normal shutdown doesn't work:

```bash
# Kill all node processes (use with caution)
pkill -9 node

# Or kill specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

## Process Management

### Check Running Services

```bash
# Check if services are running
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :8080  # Fashion Agent

# Or check saved PIDs
cat .pids/frontend.pid
cat .pids/backend.pid
cat .pids/fashion-agent.pid

# Verify process is still running
ps -p $(cat .pids/frontend.pid)
```

### Restart Single Service

```bash
# Stop all
./shutdown.sh

# Start specific service manually
cd backend && npm run dev
cd fashion-agent-backend && npm run dev
cd frontend && npm run dev
```

## Log Management

### Clear Old Logs

```bash
# Archive old logs
mkdir -p logs/archive
mv logs/*.log logs/archive/$(date +%Y%m%d)/

# Or delete old logs
rm logs/*.log
```

### Log File Locations

```
logs/
├── backend.log          # Backend API logs
├── fashion-agent.log    # Fashion Agent API logs
└── frontend.log         # Next.js frontend logs
```

## Environment Variables

Ensure you have the required `.env` files:

- `backend/.env` - Backend configuration
- `frontend/.env.local` - Frontend configuration
- `fashion-agent-backend/.env` - Fashion Agent configuration

## Git Integration

The scripts automatically create:
- `.pids/` - Process ID storage (add to .gitignore)
- `logs/` - Log file storage (add to .gitignore)

Add to your `.gitignore`:
```
.pids/
logs/
```

## Maintenance

### Update Scripts

The scripts are version controlled. To update:

```bash
git pull origin main
chmod +x start.sh shutdown.sh
```

### Customize Port Numbers

Edit the scripts to change default ports:

```bash
# In start.sh and shutdown.sh
# Change these lines:
# check_port 3000  → check_port YOUR_PORT
# kill_by_port 3000 → kill_by_port YOUR_PORT
```

## Support

For issues with the startup/shutdown scripts:
1. Check the troubleshooting section above
2. Review log files in `logs/` directory
3. Ensure all dependencies are installed
4. Verify environment variables are set correctly

---

**Last Updated**: December 16, 2024
**Version**: 1.0.0
