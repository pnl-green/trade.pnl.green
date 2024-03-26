import {
  PnlWrapper,
  TradingViewComponent,
  WalletBox,
} from "@/styles/pnl.styles";
import React from "react";
import { AdvancedChart } from "react-tradingview-embed";
import { Box } from "@mui/material";
import OrderPlacement from "./order-placement-terminal";
import { FlexItems } from "@/styles/common.styles";
import PositionsOrdersHistory from "./positions-history-components";
import ChatComponent from "./chatComponent";
import OrderBookAndTrades from "./order-book-and-trades";
import TokenPairInformation from "./token-pair-information";
import { usePairTokens } from "@/context/pairTokensContext";

const PnlComponent = () => {
  const { tokenPairs } = usePairTokens();
  return (
    <PnlWrapper>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <TokenPairInformation />

        <TradingViewComponent>
          {tokenPairs.length > 1 && (
            <AdvancedChart
              widgetProps={{
                theme: "dark",
                locale: "en",
                autosize: true,
                enable_publishing: false,
                symbol: tokenPairs ? `${tokenPairs[0]}${tokenPairs[1]}` : "",
              }}
              // widgetPropsAny={{ backgroundColor: "#000" }}
            />
          )}
        </TradingViewComponent>

        <PositionsOrdersHistory />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <OrderBookAndTrades />
        <ChatComponent />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          "@media (max-width: 1535px)": {
            flexDirection: "row",
            flexWrap: "wrap",
          },
          "@media (max-width: 899px)": {
            flexDirection: "column",
            flexWrap: "nowrap",
          },
        }}
      >
        <OrderPlacement />

        <WalletBox sx={{ span: { fontSize: "15px" } }} id="wallet-component">
          <FlexItems>
            <span>Balance</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>uPNL</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Equity</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Cross Margin Ratio</span>
            <span className="green">$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Maintenance Margin</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Cross Account Leverage</span>
            <span>$0.00</span>
          </FlexItems>
        </WalletBox>
      </Box>
    </PnlWrapper>
  );
};

export default PnlComponent;
