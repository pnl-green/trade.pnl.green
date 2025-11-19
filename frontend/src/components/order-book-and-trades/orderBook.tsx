import React, { useEffect, useMemo } from 'react';
import { SpreadAndPairSelects } from '@/styles/orderbook.styles';
import { Box } from '@mui/material';
import HandleSelectItems from '../handleSelectItems';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { useOrderBookTradesContext } from '@/context/orderBookTradesContext';
import { SizeEquivalentsProps } from '@/utils/usdEquivalents';
import { Order } from '@/context/orderBookTradesContext';
import DepthTable from '../ui/DepthTable';

enum Pair {
  USD = 'USD',
  ETH = 'ETH',
  BTC = 'BTC',
}

// Props for OrderBook component
interface OrderBookProps {
  spread: number;
  pair: Pair;
  setSpread: (spread: number) => void;
  setPair: (pair: Pair) => void;
}

// Calculate bar width as a percentage
const calculateBarWidth = (total: number, max: number) => {
  return (total / max) * 100;
};

// Get USD value if token is USD
export const getUsdEquivalentOnly = ({
  size,
  currentMarkPrice,
  token,
}: SizeEquivalentsProps) => {
  if (token.toUpperCase() === 'USD') {
    return Math.trunc(size * currentMarkPrice);
  } else {
    return size;
  }
};

// Calculate total size for each order
const calculateTotal = (
  orders: Order[],
  pair: Pair,
  reverse: boolean = false
) => {
  let cumulativeTotal = 0;
  const ordersCopy = reverse ? [...orders].reverse() : [...orders];
  const ordersWithTotal = ordersCopy.map((order) => {
    const orderSize = order.sz;
    const orderPx = order.px;
    let sizeEquivalent =
      pair.toUpperCase() === 'USD'
        ? getUsdEquivalentOnly({
            size: orderSize,
            currentMarkPrice: orderPx,
            token: pair,
          })
        : orderSize;

    cumulativeTotal += sizeEquivalent;

    const roundedTotal = Number(cumulativeTotal.toFixed(2));
    return { ...order, total: roundedTotal };
  });
  return reverse ? ordersWithTotal.reverse() : ordersWithTotal;
};

// Calculate spread percentage
const calculateSpreadPercentage = (asks: Order[], bids: Order[]) => {
  if (asks.length === 0 || bids.length === 0) return 0;
  const highestBid = bids[0].px;
  const lowestAsk = asks[asks.length - 1].px;
  const spread = lowestAsk - highestBid;
  const spreadPercentage = parseFloat(((spread / lowestAsk) * 100).toFixed(2));
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
  function getBookData() {
    let limit = 10;
    const asks = bookData.asks.slice(0, limit).sort((a, b) => b.px - a.px);
    const bids = bookData.bids.slice(0, limit).sort((a, b) => b.px - a.px);
    return { asks, bids };
  }

  // Update spread percentage when book data changes
  useEffect(() => {
    if (!loadingBookData) {
      const { asks, bids } = getBookData();
      if (asks.length > 0 && bids.length > 0) {
        setSpreadPercentage(calculateSpreadPercentage(asks, bids));
      }
    }
  }, [bookData, loadingBookData]);

  const pairLabel = pair?.toString() ?? 'USD';
  const { asks, bids } = getBookData();

  const formattedRows = useMemo(() => {
    const asksWithTotal = calculateTotal(asks, pair, true);
    const bidsWithTotal = calculateTotal(bids, pair, false);
    const combinedTotals = [...asksWithTotal, ...bidsWithTotal].map(
      (order) => order.total
    );
    const maxTotal = combinedTotals.length
      ? Math.max(...combinedTotals)
      : 1;

    const formatValue = (order: any) =>
      pair.toUpperCase() === 'USD'
        ? Math.trunc(
            getUsdEquivalentOnly({
              size: order.sz,
              currentMarkPrice: order.px,
              token: pair,
            })
          ).toLocaleString()
        : getUsdEquivalentOnly({
            size: order.sz,
            currentMarkPrice: order.px,
            token: pair,
          })
            .toFixed(2)
            .toString();

    const formatTotal = (total: number) =>
      pair.toUpperCase() === 'USD'
        ? Math.trunc(total).toLocaleString()
        : total.toString();

    return {
      asks: asksWithTotal.map((order) => ({
        price: order.px.toFixed(2),
        size: formatValue(order),
        total: formatTotal(order.total),
        widthPct: calculateBarWidth(order.total, maxTotal),
        side: 'ask' as const,
      })),
      bids: bidsWithTotal.map((order) => ({
        price: order.px.toFixed(2),
        size: formatValue(order),
        total: formatTotal(order.total),
        widthPct: calculateBarWidth(order.total, maxTotal),
        side: 'bid' as const,
      })),
    };
  }, [asks, bids, pair]);

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
            selectDataItems={
              Array.isArray(tokenPairs)
                ? tokenPairs.map((tokenPair) => {
                    return tokenPair ? tokenPair.toString() : '';
                  })
                : []
            }
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
