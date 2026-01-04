import { TradingViewComponent } from '@/styles/pnl.styles';
import React, { memo, useEffect, useMemo, useState } from 'react';
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

import { parseFullSymbol } from '@/components/TVChartContainer/helpers';
import {
  subscribeOnStream,
  unsubscribeFromStream,
} from '@/components/TVChartContainer/streaming';
import TerminalLayout from './layout/TerminalLayout';
import PanelCard from './ui/PanelCard';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import Tooltip from './ui/Tooltip';
import { styled } from '@mui/material';
import { useChartInteractionContext } from '@/context/chartInteractionContext';
import { useExchange } from '@/context/exchangeContext';

const normalizePairName = (pair?: string) => {
  if (!pair) return '';

  const [base, quote] = pair.split('-');
  const upperQuote = quote?.toUpperCase();
  const normalizedQuote =
    upperQuote === 'USDCC' || upperQuote === 'USD' ? 'USDC' : upperQuote;

  return quote ? `${base}-${normalizedQuote}` : base;
};

// Helper function to parse resolution string to seconds
function parseResolutionToSeconds(resolution: string): number {
  const normalized = resolution.toString().toUpperCase();
  const match = normalized.match(/^(\d+)([MHDW])$/);
  if (!match) return 60; // Default to 1 minute
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    'M': 60,           // minutes
    'H': 60 * 60,      // hours
    'D': 24 * 60 * 60, // days
    'W': 7 * 24 * 60 * 60, // weeks
  };
  
  return value * (multipliers[unit] || 60);
}

const TVChartContainer = dynamic(
  () =>
    import("@/components/TVChartContainer").then((mod) => mod.TVChartContainer),
  { ssr: false }
);

const AdvancedChartMemoized = memo(function AdvancedChartMemoized(props: any) {
  return (
    <TradingViewComponent>
      <TVChartContainer {...props} />
    </TradingViewComponent>
  );
});

