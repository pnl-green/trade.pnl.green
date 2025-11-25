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
    const limit = 25;
    const asks = bookData.asks
      .slice(0, limit)
      .map((order) => ({ ...order, px: Number(order.px), sz: Number(order.sz) }))
      .sort((a, b) => a.px - b.px);
    const bids = bookData.bids
      .slice(0, limit)
      .map((order) => ({ ...order, px: Number(order.px), sz: Number(order.sz) }))
      .sort((a, b) => b.px - a.px);
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

  const pairLabel = pair?.toString() || tokenPairs?.[0] || 'USDC';
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
