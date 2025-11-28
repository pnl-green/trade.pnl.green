//get data from websocket and pass it to the context

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BookDataProps, WsTrades } from '@/types/hyperliquid';
import { usePairTokensContext } from './pairTokensContext';
import { useChainId } from '@thirdweb-dev/react';
import { useExchange } from './exchangeContext';

type TradeWithDisplay = WsTrades & { displayTime?: string };

interface OrderBookTradesProps {
  bookData: BookDataProps;
  tradesData: TradeWithDisplay[];
  loadingBookData: boolean;
}

export interface Order {
  sz: number,
  px: number, 
  n: number
}

const OrderBookTradesContext = createContext({} as OrderBookTradesProps);

export const useOrderBookTradesContext = () => {
  const context = useContext(OrderBookTradesContext);
  if (!context) {
    throw new Error(
      'useOrderBookTrades must be used within a OrderBookTradesProvider'
    );
  }
  return context;
};

const OrderBookTradesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { pair, tokenPairs } = usePairTokensContext();
  const { currentExchangeId } = useExchange();
  const [bookData, setBookData] = useState<BookDataProps>({
    asks: [],
    bids: [],
  });

  const [tradesData, setTradesData] = useState<TradeWithDisplay[]>([]);
  const [loadingBookData, setLoadingBookData] = useState<boolean>(true);

  const chainId = useChainId();

  useEffect(() => {
    const controller = new AbortController();

    const fetchTrades = async () => {
      try {
        let url = '';
        if (currentExchangeId === 'hyperliquid') {
          url = `/hl/${pair}/trades`;
        } else {
          const params = new URLSearchParams({ symbol: pair, limit: '50' });
          url = `/ccxt/${currentExchangeId}/trades?${params.toString()}`;
        }

        const response = await fetch(url, { signal: controller.signal }).then((r) => r.json());
        const trades = currentExchangeId === 'hyperliquid' ? response.trades : response.data;

        if (Array.isArray(trades)) {
          const mapped = trades.map((trade: any) => {
            const timestamp = trade.time || trade.timestamp;
            const date = new Date(timestamp);
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            const newTime = `${hours}:${minutes}:${seconds}`;

            return {
              ...trade,
              px: Number(trade.px ?? trade.price),
              sz: Number(trade.sz ?? trade.amount),
              time: timestamp,
              displayTime: newTime,
            };
          });

          setTradesData(mapped.slice(0, 50));
        }
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Failed to fetch trades', error);
        }
      }
    };

    fetchTrades();
    const interval = setInterval(fetchTrades, 3_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [pair, currentExchangeId, chainId]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchOrderBook = async () => {
      setLoadingBookData(true);
      try {
        let url = '';
        if (currentExchangeId === 'hyperliquid') {
          url = `/hl/${pair}/orderbook`;
        } else {
          const params = new URLSearchParams({ symbol: pair, limit: '50' });
          url = `/ccxt/${currentExchangeId}/orderbook?${params.toString()}`;
        }

        const response = await fetch(url, { signal: controller.signal }).then((r) => r.json());
        const data = currentExchangeId === 'hyperliquid' ? response : response.data;

        const parseSide = (levels: any[] = []) =>
          levels.map((level) => {
            if (Array.isArray(level)) {
              return { px: Number(level[0]), sz: Number(level[1]), n: Number(level[2] || 0) } as Order;
            }
            return { px: Number(level.px), sz: Number(level.sz), n: Number(level.n || 0) } as Order;
          });

        const asks = parseSide(data?.asks);
        const bids = parseSide(data?.bids);

        setBookData({ asks, bids });
        setLoadingBookData(false);
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Failed to fetch orderbook', error);
          setBookData({ asks: [], bids: [] });
          setLoadingBookData(false);
        }
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 2_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [pair, currentExchangeId, tokenPairs, chainId]);

  return (
    <OrderBookTradesContext.Provider
      value={{
        bookData,
        tradesData,
        loadingBookData,
      }}
    >
      {children}
    </OrderBookTradesContext.Provider>
  );
};

export default OrderBookTradesProvider;
