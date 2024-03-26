import { PairTokensProvider } from "@/context/pairTokensContext";
import "@/styles/globals.css";
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
      <PairTokensProvider>
        <Component {...pageProps} />
      </PairTokensProvider>
    </NoSSR>
  );
}