const PnlComponent = () => {
  const { webData2 } = useWebDataContext();
  const { tokenPairs } = usePairTokensContext();
  const { allTokenPairs, tokenPairData } = usePairTokensContext();
  const { selectionMode, handleChartPricePick } = useChartInteractionContext();
  const { currentExchangeId } = useExchange();

  const [pairs, setPairs] = useState([]);

  useEffect(() => {
    let merged = tokenPairData;
    merged = merged.concat(allTokenPairs);
    const normalizedPairs = merged.map((item: any) => ({
      ...item,
      pairs: normalizePairName(item.pairs),
    }));
    setPairs(normalizedPairs);
  }, [allTokenPairs, tokenPairData, currentExchangeId]);

  const lastBarsCache = new Map();

  const configurationData = {
    supported_resolutions: ['1H', '1D', '1W', '1M'],
    exchanges: [
      {
        value: 'Coinbase',
        name: 'Coinbase',
        desc: 'Coinbase',
      },
      {
        value: 'Kraken',
        name: 'Kraken',
        desc: 'Kraken',
      },
      {
        value: 'OKX',
        name: 'OKX',
        desc: 'OKX',
      },
      {
        value: 'Bitfinex',
        name: 'Bitfinex',
        desc: 'Bitfinex',
      },
      {
        value: 'Gate',
        name: 'Gate.io',
        desc: 'Gate.io',
      },
    ],
    symbols_types: [
      {
        name: 'crypto',
        value: 'crypto',
      },
    ],
  };

  function getAllSymbols() {
    let allSymbols = pairs.map((item: any) => {
      const normalizedPair = normalizePairName(item.pairs);
      let formatted_pair = normalizedPair.replaceAll("-", "/");
      return {
        symbol: formatted_pair,
        full_name: `${currentExchangeId}:${formatted_pair}`,
        description: formatted_pair,
        exchange: currentExchangeId,
        type: 'crypto',
      };
    });

    return allSymbols;
  }

  let datafeed = {
    allSymbolsCtx: [],

    setAllSymbolsCtx(newCtx: any) {
      this.allSymbolsCtx = newCtx;
    },

    onReady: (callback: any) => {
      console.log('[onReady]: Method call');
      setTimeout(() => callback(configurationData));
    },

    searchSymbols: async (
      userInput: any,
      exchange: any,
      symbolType: any,
      onResultReadyCallback: any
    ) => {
      console.log('[searchSymbols]: Method call');
      const symbols = getAllSymbols();
      const newSymbols = symbols.filter((symbol: any) => {
        const isExchangeValid = exchange === '' || symbol.exchange === exchange;
        const isFullSymbolContainsInput =
          symbol.full_name.toLowerCase().indexOf(userInput.toLowerCase()) !== -1;
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
      
      // Make this async as required by TradingView
      setTimeout(() => {
        const symbols = getAllSymbols();
        const symbolItem = symbols.find(
          ({ full_name }: { full_name: any }) => full_name === symbolName
        );
        if (!symbolItem) {
          console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
          onResolveErrorCallback('cannot resolve symbol');
          return;
        }

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
          visible_plots_set: 'ohlcv', // Use visible_plots_set instead of deprecated has_no_volume
          has_weekly_and_monthly: false,
          supported_resolutions: configurationData.supported_resolutions,
          volume_precision: 2,
          data_status: 'streaming',
        };

        console.log('[resolveSymbol]: Symbol resolved', symbolName);
        onSymbolResolvedCallback(symbolInfo);
      }, 0);
    },

    getBars: async (
      symbolInfo: any,
      resolution: any,
      periodParams: any,
      onHistoryCallback: any,
      onErrorCallback: any
    ) => {
      const { from, to, firstDataRequest } = periodParams;
      console.log('[getBars]: Method call', symbolInfo, resolution, from, to);
      const parsedSymbol: any = parseFullSymbol(symbolInfo.full_name);
      if (!parsedSymbol) {
        onErrorCallback('Invalid symbol');
        return;
      }

      const logicalSymbol = `${parsedSymbol.fromSymbol.toUpperCase()}-${parsedSymbol.toSymbol.toUpperCase()}`;
      const resolutionMap = (res: string) => {
        const normalized = res.toString().toUpperCase();
        if (normalized.endsWith('H')) return `${normalized.replace('H', '')}h`;
        if (normalized.endsWith('D')) return `${normalized.replace('D', '')}d`;
        if (normalized.endsWith('W')) return `${normalized.replace('W', '')}w`;
        if (normalized.endsWith('M')) return `${normalized.replace('M', '')}M`;
        return '1m';
      };

      try {
        // Prioritize complete recent data over long historical lookback
        // Limit lookback period to ensure gap-free recent candles
        const now = Math.floor(Date.now() / 1000);
        const resolutionSeconds = parseResolutionToSeconds(resolution);
        
        // Define maximum lookback periods for complete data (in seconds)
        // These are conservative limits to ensure exchanges can provide complete data
        const maxLookbackByResolution: Record<string, number> = {
          '1m': 2 * 24 * 60 * 60,      // 2 days for 1m
          '5m': 3 * 24 * 60 * 60,      // 3 days for 5m
          '15m': 3 * 24 * 60 * 60,     // 3 days for 15m
          '30m': 4 * 24 * 60 * 60,     // 4 days for 30m
          '1h': 5 * 24 * 60 * 60,      // 5 days for 1h
          '4h': 10 * 24 * 60 * 60,     // 10 days for 4h
          '1d': 30 * 24 * 60 * 60,     // 30 days for 1d
          '1w': 90 * 24 * 60 * 60,     // 90 days for 1w
        };
        
        // Determine max lookback for this resolution
        const resolutionKey = resolutionMap(resolution);
        const maxLookback = maxLookbackByResolution[resolutionKey] || (5 * 24 * 60 * 60); // Default 5 days
        
        // Calculate the actual time range TradingView wants
        const requestedTimeRangeSeconds = to - from;
        
        // Calculate limit based on requested time range
        // Use exact calculation (no buffer) to avoid requesting more than available
        const calculatedLimit = Math.ceil(requestedTimeRangeSeconds / resolutionSeconds);
        
        // Use conservative maximums to ensure complete data
        // These limits are based on what exchanges typically provide reliably
        const maxLimit = ['m', 'h'].some(u => resolution.toLowerCase().includes(u)) 
          ? 1000  // Reduced from 5000 for intraday - prioritize completeness
          : 500;   // Reduced from 2000 for daily/weekly
        
        const limit = Math.min(Math.max(calculatedLimit, 50), maxLimit); // At least 50, at most maxLimit
        
        // For the API request, use the original 'from' that TradingView requested
        // This ensures we fetch the data TradingView expects, even if it's beyond our maxLookback
        // The exchange will return what it can, and we'll filter based on TradingView's range
        const params = new URLSearchParams({
          symbol: logicalSymbol,
          tf: resolutionMap(resolution),
          since: String(from * 1000),
          limit: String(limit),
        });

        const url = `/ccxt/${currentExchangeId}/candles?${params.toString()}`;
        
        const rawResponse = await fetch(url);
        if (!rawResponse.ok) {
          const errorMsg = `Failed to fetch candles: ${rawResponse.status} ${rawResponse.statusText}`;
          console.error('[getBars]:', errorMsg);
          onErrorCallback(errorMsg);
          return;
        }
        
        const response = await rawResponse.json();

        // Check for errors in CCXT responses
        if (!response.success && response.error) {
          console.error('[getBars]: CCXT API error:', response.error);
          console.error('[getBars]: This might be due to:', {
            'Missing API keys': 'Some exchanges require API keys even for public data',
            'CCXT service not running': 'Check if the ccxt-service is running on port 4001',
            'Invalid symbol': 'The trading pair might not exist on this exchange',
            'Network issue': 'Check your connection to the backend service'
          });
          onErrorCallback(response.error || 'Failed to fetch candle data');
          return;
        }

        const data = response.data;
        if (!Array.isArray(data)) {
          onErrorCallback('No data');
          return;
        }

        const bars = data
          .filter((bar: any) => Array.isArray(bar) || bar?.time)
          .map((bar: any) => ({
            time: Number(bar[0] ?? bar.time),
            open: Number(bar[1] ?? bar.open),
            high: Number(bar[2] ?? bar.high),
            low: Number(bar[3] ?? bar.low),
            close: Number(bar[4] ?? bar.close),
            volume: Number(bar[5] ?? bar.volume ?? 0),
          }))
          // Filter based on TradingView's requested range, not our adjusted range
          // This ensures we don't create gaps by filtering out data TradingView expects
          .filter((bar: any) => bar.time >= from * 1000 && bar.time <= to * 1000)
          // Sort by time to ensure chronological order
          .sort((a: any, b: any) => a.time - b.time);

        if (firstDataRequest && bars.length > 0) {
          lastBarsCache.set(symbolInfo.full_name, {
            ...bars[bars.length - 1],
          });
        }

        if (bars.length > 0) {
          onHistoryCallback(bars, { noData: false });
        } else {
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
      onResetCacheNeededCallback: any
    ) => {
      console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
      subscribeOnStream(
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback,
        lastBarsCache.get(symbolInfo.full_name)
      );
    },

    unsubscribeBars: (subscriberUID: any) => {
      console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
      unsubscribeFromStream(subscriberUID);
    },
  };

  const balance = webData2.clearinghouseState?.marginSummary.accountValue;
  const renderAdvancedChart = tokenPairs.length > 1;

  const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = useMemo(
    () => ({
      interval: "1H" as ResolutionString,
      datafeed: datafeed,
      library_path: "/static/charting_library/charting_library/",
      locale: "en",
      fullscreen: false,
      autosize: true,
      theme: "dark",
      symbol:
        tokenPairs && tokenPairs.length >= 2
          ? `${currentExchangeId}:${tokenPairs[0]}/${tokenPairs[1]}`
          : '',
    }),
    [currentExchangeId, pairs, tokenPairs]
  );

  const chartElement = useMemo(
    () =>
      renderAdvancedChart ? (
        <AdvancedChartMemoized
          {...defaultWidgetProps}
          selectionMode={selectionMode}
          onPriceFromChart={handleChartPricePick}
        />
      ) : null,
    [
      defaultWidgetProps,
      handleChartPricePick,
      pairs,
      renderAdvancedChart,
      selectionMode,
      tokenPairs,
    ]
  );

  return (
    <TerminalLayout
      assetInfo={
        <PanelCard
          title="Asset Info"
          hideHeader
          compact
          sx={{
            height: '100%',
            minHeight: 0,
            border: 'none',
            boxShadow: 'none',
            padding: '10px',
          }}
        >
          <TokenPairInformation />
        </PanelCard>
      }
      chart={
        <PanelCard
          title="Price Chart"
          hideHeader
          compact
          sx={{
            height: '100%',
            minHeight: 0,
            border: 'none',
            boxShadow: 'none',
            padding: '10px',
          }}
        >
          {chartElement}
        </PanelCard>
      }
      orderbook={
        <PanelCard
          title="Order Book & Trades"
          hideHeader
          compact
          sx={{ height: '100%', minHeight: 0, padding: '10px 8px' }}
        >
          <OrderBookAndTrades />
        </PanelCard>
      }
      ticket={
        <PanelCard
          title="Risk Manager & Order Ticket"
          hideHeader
          compact
          sx={{ height: '100%', minHeight: 0, padding: '10px 8px' }}
        >
          <OrderPlacement />
        </PanelCard>
      }
      positions={
        <PanelCard
          title="Positions & History"
          hideHeader
          compact
          sx={{ height: '100%', minHeight: 0 }}
        >
          <PositionsOrdersHistory />
        </PanelCard>
      }
      assistant={
        <PanelCard
          title="Intelayer Assistant"
          hideHeader
          compact
          sx={{ height: '100%', minHeight: 0 }}
        >
          <ChatComponent />
        </PanelCard>
      }
      portfolio={
        <PanelCard
          title="Portfolio Snapshot"
          hideHeader
          compact
          sx={{
            height: '100%',
            minHeight: 0,
            gap: '10px',
            '& span': {
              fontFamily: intelayerFonts.body,
              fontSize: '14px',
            },
          }}
        >
          {[
            {
              label: 'Balance',
              value: balance ? `$${Number(balance).toFixed(2)}` : '$0.00',
              tooltip:
                'Balance is your total account value before unrealized PnL, denominated in the account currency.',
            },
            {
              label: 'uPNL',
              value: '$0.00',
              tooltip:
                'uPNL (Unrealized PnL) is your current profit or loss on open positions based on mark price.',
            },
            {
              label: 'Equity',
              value: '$0.00',
              tooltip:
                'Equity is Balance plus Unrealized PnL. It is the effective value of your account right now.',
            },
            {
              label: 'Cross Margin Ratio',
              value: '$0.00',
              tooltip:
                'Cross Margin Ratio shows how much of your account equity is currently committed to margin across all positions.',
            },
            {
              label: 'Maintenance Margin',
              value: '$0.00',
              tooltip:
                'Maintenance Margin is the minimum margin level you must maintain to avoid liquidation.',
            },
            {
              label: 'Cross Account Leverage',
              value: '$0.00',
              tooltip:
                'Cross Account Leverage is your effective leverage across the entire account, using all open positions and equity.',
            },
          ].map(({ label, value, tooltip }) => (
            <FlexItems key={label}>
              <Tooltip content={tooltip}>
                <span>{label}</span>
              </Tooltip>
              <span
                style={
                  label === 'Cross Margin Ratio'
                    ? { color: intelayerColors.green[500] }
                    : undefined
                }
              >
                {value}
              </span>
            </FlexItems>
          ))}
        </PanelCard>
      }
    />
  );
};

export default PnlComponent;
