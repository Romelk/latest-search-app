# Quick Start Guide

Essential steps to get the application running on a new machine.

## 1. Clone Repository
```bash
git clone https://github.com/Romelk/latest-search-app.git
cd latest-search-app
```

## 2. Google Cloud Setup
```bash
gcloud auth login
gcloud config set project nrf-search-demo
gcloud auth application-default login
```

## 3. Get Anthropic API Key
- Visit: https://console.anthropic.com/
- Create API key
- Copy for next step

## 4. Create Environment Files

### backend/.env
```bash
GOOGLE_CLOUD_PROJECT=nrf-search-demo
ANTHROPIC_API_KEY=your_key_here
PORT=8080
FRONTEND_URL=http://localhost:3000
```

### fashion-agent-backend/.env
```bash
GOOGLE_CLOUD_PROJECT=nrf-search-demo
ANTHROPIC_API_KEY=your_key_here
PORT=8001
```

### fashion-agent-python-backend/.env
```bash
GOOGLE_CLOUD_PROJECT=nrf-search-demo
ANTHROPIC_API_KEY=your_key_here
PORT=8002
```

### frontend/.env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FASHION_AGENT_URL=http://localhost:8001
NEXT_PUBLIC_PYTHON_BACKEND_URL=http://localhost:8002
NEXT_PUBLIC_ENABLE_TOOLKIT=true
```

## 5. Install Dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Fashion Agent Backend
cd fashion-agent-backend && npm install && cd ..

# Python Backend
cd fashion-agent-python-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Frontend
cd frontend && npm install && cd ..
```

## 6. Start Application
```bash
chmod +x start.sh
./start.sh
```

## 7. Verify
- Backend: http://localhost:8080/health
- Frontend: http://localhost:3000

## Stop Application
```bash
./stop.sh
```

---

For detailed setup and troubleshooting, see [SETUP.md](SETUP.md)
