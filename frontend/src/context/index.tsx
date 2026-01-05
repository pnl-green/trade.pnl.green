import React from 'react';
import { VersionProvider, useVersionContext } from './versionContext';
import { ExchangeProvider } from './exchangeContext';
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

const V2Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ExchangeProvider>
      {children}
    </ExchangeProvider>
  );
};

const V1Providers = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const ConditionalProviders = ({ children }: { children: React.ReactNode }) => {
  const { isV2 } = useVersionContext();
  
  if (isV2) {
    return <V2Providers>{children}</V2Providers>;
  }
  return <V1Providers>{children}</V1Providers>;
};

const ContextProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <VersionProvider>
      <ConditionalProviders>
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
      </ConditionalProviders>
    </VersionProvider>
  );
};

export default ContextProviders;
