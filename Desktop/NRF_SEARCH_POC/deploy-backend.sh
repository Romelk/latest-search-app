#!/bin/bash

# Deploy Backend to Cloud Run
# Usage: ./deploy-backend.sh <GCP_PROJECT_ID> <REGION>

set -e

PROJECT_ID=${1:-your-gcp-project-id}
REGION=${2:-us-central1}
SERVICE_NAME="agentic-search-backend"

echo "Deploying backend to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Build and deploy
gcloud run deploy $SERVICE_NAME \
  --source ./backend \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID,REGION=$REGION,VERTEX_MODEL_NAME=gemini-1.5-pro,BIGQUERY_DATASET=fashion_catalog,BIGQUERY_TABLE=products,NODE_ENV=production" \
  --max-instances 10 \
  --min-instances 0 \
  --cpu 1 \
  --memory 512Mi \
  --timeout 60s

echo "Backend deployed successfully!"
echo "Getting service URL..."

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)')

echo "Backend URL: $SERVICE_URL"
echo ""
echo "Update your frontend .env.local with:"
echo "NEXT_PUBLIC_API_URL=$SERVICE_URL"
