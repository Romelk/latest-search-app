#!/bin/bash

# Deploy Frontend to Cloud Run
# Usage: ./deploy-frontend.sh <GCP_PROJECT_ID> <REGION> <BACKEND_URL>

set -e

PROJECT_ID=${1:-your-gcp-project-id}
REGION=${2:-us-central1}
BACKEND_URL=${3:-http://localhost:8080}
SERVICE_NAME="agentic-search-frontend"

echo "Deploying frontend to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Backend URL: $BACKEND_URL"

# Build and deploy
gcloud run deploy $SERVICE_NAME \
  --source ./frontend \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
  --max-instances 10 \
  --min-instances 0 \
  --cpu 1 \
  --memory 1Gi \
  --timeout 60s

echo "Frontend deployed successfully!"
echo "Getting service URL..."

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)')

echo "Frontend URL: $SERVICE_URL"
echo ""
echo "Application is now live at: $SERVICE_URL"
