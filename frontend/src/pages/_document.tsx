// Custom Next.js Document that lets us augment the <html> and <body> tags.
import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";
import { useState } from "react";

export default function Document() {
  // Track whether the TradingView datafeed script has mounted so downstream
  // consumers could react (even though it's not currently read anywhere).
  const [isScriptReady, setIsScriptReady] = useState(false);
  return (
    <Html lang="en">
      <Head>
        {/* Lazy load the TradingView datafeed bundle so the chart widget can boot */}
        <Script
          src="/static/datafeeds/udf/dist/bundle.js"
          strategy="lazyOnload"
          onReady={() => {
            // Mark the script as ready to unblock consumers that might depend on
            // the TradingView global when the document hydrates.
            setIsScriptReady(true);
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
