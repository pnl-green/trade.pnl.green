import React from 'react';
import PairTokensProvider from './pairTokensContext';
import OrderBookTradesProvider from './orderBookTradesContext';
import WebDataProvider from './webDataContext';
import HyperliquidProvider from './hyperLiquidContext';
import TradeHistoryProvider from './tradeHistoryContext';
import FundingHistoryProvider from './fundingHistoryContext';
import OrderHistoryProvider from './orderHistoryContext';
import TwapHistoryProvider from './twapHistoryContext';
import SwitchAccountProvider from './switchTradingAccContext';
import { OrderTicketProvider } from './orderTicketContext';
import { ChartInteractionProvider } from './chartInteractionContext';
import { ExchangeProvider } from './exchangeContext';

const ContextProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ExchangeProvider>
      <WebDataProvider>
        <HyperliquidProvider>
          <PairTokensProvider>
            <OrderBookTradesProvider>
              <TradeHistoryProvider>
                <FundingHistoryProvider>
                  <OrderHistoryProvider>
                    <TwapHistoryProvider>
                      <SwitchAccountProvider>
                        <OrderTicketProvider>
                          <ChartInteractionProvider>
                            <React.Fragment>{children}</React.Fragment>
                          </ChartInteractionProvider>
                        </OrderTicketProvider>
                      </SwitchAccountProvider>
                    </TwapHistoryProvider>
                  </OrderHistoryProvider>
                </FundingHistoryProvider>
              </TradeHistoryProvider>
            </OrderBookTradesProvider>
          </PairTokensProvider>
        </HyperliquidProvider>
      </WebDataProvider>
    </ExchangeProvider>
  );
};

export default ContextProviders;
