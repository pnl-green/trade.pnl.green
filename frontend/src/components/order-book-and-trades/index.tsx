import React, { useState } from 'react';
import { OrderBookContainer } from '@/styles/orderbook.styles';
import OrderBook from './orderBook';
import Trades from './trades';
import { usePairTokensContext } from '@/context/pairTokensContext';
import SegmentedControl from '../ui/SegmentedControl';

const OrderBookAndTrades = () => {
  const { pair, setPair } = usePairTokensContext();
  const [activeTab, setActiveTab] = useState('orderBook');

  const tabOptions = [
    {
      label: 'Order Book',
      value: 'orderBook',
      tooltip: 'View the current order book with bid and ask prices',
    },
    {
      label: 'Recent Trades',
      value: 'recentTrades',
      tooltip: 'View recent trades executed on the exchange',
    },
  ];

  return (
    <OrderBookContainer>
      <SegmentedControl
        ariaLabel="Order book and trades"
        options={tabOptions}
        value={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === 'orderBook' && (
        <OrderBook pair={pair as any} setPair={setPair} />
      )}
      {activeTab === 'recentTrades' && <Trades maxHeight="100%" />}
    </OrderBookContainer>
  );
};

export default OrderBookAndTrades;
