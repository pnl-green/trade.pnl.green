import express from 'express';
import ccxt from 'ccxt';

const SYMBOL_MAP = {
  coinbase: {},
  kraken: {},
  okx: {},
  bitfinex: {},
  gate: {},
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
  coinbase: makeExchange(process.env.COINBASE_ID || 'coinbase', {
    keyPrefix: 'CB',
    defaultType: process.env.COINBASE_DEFAULT_TYPE || 'spot',
  }),
  kraken: makeExchange('kraken', {
    keyPrefix: 'KR',
    defaultType: process.env.KRAKEN_DEFAULT_TYPE || 'spot',
  }),
  okx: makeExchange('okx', {
    keyPrefix: 'OK',
    defaultType: process.env.OKX_DEFAULT_TYPE || 'spot',
  }),
  bitfinex: makeExchange('bitfinex', {
    keyPrefix: 'BF',
    defaultType: process.env.BITFINEX_DEFAULT_TYPE || 'spot',
  }),
  gate: makeExchange('gate', {
    keyPrefix: 'GT',
    defaultType: process.env.GATE_DEFAULT_TYPE || 'spot',
  }),
};

const marketsLoaded = {
  coinbase: null,
  kraken: null,
  okx: null,
  bitfinex: null,
  gate: null,
};

async function getExchange(exchangeId) {
  const exchange = exchanges[exchangeId];
  if (!exchange) {
    throw new Error(`Unknown exchange ${exchangeId}`);
  }

  if (!marketsLoaded[exchangeId]) {
    marketsLoaded[exchangeId] = exchange.loadMarkets().catch((err) => {
      console.error(`Failed to load markets for ${exchangeId}:`, err);
      throw new Error(`Failed to load markets for ${exchangeId}: ${err.message}`);
    });
  }
  
  try {
    await marketsLoaded[exchangeId];
  } catch (err) {
    // Reset the promise so we can retry
    marketsLoaded[exchangeId] = null;
    throw err;
  }

  return exchange;
}

function buildSymbolMap(logicalSymbol, exchangeId, exchange) {
  if (SYMBOL_MAP[exchangeId][logicalSymbol]) {
    return SYMBOL_MAP[exchangeId][logicalSymbol];
  }

  if (!exchange.markets || Object.keys(exchange.markets).length === 0) {
    throw new Error(`Markets not loaded for ${exchangeId}. Please ensure the exchange is properly configured.`);
  }

  const [base, quoted] = (logicalSymbol || '').split('-');
  if (!base) {
    throw new Error(`Invalid symbol format: ${logicalSymbol}. Expected format: BASE-QUOTE (e.g., SOL-USDC)`);
  }
  
  const targetQuote = quoted === 'PERP' ? undefined : quoted;

  // For spot markets, look for exact match
  const market = Object.values(exchange.markets || {}).find((m) => {
    const matchesBase = m.base && m.base.toUpperCase() === base.toUpperCase();

    // Allow USD/USDC/USDT to be interchangeable for finding the market
    const aliases = targetQuote ? [targetQuote.toUpperCase()] : [];
    if (targetQuote && targetQuote.toUpperCase() === 'USD') {
      aliases.push('USDC', 'USDT');
    }
    if (targetQuote && targetQuote.toUpperCase() === 'USDC') {
      aliases.push('USD', 'USDT');
    }
    if (targetQuote && targetQuote.toUpperCase() === 'USDT') {
      aliases.push('USD', 'USDC');
    }

    const matchesQuote = targetQuote ? aliases.includes((m.quote || '').toUpperCase()) : true;
    const matchesType = m.type === 'spot'; // Only look for spot markets
    return matchesType && matchesBase && matchesQuote;
  });

  if (!market) {
    // Provide helpful error message with available markets
    const availableMarkets = Object.values(exchange.markets || {})
      .filter((m) => m.type === 'spot')
      .slice(0, 10)
      .map((m) => `${m.base}-${m.quote}`)
      .join(', ');
    
    throw new Error(
      `Symbol mapping missing for ${exchangeId}:${logicalSymbol}. ` +
      `Available markets include: ${availableMarkets}${Object.values(exchange.markets || {}).length > 10 ? '...' : ''}. ` +
      `Please check if the symbol exists on this exchange.`
    );
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
    // Filter for spot markets for all exchanges
    const markets = Object.values(exchange.markets).filter((m) =>
      m.type === 'spot'
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
    
    // Gate.io has a limit: "Maximum 10000 points ago are allowed"
    // Calculate the maximum allowed 'since' timestamp based on timeframe and limit
    let sinceTimestamp = since ? Number(since) : undefined;
    let requestLimit = limit ? Number(limit) : undefined;
    
    if (req.params.exchange === 'gate') {
      const now = Date.now();
      const maxPoints = 10000;
      
      // Parse timeframe to get milliseconds per candle
      const timeframeMs = parseTimeframe(tf);
      if (timeframeMs) {
        // Calculate maximum allowed 'since' based on maxPoints and timeframe
        const maxAgeMs = maxPoints * timeframeMs;
        const minAllowedSince = now - maxAgeMs;
        
        // If requested 'since' is too far back, don't pass it at all
        // Gate.io will return the most recent candles instead
        if (sinceTimestamp && sinceTimestamp < minAllowedSince) {
          console.warn(`Gate.io: Requested 'since' (${new Date(sinceTimestamp).toISOString()}) is too far back (max ${maxPoints} points). Omitting 'since' parameter to fetch recent candles.`);
          sinceTimestamp = undefined;
        }
        
        // Always limit the number of candles to maxPoints for Gate.io
        if (requestLimit && requestLimit > maxPoints) {
          console.warn(`Gate.io: Requested limit (${requestLimit}) exceeds maximum. Capping to ${maxPoints}`);
          requestLimit = maxPoints;
        } else if (!requestLimit) {
          // If no limit specified, use a safe default for Gate.io
          requestLimit = Math.min(1000, maxPoints);
        }
      }
    }
    
    const candles = await exchange.fetchOHLCV(
      resolvedSymbol,
      tf,
      sinceTimestamp,
      requestLimit
    );
    res.json({ success: true, data: candles });
  } catch (err) {
    console.error(err);
    res.status(500).json(formatError(err));
  }
});

