import express from 'express';
import ccxt from 'ccxt';

// Initialize exchanges with error handling
const exchanges = {};

function makeExchange(id, options = {}) {
  const exchangeClass = ccxt[id];
  if (!exchangeClass) {
    throw new Error(`Exchange ${id} is not supported by ccxt`);
  }
  return new exchangeClass({
    ...options,
    enableRateLimit: true,
  });
}

try {
  exchanges.coinbase = makeExchange('coinbase', {
    keyPrefix: 'CB',
    defaultType: 'spot', // Always use 'spot' for Coinbase public data
  });
  console.log('Coinbase exchange initialized:', exchanges.coinbase.id);
} catch (err) {
  console.error('Failed to initialize Coinbase exchange:', err);
}

try {
  exchanges.kraken = makeExchange('kraken', {
    keyPrefix: 'KR',
    defaultType: process.env.KRAKEN_DEFAULT_TYPE || 'spot',
  });
  exchanges.okx = makeExchange('okx', {
    keyPrefix: 'OK',
    defaultType: process.env.OKX_DEFAULT_TYPE || 'spot',
  });
  exchanges.bitfinex = makeExchange('bitfinex', {
    keyPrefix: 'BF',
    defaultType: process.env.BITFINEX_DEFAULT_TYPE || 'spot',
  });
  exchanges.gate = makeExchange('gate', {
    keyPrefix: 'GT',
    defaultType: process.env.GATE_DEFAULT_TYPE || 'spot',
  });
  console.log('Other exchanges initialized:', Object.keys(exchanges).filter(k => k !== 'coinbase'));
} catch (err) {
  console.error('Failed to initialize other exchanges:', err);
}

function getExchange(exchangeId) {
  const exchange = exchanges[exchangeId];
  if (!exchange) {
    throw new Error(`Unknown exchange ${exchangeId}. Available: ${Object.keys(exchanges).join(', ')}`);
  }
  return exchange;
}

// Convert logical symbol (e.g., "BTC-USDC") to exchange-specific format
function buildSymbolMap(exchange, logicalSymbol) {
  if (!exchange.markets || Object.keys(exchange.markets).length === 0) {
    throw new Error('Markets not loaded for exchange');
  }

  const [base, quote] = logicalSymbol.split('-');
  if (!base || !quote) {
    throw new Error(`Invalid symbol format: ${logicalSymbol}. Expected format: BASE-QUOTE`);
  }

  // Normalize quote symbols (USD/USDC/USDT are interchangeable)
  const normalizedQuote = quote.toUpperCase();
  const quoteVariants = [normalizedQuote];
  if (normalizedQuote === 'USD') {
    quoteVariants.push('USDC', 'USDT');
  } else if (normalizedQuote === 'USDC') {
    quoteVariants.push('USD', 'USDT');
  } else if (normalizedQuote === 'USDT') {
    quoteVariants.push('USD', 'USDC');
  }

  // Try to find matching market
  for (const quoteVar of quoteVariants) {
    // Try different symbol formats
    const formats = [
      `${base}/${quoteVar}`,      // BTC/USD
      `${base}-${quoteVar}`,      // BTC-USD
      `${base}_${quoteVar}`,      // BTC_USD
    ];

    for (const format of formats) {
      if (exchange.markets[format]) {
        return format;
      }
    }
  }

  throw new Error(`Symbol ${logicalSymbol} not found on ${exchange.id}`);
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
    
    // Filter for spot markets for most exchanges
    const marketType = req.params.exchange === 'coinbase' ? 'spot' : 'spot';
    const markets = Object.values(exchange.markets).filter((m) => {
      if (m.type !== marketType) return false;
      // Filter for markets with USD/USDC/USDT quotes
      const quote = (m.quote || '').toUpperCase();
      return ['USD', 'USDC', 'USDT'].includes(quote);
    });
    
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
    await exchange.loadMarkets();
    const resolvedSymbol = buildSymbolMap(exchange, symbol);
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
    await exchange.loadMarkets();
    const resolvedSymbol = buildSymbolMap(exchange, symbol);
    
    // Bitfinex requires specific limit values
    let orderbookLimit = limit ? Number(limit) : undefined;
    if (req.params.exchange === 'bitfinex' && orderbookLimit) {
      const validLimits = [1, 25, 100, 250, 500];
      orderbookLimit = validLimits.reduce((prev, curr) => 
        Math.abs(curr - orderbookLimit) < Math.abs(prev - orderbookLimit) ? curr : prev
      );
    }
    
    const book = await exchange.fetchOrderBook(
      resolvedSymbol,
      orderbookLimit
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
    await exchange.loadMarkets();
    const resolvedSymbol = buildSymbolMap(exchange, symbol);
    
    // Add timeout for exchanges that might hang
    const timeout = req.params.exchange === 'hyperliquid' ? 8000 : undefined;
    const tradesPromise = exchange.fetchTrades(
      resolvedSymbol,
      since ? Number(since) : undefined,
      limit ? Number(limit) : undefined
    );
    
    let trades;
    if (timeout) {
      trades = await Promise.race([
        tradesPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]);
    } else {
      trades = await tradesPromise;
    }
    
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
    // Return empty array on timeout instead of error
    if (err.message === 'Timeout') {
      res.json({ success: true, data: [] });
    } else {
      res.status(500).json(formatError(err));
    }
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
    await exchange.loadMarkets();
    const resolvedSymbol = symbol ? buildSymbolMap(exchange, symbol) : undefined;
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
    await exchange.loadMarkets();
    const resolvedSymbol = symbol ? buildSymbolMap(exchange, symbol) : undefined;
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
    await exchange.loadMarkets();
    const resolvedSymbol = buildSymbolMap(exchange, symbol);
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
    await exchange.loadMarkets();
    const resolvedSymbol = symbol ? buildSymbolMap(exchange, symbol) : undefined;
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
