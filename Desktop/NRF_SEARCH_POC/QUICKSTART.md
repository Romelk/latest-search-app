# Quick Start Guide

Get your Agentic Search Demo running in 10 minutes!

## Prerequisites Checklist

- [ ] Node.js 22.x installed
- [ ] Google Cloud account with billing enabled
- [ ] gcloud CLI installed and authenticated
- [ ] Git installed

## 1. Clone and Setup (2 minutes)

```bash
# Clone the repository
git clone https://github.com/Romelk/latest-search-app.git
cd latest-search-app

# Set your Google Cloud project
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID
```

## 2. Enable Google Cloud APIs (2 minutes)

```bash
# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable bigquery.googleapis.com
```

## 3. Set Up BigQuery (2 minutes)

```bash
# Run the setup script
./setup-bigquery.sh $PROJECT_ID

# Load sample data
bq load --source_format=NEWLINE_DELIMITED_JSON \
  fashion_catalog.products \
  backend/sample-data.json
```

## 4. Deploy Backend (2 minutes)

```bash
# Deploy to Cloud Run
./deploy-backend.sh $PROJECT_ID us-central1

# Save the backend URL (it will be printed)
export BACKEND_URL="<your-backend-url>"
```

## 5. Deploy Frontend (2 minutes)

```bash
# Deploy to Cloud Run
./deploy-frontend.sh $PROJECT_ID us-central1 $BACKEND_URL

# Your app is now live! The URL will be printed.
```

## 6. Test the Application

Open the frontend URL in your browser and try these queries:

### CLEAR Intent
**Query**: `blue formal shirt size 42`
- See filtered product results with filters bar

### AMBIGUOUS Intent
**Query**: `shirt`
- See refinement chips for style, color, and price
- Select chips to narrow down results

### GOAL Intent
**Query**: `I am attending my daughter's annual day. She is ten. I want something smart and coordinated for me and my wife, we are in our forties and not very slim.`
- Chat panel opens
- Answer the clarifying question
- See curated outfit looks

## Local Development (Optional)

If you want to run locally instead:

```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your GCP_PROJECT_ID
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev

# Open http://localhost:3000
```

## Troubleshooting

**"Permission denied" on scripts**
```bash
chmod +x deploy-backend.sh deploy-frontend.sh setup-bigquery.sh
```

**"Billing not enabled"**
- Go to Google Cloud Console > Billing
- Enable billing for your project

**"API not enabled"**
- Run the API enable commands from step 2 again

**Backend/Frontend deployment fails**
- Check that you've replaced `your-project-id` with your actual project ID
- Verify billing is enabled
- Check Cloud Build logs in Google Cloud Console

## What's Next?

- Customize the UI colors and branding
- Add more products to BigQuery
- Modify agent prompts in `backend/src/agents/prompts.ts`
- Add authentication
- Set up monitoring and logging

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review the [GitHub repository](https://github.com/Romelk/latest-search-app)

## Clean Up (to avoid charges)

```bash
# Delete Cloud Run services
gcloud run services delete agentic-search-frontend --region=us-central1
gcloud run services delete agentic-search-backend --region=us-central1

# Delete BigQuery dataset
bq rm -r -f fashion_catalog
```

---

Built with Google Cloud, Next.js, and AI
