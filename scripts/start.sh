#!/usr/bin/env bash
# LytheraHub — Production startup script
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "================================================"
echo "  LytheraHub AI — Production Startup"
echo "================================================"

# Check for .env file
if [ ! -f backend/.env ]; then
    echo "WARNING: backend/.env not found. Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo "Please edit backend/.env with your real credentials before running in production."
fi

# Build and start all services
echo "Building and starting all services..."
docker-compose up --build -d

echo ""
echo "Waiting for services to become healthy..."
sleep 5

# Check service health
echo ""
echo "Service status:"
docker-compose ps

echo ""
echo "================================================"
echo "  LytheraHub AI is running!"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "  n8n:       http://localhost:5678"
echo "================================================"
echo ""
echo "Logs: docker-compose logs -f"
echo "Stop: docker-compose down"
