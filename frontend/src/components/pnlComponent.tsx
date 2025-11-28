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
    if (pairs.length !== 0) return;
    let merged = tokenPairData;
    merged = merged.concat(allTokenPairs);
    const normalizedPairs = merged.map((item: any) => ({
      ...item,
      pairs: normalizePairName(item.pairs),
    }));
    setPairs(normalizedPairs);
  }, [allTokenPairs, pairs.length, tokenPairData]);

  const lastBarsCache = new Map();

  const configurationData = {
    supported_resolutions: ['1H', '1D', '1W', '1M'],
    exchanges: [
      {
        value: 'Hyperliquid',
        name: 'Hyperliquid',
        desc: 'Hyperliquid',
      },
      {
        value: 'Coinbase',
        name: 'Coinbase',
        desc: 'Coinbase',
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
        has_no_volume: true,
        has_weekly_and_monthly: false,
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 2,
        data_status: 'streaming',
      };

      console.log('[resolveSymbol]: Symbol resolved', symbolName);
      onSymbolResolvedCallback(symbolInfo);
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

      const logicalSymbol = `${parsedSymbol.fromSymbol.toUpperCase()}-PERP`;
      const resolutionMap = (res: string) => {
        const normalized = res.toString().toUpperCase();
        if (normalized.endsWith('H')) return `${normalized.replace('H', '')}h`;
        if (normalized.endsWith('D')) return `${normalized.replace('D', '')}d`;
        if (normalized.endsWith('W')) return `${normalized.replace('W', '')}w`;
        if (normalized.endsWith('M')) return `${normalized.replace('M', '')}M`;
        return '1m';
      };

      try {
        const params = new URLSearchParams({
          symbol: logicalSymbol,
          tf: resolutionMap(resolution),
          since: String(from * 1000),
          limit: '500',
        });

        const url =
          currentExchangeId === 'hyperliquid'
            ? `/hl/${logicalSymbol}/candles?${params.toString()}`
            : `/ccxt/${currentExchangeId}/candles?${params.toString()}`;
        const response = await fetch(url).then((res) => res.json());

        const data = currentExchangeId === 'hyperliquid' ? response.candles : response.data;
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
          .filter((bar: any) => bar.time >= from * 1000 && bar.time <= to * 1000);

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
