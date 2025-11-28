import ccxt from 'ccxt';

export type SupportedExchangeId = string;

export interface ExchangeCredentials {
  apiKey: string;
  secret: string;
  password?: string;
  uid?: string;
}

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface BaseOrderRequest {
  exchangeId: SupportedExchangeId;
  symbol: string;
  side: OrderSide;
  amount: number;
  params?: ccxt.Params;
}

export interface MarketOrderRequest extends BaseOrderRequest {
  type: 'market';
}

export interface LimitOrderRequest extends BaseOrderRequest {
  type: 'limit';
  price: number;
}

export interface UnifiedOrderResponse {
  id: string;
  status: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number | undefined;
  amount: number;
  filled: number;
  remaining: number;
  raw: ccxt.Order;
}

export interface ConfiguredExchange {
  id: SupportedExchangeId;
  label: string;
  instance: ccxt.Exchange;
  tradingEnabled: boolean;
}

export class ExchangeRegistry {
  private exchanges: Map<SupportedExchangeId, ConfiguredExchange>;

  constructor() {
    this.exchanges = new Map();
  }

  public configureExchange(
    exchangeId: SupportedExchangeId,
    label: string,
    credentials: ExchangeCredentials,
    options: ccxt.Params = {}
  ): void {
    const ExchangeClass = (ccxt as any)[exchangeId];
    if (!ExchangeClass) {
      throw new Error(`Unsupported exchange: ${exchangeId}`);
    }

    const instance = new ExchangeClass({
      apiKey: credentials.apiKey,
      secret: credentials.secret,
      password: credentials.password,
      uid: credentials.uid,
      enableRateLimit: true,
      ...options,
    });

    this.exchanges.set(exchangeId, {
      id: exchangeId,
      label,
      instance,
      tradingEnabled: false,
    });
  }

  public setTradingEnabled(exchangeId: SupportedExchangeId, enabled: boolean): void {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) {
      throw new Error(`Exchange not configured: ${exchangeId}`);
    }
    exchange.tradingEnabled = enabled;
  }

  public isTradingEnabled(exchangeId: SupportedExchangeId): boolean {
    return this.getConfiguredExchange(exchangeId).tradingEnabled;
  }

  public getConfiguredExchange(exchangeId: SupportedExchangeId): ConfiguredExchange {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) {
      throw new Error(`Exchange not configured: ${exchangeId}`);
    }
    return exchange;
  }

  public async placeMarketOrder(
    request: Omit<MarketOrderRequest, 'type'>
  ): Promise<UnifiedOrderResponse> {
    return this.placeOrder({ ...request, type: 'market' });
  }

  public async placeLimitOrder(
    request: Omit<LimitOrderRequest, 'type'>
  ): Promise<UnifiedOrderResponse> {
    return this.placeOrder({ ...request, type: 'limit' });
  }

  private async placeOrder(request: MarketOrderRequest | LimitOrderRequest): Promise<UnifiedOrderResponse> {
    const exchange = this.getConfiguredExchange(request.exchangeId);
    if (!exchange.tradingEnabled) {
      throw new Error(
        `Trading is disabled for exchange ${request.exchangeId}. Enable it before placing orders.`
      );
    }

    if (request.side !== 'buy' && request.side !== 'sell') {
      throw new Error('Order side must be "buy" or "sell".');
    }

    if (request.type === 'limit' && (!request.price || request.price <= 0)) {
      throw new Error('Limit orders require a positive price.');
    }

    try {
      const order = await exchange.instance.createOrder(
        request.symbol,
        request.type,
        request.side,
        request.amount,
        request.type === 'limit' ? request.price : undefined,
        request.params ?? {}
      );

      return {
        id: order.id,
        status: order.status ?? 'unknown',
        symbol: order.symbol,
        side: order.side as OrderSide,
        type: order.type as OrderType,
        price: typeof order.price === 'number' ? order.price : undefined,
        amount: order.amount ?? request.amount,
        filled: order.filled ?? 0,
        remaining: order.remaining ?? 0,
        raw: order,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to place ${request.type} order on ${request.exchangeId}: ${message}`);
    }
  }
}

// Example usage (pseudo-code):
//
// const registry = new ExchangeRegistry();
//
// registry.configureExchange(
//   'binance',
//   'Binance Futures',
//   {
//     apiKey: process.env.BINANCE_API_KEY!,
//     secret: process.env.BINANCE_SECRET!,
//   },
//   {
//     // options: { defaultType: 'future' },
//   }
// );
//
// registry.setTradingEnabled('binance', true);
//
// const marketOrderResponse = await registry.placeMarketOrder({
//   exchangeId: 'binance',
//   symbol: 'BTC/USDT',
//   side: 'buy',
//   amount: 0.01,
// });
//
// const limitOrderResponse = await registry.placeLimitOrder({
//   exchangeId: 'binance',
//   symbol: 'BTC/USDT',
//   side: 'sell',
//   amount: 0.01,
//   price: 70000,
// });
//
// All credentials are provided by the user locally and never sent to a remote server.
// The registry keeps in-memory ccxt instances and exposes unified market/limit order helpers.
