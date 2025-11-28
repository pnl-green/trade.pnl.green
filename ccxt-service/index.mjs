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

function getSymbol(exchangeId, logicalSymbol) {
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

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[ccxt-service] ${req.method} ${req.path}`);
  next();
});

function getExchange(req) {
  const exchangeId = req.params.exchange;
  const exchange = exchanges[exchangeId];
  if (!exchange) {
    throw new Error(`Unknown exchange ${exchangeId}`);
  }
  return exchange;
}

app.get('/api/:exchange/markets', async (req, res) => {
  try {
    const exchange = getExchange(req);
    await exchange.loadMarkets();
    const markets = Object.values(exchange.markets).filter((m) =>
      ['swap', 'future'].includes(m.type)
    );
    res.json({ success: true, data: markets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/:exchange/candles', async (req, res) => {
  const { symbol, tf = '1m', since, limit } = req.query;
  try {
    const exchange = getExchange(req);
    const resolvedSymbol = getSymbol(req.params.exchange, symbol);
    const candles = await exchange.fetchOHLCV(resolvedSymbol, tf, since ? Number(since) : undefined, limit ? Number(limit) : undefined);
    res.json({ success: true, data: candles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/:exchange/orderbook', async (req, res) => {
  const { symbol, limit } = req.query;
  try {
    const exchange = getExchange(req);
    const resolvedSymbol = getSymbol(req.params.exchange, symbol);
    const book = await exchange.fetchOrderBook(resolvedSymbol, limit ? Number(limit) : undefined);
    res.json({ success: true, data: book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/:exchange/trades', async (req, res) => {
  const { symbol, limit, since } = req.query;
  try {
    const exchange = getExchange(req);
    const resolvedSymbol = getSymbol(req.params.exchange, symbol);
    const trades = await exchange.fetchTrades(resolvedSymbol, since ? Number(since) : undefined, limit ? Number(limit) : undefined);
    res.json({ success: true, data: trades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/:exchange/portfolio', async (req, res) => {
  try {
    const exchange = getExchange(req);
    const balance = await exchange.fetchBalance();
    res.json({ success: true, data: balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/:exchange/positions', async (req, res) => {
  const { symbol } = req.query;
  try {
    const exchange = getExchange(req);
    const resolvedSymbol = symbol ? getSymbol(req.params.exchange, symbol) : undefined;
    const positions = await exchange.fetchPositions(resolvedSymbol ? [resolvedSymbol] : undefined);
    res.json({ success: true, data: positions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/:exchange/order', async (req, res) => {
  const { symbol, type, side, size, price, params = {} } = req.body || {};
  try {
    const exchange = getExchange(req);
    const resolvedSymbol = getSymbol(req.params.exchange, symbol);
    const order = await exchange.createOrder(resolvedSymbol, type, side, size, price, params);
    res.json({ success: true, data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`ccxt-service listening on ${port}`);
});
