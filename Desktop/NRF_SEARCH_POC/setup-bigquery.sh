#!/bin/bash

# Setup BigQuery dataset and tables
# Usage: ./setup-bigquery.sh <GCP_PROJECT_ID>

set -e

PROJECT_ID=${1:-your-gcp-project-id}
DATASET="fashion_catalog"
LOCATION="US"

echo "Setting up BigQuery for project: $PROJECT_ID"
echo "Dataset: $DATASET"

# Create dataset
echo "Creating dataset..."
bq --project_id=$PROJECT_ID mk \
  --dataset \
  --location=$LOCATION \
  --description="Fashion and lifestyle product catalog for agentic search demo" \
  $DATASET || echo "Dataset already exists"

# Create products table
echo "Creating products table..."
bq --project_id=$PROJECT_ID mk \
  --table \
  $DATASET.products \
  product_id:STRING,title:STRING,brand:STRING,price:FLOAT64,image_url:STRING,category:STRING,color:STRING,size:STRING,fit:STRING,occasion_tags:STRING,style:STRING,description:STRING,created_at:TIMESTAMP,updated_at:TIMESTAMP || echo "Table already exists"

# Create analytics_events table
echo "Creating analytics_events table..."
bq --project_id=$PROJECT_ID mk \
  --table \
  $DATASET.analytics_events \
  event_id:STRING,session_id:STRING,event_name:STRING,event_timestamp:TIMESTAMP,query:STRING,intent_mode:STRING,metadata:JSON,created_at:TIMESTAMP || echo "Table already exists"

echo ""
echo "BigQuery setup complete!"
echo ""
echo "To load sample data, run:"
echo "bq load --source_format=NEWLINE_DELIMITED_JSON $DATASET.products backend/sample-data.json"
