# Credentials Checklist

Use this checklist to ensure you have all required credentials before setting up the application on a new machine.

## Required Credentials

### 1. Google Cloud Credentials ✓

**Method A: Application Default Credentials (Recommended for Development)**
- [ ] Google Cloud account with access to project `nrf-search-demo`
- [ ] gcloud CLI installed
- [ ] Run: `gcloud auth application-default login`
- [ ] File created: `~/.config/gcloud/application_default_credentials.json`

**Method B: Service Account (Alternative)**
- [ ] Service account created in Google Cloud Console
- [ ] Service account has these roles:
  - [ ] BigQuery Data Editor
  - [ ] BigQuery Job User
  - [ ] Vertex AI User
- [ ] JSON key file downloaded
- [ ] Path to key file: `_____________________`

### 2. Anthropic API Key ✓

- [ ] Anthropic account created at https://console.anthropic.com/
- [ ] API key generated
- [ ] API key copied (starts with `sk-ant-`)
- [ ] API key saved to: `_____________________`

**Note:** You need the SAME Anthropic API key in 3 places:
- [ ] `backend/.env` → `ANTHROPIC_API_KEY`
- [ ] `fashion-agent-backend/.env` → `ANTHROPIC_API_KEY`
- [ ] `fashion-agent-python-backend/.env` → `ANTHROPIC_API_KEY`

### 3. Google Cloud Project Access ✓

- [ ] Project ID: `nrf-search-demo`
- [ ] Access to BigQuery dataset: `fashion_catalog`
- [ ] Required tables exist:
  - [ ] `fashion_catalog.products`
  - [ ] `fashion_catalog.outfits`
  - [ ] `fashion_catalog.myntra_products`

Verify access:
```bash
bq query --use_legacy_sql=false \
  "SELECT COUNT(*) FROM \`nrf-search-demo.fashion_catalog.products\` LIMIT 1"
```

### 4. Required APIs Enabled ✓

- [ ] BigQuery API
- [ ] Vertex AI API (for Claude via Vertex AI)
- [ ] Cloud Storage API

Enable all:
```bash
gcloud services enable bigquery.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

## Environment Variables Summary

### Required in ALL Environments

| Variable | Value | Where Needed |
|----------|-------|--------------|
| `GOOGLE_CLOUD_PROJECT` | `nrf-search-demo` | All 3 backends |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | All 3 backends |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to credentials | All 3 backends (if using service account) |

### Backend-Specific

| Variable | Value | Where Needed |
|----------|-------|--------------|
| `PORT` | `8080` | `backend/.env` |
| `PORT` | `8001` | `fashion-agent-backend/.env` |
| `PORT` | `8002` | `fashion-agent-python-backend/.env` |
| `FRONTEND_URL` | `http://localhost:3000` | `backend/.env` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | `frontend/.env.local` |
| `NEXT_PUBLIC_FASHION_AGENT_URL` | `http://localhost:8001` | `frontend/.env.local` |
| `NEXT_PUBLIC_PYTHON_BACKEND_URL` | `http://localhost:8002` | `frontend/.env.local` |

## Security Notes

### DO NOT commit these files to Git:
- [ ] `backend/.env`
- [ ] `fashion-agent-backend/.env`
- [ ] `fashion-agent-python-backend/.env`
- [ ] `frontend/.env.local`
- [ ] Any service account JSON key files

These are already in `.gitignore` but double-check before committing!

### For Production:
- [ ] Use Google Secret Manager for sensitive credentials
- [ ] Rotate API keys regularly
- [ ] Use service accounts with minimum required permissions
- [ ] Enable audit logging
- [ ] Set up proper CORS and authentication

## Verification Commands

After setting up all credentials, run these to verify:

```bash
# 1. Check gcloud authentication
gcloud auth list

# 2. Check current project
gcloud config get-value project

# 3. Test BigQuery access
bq ls nrf-search-demo:fashion_catalog

# 4. Test backend can start (should not error on credentials)
cd backend && npm run dev &
sleep 5
curl http://localhost:8080/health
pkill -f "nodemon.*backend"
cd ..

# 5. Check all .env files exist
ls -la backend/.env
ls -la fashion-agent-backend/.env
ls -la fashion-agent-python-backend/.env
ls -la frontend/.env.local
```

## Troubleshooting

### "Could not find default credentials"
→ Run `gcloud auth application-default login`

### "Permission denied on BigQuery"
→ Check your Google Cloud account has proper roles

### "Invalid API key" from Anthropic
→ Verify API key is correct and active at https://console.anthropic.com/

### "Project nrf-search-demo not found"
→ Ensure you're logged into the correct Google Cloud account

## Quick Test After Setup

```bash
# Start everything
./start.sh

# Test in browser
open http://localhost:3000

# Test search API
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","query":"blue jeans","filters":{}}'

# Should see products returned
```

---

**Important:** Keep your credentials secure and never share them publicly!
