import { Box, styled } from "@mui/material";
import { Ticker } from "react-tradingview-embed";

export const PnlWrapper = styled(Box)(() => ({
  display: "flex",
  //flexDirection: "column",
  gap: "50px",
  backgroundColor: "#000",
  width: "100%",
  minHeight: "calc(100vh - 70px)",
  height: "auto",
  padding: "10px",
}));

export const TickerWrapper = styled(Box)(() => ({
  display: "flex",
  width: "757px",
  height: "46px",
  borderRadius: "5px",
  backgroundColor: "#fff",

  div: {
    width: "100%",
    height: "46px",
  },
}));

export const TradingViewComponent = styled(Box)(() => ({
  display: "flex",
  width: "757px",
  height: "578px",
  borderRadius: "5px",
  backgroundColor: "#fff",

  div: {
    width: "100%",
  },
}));

export const OrderBookBox = styled(Box)(() => ({
  display: "flex",
  width: "310px",
  height: "578px",
  borderRadius: "5px",
  overflowX: "hidden",
  overflowY: "auto",
  border: "1px solid rgba(255, 255, 255, 0.1)",
}));
