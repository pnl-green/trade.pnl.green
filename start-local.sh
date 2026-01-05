#!/bin/bash

# Startup script for local development
# This script starts all required services for the Intelayer trading platform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Intelayer local development environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is in use. Attempting to free it...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Check and start Redis
echo "📦 Checking Redis..."
if ! check_port 6379; then
    echo -e "${YELLOW}Redis not running. Starting Redis with Docker...${NC}"
    if command -v docker &> /dev/null; then
        cd backend
        docker compose up -d redis 2>/dev/null || docker-compose up -d redis 2>/dev/null || {
            echo -e "${RED}❌ Failed to start Redis. Please install Docker or start Redis manually.${NC}"
            exit 1
        }
        cd ..
        sleep 2
        echo -e "${GREEN}✅ Redis started${NC}"
    else
        echo -e "${RED}❌ Docker not found. Please start Redis manually on port 6379${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Redis is already running${NC}"
fi

# Set backend environment variables
export SERVER_HOST=127.0.0.1
export SERVER_PORT=5002
export WS_HOST=127.0.0.1
export WS_PORT=5003
export REDIS_URL=redis://127.0.0.1:6379
export COOKIE_KEY=$(openssl rand -hex 32 2>/dev/null || echo "dev-cookie-key-change-in-production-$(date +%s)")
export LEVEL=info
export CCXT_SERVICE_URL=http://localhost:4001

# Free up ports if needed
kill_port 4001
kill_port 5002
kill_port 5003
kill_port 3000

# Start CCXT Service
echo ""
echo "🔧 Starting CCXT Service on port 4001..."
cd ccxt-service
if [ ! -d "node_modules" ]; then
    echo "Installing CCXT service dependencies..."
    npm install
fi
node index.mjs > ../ccxt-service.log 2>&1 &
CCXT_PID=$!
cd ..
sleep 2
if check_port 4001; then
    echo -e "${GREEN}✅ CCXT Service started (PID: $CCXT_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start CCXT Service. Check ccxt-service.log${NC}"
    exit 1
fi

# Start Backend
echo ""
echo "🦀 Starting Backend on port 5002..."
cd backend
if [ ! -f "target/debug/backend" ] && [ ! -f "target/release/backend" ]; then
    echo "Building backend (this may take a few minutes)..."
    cargo build
fi

# Use release build if available, otherwise debug
if [ -f "target/release/backend" ]; then
    ./target/release/backend > ../backend.log 2>&1 &
else
    ./target/debug/backend > ../backend.log 2>&1 &
fi
BACKEND_PID=$!
cd ..
sleep 3
if check_port 5002; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Backend. Check backend.log${NC}"
    exit 1
fi

# Start Frontend
echo ""
echo "⚛️  Starting Frontend on port 3000..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies (this may take a few minutes)..."
    npm install
fi

# Set frontend environment variables
export NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:5002
export NEXT_PUBLIC_BASE_URL=http://127.0.0.1:5002

npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 5
if check_port 3000; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Frontend. Check frontend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo "📍 Services:"
echo "   - Frontend:  http://localhost:3000"
echo "   - Backend:   http://127.0.0.1:5002"
echo "   - CCXT:      http://localhost:4001"
echo "   - Redis:     localhost:6379"
echo ""
echo "📋 Logs:"
echo "   - Frontend:  tail -f frontend.log"
echo "   - Backend:   tail -f backend.log"
echo "   - CCXT:      tail -f ccxt-service.log"
echo ""
echo "🛑 To stop all services, run: ./stop-local.sh"
echo "   Or manually kill PIDs: $CCXT_PID $BACKEND_PID $FRONTEND_PID"
echo ""

# Save PIDs to file for easy stopping
echo "$CCXT_PID $BACKEND_PID $FRONTEND_PID" > .local-pids

