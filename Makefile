.PHONY: dev demo test build clean start services

# Production — build and run detached
start:
	@bash scripts/start.sh

# Development — run full stack with hot reload
dev:
	@bash scripts/dev.sh full

# Demo mode — no external API keys needed
demo:
	@bash scripts/dev.sh demo

# Infrastructure only — Postgres, Redis, n8n
services:
	@bash scripts/dev.sh services

# Run all tests
test:
	cd backend && python -m pytest tests/ -v
	cd frontend && npm test

# Backend tests only
test-backend:
	cd backend && python -m pytest tests/ -v

# Frontend tests only
test-frontend:
	cd frontend && npm test

# Build production images
build:
	docker-compose build

# Backend dev server (no Docker)
backend-dev:
	@bash scripts/dev.sh backend

# Frontend dev server (no Docker)
frontend-dev:
	@bash scripts/dev.sh frontend

# View logs
logs:
	docker-compose logs -f

# Clean up
clean:
	docker-compose down -v --remove-orphans
	rm -rf backend/__pycache__ backend/app/__pycache__
	rm -rf frontend/node_modules/.cache
