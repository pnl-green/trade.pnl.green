import { Box } from "@mui/material";
import React, { useState } from "react";
import {
  LiquidationWrapper,
  RiskManagerWrapper,
  TabsButton,
  TabsWrapper,
} from "@/styles/riskManager.styles";
import MarketComponent from "./market";
import LimitComponent from "./limit";
import TwapOrderTerminal from "./twap";
import ChaseOrderTerminal from "./chase";
import ScaleOrderTerminal from "./scale";

const OrderPlacementTerminal = () => {
  const [activeTab, setActiveTab] = useState("Market");

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <RiskManagerWrapper id="order-placement-terminal">
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div className="captions">Risk Manager</div>
        <div className="captions">Leverage</div>
        <div className="captions">Margin Type</div>
      </Box>
      <TabsWrapper>
        {["Market", "Limit", "TWAP", "Chase", "Scale"].map((tabName) => (
          <TabsButton
            key={tabName}
            className={activeTab === tabName ? "active" : ""}
            onClick={() => handleTabChange(tabName)}
          >
            {tabName}
          </TabsButton>
        ))}
      </TabsWrapper>

      {/* Conditionally render components based on active tab */}
      {activeTab === "Market" && <MarketComponent />}
      {activeTab === "Limit" && <LimitComponent />}
      {activeTab === "TWAP" && <TwapOrderTerminal />}
      {activeTab === "Chase" && <ChaseOrderTerminal />}
      {activeTab === "Scale" && <ScaleOrderTerminal />}

      <LiquidationWrapper>
        <Box className="items">
          <span>Liquidation Price</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Order Value</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Margin Required</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Fees</span>
          <span>N/A</span>
        </Box>
      </LiquidationWrapper>
    </RiskManagerWrapper>
  );
};

export default OrderPlacementTerminal;
