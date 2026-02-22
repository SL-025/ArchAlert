#!/usr/bin/env bash
set -e

echo "Starting FastAPI on :8000"
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 &

echo "Starting Next.js on :${PORT}"
cd /app/frontend
npx next start -p "${PORT}" -H 0.0.0.0
