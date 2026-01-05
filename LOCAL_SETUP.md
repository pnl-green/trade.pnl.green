# Local Development Setup

## ✅ Services Running

All services have been started successfully:

- **Frontend (Next.js)**: http://localhost:3000
- **Backend (Rust/Actix)**: http://localhost:5000
- **CCXT Service (Node.js)**: http://localhost:4001
- **Redis**: localhost:6379 (via Docker)
- **WebSocket**: localhost:5001

## 🚀 Quick Start

### Start all services:
```bash
./start-local.sh
```

### Stop all services:
```bash
./stop-local.sh
```

## 📋 Manual Service Management

### Start services individually:

**1. Redis (via Docker):**
```bash
cd backend
docker compose up -d redis
```

**2. CCXT Service:**
```bash
cd ccxt-service
npm install  # First time only
node index.mjs
```

**3. Backend:**
```bash
cd backend
export SERVER_HOST=127.0.0.1
export SERVER_PORT=5000
export WS_HOST=127.0.0.1
export WS_PORT=5001
export REDIS_URL=redis://127.0.0.1:6379
export COOKIE_KEY=$(openssl rand -hex 32)
export LEVEL=info
export CCXT_SERVICE_URL=http://localhost:4001

cargo build  # First time only
./target/debug/backend  # or ./target/release/backend
```

**4. Frontend:**
```bash
cd frontend
export NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
export NEXT_PUBLIC_BASE_URL=http://localhost:5000

npm install  # First time only
npm run dev
```

## 📊 View Logs

```bash
# Frontend logs
tail -f frontend.log

# Backend logs
tail -f backend.log

# CCXT service logs
tail -f ccxt-service.log
```

## 🧪 Test Endpoints

```bash
# Health checks
curl http://localhost:4001/health  # CCXT Service
curl http://localhost:5000/status  # Backend

# Hyperliquid endpoints (via Next.js proxy)
curl http://localhost:3000/hl/SOL-USDC/asset-info
curl http://localhost:3000/hl/SOL-USDC/orderbook

# Direct backend endpoints
curl http://localhost:5000/hl/SOL-USDC/asset-info
curl http://localhost:5000/ccxt/coinbase/markets
```

## 🔧 Environment Variables

### Backend Required:
- `SERVER_HOST` - Backend HTTP host (default: 127.0.0.1)
- `SERVER_PORT` - Backend HTTP port (default: 5000)
- `WS_HOST` - WebSocket host (default: 127.0.0.1)
- `WS_PORT` - WebSocket port (default: 5001)
- `REDIS_URL` - Redis connection string (default: redis://127.0.0.1:6379)
- `COOKIE_KEY` - Session cookie secret (generate with: `openssl rand -hex 32`)
- `LEVEL` - Log level (default: info)
- `CCXT_SERVICE_URL` - CCXT service URL (default: http://localhost:4001)

### Frontend Optional:
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (default: http://localhost:5000)
- `NEXT_PUBLIC_BASE_URL` - Base URL for API calls (default: http://localhost:5000)

## 🐛 Troubleshooting

### Port already in use:
```bash
# Kill process on specific port
lsof -ti:3000 | xargs kill -9
```

### Redis connection issues:
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
cd backend
docker compose restart redis
```

### Backend build issues:
```bash
cd backend
cargo clean
cargo build
```

### Frontend build issues:
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

## 📝 Next Steps

1. **Test the application**: Open http://localhost:3000 in your browser
2. **Check console logs**: Open browser DevTools to see any errors
3. **Test exchange data**: Try switching between Hyperliquid and Coinbase exchanges
4. **Verify CCXT integration**: Check if orderbook, candles, and trades are loading

## 🚢 Deployment

Once everything works locally:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Fix CCXT integration and add Next.js rewrites"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

3. **Auto-deployment**: Your AWS instance should automatically deploy from GitHub (if CI/CD is configured)

## 📚 Notes

- The Next.js rewrites in `next.config.js` proxy `/hl/*` and `/ccxt/*` requests to the backend
- CCXT service handles exchange API calls for non-Hyperliquid exchanges
- Backend handles Hyperliquid-specific endpoints and proxies CCXT requests
- All services must be running for the application to work properly

