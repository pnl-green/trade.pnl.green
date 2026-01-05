#!/bin/bash

# Stop script for local development services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🛑 Stopping Intelayer local development services..."
echo ""

# Kill processes from PID file if it exists
if [ -f ".local-pids" ]; then
    PIDS=$(cat .local-pids)
    for PID in $PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            echo "Stopping process $PID..."
            kill $PID 2>/dev/null || true
        fi
    done
    rm .local-pids
fi

# Also kill by port (in case PID file is missing)
for port in 3000 4001 5000 5001; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "Stopping service on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

echo -e "${GREEN}✅ All services stopped${NC}"

