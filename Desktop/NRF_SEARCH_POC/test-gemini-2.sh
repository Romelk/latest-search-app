#!/bin/bash

echo "Testing Gemini 2.0 Flash access..."
echo ""

TOKEN=$(gcloud auth application-default print-access-token)

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/nrf-search-demo/locations/us-central1/publishers/google/models/gemini-2.0-flash-001:generateContent" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Respond with just OK"}]
    }]
  }' 2>&1

echo ""
echo ""
echo "✅ If you see JSON with candidates and content - IT WORKS!"
echo "❌ If you see 404 error - Model not available yet"
