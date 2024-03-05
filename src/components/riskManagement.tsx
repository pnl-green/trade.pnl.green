import { Box } from "@mui/material";
import React from "react";
import { BuySellBtn } from "@/styles/buttons.styles";
import {
  FlexItems,
  InputCheckBox,
  LiquidationWrapper,
  RiskManagerWrapper,
  SelectItemsBox,
  TabsButton,
  TabsWrapper,
} from "@/styles/riskManager.styles";

const RiskManagementComponent = () => {
  return (
    <RiskManagerWrapper>
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
        <TabsButton className="active">Market</TabsButton>
        <TabsButton>Limit</TabsButton>
        <TabsButton>TWAP</TabsButton>
        <TabsButton>Chase</TabsButton>
        <TabsButton>Scale</TabsButton>
      </TabsWrapper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <FlexItems>
          <span>Available balance</span>
          <span>10:00</span>
        </FlexItems>
        <FlexItems>
          <span>Current position size</span>
          <span>0.0 APE</span>
        </FlexItems>
      </Box>

      <SelectItemsBox>
        <Box>Size</Box>
      </SelectItemsBox>

      <Box sx={{ mt: "20px" }}>
        <FlexItems sx={{ justifyContent: "flex-start" }}>
          <InputCheckBox />
          <span>Reduce Only</span>
        </FlexItems>

        <FlexItems sx={{ justifyContent: "flex-start" }}>
          <InputCheckBox />
          <span>Take Profit / Stop Loss</span>
        </FlexItems>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          mt: "30px",
        }}
      >
        <BuySellBtn sx={{ width: "112px" }} className="active">
          Buy
        </BuySellBtn>
        <BuySellBtn sx={{ width: "112px" }}>Sell</BuySellBtn>
      </Box>

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

export default RiskManagementComponent;
