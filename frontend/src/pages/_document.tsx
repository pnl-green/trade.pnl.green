import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";
import { useState } from "react";

export default function Document() {
  const [isScriptReady, setIsScriptReady] = useState(false);
  return (
    <Html lang="en">
      <Head>
        <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => {
          setIsScriptReady(true);
        }}
      />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0bd88d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PNL Green" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
