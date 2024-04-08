import OrderBookTradesProvider from "@/context/orderBookTradesContext";
import { PairTokensProvider } from "@/context/pairTokensContext";
import PositionHistoryProvider from "@/context/positionHistoryContext";
import "@/styles/globals.css";
import {
  ThirdwebProvider,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  embeddedWallet,
  en,
} from "@thirdweb-dev/react";
import { NextPage } from "next";
import type { AppProps } from "next/app";
import { ReactElement, ReactNode, useEffect, useState } from "react";
import NoSSR from "react-no-ssr";

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
        activeChain="sepolia"
        clientId="YOUR_CLIENT_ID"
        locale={en()}
        supportedWallets={[
          metamaskWallet(),
          coinbaseWallet({ recommended: true }),
          walletConnect(),
          embeddedWallet({
            auth: {
              options: ["email"],
            },
          }),
        ]}
      >
        <PairTokensProvider>
          <OrderBookTradesProvider>
            <PositionHistoryProvider>
              {getLayout(<Component {...pageProps} />)}
            </PositionHistoryProvider>
          </OrderBookTradesProvider>
        </PairTokensProvider>
      </ThirdwebProvider>
    </NoSSR>
  );
}
