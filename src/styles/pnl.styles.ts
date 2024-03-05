import { Box, styled } from "@mui/material";

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
}));
