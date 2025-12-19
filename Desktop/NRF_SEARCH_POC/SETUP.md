# NRF Search POC - Setup Guide

Complete setup instructions for running this application on a new machine.

## Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

2. **Python** (v3.9 or higher)
   ```bash
   python3 --version  # Should be v3.9+
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **Google Cloud CLI** (gcloud)
   ```bash
   gcloud --version
   ```

## Step 1: Clone the Repository

```bash
git clone https://github.com/Romelk/latest-search-app.git
cd latest-search-app
```

## Step 2: Google Cloud Authentication

### 2.1 Setup Application Default Credentials

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project nrf-search-demo

# Create application default credentials
gcloud auth application-default login
```

This creates credentials at: `~/.config/gcloud/application_default_credentials.json`

### 2.2 Enable Required APIs

Ensure these Google Cloud APIs are enabled in your project:
- BigQuery API
- Vertex AI API
- Cloud Storage API

```bash
gcloud services enable bigquery.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

## Step 3: Environment Variables

### 3.1 Backend Environment Variables

Create `backend/.env` file:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=nrf-search-demo
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json

# Anthropic API Key (for Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# BigQuery Configuration
BIGQUERY_DATASET=fashion_catalog
BIGQUERY_LOCATION=US

# Server Configuration
PORT=8080
NODE_ENV=development

# Frontend URL (for image URL resolution)
FRONTEND_URL=http://localhost:3000
```

### 3.2 Fashion Agent Backend Environment Variables

Create `fashion-agent-backend/.env` file:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=nrf-search-demo

# Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
PORT=8001
NODE_ENV=development
```

### 3.3 Python Backend Environment Variables

Create `fashion-agent-python-backend/.env` file:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=nrf-search-demo

# Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
PORT=8002
```

### 3.4 Frontend Environment Variables

Create `frontend/.env.local` file:

```bash
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FASHION_AGENT_URL=http://localhost:8001
NEXT_PUBLIC_PYTHON_BACKEND_URL=http://localhost:8002

# Feature Flags
NEXT_PUBLIC_ENABLE_TOOLKIT=true
NEXT_PUBLIC_ENABLE_VISUAL_SEARCH=true
```

## Step 4: Install Dependencies

### 4.1 Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4.2 Fashion Agent Backend Dependencies

```bash
cd fashion-agent-backend
npm install
cd ..
```

### 4.3 Python Backend Dependencies

```bash
cd fashion-agent-python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..
```

### 4.4 Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## Step 5: Required API Keys

### 5.1 Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or login
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to all `.env` files as `ANTHROPIC_API_KEY`

### 5.2 Google Cloud Service Account (Alternative to ADC)

If you prefer using a service account instead of Application Default Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to IAM & Admin → Service Accounts
3. Create a new service account with these roles:
   - BigQuery Data Editor
   - BigQuery Job User
   - Vertex AI User
4. Create and download a JSON key
5. Update all `.env` files:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
   ```

## Step 6: Verify BigQuery Data

Ensure you have access to the required BigQuery tables:

```bash
# Check products table
bq query --use_legacy_sql=false "SELECT COUNT(*) FROM \`nrf-search-demo.fashion_catalog.products\` LIMIT 1"

# Check outfits table
bq query --use_legacy_sql=false "SELECT COUNT(*) FROM \`nrf-search-demo.fashion_catalog.outfits\` LIMIT 1"
```

Expected results:
- Products table: Should return a count (e.g., 50000+)
- Outfits table: Should return 2055

## Step 7: Start the Application

### Option A: Using Start Script (Recommended)

```bash
# Make scripts executable
chmod +x start.sh stop.sh

# Start all services
./start.sh
```

This will start:
- Backend (Port 8080)
- Fashion Agent Backend (Port 8001)
- Python Backend (Port 8002)
- Frontend (Port 3000)

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Fashion Agent Backend:**
```bash
cd fashion-agent-backend
npm run dev
```

**Terminal 3 - Python Backend:**
```bash
cd fashion-agent-python-backend
source venv/bin/activate
python alex_service.py
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 8: Verify Installation

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8080/health
   # Should return: {"status":"ok"}
   ```

2. **Fashion Agent Health Check:**
   ```bash
   curl http://localhost:8001/health
   # Should return: {"status":"ok"}
   ```

3. **Python Backend Health Check:**
   ```bash
   curl http://localhost:8002/health
   # Should return: {"status":"healthy"}
   ```

4. **Frontend:**
   - Open browser: [http://localhost:3000](http://localhost:3000)
   - Should see the NRF Search application

## Step 9: Test Key Features

### Test Search
```bash
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "query": "blue jeans",
    "filters": {}
  }'
```

### Test Complete the Look
```bash
curl http://localhost:8080/outfits/complete-the-look/8e4649ac-617d-455f-a379-2ed5072fcd5a
```

### Test Visual Search
```bash
curl -X POST http://localhost:8080/toolkit/visual-search \
  -H "Content-Type: application/json" \
  -d @test-visual-search.json
```

## Troubleshooting

### Issue: "GOOGLE_APPLICATION_CREDENTIALS not found"

**Solution:** Run `gcloud auth application-default login` or set up service account key

### Issue: "Anthropic API key not configured"

**Solution:** Add `ANTHROPIC_API_KEY` to all `.env` files

### Issue: "BigQuery permission denied"

**Solution:** Ensure your Google Cloud user/service account has BigQuery permissions:
```bash
gcloud projects add-iam-policy-binding nrf-search-demo \
  --member="user:your-email@example.com" \
  --role="roles/bigquery.user"
```

### Issue: Port already in use

**Solution:** Stop existing processes or change ports:
```bash
# Find process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use stop script
./stop.sh
```

### Issue: Python dependencies fail to install

**Solution:** Upgrade pip and try again:
```bash
cd fashion-agent-python-backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Issue: Frontend fails to connect to backend

**Solution:** Check that all backends are running and `.env.local` has correct URLs

## Production Deployment Checklist

When deploying to production:

- [ ] Set `NODE_ENV=production` in all `.env` files
- [ ] Use production Anthropic API key
- [ ] Use service account credentials instead of ADC
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Update `NEXT_PUBLIC_API_URL` to production backend URL
- [ ] Enable CORS properly in backend
- [ ] Set up proper logging and monitoring
- [ ] Use environment secrets management (e.g., Google Secret Manager)
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up load balancing if needed

## Logs Location

When using `./start.sh`, logs are saved to:
- Backend: `logs/backend.log`
- Fashion Agent: `logs/fashion-agent.log`
- Python Backend: `logs/python-backend.log`
- Frontend: `logs/frontend.log`

View logs in real-time:
```bash
tail -f logs/backend.log
```

## Stopping the Application

```bash
./stop.sh
```

This cleanly stops all services and preserves logs.

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review error messages in terminal
3. Verify all environment variables are set correctly
4. Ensure Google Cloud credentials are valid
5. Check that all required APIs are enabled in Google Cloud Console

---

**Last Updated:** 2025-12-19
