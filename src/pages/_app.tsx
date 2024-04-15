<<<<<<< HEAD
import OrderBookTradesProvider from "@/context/orderBookTradesContext";
import { PairTokensProvider } from "@/context/pairTokensContext";
import PositionHistoryProvider from "@/context/positionHistoryContext";
import SUbAccountsProvider from "@/context/subAccountsContext";
// import SUbAccountsProvider from "@/context/subAccountsContext";
import "@/styles/globals.css";
=======
import OrderBookTradesProvider from '@/context/orderBookTradesContext';
import { PairTokensProvider } from '@/context/pairTokensContext';
import PositionHistoryProvider from '@/context/positionHistoryContext';
import '@/styles/globals.css';
>>>>>>> 9eb754c350da2d2a694ccb60fb1f6d1630e2c21d
import {
  ThirdwebProvider,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  embeddedWallet,
  en,
} from '@thirdweb-dev/react';
import { Arbitrum, ArbitrumSepolia } from '@thirdweb-dev/chains';
import { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { ReactElement, ReactNode, useEffect, useState } from 'react';
import NoSSR from 'react-no-ssr';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const [isRendered, setIsRendered] = useState(false);
  const getLayout = Component.getLayout ?? ((page) => page);

  useEffect(() => {
    setIsRendered(true);
  }, []);

  if (!isRendered) {
    return null;
  }
  return (
    <NoSSR>
      <ThirdwebProvider
        activeChain={ArbitrumSepolia}
        clientId="YOUR_CLIENT_ID"
        locale={en()}
        supportedChains={[Arbitrum, ArbitrumSepolia]}
        supportedWallets={[
          metamaskWallet(),
          coinbaseWallet({ recommended: true }),
          walletConnect(),
          embeddedWallet({
            auth: {
              options: ['email'],
            },
          }),
        ]}
      >
        <PairTokensProvider>
          <OrderBookTradesProvider>
            <PositionHistoryProvider>
              <SUbAccountsProvider>
                {getLayout(<Component {...pageProps} />)}
              </SUbAccountsProvider>
            </PositionHistoryProvider>
          </OrderBookTradesProvider>
        </PairTokensProvider>
      </ThirdwebProvider>
    </NoSSR>
  );
}
