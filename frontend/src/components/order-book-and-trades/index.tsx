import React, { useState } from 'react';
import { OrderBookContainer } from '@/styles/orderbook.styles';
import OrderBook from './orderBook';
import Trades from './trades';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { Box } from '@mui/material';

const OrderBookAndTrades = () => {
  const [spread, setSpread] = useState(1);
  const { pair, setPair } = usePairTokensContext();

  return (
    <OrderBookContainer>
      <OrderBook
        spread={spread}
        pair={pair as any}
        setSpread={setSpread}
        setPair={setPair}
      />
      <Box sx={{ borderTop: `1px solid rgba(28, 38, 53, 0.8)`, paddingTop: '12px' }}>
        <Box sx={{ fontSize: '13px', marginBottom: '8px', color: 'rgba(230, 241, 255, 0.7)' }}>
          Recent Trades
        </Box>
        <Trades maxHeight="220px" />
      </Box>
    </OrderBookContainer>
  );
};

export default OrderBookAndTrades;
