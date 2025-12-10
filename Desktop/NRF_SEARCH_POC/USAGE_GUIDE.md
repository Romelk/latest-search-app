# Usage Guide - Agentic Search Demo

## 🚀 Quick Start

### Starting the Application

```bash
./start.sh
```

This will:
- Start the backend server on `http://localhost:8080`
- Start the frontend server on `http://localhost:3000`
- Run both servers in the background
- Create log files in the `logs/` directory

**Open your browser to:** `http://localhost:3000`

---

### Stopping the Application

```bash
./stop.sh
```

This will:
- Stop both backend and frontend servers
- **Stop consuming Google Cloud AI resources** (saving costs!)
- Clean up PID files

**💰 Important:** Always stop the application when not in use to avoid unnecessary AI API costs.

---

### Checking Status

```bash
./status.sh
```

This shows:
- Whether backend and frontend are running
- Server URLs and process IDs
- Cost status (whether AI resources are being consumed)
- Log file locations and sizes

---

## 📊 Server Management

### Manual Server Commands

If you prefer to run servers manually (for development):

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

**Note:** Manual servers will run in the foreground and occupy your terminal.

---

## 📝 Logs

When using `./start.sh`, logs are saved to:

- **Backend:** `logs/backend.log`
- **Frontend:** `logs/frontend.log`

### Viewing Logs

```bash
# View backend logs
tail -f logs/backend.log

# View frontend logs
tail -f logs/frontend.log

# View recent errors
grep -i error logs/*.log
```

---

## 💰 Cost Management

### Understanding AI Costs

The application uses **Google Cloud Vertex AI (Gemini)** which charges per API call:

- **When Running:** Every search query consumes AI resources
- **When Stopped:** No AI costs (servers not running)

### Best Practices

✅ **DO:**
- Stop the application when done for the day: `./stop.sh`
- Use `./status.sh` to verify servers are stopped
- Test with simple queries first

❌ **DON'T:**
- Leave servers running overnight
- Run unnecessary searches
- Forget to stop the application

### Estimated Costs

- Simple search: ~$0.001 - $0.002 per query
- Goal-based search (with conversation): ~$0.005 - $0.01 per session
- Daily demo usage: ~$0.50 - $2.00 (depending on activity)

**Tip:** Google Cloud offers free credits for new accounts!

---

## 🔧 Troubleshooting

### Servers Won't Start

**Problem:** Port already in use
```bash
# Check what's using the ports
lsof -ti:8080  # Backend
lsof -ti:3000  # Frontend

# Stop and restart
./stop.sh
./start.sh
```

**Problem:** Dependencies missing
```bash
# Reinstall dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Servers Not Responding

```bash
# Check logs for errors
tail -20 logs/backend.log
tail -20 logs/frontend.log

# Restart servers
./stop.sh
./start.sh
```

### AI Errors

**Error:** "Failed to detect intent" or "Internal server error"

**Possible causes:**
1. **Not authenticated with Google Cloud:**
   ```bash
   gcloud auth application-default login
   ```

2. **Missing GCP_PROJECT_ID in backend/.env:**
   - Open `backend/.env`
   - Set `GCP_PROJECT_ID=your-actual-project-id`

3. **Vertex AI API not enabled:**
   - Go to Google Cloud Console
   - Enable Vertex AI API for your project

---

## 📦 Application States

### ✅ Running (Normal)
```
Backend:  ✅ http://localhost:8080
Frontend: ✅ http://localhost:3000
Cost:     💰 AI resources being consumed
```

### 🔴 Stopped (Cost-Saving)
```
Backend:  🔴 Not running
Frontend: 🔴 Not running
Cost:     💰 No AI resources consumed
```

### ⚠️ Partial (Inconsistent)
```
Backend:  ✅ Running
Frontend: 🔴 Not running
```
**Fix:** Run `./stop.sh` then `./start.sh`

---

## 🎯 Testing the Application

### 1. CLEAR Intent (Specific Search)
**Query:** `blue formal shirt size 42`

**Expected:**
- Product grid appears
- Filter chips for style, color, fit
- Results show matching products

---

### 2. AMBIGUOUS Intent (Broad Search)
**Query:** `shirt`

**Expected:**
- Refinement chips appear (Style, Color, Price)
- Click chips to narrow down results
- Click chip again to deselect (new feature!)

---

### 3. GOAL Intent (Conversational)
**Query:** `I am a male of 42 years and I need help dressing for a friend's wedding in Shillong in December`

**Expected:**
- Chat panel opens with greeting
- AI asks 0-1 clarifying questions (should be minimal!)
- Presents 3 style options: Traditional, Indo-Western, Western
- After selection, curates 2-3 complete outfit looks
- Shows products with explanations

---

## 🚨 Emergency Procedures

### Kill All Running Processes

If `./stop.sh` doesn't work:

```bash
# Force kill by port
kill -9 $(lsof -ti:8080)  # Backend
kill -9 $(lsof -ti:3000)  # Frontend
```

### Clean Start

```bash
# Nuclear option - clean everything
./stop.sh
rm -rf logs/
rm -rf backend/node_modules frontend/node_modules
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
./start.sh
```

---

## 📚 Additional Resources

- **Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Project Summary:** See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Quick Start:** See [QUICKSTART.md](QUICKSTART.md)
- **Vertex AI Setup:** See [VERTEX_AI_SETUP_INSTRUCTIONS.md](VERTEX_AI_SETUP_INSTRUCTIONS.md)

---

## ⌨️ Command Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `./start.sh` | Start both servers | Beginning work session |
| `./stop.sh` | Stop both servers | End of work session, saving costs |
| `./status.sh` | Check server status | Verify servers running/stopped |
| `tail -f logs/backend.log` | View backend logs | Debugging backend issues |
| `tail -f logs/frontend.log` | View frontend logs | Debugging frontend issues |

---

## 💡 Pro Tips

1. **Daily Workflow:**
   ```bash
   ./start.sh     # Morning
   # ... work on demo ...
   ./stop.sh      # Evening (save costs!)
   ```

2. **Before Demos:**
   ```bash
   ./status.sh    # Verify everything running
   ```

3. **After Demos:**
   ```bash
   ./stop.sh      # Stop immediately to save costs
   ```

4. **Monitoring Costs:**
   - Check Google Cloud Console > Billing
   - Set up budget alerts
   - Monitor Vertex AI usage

5. **Development Mode:**
   - Use `./start.sh` for background servers
   - Or run `npm run dev` manually in separate terminals for live reloading visibility

---

**Need help?** Check the logs first, then review troubleshooting section above.
