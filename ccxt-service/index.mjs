import express from 'express';
import ccxt from 'ccxt';

const SYMBOL_MAP = {
  hyperliquid: {},
  coinbase: {},
};

const defaultType = process.env.DEFAULT_MARKET_TYPE || 'swap';

function makeExchange(id, { defaultType: overrideType, keyPrefix, extraOptions = {} } = {}) {
  const exchangeClass = ccxt[id];
  if (!exchangeClass) {
    throw new Error(`Exchange ${id} is not supported by ccxt`);
  }

  const prefix = keyPrefix || id.toUpperCase();
  const config = {
    enableRateLimit: true,
    options: { defaultType: overrideType || defaultType, ...extraOptions },
  };

  const apiKey = process.env[`${prefix}_KEY`];
  const secret = process.env[`${prefix}_SECRET`];
  const password = process.env[`${prefix}_PASSWORD`] || process.env[`${prefix}_PASSPHRASE`];

  if (apiKey) {
    config.apiKey = apiKey;
  }
  if (secret) {
    config.secret = secret;
  }
  if (password) {
    config.password = password;
  }

  return new exchangeClass(config);
}

const exchanges = {
  hyperliquid: makeExchange('hyperliquid', { keyPrefix: 'HL' }),
  coinbase: makeExchange(process.env.COINBASE_ID || 'coinbaseinternational', {
    keyPrefix: 'CB',
    defaultType: process.env.COINBASE_DEFAULT_TYPE || 'swap',
  }),
};

const marketsLoaded = {
  hyperliquid: null,
  coinbase: null,
};

async function getExchange(exchangeId) {
  const exchange = exchanges[exchangeId];
  if (!exchange) {
    throw new Error(`Unknown exchange ${exchangeId}`);
  }

  if (!marketsLoaded[exchangeId]) {
    marketsLoaded[exchangeId] = exchange.loadMarkets();
  }
  await marketsLoaded[exchangeId];

  return exchange;
}

function buildSymbolMap(logicalSymbol, exchangeId, exchange) {
  if (SYMBOL_MAP[exchangeId][logicalSymbol]) {
    return SYMBOL_MAP[exchangeId][logicalSymbol];
  }

  const [base, quoted] = (logicalSymbol || '').split('-');
  const targetQuote = quoted === 'PERP' ? undefined : quoted;

  const market = Object.values(exchange.markets || {}).find((m) => {
    const isDeriv = ['swap', 'future'].includes(m.type);
    const matchesBase = m.base === base;
    const matchesQuote = targetQuote ? m.quote === targetQuote : true;
    return isDeriv && matchesBase && matchesQuote;
  });

  if (!market) {
    throw new Error(`Symbol mapping missing for ${exchangeId}:${logicalSymbol}`);
  }

  SYMBOL_MAP[exchangeId][logicalSymbol] = market.symbol;
  return market.symbol;
}

async function mapSymbol(logicalSymbol, exchangeId) {
  const exchange = await getExchange(exchangeId);
  return buildSymbolMap(logicalSymbol, exchangeId, exchange);
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

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/:exchange/markets', async (req, res) => {
  try {
    const exchange = await getExchange(req.params.exchange);
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
    if (!symbol) {
      throw new Error('symbol is required');
    }
    const exchange = await getExchange(req.params.exchange);
    const resolvedSymbol = await mapSymbol(symbol, req.params.exchange);
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
    if (!symbol) {
      throw new Error('symbol is required');
    }
    const exchange = await getExchange(req.params.exchange);
    const resolvedSymbol = await mapSymbol(symbol, req.params.exchange);
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
    if (!symbol) {
      throw new Error('symbol is required');
    }
    const exchange = await getExchange(req.params.exchange);
    const resolvedSymbol = await mapSymbol(symbol, req.params.exchange);
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

app.get('/api/:exchange/asset-info', async (req, res) => {
  const { symbol } = req.query;
  const { exchange } = req.params;
  try {
    if (!symbol) {
      throw new Error('symbol is required');
    }
    const ccxtExchange = await getExchange(exchange);
    const resolvedSymbol = await mapSymbol(symbol, exchange);
    const [ticker, markets] = await Promise.all([
      ccxtExchange.fetchTicker(resolvedSymbol),
      ccxtExchange.fetchMarkets(),
    ]);

    const market = markets.find((m) => m.symbol === resolvedSymbol);

    res.json({
      success: true,
      data: {
        symbol,
        marketId: resolvedSymbol,
        last: ticker.last,
        percentage: ticker.percentage,
        change: ticker.change,
        baseVolume: ticker.baseVolume ?? ticker.info?.base_volume,
        quoteVolume: ticker.quoteVolume ?? ticker.info?.quote_volume,
        funding: ticker.fundingRate ?? ticker.info?.funding_rate,
        info: ticker.info,
        meta: market ? { type: market.type, contractSize: market.contractSize } : undefined,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

app.get('/api/:exchange/portfolio', async (req, res) => {
  try {
    const exchange = await getExchange(req.params.exchange);
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
    const exchange = await getExchange(req.params.exchange);
    const resolvedSymbol = symbol
      ? await mapSymbol(symbol, req.params.exchange)
      : undefined;
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
    const exchange = await getExchange(req.params.exchange);
    const resolvedSymbol = symbol
      ? await mapSymbol(symbol, req.params.exchange)
      : undefined;
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
    const exchange = await getExchange(req.params.exchange);
    const resolvedSymbol = await mapSymbol(symbol, req.params.exchange);
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
    const exchange = await getExchange(req.params.exchange);
    const resolvedSymbol = symbol
      ? await mapSymbol(symbol, req.params.exchange)
      : undefined;
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
