// Import the global stylesheet so Tailwind/custom resets are available on every page.
import '@/styles/globals.css';
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
import { Toaster } from 'react-hot-toast';
import ContextProviders from '../context';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Custom Next.js App used to inject global providers and optional per-page layouts.
export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const [isRendered, setIsRendered] = useState(false);
  const getLayout = Component.getLayout ?? ((page) => page);

  useEffect(() => {
    // Defer rendering until we know we're on the client so that NoSSR + wallet
    // providers do not attempt to hydrate on the server.
    setIsRendered(true);
  }, []);

  if (!isRendered) {
    return null;
  }
  return (
    // NoSSR prevents wallet/modals from rendering on the server and keeps us
    // aligned with Thirdweb's client-only APIs.
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
        {/* Bundle every custom React context so all downstream pages get shared state. */}
        <ContextProviders>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#000',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                fontFamily: 'Sora',
                fontSize: '14px',
                color: '#fff',
              },
            }}
          />
          {/* Allow each page to specify a layout wrapper while still inheriting providers. */}
          {getLayout(<Component {...pageProps} />)}
        </ContextProviders>
      </ThirdwebProvider>
    </NoSSR>
  );
}
