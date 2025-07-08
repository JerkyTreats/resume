# Resume PDF Generation Server - Docker Commands

.PHONY: help dev prod build-dev build-prod clean logs health

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev          - Start development server with live reload"
	@echo "  make prod         - Start production server"
	@echo "  make build-dev    - Build development Docker image"
	@echo "  make build-prod   - Build production Docker image"
	@echo "  make clean        - Clean up Docker containers and images"
	@echo "  make logs         - Show server logs"
	@echo "  make health       - Check server health"
	@echo "  make stop         - Stop all containers"

# Development server with volume mounting for live code changes
dev:
	@echo "🚀 Starting development server..."
	DOCKER_BUILDKIT=0 docker-compose --profile dev up --build

# Start development server without rebuilding
start:
	@echo "🚀 Starting development server (no rebuild)..."
	DOCKER_BUILDKIT=0 docker-compose --profile dev up

# Production server
prod:
	@echo "🚀 Starting production server..."
	DOCKER_BUILDKIT=0 docker-compose --profile prod up --build -d

# Build development image
build-dev:
	@echo "🔨 Building development Docker image..."
	DOCKER_BUILDKIT=0 docker-compose --profile dev build

# Build production image
build-prod:
	@echo "🔨 Building production Docker image..."
	DOCKER_BUILDKIT=0 docker-compose --profile prod build

# Clean up Docker resources
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down --volumes --remove-orphans
	docker system prune -f

# Show server logs
logs:
	@echo "📋 Showing server logs..."
	docker-compose logs -f

# Check server health
health:
	@echo "🏥 Checking server health..."
	curl -f http://localhost:${SERVER_PORT:-3000}/api/health || echo "Server is not responding"

# Stop all containers
stop:
	@echo "🛑 Stopping all containers..."
	docker-compose down

# Install dependencies locally (for development without Docker)
install:
	@echo "📦 Installing dependencies..."
	npm install

# Run server locally (requires Node.js 24.3.0)
local-dev:
	@echo "🚀 Starting local development server..."
	npm run dev

# Run server locally in production mode
local-prod:
	@echo "🚀 Starting local production server..."
	npm run build && npm start
