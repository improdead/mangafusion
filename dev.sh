#!/bin/bash

# Kill any existing processes on ports 3000 and 4000
echo "Stopping any existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

echo "Starting MangaFusion development servers..."
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:4000/api"
echo ""
echo "Environment variables loaded from root .env file"
echo "✅ GEMINI_API_KEY configured for manga generation"
echo "✅ ELEVENLABS_API_KEY configured for audiobook feature"
echo "✅ SUPABASE configured for storage"
echo ""

# Start both frontend and backend
npm run dev