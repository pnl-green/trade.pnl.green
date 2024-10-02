import {
  generateSymbol,
  parseFullSymbol,
} from './helpers';
import {
  subscribeOnStream,
  unsubscribeFromStream,
} from './streaming';

const lastBarsCache = new Map();

// DatafeedConfiguration implementation
const configurationData = {
  // Represents the resolutions for bars supported by your datafeed
  supported_resolutions: ['1H', '1D', '1W', '1M'],

  // The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
  exchanges: [{
    value: 'Hyperliquid',
    name: 'Hyperliquid',
    desc: 'Hyperliquid',
  },
  ],
  // The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
  symbols_types: [{
    name: 'crypto',
    value: 'crypto',
  },
  ],
};

// Obtains all symbols for all exchanges supported by CryptoCompare API
async function getAllSymbols() {
  let allSymbols = [{
    symbol: "BTC/APT",
    full_name: "Hyperliquid:BTC/APT",
    description: "BTC/APT",
    exchange: "Hyperliquid",
    type: 'crypto',
  }];

  return allSymbols;
}

export default {
  onReady: (callback: any) => {
    console.log('[onReady]: Method call');
    setTimeout(() => callback(configurationData));
  },

  searchSymbols: async (
    userInput: any,
    exchange: any,
    symbolType: any,
    onResultReadyCallback: any,
  ) => {
    console.log('[searchSymbols]: Method call');
    const symbols = await getAllSymbols();
    const newSymbols = symbols.filter(symbol => {
      const isExchangeValid = exchange === '' || symbol.exchange === exchange;
      const isFullSymbolContainsInput = symbol.full_name
        .toLowerCase()
        .indexOf(userInput.toLowerCase()) !== -1;
      return isExchangeValid && isFullSymbolContainsInput;
    });
    onResultReadyCallback(newSymbols);
  },

  resolveSymbol: async (
    symbolName: any,
    onSymbolResolvedCallback: any,
    onResolveErrorCallback: any,
    extension: any
  ) => {
    console.log('[resolveSymbol]: Method call', symbolName);
    const symbols = await getAllSymbols();
    console.log(symbols, symbolName);
    const symbolItem = symbols.find(({
      full_name,
    }) => full_name === symbolName);
    if (!symbolItem) {
      console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
      onResolveErrorCallback('cannot resolve symbol');
      return;
    }
    // Symbol information object
    const symbolInfo = {
      ticker: symbolItem.full_name,
      name: symbolItem.symbol,
      description: symbolItem.description,
      type: symbolItem.type,
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: symbolItem.exchange,
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      has_no_volume: true,
      has_weekly_and_monthly: false,
      supported_resolutions: configurationData.supported_resolutions,
      volume_precision: 2,
      data_status: 'streaming',
    };

    console.log('[resolveSymbol]: Symbol resolved', symbolName);
    onSymbolResolvedCallback(symbolInfo);
  },

  getBars: async (symbolInfo: any, resolution: any, periodParams: any, onHistoryCallback: any, onErrorCallback: any) => {
    const { from, to, firstDataRequest } = periodParams;
    console.log('[getBars]: Method call', symbolInfo, resolution, from, to);
    const parsedSymbol: any = parseFullSymbol(symbolInfo.full_name);
    try {
      let headers = new Headers();
      headers.append("Content-Type", "application/json");


      let raw = JSON.stringify({
        "endpoint": "info",
        "type": "pairCandleSnapshot",
        "req": {
          "coin": parsedSymbol.fromSymbol,
          "interval": "1h",
          "startTime": from * 1000,
          "endTime": to * 1000
        },
        "pair_coin": parsedSymbol.toSymbol
      });

      let requestOptions = {
        method: 'POST',
        headers: headers,
        body: raw,
      };

      let data = await fetch("http://127.0.0.1:5000/hyperliquid", requestOptions)
        .then(response => response.json());
      let bars: any[] = [];
      data.data.forEach((bar: any) => {
        if (bar.t >= from * 1000 && bar.T < to * 1000) {
          bars = [...bars, {
            time: bar.t,
            low: bar.l,
            high: bar.h,
            open: bar.o,
            close: bar.c,
          }];
        }
      });
      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.full_name, {
          ...bars[bars.length - 1],
        });
      }
      console.log(`[getBars]: returned ${bars.length} bar(s)`);
      onHistoryCallback(bars, {
        noData: false,
      });
    } catch (error) {
      console.log('[getBars]: Get error', error);
      onErrorCallback(error);
    }
  },

  subscribeBars: (
    symbolInfo: any,
    resolution: any,
    onRealtimeCallback: any,
    subscriberUID: any,
    onResetCacheNeededCallback: any,
  ) => {
    console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.full_name),
    );
  },

  unsubscribeBars: (subscriberUID: any) => {
    console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
    unsubscribeFromStream(subscriberUID);
  },
};
