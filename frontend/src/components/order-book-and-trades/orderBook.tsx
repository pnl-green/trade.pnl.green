import React, { useCallback, useEffect, useMemo } from 'react';
import { SpreadAndPairSelects } from '@/styles/orderbook.styles';
import { Box } from '@mui/material';
import HandleSelectItems from '../handleSelectItems';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { useOrderBookTradesContext } from '@/context/orderBookTradesContext';
import { Order } from '@/context/orderBookTradesContext';
import DepthTable from '../ui/DepthTable';

// Props for OrderBook component
interface OrderBookProps {
  spread: number;
  pair: string;
  setSpread: (spread: number) => void;
  setPair: (pair: string) => void;
}

// Calculate bar width as a percentage
const calculateBarWidth = (total: number, max: number) => {
  if (!max) return 0;
  return (total / max) * 100;
};

// Calculate total size for each order
const calculateTotal = (orders: Order[], reverse: boolean = false) => {
  let cumulativeTotal = 0;
  const ordersCopy = reverse ? [...orders].reverse() : [...orders];
  const ordersWithTotal = ordersCopy.map((order) => {
    const orderSize = order.sz;
    cumulativeTotal += orderSize;
    const roundedTotal = Number(cumulativeTotal.toFixed(4));
    return { ...order, total: roundedTotal };
  });
  return reverse ? ordersWithTotal.reverse() : ordersWithTotal;
};

// Aggregate orders by price level to merge duplicate entries
const aggregateOrdersByPrice = (orders: Order[]) => {
  const aggregated = new Map<number, Order>();

  orders.forEach((order) => {
    const price = Number(order.px);
    const size = Number(order.sz);
    const count = Number(order.n || 0);
    const existing = aggregated.get(price);

    if (existing) {
      aggregated.set(price, {
        px: price,
        sz: existing.sz + size,
        n: existing.n + count,
      });
    } else {
      aggregated.set(price, { px: price, sz: size, n: count });
    }
  });

  return Array.from(aggregated.values());
};

const MAX_LEVELS_PER_SIDE = 15;

// Trim orders to the closest levels around best bid/ask
const trimOrderLevels = (orders: Order[], side: 'ask' | 'bid') => {
  const sorted = [...orders].sort((a, b) =>
    side === 'ask' ? a.px - b.px : b.px - a.px
  );

  return sorted.slice(0, MAX_LEVELS_PER_SIDE);
};

// Calculate spread percentage
const calculateSpreadPercentage = (asks: Order[], bids: Order[]) => {
  if (asks.length === 0 || bids.length === 0) return 0;
  const highestBid = bids[0].px;
  const lowestAsk = asks[0].px;
  const spread = lowestAsk - highestBid;
  const spreadPercentage = parseFloat(((spread / lowestAsk) * 100).toFixed(3));
  return spreadPercentage;
};

// Main component for order book
const OrderBook = ({ spread, pair, setSpread, setPair }: OrderBookProps) => {
  const { tokenPairs } = usePairTokensContext();
  const { bookData, loadingBookData } = useOrderBookTradesContext();
  const [spreadPercentage, setSpreadPercentage] = React.useState(0);

  // Get asks and bids data
  //
  // @TODO investigate how sort orders with step: 1/2/5/10/100/1000
  const getBookData = useCallback(() => {
    const asks = trimOrderLevels(
      aggregateOrdersByPrice(bookData.asks),
      'ask'
    );
    const bids = trimOrderLevels(
      aggregateOrdersByPrice(bookData.bids),
      'bid'
    );
    return { asks, bids };
  }, [bookData]);

  // Update spread percentage when book data changes
  useEffect(() => {
    if (!loadingBookData) {
      const { asks, bids } = getBookData();
      if (asks.length > 0 && bids.length > 0) {
        setSpreadPercentage(calculateSpreadPercentage(asks, bids));
      }
    }
  }, [bookData, getBookData, loadingBookData]);

  const pairLabel =
    tokenPairs?.length >= 2
      ? `${tokenPairs[0]}-${tokenPairs[1]}`
      : pair?.toString() || 'USDC';
  const { asks, bids } = getBookData();

  const formattedRows = useMemo(() => {
    const asksWithTotal = calculateTotal(asks, true);
    const bidsWithTotal = calculateTotal(bids, false);
    const combinedTotals = [...asksWithTotal, ...bidsWithTotal].map(
      (order) => order.total
    );
    const maxTotal = combinedTotals.length
      ? Math.max(...combinedTotals)
      : 1;

    const formatValue = (value: number) => Number(value).toFixed(4);
    const formatTotal = (total: number) => Number(total).toFixed(4);

    return {
      asks: asksWithTotal.map((order) => ({
        price: order.px.toFixed(2),
        size: formatValue(order.sz),
        total: formatTotal(order.total),
        widthPct: calculateBarWidth(order.total, maxTotal),
        side: 'ask' as const,
      })),
      bids: bidsWithTotal.map((order) => ({
        price: order.px.toFixed(2),
        size: formatValue(order.sz),
        total: formatTotal(order.total),
        widthPct: calculateBarWidth(order.total, maxTotal),
        side: 'bid' as const,
      })),
    };
  }, [asks, bids]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SpreadAndPairSelects>
        <div style={{ flex: 1 }}>
          <HandleSelectItems
            selectItem={spread}
            setSelectItem={setSpread}
            selectDataItems={['1', '2', '5', '10', '100', '1000']}
            variant="elev"
          />
        </div>
        <div style={{ flex: 1 }}>
          <HandleSelectItems
            selectItem={pair}
            setSelectItem={setPair}
            selectDataItems={tokenPairs?.[0] ? [tokenPairs[0].toString()] : []}
            variant="elev"
          />
        </div>
      </SpreadAndPairSelects>

      <DepthTable
        asks={formattedRows.asks}
        bids={formattedRows.bids}
        pairLabel={pairLabel}
        spreadValue={spread}
        spreadPercent={spreadPercentage}
        loading={loadingBookData}
        emptyMessage={`No data Available for ${pairLabel}`}
      />
    </Box>
  );
};

export default OrderBook;
