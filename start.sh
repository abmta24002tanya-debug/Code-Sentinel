#!/bin/sh
# Start FastAPI backend on port 8000
cd /app
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

# Start Next.js frontend on port 3000 (main public port)
NEXT_PUBLIC_API_URL=http://localhost:8000 node_modules/.bin/next start -p 3000
