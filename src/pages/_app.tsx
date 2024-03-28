import OrderBookTradesProvider from "@/context/orderBookTradesContext";
import { PairTokensProvider } from "@/context/pairTokensContext";
import "@/styles/globals.css";
import {
  ThirdwebProvider,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  embeddedWallet,
  en,
} from "@thirdweb-dev/react";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import NoSSR from "react-no-ssr";

export default function App({ Component, pageProps }: AppProps) {
  const [isRendered, setIsRendered] = useState(false);

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
            <Component {...pageProps} />
          </OrderBookTradesProvider>
        </PairTokensProvider>
      </ThirdwebProvider>
    </NoSSR>
  );
}
