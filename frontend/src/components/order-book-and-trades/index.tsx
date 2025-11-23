import React, { useMemo, useState } from 'react';
import {
  OrderBookContainer,
  OrderBookTabs,
  OrderBookTabsWrapper,
  OrderBookTabsHighlight,
} from '@/styles/orderbook.styles';
import OrderBook from './orderBook';
import Trades from './trades';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { Box } from '@mui/material';

const OrderBookAndTrades = () => {
  const [spread, setSpread] = useState(1);
  const { pair, setPair } = usePairTokensContext();

  const tabs = useMemo(
    () => [
      { label: 'Order Book', value: 'orderbook' },
      { label: 'Trades', value: 'trades' },
    ],
    []
  );
  const [activeTab, setActiveTab] = useState<string>(tabs[0].value);

  return (
    <OrderBookContainer>
      <OrderBookTabsWrapper>
        <OrderBookTabs>
          {tabs.map((tab, index) => (
            <Box
              key={tab.value}
              component="button"
              onClick={() => setActiveTab(tab.value)}
              data-active={activeTab === tab.value}
            >
              {tab.label}
            </Box>
          ))}
          <OrderBookTabsHighlight
            data-active={activeTab === 'trades' ? 'trades' : 'orderbook'}
          />
        </OrderBookTabs>
      </OrderBookTabsWrapper>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === 'orderbook' ? (
          <OrderBook
            spread={spread}
            pair={pair as any}
            setSpread={setSpread}
            setPair={setPair}
          />
        ) : (
          <Trades maxHeight="100%" />
        )}
      </Box>
    </OrderBookContainer>
  );
};

export default OrderBookAndTrades;
