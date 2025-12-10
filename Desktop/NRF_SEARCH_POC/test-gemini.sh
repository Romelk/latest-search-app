#!/bin/bash

TOKEN=$(gcloud auth application-default print-access-token)

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/nrf-search-demo/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Hello, respond with just the word OK"}]
    }]
  }'
