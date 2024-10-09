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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
