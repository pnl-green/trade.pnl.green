import { TradingViewComponent } from '@/styles/pnl.styles';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
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
import TerminalLayout, {
  BottomArea,
  ChartArea,
  OrderbookArea,
  TicketArea,
} from './layout/TerminalLayout';
import Panel from './ui/Panel';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import Tooltip from './ui/Tooltip';


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
  const [syncedHeight, setSyncedHeight] = useState<number | undefined>();
  const orderTicketRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (pairs.length !== 0) {
      return
    }
    let merged = tokenPairData;
    merged = merged.concat(allTokenPairs);
    setPairs(merged)
  }, [allTokenPairs])

  useEffect(() => {
    if (!orderTicketRef.current || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      setSyncedHeight(height);
    });

    observer.observe(orderTicketRef.current);
    return () => observer.disconnect();
  }, []);


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

        let url = parsedSymbol.toSymbol === "USD" ? "https://api.hyperliquid.xyz/info" : "https://trade.intelayer.com/hyperliquid" 
        let data = await fetch(url, requestOptions)
          .then(response => response.json());
        let bars: any[] = [];
        let response = parsedSymbol.toSymbol === "USD" ? data : data.data
        response.forEach((bar: any) => {
          if (bar.t >= from * 1000 && bar.T < to * 1000) {
            bars = [...bars, {
              time: Number(bar.t),
              low: Number(bar.l),
              high: Number(bar.h),
              open: Number(bar.o),
              close: Number(bar.c),
            }];
          }
        });
        if (firstDataRequest) {
          lastBarsCache.set(symbolInfo.full_name, {
            ...bars[bars.length - 1],
          });
        }

        if (bars.length > 0) {
          onHistoryCallback(bars, { noData: false });
        }
        else {
          onHistoryCallback([], { noData: true });
        }      
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

  const chartElement = useMemo(
    () =>
      renderAdvancedChart ? (
        <AdvancedChartMemoized {...defaultWidgetProps} />
      ) : null,
    [renderAdvancedChart, tokenPairs, pairs]
  );
  
  return (
    <TerminalLayout topBar={<TokenPairInformation />}>
      <ChartArea>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            minHeight: 0,
            height: syncedHeight ? `${syncedHeight}px` : '100%',
          }}
        >
          <Panel noPadding sx={{ flex: 1, minHeight: '100%' }}>{chartElement}</Panel>
        </Box>
      </ChartArea>
      <OrderbookArea>
        <Panel title="Order Book & Trades">
          <OrderBookAndTrades />
        </Panel>
      </OrderbookArea>
      <TicketArea>
        <Box ref={orderTicketRef} sx={{ width: '100%' }}>
          <Panel title="Risk Manager & Order Ticket" sx={{ flex: 1 }}>
            <OrderPlacement />
          </Panel>
        </Box>
        <Panel
          title="Portfolio Snapshot"
          sx={{
            gap: '8px',
            '& span': { fontFamily: intelayerFonts.body, fontSize: '14px' },
          }}
        >
          {[{
            label: 'Balance',
            value: balance ? `$${Number(balance).toFixed(2)}` : '$0.00',
            tooltip:
              'Balance is your total account value before unrealized PnL, denominated in the account currency.',
          },
          { label: 'uPNL', value: '$0.00', tooltip: 'uPNL (Unrealized PnL) is your current profit or loss on open positions based on mark price.' },
          { label: 'Equity', value: '$0.00', tooltip: 'Equity is Balance plus Unrealized PnL. It is the effective value of your account right now.' },
          { label: 'Cross Margin Ratio', value: '$0.00', tooltip: 'Cross Margin Ratio shows how much of your account equity is currently committed to margin across all positions.' },
          { label: 'Maintenance Margin', value: '$0.00', tooltip: 'Maintenance Margin is the minimum margin level you must maintain to avoid liquidation.' },
          { label: 'Cross Account Leverage', value: '$0.00', tooltip: 'Cross Account Leverage is your effective leverage across the entire account, using all open positions and equity.' }].map(
            ({ label, value, tooltip }) => (
              <FlexItems key={label}>
                <Tooltip content={tooltip}>
                  <span>{label}</span>
                </Tooltip>
                <span style={label === 'Cross Margin Ratio' ? { color: intelayerColors.green[500] } : undefined}>
                  {value}
                </span>
              </FlexItems>
            )
          )}
        </Panel>
        <Panel title="Intelayer Assistant">
          <ChatComponent />
        </Panel>
      </TicketArea>
      <BottomArea>
        <Panel title="Positions & History" sx={{ flex: 1 }}>
          <PositionsOrdersHistory />
        </Panel>
      </BottomArea>
    </TerminalLayout>
  );
};

export default PnlComponent;
