import React, { useEffect, useMemo, useState } from 'react';
import { SpreadAndPairSelects } from '@/styles/orderbook.styles';
import { Box } from '@mui/material';
import HandleSelectItems from '../handleSelectItems';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { useOrderBookTradesContext, Order } from '@/context/orderBookTradesContext';
import DepthTable from '../ui/DepthTable';

type SizeUnit = 'SOL' | 'USDC';

interface EnhancedOrder extends Order {
  sizeSol: number;
  sizeUsdc: number;
  total?: number;
}

const MAX_LEVELS_PER_SIDE = 15;

const calculateBarWidth = (total: number, max: number) => {
  if (!max) return 0;
  return (total / max) * 100;
};

const getDecimalPlaces = (value: number) => {
  const valueString = value.toString();
  if (valueString.includes('e-')) {
    const [, exponent] = valueString.split('e-');
    return Number(exponent);
  }
  const [, decimals] = valueString.split('.');
  return decimals ? decimals.length : 0;
};

const formatNumber = (value: number, decimals: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const getTickConfigForAsset = (symbol: string) => {
  if (symbol === 'BTC') {
    return { baseTick: 1, allowedIncrements: [1, 2, 5, 10, 50, 100] };
  }
  if (symbol === 'ETH') {
    return { baseTick: 0.1, allowedIncrements: [0.1, 0.5, 1, 5, 10] };
  }
  if (symbol === 'SOL') {
    return { baseTick: 0.01, allowedIncrements: [0.01, 0.05, 0.1, 0.5, 1] };
  }
  return {
    baseTick: 0.000001,
    allowedIncrements: [0.000001, 0.00001, 0.0001, 0.001, 0.01],
  };
};

const aggregateByIncrement = (
  orders: Order[],
  increment: number,
  side: 'ask' | 'bid'
): Order[] => {
  const aggregated = new Map<number, Order>();

  orders.forEach((order) => {
    const price = Number(order.px);
    const bucket =
      side === 'bid'
        ? Math.floor(price / increment) * increment
        : Math.ceil(price / increment) * increment;
    const size = Number(order.sz);
    const count = Number(order.n || 0);
    const existing = aggregated.get(bucket);

    if (existing) {
      aggregated.set(bucket, {
        px: bucket,
        sz: existing.sz + size,
        n: existing.n + count,
      });
    } else {
      aggregated.set(bucket, { px: bucket, sz: size, n: count });
    }
  });

  return Array.from(aggregated.values());
};

const trimOrderLevels = (orders: Order[], side: 'ask' | 'bid') => {
  const sorted = [...orders].sort((a, b) =>
    side === 'ask' ? a.px - b.px : b.px - a.px
  );

  return sorted.slice(0, MAX_LEVELS_PER_SIDE);
};

const computeLevelValues = (orders: Order[]): EnhancedOrder[] =>
  orders.map((order) => {
    const sizeSol = Number(order.sz);
    const sizeUsdc = sizeSol * Number(order.px);

    return {
      ...order,
      sizeSol,
      sizeUsdc,
    };
  });

const addCumulativeTotals = (
  bids: EnhancedOrder[],
  asks: EnhancedOrder[],
  unit: SizeUnit
) => {
  const key = unit === 'SOL' ? 'sizeSol' : 'sizeUsdc';

  let running = 0;
  const bidsWithTotal = bids.map((level) => {
    running += level[key];
    return { ...level, total: running };
  });

  running = 0;
  const asksWithTotal = asks.map((level) => {
    running += level[key];
    return { ...level, total: running };
  });

  return { bidsWithTotal, asksWithTotal };
};

const OrderBook = () => {
  const { tokenPairs, pair } = usePairTokensContext();
  const { bookData, loadingBookData } = useOrderBookTradesContext();
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('SOL');
  const [priceIncrement, setPriceIncrement] = useState<number>(1);
  const [incrementOptions, setIncrementOptions] = useState<number[]>([]);

  const baseSymbol = tokenPairs?.[0] || 'SOL';

  useEffect(() => {
    const { baseTick, allowedIncrements } = getTickConfigForAsset(baseSymbol);
    setIncrementOptions(allowedIncrements);
    setPriceIncrement((current) => {
      const numeric = Number(current) || baseTick;
      return numeric < baseTick ? baseTick : numeric;
    });
  }, [baseSymbol]);

  const processedBook = useMemo(() => {
    const increment = priceIncrement || getTickConfigForAsset(baseSymbol).baseTick;
    const aggregatedAsks = aggregateByIncrement(bookData.asks, increment, 'ask');
    const aggregatedBids = aggregateByIncrement(bookData.bids, increment, 'bid');

    let asksSorted = trimOrderLevels(aggregatedAsks, 'ask');
    const bidsSorted = trimOrderLevels(aggregatedBids, 'bid');

    const bestAsk = asksSorted[0]?.px;
    const bestBid = bidsSorted[0]?.px;

    if (bestAsk !== undefined && bestBid !== undefined && bestBid >= bestAsk) {
      const adjustedBestAsk = bestBid + increment;
      asksSorted = [
        { ...asksSorted[0], px: adjustedBestAsk },
        ...asksSorted.slice(1),
      ].sort((a, b) => a.px - b.px);
    }

    const asksWithUnits = computeLevelValues(asksSorted);
    const bidsWithUnits = computeLevelValues(bidsSorted);

    const { bidsWithTotal, asksWithTotal } = addCumulativeTotals(
      bidsWithUnits,
      asksWithUnits,
      sizeUnit
    );

    const totals = [...bidsWithTotal, ...asksWithTotal].map(
      (order) => order.total || 0
    );
    const maxTotal = totals.length ? Math.max(...totals) : 1;

    const priceDecimals = Math.min(Math.max(getDecimalPlaces(increment), 2), 8);
    const valueDecimals = sizeUnit === 'SOL' ? 4 : 2;
    const sizeKey = sizeUnit === 'SOL' ? 'sizeSol' : 'sizeUsdc';

    const asksVisual = [...asksWithTotal].reverse();

    const asksRows = asksVisual.map((order) => ({
      price: formatNumber(order.px, priceDecimals),
      size: formatNumber(order[sizeKey], valueDecimals),
      total: formatNumber(order.total || 0, valueDecimals),
      widthPct: calculateBarWidth(order.total || 0, maxTotal),
      side: 'ask' as const,
    }));

    const bidsRows = bidsWithTotal.map((order) => ({
      price: formatNumber(order.px, priceDecimals),
      size: formatNumber(order[sizeKey], valueDecimals),
      total: formatNumber(order.total || 0, valueDecimals),
      widthPct: calculateBarWidth(order.total || 0, maxTotal),
      side: 'bid' as const,
    }));

    const bestAsk = asksSorted[0]?.px;
    const bestBid = bidsSorted[0]?.px;
    const spreadValue =
      bestAsk && bestBid ? Number((bestAsk - bestBid).toFixed(priceDecimals)) : 0;
    const spreadPercent =
      bestAsk && bestBid
        ? Number((((bestAsk - bestBid) / bestAsk) * 100).toFixed(3))
        : 0;

    return {
      asksRows,
      bidsRows,
      spreadValue,
      spreadPercent,
    };
  }, [
    baseSymbol,
    bookData.asks,
    bookData.bids,
    priceIncrement,
    sizeUnit,
  ]);

  const pairLabel =
    tokenPairs?.length >= 2
      ? `${tokenPairs[0]}-${tokenPairs[1]}`
      : pair?.toString() || 'USDC';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      <SpreadAndPairSelects>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <HandleSelectItems
            selectItem={priceIncrement}
            setSelectItem={(value) => setPriceIncrement(Number(value))}
            selectDataItems={incrementOptions.map((value) => value.toString())}
            variant="elev"
          />
        </div>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <HandleSelectItems
            selectItem={sizeUnit}
            setSelectItem={(value) => setSizeUnit(value as SizeUnit)}
            selectDataItems={['SOL', 'USDC']}
            variant="elev"
          />
        </div>
      </SpreadAndPairSelects>

      <DepthTable
        asks={processedBook.asksRows}
        bids={processedBook.bidsRows}
        sizeLabel={`Size (${sizeUnit})`}
        totalLabel={`Total (${sizeUnit})`}
        spreadValue={processedBook.spreadValue}
        spreadPercent={processedBook.spreadPercent}
        loading={loadingBookData}
        emptyMessage={`No data Available for ${pairLabel}`}
      />
    </Box>
  );
};

export default OrderBook;
