#!/bin/bash

echo "Testing Gemini 1.5 Flash access..."
echo ""

TOKEN=$(gcloud auth application-default print-access-token)

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/nrf-search-demo/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Say OK"}]
    }]
  }' 2>&1

echo ""
echo ""
echo "If you see JSON with 'candidates' and 'content', it works! ✅"
echo "If you see 404 error, model access not yet enabled ❌"
