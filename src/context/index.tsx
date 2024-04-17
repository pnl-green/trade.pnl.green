import React from 'react';
import { PairTokensProvider } from './pairTokensContext';
import OrderBookTradesProvider from './orderBookTradesContext';
import PositionHistoryProvider from './positionHistoryContext';
import SubAccountsProvider from './subAccountsContext';
import TradeHistoryProvider from './tradeHistoryContext';
import FundingHistoryProvider from './fundingHistoryContext';
import OrderHistoryProvider from './orderHistoryContext';

const ContextProviders = ({ children }: { children: any }) => {
  return (
    <PairTokensProvider>
      <OrderBookTradesProvider>
        <PositionHistoryProvider>
          <SubAccountsProvider>
            <TradeHistoryProvider>
              <FundingHistoryProvider>
                <OrderHistoryProvider>
                  <React.Fragment>{children}</React.Fragment>
                </OrderHistoryProvider>
              </FundingHistoryProvider>
            </TradeHistoryProvider>
          </SubAccountsProvider>
        </PositionHistoryProvider>
      </OrderBookTradesProvider>
    </PairTokensProvider>
  );
};

export default ContextProviders;
