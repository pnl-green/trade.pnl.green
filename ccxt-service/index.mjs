import express from 'express';
import ccxt from 'ccxt';

const SYMBOL_MAP = {
  'BTC-PERP': {
    hyperliquid: 'BTC/USDC:USDC',
    coinbase: 'BTC-USD-PERP',
  },
  'ETH-PERP': {
    hyperliquid: 'ETH/USDC:USDC',
    coinbase: 'ETH-USD-PERP',
  },
};

const defaultType = process.env.DEFAULT_MARKET_TYPE || 'swap';

function createExchange(id, { apiKey, secret, password }) {
  const exchangeClass = ccxt[id];
  if (!exchangeClass) {
    throw new Error(`Exchange ${id} is not supported by ccxt`);
  }

  return new exchangeClass({
    apiKey,
    secret,
    password,
    options: { defaultType },
    enableRateLimit: true,
  });
}

function buildExchanges() {
  return {
    hyperliquid: createExchange('hyperliquid', {
      apiKey: process.env.HL_KEY,
      secret: process.env.HL_SECRET,
      password: process.env.HL_PASSWORD,
    }),
    coinbase: createExchange(process.env.COINBASE_ID || 'coinbase', {
      apiKey: process.env.CB_KEY,
      secret: process.env.CB_SECRET,
      password: process.env.CB_PASSPHRASE,
    }),
  };
}

const exchanges = buildExchanges();

function getExchange(exchangeId) {
  const exchange = exchanges[exchangeId];
  if (!exchange) {
    throw new Error(`Unknown exchange ${exchangeId}`);
  }
  return exchange;
}

function mapSymbol(logicalSymbol, exchangeId) {
  const mapping = SYMBOL_MAP[logicalSymbol];
  if (!mapping) {
    throw new Error(`Unknown logical symbol ${logicalSymbol}`);
  }
  const symbol = mapping[exchangeId];
  if (!symbol) {
    throw new Error(`Symbol mapping missing for ${exchangeId}`);
  }
  return symbol;
}

function formatError(err) {
  const message = err?.message || String(err);
  return { success: false, error: message };
}

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[ccxt-service] ${req.method} ${req.path}`);
  next();
});

app.get('/api/:exchange/markets', async (req, res) => {
  try {
    const exchange = getExchange(req.params.exchange);
    await exchange.loadMarkets();
    const markets = Object.values(exchange.markets).filter((m) =>
      ['swap', 'future'].includes(m.type)
    );
    res.json({ success: true, data: markets });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.get('/api/:exchange/candles', async (req, res) => {
  const { symbol, tf = '1m', since, limit } = req.query;
  try {
    const exchange = getExchange(req.params.exchange);
    const resolvedSymbol = mapSymbol(symbol, req.params.exchange);
    const candles = await exchange.fetchOHLCV(
      resolvedSymbol,
      tf,
      since ? Number(since) : undefined,
      limit ? Number(limit) : undefined
    );
    res.json({ success: true, data: candles });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.get('/api/:exchange/orderbook', async (req, res) => {
  const { symbol, limit } = req.query;
  try {
    const exchange = getExchange(req.params.exchange);
    const resolvedSymbol = mapSymbol(symbol, req.params.exchange);
    const book = await exchange.fetchOrderBook(
      resolvedSymbol,
      limit ? Number(limit) : undefined
    );
    res.json({
      success: true,
      data: { bids: book.bids, asks: book.asks, timestamp: book.timestamp },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.get('/api/:exchange/trades', async (req, res) => {
  const { symbol, limit, since } = req.query;
  try {
    const exchange = getExchange(req.params.exchange);
    const resolvedSymbol = mapSymbol(symbol, req.params.exchange);
    const trades = await exchange.fetchTrades(
      resolvedSymbol,
      since ? Number(since) : undefined,
      limit ? Number(limit) : undefined
    );
    const normalized = trades.map((t) => ({
      id: t.id,
      timestamp: t.timestamp,
      side: t.side,
      price: t.price,
      amount: t.amount,
      info: t.info,
    }));
    res.json({ success: true, data: normalized });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.get('/api/:exchange/portfolio', async (req, res) => {
  try {
    const exchange = getExchange(req.params.exchange);
    const balance = await exchange.fetchBalance();
    res.json({ success: true, data: balance });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.get('/api/:exchange/positions', async (req, res) => {
  const { symbol } = req.query;
  try {
    const exchange = getExchange(req.params.exchange);
    const resolvedSymbol = symbol ? mapSymbol(symbol, req.params.exchange) : undefined;
    const positions = await exchange.fetchPositions(
      resolvedSymbol ? [resolvedSymbol] : undefined
    );
    const normalized = positions.map((p) => ({
      symbol: p.symbol,
      side: p.side,
      contracts: p.contracts ?? p.amount,
      entryPrice: p.entryPrice,
      unrealizedPnl: p.unrealizedPnl ?? p.unrealizedProfit,
      leverage: p.leverage,
      liquidationPrice: p.liquidationPrice,
      info: p.info,
    }));
    res.json({ success: true, data: normalized });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.get('/api/:exchange/position-history', async (req, res) => {
  const { symbol, since, limit } = req.query;
  try {
    const exchange = getExchange(req.params.exchange);
    const resolvedSymbol = symbol ? mapSymbol(symbol, req.params.exchange) : undefined;
    const trades = await exchange.fetchMyTrades(
      resolvedSymbol,
      since ? Number(since) : undefined,
      limit ? Number(limit) : undefined
    );
    res.json({ success: true, data: trades });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.post('/api/:exchange/order', async (req, res) => {
  const { symbol, type, side, size, price, params = {} } = req.body || {};
  try {
    const exchange = getExchange(req.params.exchange);
    const resolvedSymbol = mapSymbol(symbol, req.params.exchange);
    const order = await exchange.createOrder(
      resolvedSymbol,
      type,
      side,
      size,
      price,
      params
    );
    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.delete('/api/:exchange/order/:id', async (req, res) => {
  const { id } = req.params;
  const { symbol, params = {} } = req.query;
  try {
    const exchange = getExchange(req.params.exchange);
    const resolvedSymbol = symbol ? mapSymbol(symbol, req.params.exchange) : undefined;
    const result = await exchange.cancelOrder(id, resolvedSymbol, params);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`ccxt-service listening on ${port}`);
});
