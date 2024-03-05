import {
  OrderBookBox,
  PnlWrapper,
  TradingViewComponent,
} from "@/styles/pnl.styles";
import React, { useEffect, useMemo, useState } from "react";
import { AdvancedChart } from "react-tradingview-embed";
import { OrderBook } from "@lab49/react-order-book";

const PnlComponent = () => {
  const [isRendered, setIsRendered] = useState(false);

  const book = {
    asks: [
      ["1.01", "2"],
      ["1.02", "3"],
      ["1.01", "2"],
      ["1.02", "3"],
    ],
    bids: [
      ["0.99", "5"],
      ["0.98", "3"],
      ["0.99", "5"],
      ["0.98", "3"],
    ],
  };

  useEffect(() => {
    setIsRendered(true);
  }, []);

  if (!isRendered) {
    return null;
  }

  return (
    <PnlWrapper>
      <TradingViewComponent>
        <AdvancedChart
          widgetProps={{
            theme: "dark",
            locale: "en",
            autosize: true,
          }}
        />
      </TradingViewComponent>
      <OrderBookBox>
        <OrderBook
          book={{ bids: book.bids, asks: book.asks }}
          // fullOpacity
          interpolateColor={(color) => color}
          // listLength={10}
          showSpread={true}
        />
      </OrderBookBox>
    </PnlWrapper>
  );
};

export default PnlComponent;
