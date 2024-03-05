import {
  OrderBookBox,
  PnlWrapper,
  TickerWrapper,
  TradingViewComponent,
} from "@/styles/pnl.styles";
import React, { useEffect, useState } from "react";
import {
  AdvancedChart,
  Ticker,
  MarketData,
  SingleTicker,
  TickerTape,
} from "react-tradingview-embed";
import { OrderBook } from "@lab49/react-order-book";
import { Box } from "@mui/material";
import RiskManagementComponent from "./riskManagement";
// import axios from "axios";

const PnlComponent = () => {
  // const [orderBook, setOrderBook] = useState({ asks: [], bids: [] });

  // useEffect(() => {
  //   const fetchOrderBook = async () => {
  //     try {
  //       const symbol = "LDOUSDT";
  //       const { data } = await axios.get(
  //         `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=5000`
  //       );
  //       setOrderBook({ asks: data.asks, bids: data.bids });
  //     } catch (error) {
  //       console.error("Error fetching order book:", error);
  //     }
  //   };

  //   fetchOrderBook();
  // }, []);

  // console.log("orderBook", orderBook);

  const book = {
    asks: [
      ["11661.89", "7.38470214"],
      ["11661.90", "1.50651300"],
      ["11661.96", "0.01000000"],
      ["11664.73", "0.01831024"],
      ["11665.54", "1.10470714"],
      ["11665.62", "0.61473402"],
      ["11666.45", "0.00694470"],
      ["11666.56", "2.56600000"],
      ["11666.58", "0.01350000"],
      ["11666.61", "1.25050743"],
      ["11666.64", "0.42440000"],
      ["11666.87", "2.45020000"],
      ["11666.93", "0.04000000"],
      ["11667.41", "0.02600000"],
      ["11667.63", "0.85090000"],
    ],
    bids: [
      ["11661.88", "7.69965034"],
      ["11661.87", "0.13211587"],
      ["11661.79", "0.10000000"],
      ["11661.51", "0.42690000"],
      ["11661.26", "0.01027252"],
      ["11660.92", "0.13526598"],
      ["11660.57", "0.85520000"],
      ["11660.01", "0.90000000"],
      ["11660.00", "0.85336610"],
      ["11659.94", "2.82305163"],
      ["11659.66", "0.46619275"],
      ["11659.65", "0.25729000"],
      ["11659.09", "3.90000000"],
      ["11658.80", "0.02150000"],
      ["11658.28", "0.25732000"],
    ],
  };

  return (
    <PnlWrapper>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <TickerWrapper>
          <TickerTape widgetProps={{ displayMode: "Adaptive" }} />
        </TickerWrapper>
        <TradingViewComponent>
          <AdvancedChart
            widgetProps={{
              theme: "dark",
              locale: "en",
              autosize: true,
            }}
          />
        </TradingViewComponent>
      </Box>
      <OrderBookBox>
        <OrderBook
          askColor={[255, 0, 0]}
          book={{ asks: book.asks, bids: book.bids }}
          fullOpacity
          interpolateColor={(color) => color}
          listLength={10}
          showSpread={true}
          stylePrefix="MakeItNice"
        />
      </OrderBookBox>
      <RiskManagementComponent />
    </PnlWrapper>
  );
};

export default PnlComponent;
