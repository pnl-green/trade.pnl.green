import React from 'react';
import PairTokensProvider from './pairTokensContext';
import OrderBookTradesProvider from './orderBookTradesContext';
import WebDataProvider from './webDataContext';
import SubAccountsProvider from './subAccountsContext';
import TradeHistoryProvider from './tradeHistoryContext';
import FundingHistoryProvider from './fundingHistoryContext';
import OrderHistoryProvider from './orderHistoryContext';
import TwapHistoryProvider from './twapHistoryContext';
import SwitchAccountProvider from './switchTradingAccContext';

const ContextProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <PairTokensProvider>
      <OrderBookTradesProvider>
        <WebDataProvider>
          <SubAccountsProvider>
            <TradeHistoryProvider>
              <FundingHistoryProvider>
                <OrderHistoryProvider>
                  <TwapHistoryProvider>
                    <SwitchAccountProvider>
                      <React.Fragment>{children}</React.Fragment>
                    </SwitchAccountProvider>
                  </TwapHistoryProvider>
                </OrderHistoryProvider>
              </FundingHistoryProvider>
            </TradeHistoryProvider>
          </SubAccountsProvider>
        </WebDataProvider>
      </OrderBookTradesProvider>
    </PairTokensProvider>
  );
};

export default ContextProviders;