// Helper function to parse timeframe string to milliseconds
function parseTimeframe(tf) {
  const match = tf.match(/^(\d+)([mhdwM])$/);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    'm': 60 * 1000,        // minutes
    'h': 60 * 60 * 1000,   // hours
    'd': 24 * 60 * 60 * 1000, // days
    'w': 7 * 24 * 60 * 60 * 1000, // weeks
    'M': 30 * 24 * 60 * 60 * 1000, // months (approximate)
  };
  
  return value * (multipliers[unit] || 0);
}

app.get('/api/:exchange/orderbook', async (req, res) => {
  const { symbol, limit } = req.query;
  try {
    if (!symbol) {
      throw new Error('symbol is required');
    }
    const exchange = await getExchange(req.params.exchange);
    const resolvedSymbol = await mapSymbol(symbol, req.params.exchange);
    
    // Bitfinex has specific limit requirements: 1, 25, 100, 250, 500
    // Map common limit values to valid Bitfinex limits
    let orderbookLimit = limit ? Number(limit) : undefined;
    if (req.params.exchange === 'bitfinex' && orderbookLimit) {
      // Map to nearest valid Bitfinex limit
      if (orderbookLimit <= 1) {
        orderbookLimit = 1;
      } else if (orderbookLimit <= 25) {
        orderbookLimit = 25;
      } else if (orderbookLimit <= 100) {
        orderbookLimit = 100;
      } else if (orderbookLimit <= 250) {
        orderbookLimit = 250;
      } else {
        orderbookLimit = 500;
      }
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
    
    // Calculate 24h change in USD from previous day price
    const prevDayPrice = ticker.previousClose ?? ticker.open ?? ticker.last;
    const change24hUsd = ticker.change ?? (ticker.last && prevDayPrice && prevDayPrice !== ticker.last 
      ? ticker.last - prevDayPrice 
      : undefined);
    const change24hPct = ticker.percentage ?? (prevDayPrice && prevDayPrice !== 0 && change24hUsd !== undefined
      ? ((change24hUsd / prevDayPrice) * 100) 
      : undefined);

    // Helper to return undefined instead of null for missing values
    const orUndefined = (value) => value !== null && value !== undefined ? value : undefined;

    res.json({
      success: true,
      data: {
        symbol,
        marketId: resolvedSymbol,
        // Mark Price (use last price as mark price for spot markets)
        markPrice: ticker.last,
        last: ticker.last,
        // Oracle Price (not available for most exchanges)
        oraclePrice: orUndefined(ticker.info?.oracle_price ?? ticker.info?.index_price),
        // 24hr Change
        change24hPct: orUndefined(change24hPct),
        change24hUsd: orUndefined(change24hUsd),
        percentage: orUndefined(ticker.percentage),
        change: orUndefined(ticker.change),
        // 24hr Volume - try multiple sources
        volume24h: orUndefined(
          ticker.baseVolume ?? 
          ticker.info?.base_volume ?? 
          ticker.info?.volume_24h ??
          ticker.info?.volume24h ??
          ticker.info?.volume
        ),
        baseVolume: orUndefined(ticker.baseVolume ?? ticker.info?.base_volume),
        quoteVolume: orUndefined(ticker.quoteVolume ?? ticker.info?.quote_volume),
        // Open Interest (only for derivatives)
        openInterest: orUndefined(ticker.openInterest ?? ticker.info?.open_interest ?? ticker.info?.oi),
        // Funding Rate (only for perpetual swaps)
        fundingRate: orUndefined(ticker.fundingRate ?? ticker.info?.funding_rate),
        funding: orUndefined(ticker.fundingRate ?? ticker.info?.funding_rate),
        // Funding Countdown (not available from CCXT)
        fundingCountdown: orUndefined(ticker.info?.funding_countdown ?? ticker.info?.next_funding_time),
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
