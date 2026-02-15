#!/usr/bin/env bash
# LytheraHub — Development startup with hot-reload
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

MODE="${1:-full}"

echo "================================================"
echo "  LytheraHub AI — Development Mode"
echo "================================================"

# Check for .env file
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
fi

case "$MODE" in
    full)
        echo "Starting full stack with Docker (hot-reload enabled)..."
        docker-compose up --build
        ;;
    demo)
        echo "Starting in demo mode (no external services needed)..."
        docker-compose -f docker-compose.yml -f docker-compose.demo.yml up --build
        ;;
    backend)
        echo "Starting backend only (no Docker)..."
        echo "Make sure Redis is running locally for full functionality."
        cd "$PROJECT_DIR/backend"
        uvicorn app.main:app --reload --port 8000
        ;;
    frontend)
        echo "Starting frontend only (no Docker)..."
        echo "Make sure backend is running at http://localhost:8000"
        cd "$PROJECT_DIR/frontend"
        npm run dev
        ;;
    services)
        echo "Starting infrastructure services only (Postgres, Redis, n8n)..."
        docker-compose up -d postgres redis n8n
        echo ""
        echo "Services running. Start backend/frontend manually:"
        echo "  Backend:  cd backend && uvicorn app.main:app --reload --port 8000"
        echo "  Frontend: cd frontend && npm run dev"
        ;;
    *)
        echo "Usage: ./scripts/dev.sh [full|demo|backend|frontend|services]"
        echo ""
        echo "  full      — Full stack with Docker (default)"
        echo "  demo      — Demo mode, no API keys needed"
        echo "  backend   — Backend only, no Docker"
        echo "  frontend  — Frontend only, no Docker"
        echo "  services  — Postgres + Redis + n8n only"
        exit 1
        ;;
esac
