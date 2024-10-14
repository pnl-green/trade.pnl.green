import {
  PnlWrapper,
  TradingViewComponent,
  WalletBox,
} from '@/styles/pnl.styles';
import React, { memo, useMemo,  createContext, useContext, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import OrderPlacement from './order-placement-terminal';
import { FlexItems } from '@/styles/common.styles';
import PositionsOrdersHistory from './positions-history-components';
import ChatComponent from './chatComponent';
import OrderBookAndTrades from './order-book-and-trades';
import TokenPairInformation from './token-pair-information';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { useWebDataContext } from '@/context/webDataContext';
import dynamic from "next/dynamic";
import {
  ChartingLibraryWidgetOptions,
  ResolutionString,
} from "@/public/static/charting_library";

import {
  generateSymbol,
  parseFullSymbol,
} from '@/components/TVChartContainer/helpers';
import {
  subscribeOnStream,
  unsubscribeFromStream,
} from '@/components/TVChartContainer/streaming';


const TVChartContainer = dynamic(
  () =>
    import("@/components/TVChartContainer").then((mod) => mod.TVChartContainer),
  { ssr: false }
);
//------Memoized Component to ------
const AdvancedChartMemoized = memo(function AdvancedChartMemoized(props: any) {
  return (
    <TradingViewComponent>
      <TVChartContainer {...props} />
    </TradingViewComponent>
  );
});

const PnlComponent = () => {
  //------Context------
  const { webData2 } = useWebDataContext();
  const { tokenPairs } = usePairTokensContext();

  const { allTokenPairs, tokenPairData } = usePairTokensContext();

  const [ pairs, setPairs ] = useState([])
  useEffect(() => {
    if (pairs.length !== 0) {
      return
    }
    let merged = tokenPairData;
    merged = merged.concat(allTokenPairs);
    setPairs(merged)
  }, [allTokenPairs])


    // ====== //

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
  function getAllSymbols() {
    let allSymbols = pairs.map( (item: any ) => {
      let formatted_pair = item.pairs.replaceAll("-", "/");
      return {
        symbol: formatted_pair,
        full_name: `Hyperliquid:${formatted_pair}`,
        description: formatted_pair,
        exchange: "Hyperliquid",
        type: 'crypto'
      }
    })

    return allSymbols;
  }

  let datafeed = {
    allSymbolsCtx: [],

    setAllSymbolsCtx(newCtx: any) {
      this.allSymbolsCtx = newCtx
    },

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
      const symbols = getAllSymbols()
      const newSymbols = symbols.filter( ( symbol: any ) => {
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
      const symbols = getAllSymbols();
      console.log(symbols, symbolName);
      const symbolItem = symbols.find(({
        full_name,
      }: { full_name: any }) => full_name === symbolName);
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
          "type": parsedSymbol.toSymbol === "USD" ? "candleSnapshot" : "pairCandleSnapshot",
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

        let url = parsedSymbol.toSymbol === "USD" ? "https://api.hyperliquid.xyz/info" : "https://api.pnl.green/hyperliquid" 
        let data = await fetch(url, requestOptions)
          .then(response => response.json());
        let bars: any[] = [];
        let response = parsedSymbol.toSymbol === "USD" ? data : data.data
        response.forEach((bar: any) => {
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

  // ====== //

  const balance = webData2.clearinghouseState?.marginSummary.accountValue;

  const renderAdvancedChart = tokenPairs.length > 1; //render chart only when token pairs are selected

  const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
    interval: "1H" as ResolutionString,
    datafeed: datafeed,
    library_path: "/static/charting_library/charting_library/",
    locale: "en",
    fullscreen: false,
    autosize: true,
    theme: "dark",
    symbol: tokenPairs ? `Hyperliquid:${tokenPairs[0]}/${tokenPairs[1]}` : '',
  };
  
  return (
    <PnlWrapper>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <TokenPairInformation />

        {useMemo(
          () =>
            renderAdvancedChart ? (
              <AdvancedChartMemoized {...defaultWidgetProps} />
            ) : null,
          [renderAdvancedChart, tokenPairs, pairs]
        )}

        <PositionsOrdersHistory />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <OrderBookAndTrades />
        <ChatComponent />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          '@media (max-width: 1535px)': {
            flexDirection: 'row',
            flexWrap: 'wrap',
          },
          '@media (max-width: 899px)': {
            flexDirection: 'column',
            flexWrap: 'nowrap',
          },
        }}
      >
        <OrderPlacement />

        <WalletBox sx={{ span: { fontSize: '15px' } }} id="wallet-component">
          <FlexItems>
            <span>Balance</span>
            <span>{balance ? `$${Number(balance).toFixed(2)}` : '$0.00'}</span>
          </FlexItems>
          <FlexItems>
            <span>uPNL</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Equity</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Cross Margin Ratio</span>
            <span className="green">$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Maintenance Margin</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Cross Account Leverage</span>
            <span>$0.00</span>
          </FlexItems>
        </WalletBox>
      </Box>
    </PnlWrapper>
  );
};

export default PnlComponent;
