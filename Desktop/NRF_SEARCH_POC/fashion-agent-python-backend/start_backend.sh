#!/bin/bash

# Start Backend Script for Alex Fashion Stylist
# This script initializes the database and starts the FastAPI server

echo "=============================================="
echo "Alex Fashion Stylist - Backend Startup"
echo "=============================================="
echo ""

# Check if CLAUDE_API_KEY is set
if [ -z "$CLAUDE_API_KEY" ]; then
    echo "ERROR: CLAUDE_API_KEY environment variable is not set!"
    echo ""
    echo "Please set it first with:"
    echo "  export CLAUDE_API_KEY='your-api-key-here'"
    echo ""
    echo "Then run this script again:"
    echo "  ./start_backend.sh"
    echo ""
    exit 1
fi

echo "✓ CLAUDE_API_KEY is set"
echo ""

# Initialize database with demo trends
echo "Initializing database with demo trends..."
python3 update_trends.py --demo

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to initialize database"
    exit 1
fi

echo ""
echo "=============================================="
echo "Starting FastAPI server..."
echo "=============================================="
echo ""

# Start the server
uvicorn alex_service:app --host 0.0.0.0 --port 8000 --reload
